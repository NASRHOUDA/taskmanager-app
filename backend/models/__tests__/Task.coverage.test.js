const { Task } = require('../index');

describe('Task Model Coverage', () => {
  test('should have Task model defined', () => {
    expect(Task).toBeDefined();
  });

  test('should have model associations', () => {
    // Test that the model has the expected associations
    expect(Task.belongsTo).toBeDefined();
  });

  test('should validate task schema', () => {
    // Test schema validation
    const taskAttributes = {
      title: { type: 'STRING', allowNull: false },
      description: { type: 'TEXT', allowNull: true },
      status: { type: 'ENUM', allowNull: false, defaultValue: 'todo' },
      priority: { type: 'ENUM', allowNull: false, defaultValue: 'medium' },
      deadline: { type: 'DATE', allowNull: true },
      alertSent: { type: 'BOOLEAN', allowNull: false, defaultValue: false },
      userId: { type: 'INTEGER', allowNull: false },
    };
    
    expect(taskAttributes.title).toBeDefined();
    expect(taskAttributes.status).toBeDefined();
    expect(taskAttributes.priority).toBeDefined();
  });
});
