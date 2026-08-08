// run-tests.js
// Runs the automated test suite sequentially to bypass glob dependency limitations in minimal Node builds.

console.log('========================================');
console.log('🧪 Running Song Downloader Unit Tests');
console.log('========================================\n');

try {
    require('./tests/url-helper.test.js');
    require('./tests/decrypt.test.js');
    require('./tests/formatters.test.js');
    require('./tests/services.test.js');
} catch (e) {
    console.error('\n❌ Test Loading Failure:', e);
    process.exit(1);
}
