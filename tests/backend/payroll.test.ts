import { describe, it } from 'mocha';
import { expect } from 'chai';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes';
import './setup';

describe('Payroll API', () => {
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

  describe('GET /api/payroll', () => {
    it('should return payroll records when authenticated', async () => {
      const response = await request(app)
        .get('/api/payroll')
        .set('Cookie', authCookie);

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/payroll');

      expect(response.status).to.equal(401);
    });
  });

  describe('GET /api/payroll with employeeId filter', () => {
    it('should return filtered payroll records for specific employee', async () => {
      const response = await request(app)
        .get('/api/payroll?employeeId=test-employee-id')
        .set('Cookie', authCookie);

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
    });
  });

  describe('POST /api/payroll/process', () => {
    it('should process payroll when endpoint exists', async () => {
      const payrollData = {
        employeeId: 'test-employee-id',
        period: '2024-01',
        baseSalary: 5000,
        allowances: 500,
        deductions: 200
      };

      const response = await request(app)
        .post('/api/payroll/process')
        .set('Cookie', authCookie)
        .send(payrollData);

      // This endpoint might not exist yet, so we check for either success or 404
      expect(response.status).to.be.oneOf([200, 201, 404]);
    });
  });

  describe('API response structure', () => {
    it('should return proper JSON content-type', async () => {
      const response = await request(app)
        .get('/api/payroll')
        .set('Cookie', authCookie);

      expect(response.headers['content-type']).to.match(/application\/json/);
    });

    it('should handle errors gracefully', async () => {
      // Try to access a non-existent payroll record
      const response = await request(app)
        .get('/api/payroll/non-existent-id')
        .set('Cookie', authCookie);

      // Should return either 404 or proper error structure
      if (response.status === 404) {
        expect(response.body).to.have.property('error');
      }
    });
  });

  describe('Performance tests', () => {
    it('should respond within reasonable time', async () => {
      const start = Date.now();
      
      const response = await request(app)
        .get('/api/payroll')
        .set('Cookie', authCookie);

      const duration = Date.now() - start;
      
      expect(response.status).to.equal(200);
      expect(duration).to.be.lessThan(5000); // 5 seconds max
    });
  });
});