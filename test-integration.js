#!/usr/bin/env node

/**
 * ========================================
 * INTEGRATION TEST SCRIPT
 * ========================================
 * 
 * Purpose: Test the integration between main app and PROJECT B
 * 
 * Usage: node test-integration.js
 * 
 * Description:
 * This script tests if both applications are running and can communicate
 * properly. It checks the main app (port 8081) and PROJECT B (port 8082).
 * 
 * Last Updated: 2025-01-31
 * Author: BrandBloom Frontend Team
 */

const http = require('http');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkPort(port, name) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: port,
      path: '/',
      method: 'GET',
      timeout: 3000
    }, (res) => {
      log(`✅ ${name} is running on port ${port}`, 'green');
      resolve(true);
    });

    req.on('error', (err) => {
      log(`❌ ${name} is not running on port ${port}`, 'red');
      resolve(false);
    });

    req.on('timeout', () => {
      log(`⏰ ${name} timeout on port ${port}`, 'yellow');
      resolve(false);
    });

    req.end();
  });
}

async function testIntegration() {
  log('\n🚀 Testing BrandBloom Insights Integration...\n', 'bold');

  // Test main app (port 8081)
  const mainAppRunning = await checkPort(8081, 'Main App');
  
  // Test PROJECT B (port 8082)
  const projectBRunning = await checkPort(8082, 'PROJECT B Dashboard');

  log('\n📊 Test Results:', 'bold');
  log(`Main App (Port 8081): ${mainAppRunning ? '✅ Running' : '❌ Not Running'}`, mainAppRunning ? 'green' : 'red');
  log(`PROJECT B (Port 8082): ${projectBRunning ? '✅ Running' : '❌ Not Running'}`, projectBRunning ? 'green' : 'red');

  if (mainAppRunning && projectBRunning) {
    log('\n🎉 Integration Test PASSED!', 'green');
    log('Both applications are running and ready for testing.', 'blue');
    log('\n📝 Next Steps:', 'bold');
    log('1. Visit http://localhost:8081', 'blue');
    log('2. Click "Analyze Dashboards"', 'blue');
    log('3. Select "Brand Leader"', 'blue');
    log('4. Click "Access Dashboard Analytics"', 'blue');
    log('5. Verify PROJECT B opens in new tab', 'blue');
  } else {
    log('\n⚠️  Integration Test FAILED!', 'red');
    log('\n🔧 Troubleshooting:', 'bold');
    
    if (!mainAppRunning) {
      log('• Start main app: cd frontend && npm run dev', 'yellow');
    }
    
    if (!projectBRunning) {
      log('• Start PROJECT B: cd "PROJECT B/maricoinsight-Dashboarding" && npm run dev', 'yellow');
    }
    
    log('\n📚 See INTEGRATION_README.md for detailed setup instructions.', 'blue');
  }

  log('\n' + '='.repeat(50), 'blue');
}

// Run the test
testIntegration().catch(console.error);

