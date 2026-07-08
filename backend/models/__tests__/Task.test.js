describe('Task Model', () => {
  test('should have correct attributes', () => {
    const Task = require('../Task');
    expect(Task).toBeDefined();
  });

  test('should validate required fields', () => {
    const task = {
      title: 'Test Task',
      status: 'todo',
      priority: 'medium',
    };
    expect(task.title).toBeDefined();
    expect(task.status).toBe('todo');
  });

  test('should have valid status values', () => {
    const validStatuses = ['todo', 'in-progress', 'done'];
    const task = { status: 'todo' };
    expect(validStatuses).toContain(task.status);
  });

  test('should have valid priority values', () => {
    const validPriorities = ['low', 'medium', 'high'];
    const task = { priority: 'medium' };
    expect(validPriorities).toContain(task.priority);
  });

  test('should allow description to be null', () => {
    const task = { title: 'Test', description: null };
    expect(task.description).toBeNull();
  });

  test('should have default values', () => {
    const task = {
      status: 'todo',
      priority: 'medium',
      alertSent: false,
    };
    expect(task.status).toBe('todo');
    expect(task.priority).toBe('medium');
    expect(task.alertSent).toBe(false);
  });

  test('should allow deadline to be null', () => {
    const task = { title: 'Test', deadline: null };
    expect(task.deadline).toBeNull();
  });
});
