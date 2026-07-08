jest.mock("node-cron", () => ({
  schedule: jest.fn(),
}));

jest.mock("../mailer", () => ({
  sendDeadlineExceededEmail: jest.fn(),
}));

jest.mock("../../models", () => ({
  Task: {
    findAll: jest.fn(),
  },
  User: {},
  sequelize: {
    query: jest.fn(),
    QueryTypes: { SELECT: "SELECT" },
  },
}));

const cron = require("node-cron");
const { sequelize, Task } = require("../../models");
const { sendDeadlineExceededEmail } = require("../mailer");
const {
  checkOverdueTasks,
  startDeadlineChecker,
} = require("../deadlineChecker");

describe("deadlineChecker.js", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("checkOverdueTasks", () => {
    test("skip silencieusement si le verrou distribué n'est pas acquis", async () => {
      sequelize.query.mockResolvedValueOnce([{ pg_try_advisory_lock: false }]);

      await checkOverdueTasks();

      expect(Task.findAll).not.toHaveBeenCalled();
      expect(sequelize.query).toHaveBeenCalledTimes(1);
    });

    test("traite les tâches en retard et envoie un email pour chacune", async () => {
      const mockTask1 = {
        id: 1,
        title: "Tâche A",
        User: { id: 10, name: "Alice", email: "alice@test.com" },
        alertSent: false,
        save: jest.fn().mockResolvedValue(true),
      };
      const mockTask2 = {
        id: 2,
        title: "Tâche B",
        User: { id: 11, name: "Bob", email: "bob@test.com" },
        alertSent: false,
        save: jest.fn().mockResolvedValue(true),
      };

      sequelize.query
        .mockResolvedValueOnce([{ pg_try_advisory_lock: true }])
        .mockResolvedValueOnce([]);

      Task.findAll.mockResolvedValueOnce([mockTask1, mockTask2]);
      sendDeadlineExceededEmail.mockResolvedValue(true);

      await checkOverdueTasks();

      expect(Task.findAll).toHaveBeenCalledTimes(1);
      expect(sendDeadlineExceededEmail).toHaveBeenCalledTimes(2);
      expect(sendDeadlineExceededEmail).toHaveBeenCalledWith(mockTask1, mockTask1.User);
      expect(sendDeadlineExceededEmail).toHaveBeenCalledWith(mockTask2, mockTask2.User);

      expect(mockTask1.alertSent).toBe(true);
      expect(mockTask2.alertSent).toBe(true);
      expect(mockTask1.save).toHaveBeenCalledTimes(1);
      expect(mockTask2.save).toHaveBeenCalledTimes(1);

      expect(sequelize.query).toHaveBeenCalledTimes(2);
    });

    test("continue le traitement des autres tâches si l'envoi d'email échoue pour une tâche", async () => {
      const failingTask = {
        id: 3,
        title: "Tâche qui échoue",
        User: { id: 12, name: "Charlie", email: "charlie@test.com" },
        alertSent: false,
        save: jest.fn().mockResolvedValue(true),
      };
      const okTask = {
        id: 4,
        title: "Tâche OK",
        User: { id: 13, name: "Dana", email: "dana@test.com" },
        alertSent: false,
        save: jest.fn().mockResolvedValue(true),
      };

      sequelize.query
        .mockResolvedValueOnce([{ pg_try_advisory_lock: true }])
        .mockResolvedValueOnce([]);

      Task.findAll.mockResolvedValueOnce([failingTask, okTask]);
      sendDeadlineExceededEmail
        .mockRejectedValueOnce(new Error("SMTP down"))
        .mockResolvedValueOnce(true);

      await checkOverdueTasks();

      expect(failingTask.alertSent).toBe(false);
      expect(failingTask.save).not.toHaveBeenCalled();

      expect(okTask.alertSent).toBe(true);
      expect(okTask.save).toHaveBeenCalledTimes(1);

      expect(sequelize.query).toHaveBeenCalledTimes(2);
    });

    test("libère toujours le verrou même si Task.findAll lève une erreur", async () => {
      sequelize.query
        .mockResolvedValueOnce([{ pg_try_advisory_lock: true }])
        .mockResolvedValueOnce([]);

      Task.findAll.mockRejectedValueOnce(new Error("DB connection lost"));

      await expect(checkOverdueTasks()).resolves.not.toThrow();

      expect(sequelize.query).toHaveBeenCalledTimes(2);
      expect(sendDeadlineExceededEmail).not.toHaveBeenCalled();
    });

    test("ne renvoie pas d'email si aucune tâche en retard n'est trouvée", async () => {
      sequelize.query
        .mockResolvedValueOnce([{ pg_try_advisory_lock: true }])
        .mockResolvedValueOnce([]);

      Task.findAll.mockResolvedValueOnce([]);

      await checkOverdueTasks();

      expect(sendDeadlineExceededEmail).not.toHaveBeenCalled();
      expect(sequelize.query).toHaveBeenCalledTimes(2);
    });
  });

  describe("startDeadlineChecker", () => {
    test("programme le cron toutes les 5 minutes", () => {
      startDeadlineChecker();

      expect(cron.schedule).toHaveBeenCalledTimes(1);
      expect(cron.schedule).toHaveBeenCalledWith(
        "*/5 * * * *",
        expect.any(Function)
      );
    });

    test("le callback du cron déclenche checkOverdueTasks", () => {
      startDeadlineChecker();

      const cronCallback = cron.schedule.mock.calls[0][1];
      expect(() => cronCallback()).not.toThrow();
    });
  });
});
