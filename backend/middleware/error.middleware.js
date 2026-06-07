const logger = require('../config/logger');

const errorMiddleware = (err, req, res, next) => {
  logger.error(err.stack);
  
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(status).json({
    error: message,
    timestamp: new Date().toISOString()
  });
};

module.exports = errorMiddleware;
