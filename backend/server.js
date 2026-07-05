const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

dotenv.config();
const app = require('./app');
const { sequelize } = require('./models');
const { startDeadlineChecker } = require('./services/deadlineChecker');

const PORT = process.env.PORT || 5000;

sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connected');
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 API available at http://localhost:${PORT}`);
      console.log(`📍 API available at http://0.0.0.0:${PORT}`);
      startDeadlineChecker();
    });
  })
  .catch(err => {
    console.error('❌ Database error:', err);
    process.exit(1);
  });
