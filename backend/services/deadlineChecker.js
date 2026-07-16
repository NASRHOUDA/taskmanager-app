const cron = require("node-cron");
const { Op } = require("sequelize");
const { Task, User, sequelize } = require("../models");
const { sendDeadlineExceededEmail } = require("./mailer");

// Identifiant arbitraire unique pour ce verrou distribué (n'importe quel entier suffit,
// tant qu'il est cohérent entre tous les pods).
const DEADLINE_CHECK_LOCK_ID = 987654321;

async function checkOverdueTasks() {
  // Tente d'acquérir un verrou distribué Postgres — un seul pod l'obtient à la fois,
  // ce qui évite les envois en double quand plusieurs replicas backend tournent.
  const [{ pg_try_advisory_lock: acquired }] = await sequelize.query(
    `SELECT pg_try_advisory_lock(${DEADLINE_CHECK_LOCK_ID}) as pg_try_advisory_lock;`,
    { type: sequelize.QueryTypes.SELECT }
  );

  if (!acquired) {
    // Un autre pod a déjà le verrou pour ce cycle — on skip silencieusement.
    return;
  }

  try {
    const overdueTasks = await Task.findAll({
      where: {
        deadline: { [Op.lt]: new Date() },
        status: { [Op.ne]: "done" },
        alertSent: false,
      },
      include: [{ model: User, attributes: ["id", "name", "email"] }],
    });

    for (const task of overdueTasks) {
      try {
        await sendDeadlineExceededEmail(task, task.User);
        task.alertSent = true;
        await task.save();
        console.log(`📧 Alerte envoyée pour la tâche "${task.title}" (id: ${task.id})`);
      } catch (mailErr) {
        console.error(`❌ Échec envoi email pour la tâche ${task.id}:`, mailErr.message);
      }
    }
  } catch (err) {
    console.error("❌ Erreur lors de la vérification des délais dépassés:", err.message);
  } finally {
    // Libère toujours le verrou, même en cas d'erreur, pour ne pas bloquer les cycles suivants.
    await sequelize.query(`SELECT pg_advisory_unlock(${DEADLINE_CHECK_LOCK_ID});`);
  }
}

function startDeadlineChecker() {
  cron.schedule("*/5 * * * *", () => {
    checkOverdueTasks();
  });
  console.log("⏰ Deadline checker démarré (toutes les 5 minutes)");
}

module.exports = { startDeadlineChecker, checkOverdueTasks };
