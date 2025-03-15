const { routes: routesDebug, debugObject } = require('../utils/debug');

/**
 * Middleware for debugging request/response flow
 */
const requestDebug = (req, res, next) => {
  // Only run in development mode
  if (process.env.NODE_ENV !== 'development') {
    return next();
  }

  const startTime = Date.now();
  
  // Log request details
  routesDebug(`🔍 [${req.method}] ${req.url}`);
  
  if (Object.keys(req.params).length) {
    routesDebug('Parameters:', req.params);
  }
  
  if (Object.keys(req.query).length) {
    routesDebug('Query:', req.query);
  }
  
  if (req.body && Object.keys(req.body).length) {
    // Hide sensitive info
    const sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '******';
    if (sanitizedBody.jwt) sanitizedBody.jwt = '******';
    if (sanitizedBody.token) sanitizedBody.token = '******';
    
    routesDebug('Body:', sanitizedBody);
  }
  
  // Capture original end method
  const originalEnd = res.end;
  
  // Override end method
  res.end = function(chunk, encoding) {
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Log response details
    routesDebug(`✅ [${req.method}] ${req.url} - Status: ${res.statusCode} - ${responseTime}ms`);
    
    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

module.exports = requestDebug; 