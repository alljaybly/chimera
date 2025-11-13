/**
 * Simple test script for Gopher adapter
 * This is a manual verification script, not an automated test
 */

import { GopherAdapter, parseGopherUrl, parseGopherDirectory } from './gopher-adapter.js';

async function testGopherAdapter() {
  console.log('Testing Gopher Adapter...\n');

  const adapter = new GopherAdapter();

  // Test 1: URL validation
  console.log('Test 1: URL Validation');
  console.log('Valid Gopher URL:', adapter.isValidGopherUrl('gopher://gopher.floodgap.com/'));
  console.log('Invalid URL:', adapter.isValidGopherUrl('http://example.com/'));
  console.log('');

  // Test 2: URL parsing
  console.log('Test 2: URL Parsing');
  const parsed = parseGopherUrl('gopher://gopher.floodgap.com:70/1/world');
  console.log('Parsed URL:', parsed);
  console.log('');

  // Test 3: Directory parsing
  console.log('Test 3: Directory Parsing');
  const sampleDirectory = '1About Floodgap\t/gopher/floodgap\tgopher.floodgap.com\t70\r\n0README\t/README.txt\tgopher.floodgap.com\t70\r\n.\r\n';
  const items = parseGopherDirectory(sampleDirectory);
  console.log('Parsed items:', items);
  console.log('');

  // Test 4: Fetch from a real Gopher server (if available)
  console.log('Test 4: Fetch from Gopher Server');
  console.log('Note: This test requires network access to a Gopher server.');
  console.log('Attempting to fetch from gopher://gopher.floodgap.com/...');
  
  try {
    const response = await adapter.fetch('gopher://gopher.floodgap.com/');
    console.log('Success! Content type:', response.contentType);
    console.log('Content preview (first 200 chars):');
    console.log(response.content.substring(0, 200));
    if (response.items) {
      console.log(`Found ${response.items.length} items in directory`);
    }
  } catch (error) {
    console.log('Fetch failed (this is expected if no network or server is down):');
    console.log(error instanceof Error ? error.message : String(error));
  }

  console.log('\nGopher Adapter tests completed!');
}

// Run tests
testGopherAdapter().catch(console.error);
