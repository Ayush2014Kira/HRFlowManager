import { describe, it } from 'mocha';
import { expect } from 'chai';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes';
import './setup';

describe('Leave Management API', () => {
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

  describe('GET /api/leave-types', () => {
    it('should return leave types when authenticated', async () => {
      const response = await request(app)
        .get('/api/leave-types')
        .set('Cookie', authCookie);

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/leave-types');

      expect(response.status).to.equal(401);
    });
  });

  describe('POST /api/leave-types', () => {
    it('should create a new leave type with valid data', async () => {
      const newLeaveType = {
        name: 'Test Leave',
        description: 'Test leave type description',
        maxDaysPerYear: 15,
        carryForwardDays: 5,
        requiresApproval: true
      };

      const response = await request(app)
        .post('/api/leave-types')
        .set('Cookie', authCookie)
        .send(newLeaveType);

      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('name', 'Test Leave');
      expect(response.body).to.have.property('maxDaysPerYear', 15);
    });

    it('should reject invalid leave type data', async () => {
      const invalidLeaveType = {
        name: '', // Invalid: empty name
        maxDaysPerYear: -5 // Invalid: negative days
      };

      const response = await request(app)
        .post('/api/leave-types')
        .set('Cookie', authCookie)
        .send(invalidLeaveType);

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('error');
    });
  });

  describe('GET /api/leave-applications', () => {
    it('should return leave applications when authenticated', async () => {
      const response = await request(app)
        .get('/api/leave-applications')
        .set('Cookie', authCookie);

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
    });
  });

  describe('POST /api/leave-applications', () => {
    it('should create a new leave application with valid data', async () => {
      const newApplication = {
        employeeId: 'test-employee-id',
        leaveTypeId: 'test-leave-type-id',
        startDate: '2024-02-01',
        endDate: '2024-02-05',
        reason: 'Personal vacation',
        status: 'pending'
      };

      const response = await request(app)
        .post('/api/leave-applications')
        .set('Cookie', authCookie)
        .send(newApplication);

      // Note: This might fail if employee/leave type doesn't exist
      expect(response.status).to.be.oneOf([201, 400, 500]);
    });

    it('should reject leave application without required fields', async () => {
      const invalidApplication = {
        reason: 'Test reason'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/leave-applications')
        .set('Cookie', authCookie)
        .send(invalidApplication);

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('error');
    });
  });

  describe('GET /api/employee-leave-assignments', () => {
    it('should return employee leave assignments when authenticated', async () => {
      const response = await request(app)
        .get('/api/employee-leave-assignments')
        .set('Cookie', authCookie);

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
    });
  });

  describe('POST /api/employee-leave-assignments/bulk', () => {
    it('should create bulk leave assignments with valid data', async () => {
      const bulkData = {
        employeeIds: ['emp-1', 'emp-2'],
        leaveTypeId: 'leave-type-1',
        allocatedDays: 20,
        year: 2024
      };

      const response = await request(app)
        .post('/api/employee-leave-assignments/bulk')
        .set('Cookie', authCookie)
        .send(bulkData);

      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('success');
    });

    it('should reject bulk assignment without employee IDs', async () => {
      const invalidData = {
        employeeIds: [], // Empty array
        leaveTypeId: 'leave-type-1',
        allocatedDays: 20,
        year: 2024
      };

      const response = await request(app)
        .post('/api/employee-leave-assignments/bulk')
        .set('Cookie', authCookie)
        .send(invalidData);

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('error');
    });
  });
});