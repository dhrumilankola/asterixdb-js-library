const { fetchMetadata } = require('./asterixdb');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();



// Test the fetchMetadata and extractMetadata functions
(async () => {
  try {
    console.log('Testing fetchMetadata function...');
    const rawResponse = await fetchMetadata();
    console.log('Raw response fetched successfully.');

    console.log('Extracting metadata...');
    const metadata = extractMetadata(rawResponse);
    console.log('Metadata extracted successfully:');
    console.log(JSON.stringify(metadata, null, 2));
  } catch (error) {
    console.error('Error during test:', error);
  }
})();