# Microservice API Testing & Monitoring Guide

This document provides comprehensive instructions for load testing, security scanning, and monitoring the microservice API.

## Table of Contents
- [Load Testing](#load-testing)
- [Security Scanning](#security-scanning)
- [Monitoring with Prometheus and Grafana](#monitoring)
- [Integration into CI/CD](#integration)

<a name="load-testing"></a>
## Load Testing

The load testing framework uses [k6](https://k6.io/), a modern load testing tool, to simulate user traffic and measure performance under different load conditions.

### Prerequisites
- Node.js 14+ and npm
- k6 (installed automatically by the run script if not present)
- jq (for parsing test results)

### Test Script Structure

The load test is defined in `load_test.js` and includes the following scenarios:
- User registration
- User login
- Profile retrieval and updates
- Public endpoint browsing

The test includes key metrics:
- HTTP request rates
- Response times (average, p95, p99)
- Error rates
- Custom metrics for business processes

### Running the Load Test

To run the load test with default settings (1,000 virtual users):

```bash
# Make the script executable
chmod +x ./run-load-test.sh

# Run with default settings
./run-load-test.sh
```

To customize the test parameters:

```bash
./run-load-test.sh \
  --api-url=http://api.example.com \
  --vus=500 \
  --duration=3m \
  --ramp-up=1m \
  --max-rps=200 \
  --test-type=auth-only
```

### Test Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| `--api-url` | API base URL | http://localhost:3000 |
| `--vus` | Number of virtual users | 1000 |
| `--duration` | Test duration | 5m |
| `--ramp-up` | Ramp-up period | 2m |
| `--max-rps` | Max requests per second | 500 |
| `--test-type` | Test type (full, auth-only, read-only) | full |

### Test Results

Results are saved to the `load-test-results` directory with timestamped filenames:
- JSON raw data: `raw_results_TIMESTAMP.json`
- CSV metrics: `metrics_TIMESTAMP.csv`
- Summary: `summary_TIMESTAMP.json`
- HTML report (if k6-reporter is installed): `report_TIMESTAMP.html`

To generate HTML reports, install the k6-reporter package:
```bash
npm install k6-reporter --save-dev
```

<a name="security-scanning"></a>
## Security Scanning

The security scanning uses [OWASP ZAP](https://www.zaproxy.org/) to perform automated security assessments on the API.

### Prerequisites
- Docker (for running ZAP)
- Java 8+ (if running ZAP locally)

### ZAP Configuration

The `zap-scan-rules.yaml` file contains configuration for:
- API context definition (endpoints, authentication)
- Scan policies tailored for API testing
- Active scan rules for:
  - SQL and NoSQL injection
  - Cross-site scripting (XSS) 
  - Authentication vulnerabilities
  - JWT implementation issues
  - Information disclosure

### Running the Security Scan

To run a security scan using Docker:

```bash
docker run -v $(pwd):/zap/wrk/:rw -t owasp/zap2docker-stable zap-full-scan.py \
  -t http://localhost:3000/api \
  -c /zap/wrk/zap-scan-rules.yaml \
  -r /zap/wrk/zap-scan-report.html \
  -j \
  -a
```

For a baseline scan (passive only, no active testing):

```bash
docker run -v $(pwd):/zap/wrk/:rw -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:3000/api \
  -c /zap/wrk/zap-scan-rules.yaml \
  -r /zap/wrk/zap-baseline-report.html
```

### Scan Results

The scan generates detailed reports in HTML and XML formats, identifying vulnerabilities categorized by:
- Risk level (High, Medium, Low, Informational)
- Vulnerability type
- Affected endpoints
- Remediation advice

<a name="monitoring"></a>
## Monitoring with Prometheus and Grafana

The monitoring setup uses Prometheus for metric collection and Grafana for visualization.

### Prerequisites
- Docker and Docker Compose

### Components

1. **Prometheus Configuration (`prometheus.yml`)**:
   - Scrapes metrics from multiple sources
   - Defines scrape intervals and timeouts
   - References rule files for alerting

2. **Alert Rules**:
   - `rules/microservice_api.rules.yml`: API-specific alerts
   - `rules/node_exporter.rules.yml`: Host-level alerts

3. **Grafana Dashboard (`grafana-dashboard.json`)**:
   - Comprehensive view of API performance
   - Host resource utilization
   - Authentication metrics
   - Database performance

### Setup and Running

1. Start the monitoring stack:

```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

2. Access Grafana at http://localhost:3000 (default credentials: admin/admin)

3. Import the dashboard from `grafana-dashboard.json`

### Key Metrics

The monitoring setup tracks:
- Request rates and latencies
- Error rates by endpoint
- CPU and memory usage
- Database operation latencies
- Authentication metrics (login success/failure)
- Active connections

### Alerts

Alerts are configured for:
- High error rates (>5%)
- Elevated response times (p95 > 2s)
- Service downtime
- Resource exhaustion (CPU, memory)
- Authentication anomalies
- Database connection issues

<a name="integration"></a>
## Integration into CI/CD

### GitHub Actions Example

```yaml
name: API Testing and Monitoring

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm ci
      - name: Run Load Test
        run: |
          chmod +x ./run-load-test.sh
          ./run-load-test.sh --vus=200 --duration=1m --ramp-up=30s
      - name: Archive test results
        uses: actions/upload-artifact@v2
        with:
          name: load-test-results
          path: load-test-results/

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: ZAP Scan
        uses: zaproxy/action-full-scan@v0.7.0
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          target: 'http://staging-api.example.com'
          rules_file_name: './zap-scan-rules.yaml'
          allow_issue_writing: true
```

### Jenkins Pipeline Example

```groovy
pipeline {
    agent any
    
    stages {
        stage('Load Test') {
            steps {
                sh 'chmod +x ./run-load-test.sh'
                sh './run-load-test.sh --api-url=http://staging-api --vus=500'
                archiveArtifacts artifacts: 'load-test-results/**', fingerprint: true
            }
        }
        
        stage('Security Scan') {
            steps {
                sh 'docker run -v $(pwd):/zap/wrk/:rw -t owasp/zap2docker-stable zap-full-scan.py -t http://staging-api -c /zap/wrk/zap-scan-rules.yaml -r /zap/wrk/zap-scan-report.html -j -a'
                archiveArtifacts artifacts: 'zap-scan-report.html', fingerprint: true
            }
        }
    }
    
    post {
        always {
            junit '**/load-test-results/junit.xml'
        }
    }
}
```

## Troubleshooting

### Load Testing Issues
- **Error: cannot connect to API**: Verify the API is running and the URL is correct
- **High error rates**: Check server logs for exceptions or timeouts
- **k6 out of memory**: Reduce VUs or adjust the test scenario

### ZAP Scanning Issues
- **Authentication failures**: Verify credentials in the ZAP config
- **Scan taking too long**: Adjust scan depth or target specific APIs
- **False positives**: Update the context or refine scan policies

### Monitoring Issues
- **Missing metrics**: Check Prometheus target status
- **Alerting noise**: Adjust thresholds in rule files
- **Grafana visualization issues**: Ensure the data source is correctly configured 