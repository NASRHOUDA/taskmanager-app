process.env.EMAIL_USER = "noreply@taskmanager.test";
process.env.EMAIL_APP_PASSWORD = "fake-app-password";

// Create a mock for sendMail
const mockSendMail = jest.fn();

// Mock nodemailer
jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({
    sendMail: mockSendMail
  })),
}));

const nodemailer = require("nodemailer");
const { sendDeadlineExceededEmail } = require("../mailer");

describe("mailer.js - sendDeadlineExceededEmail", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Default successful response
    mockSendMail.mockResolvedValue({ messageId: "test-id-123" });
  });

  const baseTask = {
    id: 1,
    title: "Finir le rapport Sprint 3",
    description: "Rapport detaille sur l'avancement du sprint",
    deadline: new Date("2026-07-01T10:00:00Z"),
  };

  const baseUser = {
    name: "Houda Nasr",
    email: "houda@example.com",
  };

  test("cree le transporter avec le service gmail et les credentials env", () => {
    // Re-import to trigger the transporter creation
    jest.isolateModules(() => {
      require("../mailer");
    });
    
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });
  });

  test("envoie un email avec le bon destinataire et sujet", async () => {
    await sendDeadlineExceededEmail(baseTask, baseUser);

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const callArg = mockSendMail.mock.calls[0][0];

    expect(callArg.to).toBe(baseUser.email);
    expect(callArg.subject).toContain(baseTask.title);
    expect(callArg.subject).toContain("Délai dépassé");
    expect(callArg.from).toContain(process.env.EMAIL_USER);
  });

  test("inclut le titre, la description et le nom de l'utilisateur dans le HTML", async () => {
    await sendDeadlineExceededEmail(baseTask, baseUser);

    const html = mockSendMail.mock.calls[0][0].html;
    expect(html).toContain(baseTask.title);
    expect(html).toContain(baseTask.description);
    expect(html).toContain(baseUser.name);
    expect(html).toContain(baseUser.email);
  });

  test("n'inclut pas de bloc description si task.description est absent", async () => {
    const taskWithoutDescription = { ...baseTask, description: undefined };
    await sendDeadlineExceededEmail(taskWithoutDescription, baseUser);

    const html = mockSendMail.mock.calls[0][0].html;
    expect(html).toContain(taskWithoutDescription.title);
    expect(html).not.toContain("undefined");
  });

  test("formate correctement la date de deadline en francais", async () => {
    await sendDeadlineExceededEmail(baseTask, baseUser);

    const html = mockSendMail.mock.calls[0][0].html;
    expect(html).toMatch(/Délai\s*:\s*\S+/);
  });

  test("propage l'erreur si transporter.sendMail echoue", async () => {
    mockSendMail.mockRejectedValueOnce(new Error("SMTP connection failed"));

    await expect(sendDeadlineExceededEmail(baseTask, baseUser)).rejects.toThrow(
      "SMTP connection failed"
    );
  });
});
