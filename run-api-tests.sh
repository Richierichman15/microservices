#!/bin/bash

# Colors for console output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}===================================================${NC}"
echo -e "${YELLOW}        Microservice API Automated Testing         ${NC}"
echo -e "${YELLOW}===================================================${NC}"

# Check if Newman is installed globally
if ! command -v newman &> /dev/null; then
    echo -e "${RED}Newman CLI is not installed. Installing...${NC}"
    npm install -g newman newman-reporter-htmlextra
fi

# Create a directory for test results if it doesn't exist
mkdir -p test-reports

# Set environment variables
API_URL=${API_URL:-"http://localhost:3000"}
ADMIN_EMAIL=${ADMIN_EMAIL:-"admin@example.com"}
ADMIN_PASSWORD=${ADMIN_PASSWORD:-"password123"}

echo -e "${YELLOW}Setting up test environment...${NC}"
echo -e "API URL: ${API_URL}"
echo -e "Admin Email: ${ADMIN_EMAIL}"
echo -e "Admin Password: ${ADMIN_PASSWORD}"

# Create environment file for newman
cat > test-environment.json << EOF
{
  "id": "microservice-api-env",
  "name": "Microservice API Environment",
  "values": [
    {
      "key": "baseUrl",
      "value": "${API_URL}",
      "type": "string",
      "enabled": true
    },
    {
      "key": "adminEmail",
      "value": "${ADMIN_EMAIL}",
      "type": "string",
      "enabled": true
    },
    {
      "key": "adminPassword",
      "value": "${ADMIN_PASSWORD}",
      "type": "string",
      "enabled": true
    }
  ]
}
EOF

echo -e "${YELLOW}Running API tests...${NC}"

# Run Newman with the Postman collection
newman run microservice-api-collection.json \
  --environment test-environment.json \
  --folder "Health Check" \
  --folder "Authentication" \
  --folder "Admin User Management" \
  --folder "Error Handling" \
  --reporters cli,htmlextra,junit \
  --reporter-htmlextra-export test-reports/html-report.html \
  --reporter-junit-export test-reports/junit-report.xml \
  --timeout-request 5000 \
  --timeout-script 10000 \
  --color on

# Check if the test execution was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}All tests completed successfully!${NC}"
    echo -e "HTML Report: ./test-reports/html-report.html"
    echo -e "JUnit Report: ./test-reports/junit-report.xml"
    exit 0
else
    echo -e "${RED}Some tests failed!${NC}"
    echo -e "HTML Report: ./test-reports/html-report.html"
    echo -e "JUnit Report: ./test-reports/junit-report.xml"
    exit 1
fi 