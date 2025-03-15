#!/bin/bash

# Color definitions
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== Microservice API Load Test ===${NC}"

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}k6 is not installed. Installing...${NC}"
    
    # Check OS and install accordingly
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew install k6
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -s https://packagecloud.io/install/repositories/k6/k6/script.deb.sh | sudo bash
        sudo apt-get install k6
    else
        echo -e "${RED}Unsupported OS. Please install k6 manually: https://k6.io/docs/getting-started/installation/${NC}"
        exit 1
    fi
fi

# Create results directory if it doesn't exist
mkdir -p load-test-results

# Get timestamp for result files
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Set default values
API_URL=${API_URL:-"http://localhost:3000"}
VUS=${VUS:-"1000"}
DURATION=${DURATION:-"5m"}
RAMP_UP=${RAMP_UP:-"2m"}
MAX_RPS=${MAX_RPS:-"500"}
TEST_TYPE=${TEST_TYPE:-"full"}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --api-url=*)
      API_URL="${1#*=}"
      shift
      ;;
    --vus=*)
      VUS="${1#*=}"
      shift
      ;;
    --duration=*)
      DURATION="${1#*=}"
      shift
      ;;
    --ramp-up=*)
      RAMP_UP="${1#*=}"
      shift
      ;;
    --max-rps=*)
      MAX_RPS="${1#*=}"
      shift
      ;;
    --test-type=*)
      TEST_TYPE="${1#*=}"
      shift
      ;;
    *)
      echo "Unknown parameter: $1"
      exit 1
      ;;
  esac
done

echo -e "${GREEN}API URL:${NC} $API_URL"
echo -e "${GREEN}Virtual Users:${NC} $VUS"
echo -e "${GREEN}Duration:${NC} $DURATION"
echo -e "${GREEN}Ramp-up:${NC} $RAMP_UP"
echo -e "${GREEN}Max RPS:${NC} $MAX_RPS"
echo -e "${GREEN}Test Type:${NC} $TEST_TYPE"

# Export variables for k6 script
export API_BASE_URL=$API_URL
export K6_VUS=$VUS
export K6_DURATION=$DURATION
export K6_RAMP_UP=$RAMP_UP
export K6_MAX_RPS=$MAX_RPS
export K6_TEST_TYPE=$TEST_TYPE

echo -e "\n${YELLOW}Starting load test...${NC}"

# Run k6 load test
k6 run \
  --out json=load-test-results/raw_results_$TIMESTAMP.json \
  --out csv=load-test-results/metrics_$TIMESTAMP.csv \
  --summary-export=load-test-results/summary_$TIMESTAMP.json \
  load_test.js

# Check if the test was successful
if [ $? -eq 0 ]; then
  echo -e "\n${GREEN}Load test completed successfully.${NC}"
  echo -e "Results saved to load-test-results/raw_results_$TIMESTAMP.json"
  echo -e "CSV metrics saved to load-test-results/metrics_$TIMESTAMP.csv"
  echo -e "Summary saved to load-test-results/summary_$TIMESTAMP.json"
  
  # Generate HTML report if k6-reporter is available
  if [ -f "node_modules/k6-reporter/dist/bundle.js" ]; then
    echo -e "\n${YELLOW}Generating HTML report...${NC}"
    node -e "const report=require('k6-reporter');report.generateSummaryReport('./load-test-results/raw_results_$TIMESTAMP.json', './load-test-results/report_$TIMESTAMP.html');"
    echo -e "${GREEN}HTML report saved to load-test-results/report_$TIMESTAMP.html${NC}"
  else
    echo -e "\n${YELLOW}To generate HTML reports, install k6-reporter:${NC}"
    echo -e "npm install k6-reporter --save-dev"
  fi
  
  # Display summary of the key metrics
  echo -e "\n${YELLOW}Key Performance Metrics:${NC}"
  jq -r '.metrics | 
    "Requests/sec: \(.http_reqs.rate.mean | round*100/100)\n" +
    "Average Response Time: \(.http_req_duration.avg | round*100/100) ms\n" +
    "95th Percentile Response Time: \(.http_req_duration["p(95)"] | round*100/100) ms\n" +
    "Error Rate: \((.http_req_failed.rate.mean*100) | round*100/100) %\n" +
    "Iterations: \(.iterations.count)\n" +
    "Failed Iterations: \(.iterations_failed.count)"' load-test-results/summary_$TIMESTAMP.json

else
  echo -e "\n${RED}Load test failed.${NC}"
  echo -e "Check the errors above for more information."
fi

echo -e "\n${YELLOW}Test complete.${NC}" 