require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/user-microservice',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default_jwt_secret_for_dev_only',
    expirationTime: process.env.JWT_EXPIRATION || '1d',
  },
  logs: {
    level: process.env.LOG_LEVEL || 'info',
  },
  cors: {
    origins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'],
  },
}; 