const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Task = sequelize.define("Task", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    status: {
      type: DataTypes.ENUM("pending", "in_progress", "completed"),
      defaultValue: "pending",
    },
    priority: {
      type: DataTypes.ENUM("low", "medium", "high", "urgent"),
      defaultValue: "medium",
    },
    userId: { type: DataTypes.UUID, allowNull: false },
  });

  return Task;
};
