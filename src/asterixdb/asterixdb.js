// Import required libraries
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// AsterixDB HTTP API configuration
const ASTERIXDB_URL = process.env.ASTERIXDB_URL || 'http://localhost:19002/query/service';

/**
 * Fetch metadata from AsterixDB.
 * @returns {Promise<string>} The database schema metadata in DDL format.
 */
async function fetchMetadata() {
    try {
      // Query to fetch metadata about datatypes and their schemas
      const metadataQuery = `
        SELECT VALUE dt
        FROM Metadata.\`Datatype\` dt
        WHERE dt.DatatypeName IN ["GleambookUserType", "ChirpMessageType", "GleambookMessageType", "ChirpUserType"];
      `;
  
      // Send the query to AsterixDB
      const response = await axios.post(ASTERIXDB_URL, {
        statement: metadataQuery,
        format: 'json',
      });
  
      // Log the full response
      console.log('Full response:', JSON.stringify(response.data, null, 2));
  
      // Return the raw response for debugging
      return response.data;
    } catch (error) {
      console.error('Error fetching metadata:', error);
      throw error;
    }
}

function extractMetadata(rawResponse) {
    try {
      // Extract the results array from the raw response
      const results = rawResponse.results;
  
      // Map each result to extract relevant metadata
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

/**
 * Execute a SQL++ query on AsterixDB.
 * @param {string} query - The SQL++ query to execute.
 * @returns {Promise<Object>} The query results.
 */
async function executeQuery(query) {
  try {
    // Send the query to AsterixDB
    const response = await axios.post(ASTERIXDB_URL, {
      statement: query,
      format: 'json',
    });

    // Return the query results
    return response.data.results;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
}

module.exports = { fetchMetadata, executeQuery };