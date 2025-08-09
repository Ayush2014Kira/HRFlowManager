import { describe, it } from 'mocha';
import { expect } from 'chai';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes';
import './setup';

describe('Authentication API', () => {
  let app: express.Application;
  let server: any;

  before(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
  });

  after(() => {
    if (server) {
      server.close();
    }
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        });

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('user');
      expect(response.body.user).to.have.property('username', 'admin');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'wrongpassword'
        });

      expect(response.status).to.equal(401);
      expect(response.body).to.have.property('error');
    });

    it('should reject missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).to.equal(400);
      expect(response.body).to.have.property('error');
    });
  });

  describe('GET /api/auth/user', () => {
    it('should return user data when authenticated', async () => {
      // First login to get session
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        });

      const cookie = loginResponse.headers['set-cookie'];

      // Then get user data
      const response = await request(app)
        .get('/api/auth/user')
        .set('Cookie', cookie);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('username', 'admin');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/auth/user');

      expect(response.status).to.equal(401);
      expect(response.body).to.have.property('error');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      // First login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        });

      const cookie = loginResponse.headers['set-cookie'];

      // Then logout
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookie);

      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('message', 'Logged out successfully');
    });
  });
});