// Vercel serverless function entry point
const express = require('express');
const { registerRoutes } = require('../server/routes');

const app = express();

// Export for Vercel
module.exports = async (req, res) => {
  await registerRoutes(app);
  return app(req, res);
};