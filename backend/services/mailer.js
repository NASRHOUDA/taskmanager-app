const nodemailer = require("nodemailer");

// EMAIL_USER et EMAIL_APP_PASSWORD doivent venir de variables d'environnement
// (Vault / Secret K8s), jamais écrits en dur ici.
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

async function sendDeadlineExceededEmail(task, user) {
  const deadlineStr = new Date(task.deadline).toLocaleString("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const html = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #4f6ef7 0%, #3a56d4 100%); padding: 24px; border-radius: 10px 10px 0 0;">
        <h2 style="color: #fff; margin: 0; font-size: 20px;">⏰ Délai dépassé</h2>
      </div>
      <div style="background: #fff; padding: 24px; border: 1px solid #e8e8e8; border-radius: 0 0 10px 10px;">
        <p style="color: #333; font-size: 15px;">
          La tâche suivante a dépassé son délai sans être marquée comme terminée :
        </p>
        <div style="background: #fafafa; border: 1px solid #eee; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px; font-weight: 700; color: #111; font-size: 16px;">${task.title}</p>
          ${task.description ? `<p style="margin: 0 0 8px; color: #666; font-size: 14px;">${task.description}</p>` : ""}
          <p style="margin: 0; color: #c62828; font-size: 13px; font-weight: 600;">
            Délai : ${deadlineStr}
          </p>
        </div>
        <p style="color: #888; font-size: 13px;">
          Assigné à : ${user.name} (${user.email})
        </p>
      </div>
    </div>
  `;

  const info = await transporter.sendMail({
    from: `"Task Manager" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `⏰ Délai dépassé : ${task.title}`,
    html,
  });

  return info;
}

module.exports = { sendDeadlineExceededEmail };
