// Simple test script to verify the filtering system
const testFilters = {
  yearMin: 2020,
  yearMax: 2024,
  types: ['article', 'preprint'],
  openAccess: true,
  minCitations: 100,
  sortBy: 'cited_by_count:desc',
  topics: ['computer-science', 'artificial-intelligence']
};

// Test the API endpoint
async function testFilteredSearch() {
  try {
    console.log('Testing filtered search...');
    console.log('Filters:', JSON.stringify(testFilters, null, 2));
    
    const response = await fetch('http://localhost:3000/api/search-papers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'machine learning',
        limit: 10,
        filters: testFilters
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Search successful!');
      console.log('Results count:', data.data.successful.length);
      console.log('Cache info:', data.cacheInfo);
      
      if (data.data.successful.length > 0) {
        console.log('First result:', {
          title: data.data.successful[0].title,
          year: data.data.successful[0].year,
          citations: data.data.successful[0].citationCount,
          isOpenAccess: data.data.successful[0].isOpenAccess
        });
      }
    } else {
      console.log('❌ Search failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

// Test without filters (backward compatibility)
async function testBasicSearch() {
  try {
    console.log('\nTesting basic search (no filters)...');
    
    const response = await fetch('http://localhost:3000/api/search-papers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'machine learning',
        limit: 5
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Basic search successful!');
      console.log('Results count:', data.data.successful.length);
    } else {
      console.log('❌ Basic search failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🧪 Testing Research Paper Filtering System\n');
  
  await testBasicSearch();
  await testFilteredSearch();
  
  console.log('\n✨ Tests completed!');
}

// Only run if this file is executed directly
if (typeof window === 'undefined') {
  runTests();
}
