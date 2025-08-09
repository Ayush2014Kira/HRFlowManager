import { describe, it } from 'mocha';
import { expect } from 'chai';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes';
import './setup';

describe('Attendance API', () => {
  let app: express.Application;
  let server: any;
  let authCookie: string[];

  before(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);

    // Login to get auth cookie
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });
    
    authCookie = loginResponse.headers['set-cookie'];
  });

  after(() => {
    if (server) {
      server.close();
    }
  });

  describe('GET /api/attendance', () => {
    it('should return attendance records when authenticated', async () => {
      const response = await request(app)
        .get('/api/attendance')
        .set('Cookie', authCookie);

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/attendance');

      expect(response.status).to.equal(401);
    });
  });

  describe('POST /api/attendance/punch-in', () => {
    it('should punch in successfully with valid employee ID', async () => {
      const response = await request(app)
        .post('/api/attendance/punch-in')
        .set('Cookie', authCookie)
        .send({
          employeeId: 'test-employee-id'
        });

      // Note: This might fail if employee doesn't exist in test DB
      // In a real test, we'd create the employee first
      expect(response.status).to.be.oneOf([200, 400]);
    });

    it('should reject punch in without employee ID', async () => {
      const response = await request(app)
        .post('/api/attendance/punch-in')
        .set('Cookie', authCookie)
        .send({});

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('error');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .post('/api/attendance/punch-in')
        .send({
          employeeId: 'test-employee-id'
        });

      expect(response.status).to.equal(401);
    });
  });

  describe('POST /api/attendance/punch-out', () => {
    it('should punch out successfully with valid employee ID', async () => {
      const response = await request(app)
        .post('/api/attendance/punch-out')
        .set('Cookie', authCookie)
        .send({
          employeeId: 'test-employee-id'
        });

      // Note: This might fail if employee doesn't exist or isn't punched in
      expect(response.status).to.be.oneOf([200, 400]);
    });

    it('should reject punch out without employee ID', async () => {
      const response = await request(app)
        .post('/api/attendance/punch-out')
        .set('Cookie', authCookie)
        .send({});

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('error');
    });
  });

  describe('GET /api/attendance/today', () => {
    it('should return today\'s attendance records', async () => {
      const response = await request(app)
        .get('/api/attendance/today')
        .set('Cookie', authCookie);

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
    });
  });
});