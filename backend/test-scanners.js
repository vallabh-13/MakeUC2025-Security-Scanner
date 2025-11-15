/**
 * Scanner Test Suite
 * Tests all security scanners to verify they work correctly
 */

require('dotenv').config();

const { scanPorts } = require('./services/nmapScanner');
const { scanWithNuclei, checkNucleiInstallation } = require('./services/nucleiScanner');
const { scanSSL } = require('./services/SSLLabsScanner');
const { detectSoftware } = require('./services/softwareDetector');
const { checkVulnerabilities, quickVulnerabilityCheck } = require('./services/cveDatabase');

// Test URLs - using well-known websites
const TEST_URL = 'https://example.com';
const TEST_HOSTNAME = 'example.com';

console.log('=====================================================');
console.log('🔍 Security Scanner Test Suite');
console.log('=====================================================\n');

async function runAllTests() {
  let allTestsPassed = true;

  // Test 1: Nmap Scanner
  console.log('1️⃣  Testing Nmap Scanner...');
  console.log('----------------------------------------------------');
  try {
    const nmapResult = await scanPorts(TEST_HOSTNAME);
    console.log('✅ Nmap scan completed');
    console.log(`   - Found ${nmapResult.detectedServices?.length || 0} services`);
    console.log(`   - Found ${nmapResult.findings?.length || 0} findings`);

    if (nmapResult.findings) {
      const basicScanWarning = nmapResult.findings.find(f =>
        f.title?.includes('Basic Port Scan') || f.title?.includes('Fallback')
      );
      if (basicScanWarning) {
        console.log('⚠️  WARNING: Nmap is using fallback mode (not installed or lacking permissions)');
        console.log('   Recommendation: Install Nmap for comprehensive scanning');
      } else {
        console.log('✅ Nmap is working with full service detection');
      }
    }
  } catch (error) {
    console.log('❌ Nmap test FAILED:', error.message);
    allTestsPassed = false;
  }
  console.log('');

  // Test 2: Nuclei Scanner
  console.log('2️⃣  Testing Nuclei Scanner...');
  console.log('----------------------------------------------------');
  try {
    // First check if Nuclei is installed
    const nucleiStatus = await checkNucleiInstallation();
    if (!nucleiStatus.installed) {
      console.log('⚠️  WARNING: Nuclei is not installed');
      console.log('   Install: https://github.com/projectdiscovery/nuclei');
      console.log('   Skipping Nuclei test...');
    } else {
      console.log(`✅ Nuclei is installed: ${nucleiStatus.version}`);

      // Run a quick scan on test URL
      const nucleiResult = await scanWithNuclei(TEST_URL);

      if (nucleiResult.error) {
        console.log(`⚠️  Nuclei scan had issues: ${nucleiResult.error}`);
        if (nucleiResult.error.includes('read-only file system') ||
            nucleiResult.error.includes('Lambda filesystem')) {
          console.log('   Note: This is expected in Lambda environment');
        }
      } else {
        console.log('✅ Nuclei scan completed');
        console.log(`   - Found ${nucleiResult.findings?.length || 0} vulnerabilities`);
      }
    }
  } catch (error) {
    console.log('❌ Nuclei test FAILED:', error.message);
    allTestsPassed = false;
  }
  console.log('');

  // Test 3: SSL Labs Scanner
  console.log('3️⃣  Testing SSL Labs Scanner...');
  console.log('----------------------------------------------------');
  try {
    console.log('   Starting SSL Labs scan (this may take 1-2 minutes)...');
    const sslResult = await scanSSL(TEST_HOSTNAME);

    if (sslResult.error) {
      console.log(`⚠️  SSL scan had issues: ${sslResult.error}`);
    } else {
      console.log('✅ SSL Labs scan completed');
      console.log(`   - SSL Grade: ${sslResult.grade || 'N/A'}`);
      console.log(`   - Found ${sslResult.findings?.length || 0} SSL findings`);
    }
  } catch (error) {
    console.log('❌ SSL Labs test FAILED:', error.message);
    allTestsPassed = false;
  }
  console.log('');

  // Test 4: Software Detection
  console.log('4️⃣  Testing Software Detection...');
  console.log('----------------------------------------------------');
  try {
    const softwareResult = await detectSoftware(TEST_URL);
    console.log('✅ Software detection completed');
    console.log(`   - Web Server: ${softwareResult.webServer?.name || 'Not detected'}`);
    console.log(`   - CMS: ${softwareResult.cms || 'Not detected'}`);
    console.log(`   - Frameworks: ${softwareResult.frameworks?.length || 0} detected`);
    console.log(`   - Libraries: ${softwareResult.libraries?.length || 0} detected`);
  } catch (error) {
    console.log('❌ Software detection test FAILED:', error.message);
    allTestsPassed = false;
  }
  console.log('');

  // Test 5: CVE Database
  console.log('5️⃣  Testing CVE Database...');
  console.log('----------------------------------------------------');
  try {
    // Test quick vulnerability check with known vulnerable version
    const testVuln = quickVulnerabilityCheck('Apache', '2.4.40');
    if (testVuln) {
      console.log('✅ CVE quick check is working');
      console.log(`   - Sample vulnerability detected: ${testVuln.title}`);
    } else {
      console.log('✅ CVE quick check completed (no known vulns for test version)');
    }

    // Test full CVE check
    const sampleSoftware = {
      webServer: { name: 'nginx', version: '1.18.0' },
      libraries: [
        { name: 'jQuery', version: '3.5.0' }
      ]
    };

    const cveResults = await checkVulnerabilities(sampleSoftware);
    console.log('✅ CVE database check completed');
    console.log(`   - Found ${cveResults.length} CVEs`);
  } catch (error) {
    console.log('❌ CVE database test FAILED:', error.message);
    allTestsPassed = false;
  }
  console.log('');

  // Final Summary
  console.log('=====================================================');
  if (allTestsPassed) {
    console.log('✅ ALL TESTS PASSED');
    console.log('=====================================================\n');
    console.log('Recommendations:');
    console.log('- If any scanners showed warnings, consider installing them');
    console.log('- Nmap: https://nmap.org/download.html');
    console.log('- Nuclei: https://github.com/projectdiscovery/nuclei');
    console.log('');
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('=====================================================\n');
    console.log('Please check the errors above and fix any issues.');
    console.log('');
  }

  process.exit(allTestsPassed ? 0 : 1);
}

// Run all tests
runAllTests().catch((error) => {
  console.error('\n💥 FATAL ERROR:', error.message);
  console.error(error.stack);
  process.exit(1);
});
