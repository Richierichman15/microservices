import { check, sleep, group } from 'k6';
import http from 'k6/http';
import { Counter, Rate, Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';
import { URLSearchParams } from 'https://jslib.k6.io/url/1.0.0/index.js';
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

// Custom metrics
const RegistrationSuccess = new Counter('registration_success');
const RegistrationFailure = new Counter('registration_failure');
const LoginSuccess = new Counter('login_success');
const LoginFailure = new Counter('login_failure');
const ProfileSuccess = new Counter('profile_success');
const ProfileFailure = new Counter('profile_failure');
const UpdateSuccess = new Counter('update_success');
const UpdateFailure = new Counter('update_failure');

// Response time metrics
const RegistrationTrend = new Trend('registration_time');
const LoginTrend = new Trend('login_time');
const ProfileTrend = new Trend('profile_time');
const UpdateTrend = new Trend('update_time');

// Error rates
const ErrorRate = new Rate('error_rate');
const SuccessRate = new Rate('success_rate');

// Configuration
const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:3000';
const MOCK_MODE = __ENV.MOCK_MODE || false;

// Setup shared array of test users (accessible to all VUs)
const testUsers = new SharedArray('test users', function() {
  return [
    { email: 'admin@example.com', password: 'adminPassword123!' },
    { email: 'user1@example.com', password: 'userPassword123!' },
    { email: 'user2@example.com', password: 'userPassword123!' },
    { email: 'user3@example.com', password: 'userPassword123!' },
    { email: 'user4@example.com', password: 'userPassword123!' },
  ];
});

// Test configuration
export const options = {
  // Get these from environment variables or use defaults
  vus: __ENV.K6_VUS || 1000,
  duration: __ENV.K6_DURATION || '5m',
  
  // Ramp-up configuration
  stages: [
    { duration: __ENV.K6_RAMP_UP || '2m', target: __ENV.K6_VUS || 1000 },  // Ramp-up to target VUs
    { duration: __ENV.K6_DURATION || '5m', target: __ENV.K6_VUS || 1000 }, // Stay at target
    { duration: '1m', target: 0 },                                         // Ramp-down to 0
  ],
  
  // Rate limiting
  rps: __ENV.K6_MAX_RPS || 500,
  
  // Thresholds
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<3000'],   // 95% of requests should be below 2s, 99% below 3s
    http_req_failed: ['rate<0.05'],                    // Error rate should be below 5%
    'registration_time': ['p(95)<3000'],               // 95% of registrations should be below 3s
    'login_time': ['p(95)<1000'],                      // 95% of logins should be below 1s
    'profile_time': ['p(95)<1000'],                    // 95% of profile retrieval should be below 1s
    'update_time': ['p(95)<2000'],                     // 95% of updates should be below 2s
    'error_rate': ['rate<0.05'],                       // Overall error rate should be below 5%
    'success_rate': ['rate>0.95'],                     // Overall success rate should be above 95%
  },
};

// Default headers
const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Cache for auth tokens (scope to VU)
let authTokens = {};

/*
 * Main function that simulates user behavior 
 */
export default function() {
  // Choose a scenario based on weighted probability
  const scenario = chooseScenario();
  
  switch(scenario) {
    case 'registration':
      registerUser();
      break;
    case 'login':
      loginUser();
      break;
    case 'profile':
      viewProfile();
      break;
    case 'update':
      updateProfile();
      break;
    case 'browse':
      browsePublicEndpoints();
      break;
    default:
      browsePublicEndpoints();
  }
  
  // Add a sleep interval to simulate real user behavior
  sleep(randomIntBetween(1, 5));
}

// Helper: Choose a scenario with different probabilities
function chooseScenario() {
  const rand = Math.random();
  if (rand < 0.1) return 'registration';   // 10% chance
  if (rand < 0.4) return 'login';          // 30% chance
  if (rand < 0.6) return 'profile';        // 20% chance 
  if (rand < 0.8) return 'update';         // 20% chance
  return 'browse';                         // 20% chance
}

// Scenario 1: Register a new user
function registerUser() {
  const username = `user_${randomString(8)}`;
  const email = `${username}@example.com`;
  const password = `Test${randomString(8)}!`;
  
  group('User Registration', () => {
    const payload = JSON.stringify({
      username: username,
      email: email,
      password: password,
      firstName: 'Test',
      lastName: 'User'
    });
    
    const response = http.post(`${BASE_URL}/api/v1/auth/register`, payload, { headers });
    
    // Record metrics
    RegistrationTrend.add(response.timings.duration);
    
    const success = check(response, {
      'registration status is 201': (r) => r.status === 201,
      'response has user ID': (r) => r.json('userId') !== undefined,
    });
    
    if (success) {
      RegistrationSuccess.add(1);
      SuccessRate.add(1);
      
      // Store the newly registered user
      if (Math.random() < 0.5) { // 50% of new users will log in
        // Try to login as the new user
        sleep(randomIntBetween(1, 3));
        loginWithCredentials(email, password);
      }
    } else {
      RegistrationFailure.add(1);
      ErrorRate.add(1);
      console.log(`Registration failed: ${response.status} - ${response.body}`);
    }
  });
}

// Scenario 2: Login with existing user
function loginUser() {
  // Choose a random existing user from test users
  const userIndex = Math.floor(Math.random() * testUsers.length);
  const { email, password } = testUsers[userIndex];
  
  loginWithCredentials(email, password);
}

// Helper: Login with specific credentials
function loginWithCredentials(email, password) {
  group('User Login', () => {
    const payload = JSON.stringify({
      email: email,
      password: password
    });
    
    const response = http.post(`${BASE_URL}/api/v1/auth/login`, payload, { headers });
    
    // Record metrics
    LoginTrend.add(response.timings.duration);
    
    const success = check(response, {
      'login status is 200': (r) => r.status === 200,
      'response has token': (r) => r.json('token') !== undefined,
    });
    
    if (success) {
      LoginSuccess.add(1);
      SuccessRate.add(1);
      
      // Store the token for this virtual user
      const token = response.json('token');
      authTokens[email] = token;
    } else {
      LoginFailure.add(1);
      ErrorRate.add(1);
      console.log(`Login failed for ${email}: ${response.status} - ${response.body}`);
    }
  });
}

// Scenario 3: View user profile
function viewProfile() {
  // Check if user is logged in, if not, log in first
  if (Object.keys(authTokens).length === 0) {
    loginUser();
    sleep(1);
  }
  
  // Get a random user's token
  const emails = Object.keys(authTokens);
  if (emails.length === 0) {
    // No logged in users, do something else instead
    browsePublicEndpoints();
    return;
  }
  
  const email = emails[Math.floor(Math.random() * emails.length)];
  const token = authTokens[email];
  
  group('View Profile', () => {
    const authHeaders = {
      ...headers,
      'Authorization': `Bearer ${token}`
    };
    
    const response = http.get(`${BASE_URL}/api/v1/users/profile`, { headers: authHeaders });
    
    // Record metrics
    ProfileTrend.add(response.timings.duration);
    
    const success = check(response, {
      'profile status is 200': (r) => r.status === 200,
      'profile has email': (r) => r.json('email') !== undefined,
    });
    
    if (success) {
      ProfileSuccess.add(1);
      SuccessRate.add(1);
    } else {
      ProfileFailure.add(1);
      ErrorRate.add(1);
      
      // If unauthorized, the token might be expired - remove it
      if (response.status === 401) {
        delete authTokens[email];
      }
      
      console.log(`Profile retrieval failed: ${response.status} - ${response.body}`);
    }
  });
}

// Scenario 4: Update user profile
function updateProfile() {
  // Check if user is logged in, if not, log in first
  if (Object.keys(authTokens).length === 0) {
    loginUser();
    sleep(1);
  }
  
  // Get a random user's token
  const emails = Object.keys(authTokens);
  if (emails.length === 0) {
    // No logged in users, do something else
    browsePublicEndpoints();
    return;
  }
  
  const email = emails[Math.floor(Math.random() * emails.length)];
  const token = authTokens[email];
  
  group('Update Profile', () => {
    const authHeaders = {
      ...headers,
      'Authorization': `Bearer ${token}`
    };
    
    const payload = JSON.stringify({
      firstName: `FirstName${randomString(4)}`,
      lastName: `LastName${randomString(4)}`,
      bio: `This is a test bio for load testing. Random text: ${randomString(20)}`
    });
    
    const response = http.put(`${BASE_URL}/api/v1/users/profile`, payload, { headers: authHeaders });
    
    // Record metrics
    UpdateTrend.add(response.timings.duration);
    
    const success = check(response, {
      'update status is 200': (r) => r.status === 200,
      'update successful': (r) => r.json('success') === true,
    });
    
    if (success) {
      UpdateSuccess.add(1);
      SuccessRate.add(1);
    } else {
      UpdateFailure.add(1);
      ErrorRate.add(1);
      
      // If unauthorized, the token might be expired - remove it
      if (response.status === 401) {
        delete authTokens[email];
      }
      
      console.log(`Profile update failed: ${response.status} - ${response.body}`);
    }
  });
}

// Scenario 5: Browse public endpoints
function browsePublicEndpoints() {
  group('Public Endpoints', () => {
    // Check health
    const healthResponse = http.get(`${BASE_URL}/api/health`, { headers });
    check(healthResponse, {
      'health check status is 200': (r) => r.status === 200,
      'health check returns ok': (r) => r.json('status') === 'ok',
    });
    
    sleep(randomIntBetween(0.5, 1.5));
    
    // Get API docs/info
    const infoResponse = http.get(`${BASE_URL}/api/v1/info`, { headers });
    check(infoResponse, {
      'info status is 200': (r) => r.status === 200,
    });
    
    sleep(randomIntBetween(0.5, 1.5));
    
    // Get public users (pagination)
    const page = randomIntBetween(1, 5);
    const limit = randomIntBetween(10, 50);
    const params = new URLSearchParams([['page', page], ['limit', limit]]);
    
    const usersResponse = http.get(`${BASE_URL}/api/v1/users/public?${params.toString()}`, { headers });
    check(usersResponse, {
      'public users status is 200': (r) => r.status === 200,
      'public users contains users array': (r) => Array.isArray(r.json('users')),
    });
  });
}

// Setup function - executed once per VU
export function setup() {
  console.log(`Starting load test with ${options.vus} virtual users for ${options.duration}`);
  
  // Register initial test users if in mock mode
  if (MOCK_MODE) {
    console.log('Pre-registering test users in mock mode');
    testUsers.forEach(user => {
      const payload = JSON.stringify({
        username: user.email.split('@')[0],
        email: user.email,
        password: user.password,
        firstName: 'Test',
        lastName: 'User'
      });
      
      http.post(`${BASE_URL}/api/v1/auth/register`, payload, { headers });
    });
  }
  
  return { mockMode: MOCK_MODE };
}

// Teardown function - executed at the end of the test
export function teardown(data) {
  console.log(`Load test completed. Mock mode was: ${data.mockMode}`);
  // We could clean up test data here if needed
}

// Generate HTML report after test
export function handleSummary(data) {
  return {
    "load-test-report.html": htmlReport(data),
    stdout: textSummary(data, { indent: " ", enableColors: true }),
  };
}

// Helper function for text summary (normally imported from k6-reporter but included here for completeness)
function textSummary(data, options) {
  const indent = options?.indent || "  ";
  const enableColors = options?.enableColors || false;
  
  const color = {
    yellow: enableColors ? "\u001b[93m" : "",
    green: enableColors ? "\u001b[32m" : "",
    red: enableColors ? "\u001b[31m" : "",
    cyan: enableColors ? "\u001b[36m" : "",
    reset: enableColors ? "\u001b[0m" : "",
  };
  
  const summary = [];
  
  summary.push(`${color.yellow}Summary${color.reset}`);
  summary.push(`${indent}Scenarios: ${data.metrics.scenarios.count}`);
  summary.push(`${indent}VUs: ${data.metrics.vus.max}`);
  summary.push(`${indent}Duration: ${formatDuration(data.state.testRunDurationMs)}`);
  
  summary.push(`\n${color.yellow}Custom Metrics${color.reset}`);
  summary.push(`${indent}Created Users: ${data.metrics.created_users?.count || 0}`);
  summary.push(`${indent}Successful Logins: ${data.metrics.successful_logins?.count || 0}`);
  summary.push(`${indent}Error Rate: ${formatPercent(data.metrics.error_rate?.rate || 0)}`);
  
  summary.push(`\n${color.yellow}HTTP Requests${color.reset}`);
  summary.push(`${indent}Total: ${data.metrics.http_reqs.count}`);
  summary.push(`${indent}Rate: ${Math.round(data.metrics.http_reqs.rate)} req/s`);
  
  summary.push(`\n${color.yellow}HTTP Request Durations${color.reset}`);
  summary.push(`${indent}Min: ${formatDuration(data.metrics.http_req_duration.min)}`);
  summary.push(`${indent}Avg: ${formatDuration(data.metrics.http_req_duration.avg)}`);
  summary.push(`${indent}Max: ${formatDuration(data.metrics.http_req_duration.max)}`);
  summary.push(`${indent}p(95): ${formatDuration(data.metrics.http_req_duration.p(95))}`);
  
  return summary.join('\n');
}

function formatDuration(ms) {
  if (ms < 1000) {
    return `${ms.toFixed(1)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatPercent(decimal) {
  return `${(decimal * 100).toFixed(2)}%`;
} 