const debug = require('debug');

// Create debuggers for different components
const debuggers = {
  server: debug('microservice:server'),
  database: debug('microservice:database'),
  auth: debug('microservice:auth'),
  user: debug('microservice:user'),
  routes: debug('microservice:routes'),
  middleware: debug('microservice:middleware'),
  error: debug('microservice:error')
};

// Helper method to pretty print objects for debugging
const debugObject = (debugInstance, message, obj) => {
  if (obj) {
    debugInstance(`${message}: %O`, obj);
  } else {
    debugInstance(message);
  }
};

module.exports = {
  ...debuggers,
  debugObject
}; 