import { describe, it } from 'mocha';
import { expect } from 'chai';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes';
import './setup';

describe('Employees API', () => {
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

  describe('GET /api/employees', () => {
    it('should return employees list when authenticated', async () => {
      const response = await request(app)
        .get('/api/employees')
        .set('Cookie', authCookie);

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/employees');

      expect(response.status).to.equal(401);
    });
  });

  describe('POST /api/employees', () => {
    it('should create a new employee with valid data', async () => {
      const newEmployee = {
        name: 'Test Employee',
        employeeId: 'EMP001',
        email: 'test@example.com',
        phone: '1234567890',
        departmentId: 'dept-1',
        position: 'Developer',
        salary: 75000,
        hireDate: '2024-01-01',
        status: 'active'
      };

      const response = await request(app)
        .post('/api/employees')
        .set('Cookie', authCookie)
        .send(newEmployee);

      expect(response.status).to.equal(201);
      expect(response.body).to.have.property('name', 'Test Employee');
      expect(response.body).to.have.property('employeeId', 'EMP001');
    });

    it('should reject invalid employee data', async () => {
      const invalidEmployee = {
        name: '', // Invalid: empty name
        email: 'invalid-email' // Invalid: bad email format
      };

      const response = await request(app)
        .post('/api/employees')
        .set('Cookie', authCookie)
        .send(invalidEmployee);

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('error');
    });
  });

  describe('PUT /api/employees/:id', () => {
    it('should update an existing employee', async () => {
      // First create an employee
      const newEmployee = {
        name: 'Test Employee',
        employeeId: 'EMP002',
        email: 'test2@example.com',
        phone: '1234567890',
        departmentId: 'dept-1',
        position: 'Developer',
        salary: 75000,
        hireDate: '2024-01-01',
        status: 'active'
      };

      const createResponse = await request(app)
        .post('/api/employees')
        .set('Cookie', authCookie)
        .send(newEmployee);

      const employeeId = createResponse.body.id;

      // Then update it
      const updates = {
        name: 'Updated Employee Name',
        salary: 80000
      };

      const updateResponse = await request(app)
        .put(`/api/employees/${employeeId}`)
        .set('Cookie', authCookie)
        .send(updates);

      expect(updateResponse.status).to.equal(200);
      expect(updateResponse.body).to.have.property('name', 'Updated Employee Name');
      expect(updateResponse.body).to.have.property('salary', 80000);
    });
  });

  describe('DELETE /api/employees/:id', () => {
    it('should delete an existing employee', async () => {
      // First create an employee
      const newEmployee = {
        name: 'Test Employee to Delete',
        employeeId: 'EMP003',
        email: 'test3@example.com',
        phone: '1234567890',
        departmentId: 'dept-1',
        position: 'Developer',
        salary: 75000,
        hireDate: '2024-01-01',
        status: 'active'
      };

      const createResponse = await request(app)
        .post('/api/employees')
        .set('Cookie', authCookie)
        .send(newEmployee);

      const employeeId = createResponse.body.id;

      // Then delete it
      const deleteResponse = await request(app)
        .delete(`/api/employees/${employeeId}`)
        .set('Cookie', authCookie);

      expect(deleteResponse.status).to.equal(200);
      expect(deleteResponse.body).to.have.property('message');
    });
  });
});