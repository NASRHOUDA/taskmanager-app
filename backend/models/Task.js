const { DataTypes } = require("sequelize");

const defineTaskModel = (sequelize) => {
  const Task = sequelize.define(
    "Task",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      status: {
        type: DataTypes.ENUM("todo", "in-progress", "done"),
        defaultValue: "todo",
      },
      priority: {
        type: DataTypes.ENUM("low", "medium", "high"),
        defaultValue: "medium",
      },
      deadline: { type: DataTypes.DATE, allowNull: true },
      alertSent: { type: DataTypes.BOOLEAN, defaultValue: false },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "Users", key: "id" },
      },
      createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      timestamps: true,
      hooks: {
        beforeUpdate: (task) => {
          if (task.changed("status") && task.status === "done") {
            task.alertSent = false;
          }
          if (task.changed("deadline")) {
            task.alertSent = false;
          }
        },
      },
    }
  );

  Task.associate = (models) => {
    Task.belongsTo(models.User, { foreignKey: "userId", onDelete: "CASCADE" });
  };

  return Task;
};

module.exports = defineTaskModel;
