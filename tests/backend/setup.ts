import { beforeEach, afterEach } from 'mocha';
import { db } from '../../server/db';
import { users, employees, departments } from '../../shared/schema';

// Test database setup
export async function setupTestDb() {
  // Clear all tables before each test
  await db.delete(users);
  await db.delete(employees);
  await db.delete(departments);
}

export async function cleanupTestDb() {
  // Clean up after tests
  await db.delete(users);
  await db.delete(employees);
  await db.delete(departments);
}

// Global test hooks
beforeEach(async function() {
  await setupTestDb();
});

afterEach(async function() {
  await cleanupTestDb();
});