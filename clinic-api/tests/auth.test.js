const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');
const bcrypt = require('bcrypt');

jest.mock('../src/config/db');

describe('Auth Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should return 200 and a token on successful login', async () => {
      const hashedPassword = await bcrypt.hash('nurse1234', 12);
      db.query.mockResolvedValueOnce({
        rows: [{ id: 1, email: 'nurse@clinic.local', password: hashedPassword, role: 'nurse', is_active: true, name: 'Head Nurse' }]
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nurse@clinic.local', password: 'nurse1234' });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body.user.email).toBe('nurse@clinic.local');
    });

    it('should return 401 for wrong password', async () => {
      const hashedPassword = await bcrypt.hash('nurse1234', 12);
      db.query.mockResolvedValueOnce({
        rows: [{ id: 1, email: 'nurse@clinic.local', password: hashedPassword, role: 'nurse', is_active: true }]
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nurse@clinic.local', password: 'wrongpassword' });

      expect(res.statusCode).toBe(401);
    });

    it('should return 403 for inactive account', async () => {
      const hashedPassword = await bcrypt.hash('nurse1234', 12);
      db.query.mockResolvedValueOnce({
        rows: [{ id: 1, email: 'nurse@clinic.local', password: hashedPassword, role: 'nurse', is_active: false }]
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nurse@clinic.local', password: 'nurse1234' });

      expect(res.statusCode).toBe(403);
    });
  });
});
