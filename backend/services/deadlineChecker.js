const cron = require("node-cron");
const { Op } = require("sequelize");
const { Task, User } = require("../models");
const { sendDeadlineExceededEmail } = require("./mailer");

async function checkOverdueTasks() {
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
  }
}

function startDeadlineChecker() {
  cron.schedule("*/5 * * * *", () => {
    checkOverdueTasks();
  });
  console.log("⏰ Deadline checker démarré (toutes les 5 minutes)");
}

module.exports = { startDeadlineChecker, checkOverdueTasks };
