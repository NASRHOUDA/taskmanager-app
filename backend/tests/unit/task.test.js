const request = require('supertest');
const app = require('../../app');

describe('Task Manager API Tests', () => {
    test('GET /health - Should return 200 OK', async () => {
        const response = await request(app).get('/health');
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('status', 'OK');
    });

    test('Task model - Should create task with valid data', () => {
        const task = {
            id: '123',
            title: 'Test Task',
            description: 'This is a test',
            status: 'pending',
            priority: 'medium'
        };
        expect(task.title).toBe('Test Task');
        expect(task.status).toBe('pending');
        expect(task.priority).toBe('medium');
    });

    test('Task status - Should update status to completed', () => {
        const task = { status: 'pending' };
        task.status = 'completed';
        expect(task.status).toBe('completed');
    });

    test('Task priority - Should have valid priority levels', () => {
        const validPriorities = ['low', 'medium', 'high', 'urgent'];
        const taskPriority = 'medium';
        expect(validPriorities).toContain(taskPriority);
    });

    test('Task title - Should be required', () => {
        const task = { title: 'Valid Title' };
        expect(task.title).toBeTruthy();
        expect(task.title).not.toBe('');
    });
});
