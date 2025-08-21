// Simple test script to verify API fixes
// Run with: node test-api.js

const testAPI = async () => {
  const testQuery = "transformer";
  const testLimit = 10;

  console.log(`Testing API with query: "${testQuery}" and limit: ${testLimit}`);
  console.log('=' .repeat(50));

  try {
    const response = await fetch('http://localhost:3000/api/search-papers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: testQuery,
        limit: testLimit
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ API call successful!');
      console.log(`Status: ${response.status}`);
      console.log(`Success: ${data.success}`);
      console.log(`Papers found: ${data.data?.successful?.length || 0}`);
      console.log(`From cache: ${data.cacheInfo?.fromCache || false}`);
      console.log(`Rate limited: ${data.cacheInfo?.rateLimited || false}`);
      console.log(`Cache hit rate: ${(data.cacheInfo?.cacheHitRate || 0) * 100}%`);
      
      if (data.data?.successful?.length > 0) {
        console.log('\n📄 Sample paper:');
        const sample = data.data.successful[0];
        console.log(`Title: ${sample.title}`);
        console.log(`Year: ${sample.year || 'N/A'}`);
        console.log(`Citations: ${sample.citationCount || 'N/A'}`);
        console.log(`Venue: ${sample.venue || 'N/A'}`);
      }
    } else {
      console.log('❌ API call failed!');
      console.log(`Status: ${response.status}`);
      console.log(`Error: ${data.error}`);
      console.log(`Message: ${data.message}`);
    }

  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
};

// Test validation errors
const testValidation = async () => {
  console.log('\n🧪 Testing validation...');
  console.log('=' .repeat(50));

  const testCases = [
    { query: '', limit: 10, description: 'Empty query' },
    { query: 'a'.repeat(600), limit: 10, description: 'Query too long' },
    { query: 'transformer', limit: 0, description: 'Invalid limit (0)' },
    { query: 'transformer', limit: 100, description: 'Limit too high' },
    { query: 'transformer<script>', limit: 10, description: 'Invalid characters' }
  ];

  for (const testCase of testCases) {
    try {
      const response = await fetch('http://localhost:3000/api/search-papers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: testCase.query,
          limit: testCase.limit
        })
      });

      const data = await response.json();

      if (response.status === 400) {
        console.log(`✅ ${testCase.description}: Properly rejected (${response.status})`);
      } else {
        console.log(`❌ ${testCase.description}: Should have been rejected, got ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${testCase.description}: Network error - ${error.message}`);
    }
  }
};

// Run tests
const runTests = async () => {
  console.log('🚀 Starting API tests...\n');
  
  await testAPI();
  await testValidation();
  
  console.log('\n✨ Tests completed!');
};

// Only run if this file is executed directly
if (typeof window === 'undefined') {
  runTests().catch(console.error);
}
