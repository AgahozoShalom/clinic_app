const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');
const jwt = require('jsonwebtoken');

jest.mock('../src/config/db');

describe('Lab Tests Endpoints', () => {
  let labToken, nurseToken;

  beforeAll(() => {
    labToken = jwt.sign({ sub: 3, role: 'lab_technician', name: 'Lab Tech' }, process.env.JWT_SECRET || 'secret');
    nurseToken = jwt.sign({ sub: 1, role: 'nurse', name: 'Nurse' }, process.env.JWT_SECRET || 'secret');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PATCH /api/v1/lab-tests/:id/results', () => {
    it('lab tech can update results', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ status: 'requested' }] }) // Test check
        .mockResolvedValueOnce({ rows: [{ id: 1, status: 'completed', results: 'Normal' }] }); // Update

      const res = await request(app)
        .patch('/api/v1/lab-tests/1/results')
        .set('Authorization', `Bearer ${labToken}`)
        .send({ results: 'Normal' });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('completed');
    });

    it('should return 409 if already completed', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ status: 'completed' }] }); // Test check

      const res = await request(app)
        .patch('/api/v1/lab-tests/1/results')
        .set('Authorization', `Bearer ${labToken}`)
        .send({ results: 'Normal' });

      expect(res.statusCode).toBe(409);
    });

    it('nurse cannot update results', async () => {
      const res = await request(app)
        .patch('/api/v1/lab-tests/1/results')
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({ results: 'Normal' });

      expect(res.statusCode).toBe(403);
    });
  });
});
