const { fetchMetadata } = require('./asterixdb');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Function to extract metadata
function extractMetadata(rawResponse) {
  try {
    const results = rawResponse.results;
    const metadata = results.map(result => {
      const datatypeName = result.DatatypeName;
      const fields = result.Derived?.Record?.Fields?.map(field => ({
        name: field.FieldName,
        type: field.FieldType,
        nullable: field.IsNullable
      })) || [];

      return {
        datatypeName,
        fields
      };
    });

    return metadata;
  } catch (error) {
    console.error('Error extracting metadata:', error);
    throw error;
  }
}

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