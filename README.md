# User Management Microservice

A Node.js Express microservice for user management with JWT authentication and MongoDB integration.

## Features

- RESTful API for user management (CRUD operations)
- JWT-based authentication
- MongoDB database integration
- Role-based authorization (admin/user)
- Robust error handling and validation
- Structured logging with Winston
- Security with Helmet, CORS, and more
- Debugging tools and advanced testing capabilities

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login with email and password
- `GET /api/v1/auth/profile` - Get current user profile (requires auth)
- `PATCH /api/v1/auth/profile` - Update current user profile (requires auth)

### Users (Admin only)

- `GET /api/v1/users` - Get all users (paginated)
- `POST /api/v1/users` - Create a new user
- `GET /api/v1/users/:id` - Get user by ID
- `PATCH /api/v1/users/:id` - Update user by ID
- `DELETE /api/v1/users/:id` - Delete user by ID

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd user-microservice

# Install dependencies
npm install

# Create .env file (use .env.example as a template)
cp .env.example .env
```

## Configuration

Create a `.env` file in the root directory with the following variables:

```
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/user-microservice
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRATION=1d
LOG_LEVEL=debug
CORS_ORIGINS=http://localhost:3000,http://localhost:8080
```

## Running the Application

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start

# Mock mode (no MongoDB required)
MOCK_MODE=true npm run dev

# Debug mode (with Node.js inspector)
npm run debug

# Debug mode with breakpoint on startup
npm run debug:break
```

## Debugging

The microservice includes several debugging features:

### Debug Mode

Run the application with debug output enabled:

```bash
# Enable debug output for all components
DEBUG=microservice:* npm run dev

# Debug specific components
DEBUG=microservice:database,microservice:auth npm run dev
```

### Node.js Inspector

Use the built-in Node.js debugging capabilities:

```bash
# Start the app with the inspector
npm run debug

# Start with a breakpoint on the first line
npm run debug:break
```

Then connect using Chrome DevTools at `chrome://inspect` or VS Code's debugger.

### Request Visualization

In development mode, the application logs detailed request/response information when the DEBUG environment variable is set:

```bash
DEBUG=microservice:routes npm run dev
```

## MongoDB Setup

To use this microservice, you'll need to have MongoDB running. You have several options:

1. **Local MongoDB installation**: Follow the [MongoDB installation guide](https://docs.mongodb.com/manual/installation/) for your OS.

2. **MongoDB Atlas (cloud)**: Set up a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and update your MONGODB_URI.

3. **MongoDB with Docker**:
   ```bash
   docker run --name mongodb -p 27017:27017 -d mongo
   ```

## Testing

The application includes comprehensive testing:

```bash
# Run all tests
npm test

# Watch mode (run tests on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Debug tests
npm run test:debug

# Run end-to-end tests only
npm run test:e2e
```

### Test Environment

Tests use:
- Jest as the test runner
- MongoDB Memory Server for database testing
- Supertest for API testing

## Docker and Kubernetes

The application is containerized and ready for Kubernetes deployment:

```bash
# Build Docker image
npm run docker:build

# Run Docker container
npm run docker:run
```

## Project Structure

```
.
├── src/
│   ├── config/            # Configuration files
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Express middleware
│   ├── models/            # Mongoose models
│   ├── routes/            # Express routes
│   ├── utils/             # Utility functions
│   ├── validations/       # Request validation schemas
│   ├── app.js             # Express app setup
│   └── server.js          # Server entry point
├── __tests__/             # Tests
│   ├── e2e/               # End-to-end tests
│   ├── fixtures/          # Test fixtures
│   ├── setup/             # Test setup
│   ├── unit/              # Unit tests
│   └── utils/             # Test utilities
├── k8s/                   # Kubernetes configuration
├── logs/                  # Application logs
├── .dockerignore          # Docker ignore file
├── .env                   # Environment variables
├── .env.example           # Example environment file
├── .eslintrc.json         # ESLint configuration
├── .gitignore             # Git ignore file
├── Dockerfile             # Docker configuration
├── jest.config.js         # Jest configuration
├── package.json           # Project dependencies
└── README.md              # Project documentation
```

## Security Considerations

- JWT tokens are used for authentication
- Passwords are hashed using bcrypt
- API is secured with Helmet security headers
- CORS is configured for specified origins only
- Request validation is performed on all endpoints
- Error messages don't leak sensitive information
- Non-root user in Docker container

## CI/CD

The project includes a GitHub Actions workflow for:
- Linting with ESLint
- Running tests with Jest
- Building and pushing Docker images
- Deploying to Kubernetes

## Future Improvements

- Add rate limiting for authentication endpoints
- Implement refresh tokens
- Add more unit and integration tests
- Set up CI/CD pipeline
- Add API documentation with Swagger
- Implement password reset functionality 