// Mock dependencies before importing
jest.mock("node-cron", () => ({
  schedule: jest.fn(),
}));

jest.mock("../mailer", () => ({
  sendDeadlineExceededEmail: jest.fn(),
}));

// Create a mock for sequelize.query that returns the expected structure
const mockQuery = jest.fn();
const mockTaskFindAll = jest.fn();

jest.mock("../../models", () => ({
  Task: {
    findAll: mockTaskFindAll,
  },
  User: {},
  sequelize: {
    query: mockQuery,
    QueryTypes: { SELECT: "SELECT" },
  },
}));

const cron = require("node-cron");
const { Task } = require("../../models");
const { sendDeadlineExceededEmail } = require("../mailer");
const { checkOverdueTasks, startDeadlineChecker } = require("../deadlineChecker");

describe("deadlineChecker.js", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("checkOverdueTasks", () => {
    test("skip silencieusement si le verrou distribue n'est pas acquis", async () => {
      // Mock the query to return false for lock acquisition
      // The code does: [{ pg_try_advisory_lock: acquired }] = await sequelize.query(...)
      // So we need to return an array with one object
      mockQuery.mockResolvedValueOnce([{ pg_try_advisory_lock: false }]);

      await checkOverdueTasks();

      expect(mockTaskFindAll).not.toHaveBeenCalled();
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    test("traite les taches en retard et envoie un email pour chacune", async () => {
      const mockTask1 = {
        id: 1,
        title: "Tache A",
        User: { id: 10, name: "Alice", email: "alice@test.com" },
        alertSent: false,
        save: jest.fn().mockResolvedValue(true),
      };
      const mockTask2 = {
        id: 2,
        title: "Tache B",
        User: { id: 11, name: "Bob", email: "bob@test.com" },
        alertSent: false,
        save: jest.fn().mockResolvedValue(true),
      };

      // First call returns lock acquired, second call is for unlock
      mockQuery
        .mockResolvedValueOnce([{ pg_try_advisory_lock: true }])
        .mockResolvedValueOnce([]);

      mockTaskFindAll.mockResolvedValue([mockTask1, mockTask2]);
      sendDeadlineExceededEmail.mockResolvedValue(true);

      await checkOverdueTasks();

      expect(mockTaskFindAll).toHaveBeenCalledTimes(1);
      expect(sendDeadlineExceededEmail).toHaveBeenCalledTimes(2);
      expect(sendDeadlineExceededEmail).toHaveBeenCalledWith(mockTask1, mockTask1.User);
      expect(sendDeadlineExceededEmail).toHaveBeenCalledWith(mockTask2, mockTask2.User);

      expect(mockTask1.alertSent).toBe(true);
      expect(mockTask2.alertSent).toBe(true);
      expect(mockTask1.save).toHaveBeenCalledTimes(1);
      expect(mockTask2.save).toHaveBeenCalledTimes(1);

      // Should be called twice: once for lock, once for unlock
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    test("continue le traitement des autres taches si l'envoi d'email echoue pour une tache", async () => {
      const failingTask = {
        id: 3,
        title: "Tache qui echoue",
        User: { id: 12, name: "Charlie", email: "charlie@test.com" },
        alertSent: false,
        save: jest.fn().mockResolvedValue(true),
      };
      const okTask = {
        id: 4,
        title: "Tache OK",
        User: { id: 13, name: "Dana", email: "dana@test.com" },
        alertSent: false,
        save: jest.fn().mockResolvedValue(true),
      };

      mockQuery
        .mockResolvedValueOnce([{ pg_try_advisory_lock: true }])
        .mockResolvedValueOnce([]);

      mockTaskFindAll.mockResolvedValue([failingTask, okTask]);
      sendDeadlineExceededEmail
        .mockRejectedValueOnce(new Error("SMTP down"))
        .mockResolvedValueOnce(true);

      await checkOverdueTasks();

      expect(failingTask.alertSent).toBe(false);
      expect(failingTask.save).not.toHaveBeenCalled();

      expect(okTask.alertSent).toBe(true);
      expect(okTask.save).toHaveBeenCalledTimes(1);

      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    test("libere toujours le verrou meme si Task.findAll leve une erreur", async () => {
      mockQuery
        .mockResolvedValueOnce([{ pg_try_advisory_lock: true }])
        .mockResolvedValueOnce([]);

      mockTaskFindAll.mockRejectedValueOnce(new Error("DB connection lost"));

      await expect(checkOverdueTasks()).resolves.not.toThrow();

      // Should be called twice: once for lock, once for unlock
      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(sendDeadlineExceededEmail).not.toHaveBeenCalled();
    });

    test("ne renvoie pas d'email si aucune tache en retard n'est trouvee", async () => {
      mockQuery
        .mockResolvedValueOnce([{ pg_try_advisory_lock: true }])
        .mockResolvedValueOnce([]);

      mockTaskFindAll.mockResolvedValue([]);

      await checkOverdueTasks();

      expect(sendDeadlineExceededEmail).not.toHaveBeenCalled();
      // Should be called twice: once for lock, once for unlock
      expect(mockQuery).toHaveBeenCalledTimes(2);
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

    test("le callback du cron declenche checkOverdueTasks", async () => {
      startDeadlineChecker();

      const cronCallback = cron.schedule.mock.calls[0][1];
      // Mock the checkOverdueTasks to resolve
      mockQuery
        .mockResolvedValueOnce([{ pg_try_advisory_lock: true }])
        .mockResolvedValueOnce([]);
      mockTaskFindAll.mockResolvedValue([]);
      
      // Call the callback and wait for it to complete
      await cronCallback();
      
      // Verify that checkOverdueTasks was called (by checking if mockQuery was called)
      expect(mockQuery).toHaveBeenCalled();
    });
  });
});
