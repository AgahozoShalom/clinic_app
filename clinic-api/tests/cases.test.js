const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');
const jwt = require('jsonwebtoken');

jest.mock('../src/config/db');

describe('Cases Endpoints', () => {
  let nurseToken, doctorToken;

  beforeAll(() => {
    nurseToken = jwt.sign({ sub: 1, role: 'nurse', name: 'Nurse' }, process.env.JWT_SECRET || 'secret');
    doctorToken = jwt.sign({ sub: 2, role: 'doctor', name: 'Doctor' }, process.env.JWT_SECRET || 'secret');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/cases', () => {
    it('nurse can create a case', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Student check
        .mockResolvedValueOnce({ rows: [{ id: 10, status: 'open' }] }); // Insert

      const res = await request(app)
        .post('/api/v1/cases')
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({ student_id: 1, nurse_notes: 'Fever' });

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('open');
    });

    it('doctor cannot create a case', async () => {
      const res = await request(app)
        .post('/api/v1/cases')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ student_id: 1, nurse_notes: 'Fever' });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('PATCH /api/v1/cases/:id/close', () => {
    it('should close an open case', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ status: 'open' }] }) // Case check
        .mockResolvedValueOnce({ rows: [{ id: 10, status: 'closed' }] }); // Update

      const res = await request(app)
        .patch('/api/v1/cases/10/close')
        .set('Authorization', `Bearer ${nurseToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('closed');
    });

    it('should return 409 if already closed', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ status: 'closed' }] }); // Case check

      const res = await request(app)
        .patch('/api/v1/cases/10/close')
        .set('Authorization', `Bearer ${nurseToken}`);

      expect(res.statusCode).toBe(409);
    });
  });

  describe('POST /api/v1/cases/:id/transfer', () => {
    it('doctor can create transfer', async () => {
      // Mock db.pool.connect
      const client = {
        query: jest.fn()
          .mockResolvedValueOnce() // BEGIN
          .mockResolvedValueOnce({ rows: [{ status: 'open' }] }) // SELECT ... FOR UPDATE
          .mockResolvedValueOnce({ rows: [{ id: 1, status: 'initiated' }] }) // INSERT transfer
          .mockResolvedValueOnce() // UPDATE cases
          .mockResolvedValueOnce(), // COMMIT
        release: jest.fn()
      };
      db.pool = { connect: jest.fn().mockResolvedValue(client) };

      const res = await request(app)
        .post('/api/v1/cases/10/transfer')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ hospital_name: 'CHUK', reason: 'Surgery' });

      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('initiated');
    });

    it('nurse cannot create transfer', async () => {
      const res = await request(app)
        .post('/api/v1/cases/10/transfer')
        .set('Authorization', `Bearer ${nurseToken}`)
        .send({ hospital_name: 'CHUK', reason: 'Surgery' });

      expect(res.statusCode).toBe(403);
    });
  });
});
