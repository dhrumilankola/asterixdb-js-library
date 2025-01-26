// Import required libraries
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// AsterixDB HTTP API configuration
const ASTERIXDB_URL = process.env.ASTERIXDB_URL || 'http://localhost:19002/query/service';

/**
 * Fetch metadata for all datasets in a dataverse.
 * @param {string} dataverseName - The name of the dataverse.
 * @returns {Promise<Object>} The metadata for all datasets in the dataverse.
 */
async function fetchAllMetadata(dataverseName) {
    try {
        // Query to fetch metadata for all datasets in the specified dataverse
        const metadataQuery = `
            USE Metadata;
            SELECT {
                "Dataset": ds,
                "Datatype": tp,
                "Indexes": (
                    SELECT VALUE ix
                    FROM \`Index\` ix
                    WHERE ix.DataverseName = ds.DataverseName AND ix.DatasetName = ds.DatasetName
                )
            }
            FROM \`Dataset\` ds
            JOIN \`Datatype\` tp
            ON ds.DataverseName = tp.DataverseName AND ds.DatatypeName = tp.DatatypeName
            WHERE ds.DataverseName = "${dataverseName}";
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

/**
 * Extract and format metadata from the raw response.
 * @param {Object} rawResponse - The raw response from AsterixDB.
 * @returns {Object} The extracted and formatted metadata.
 */
function extractMetadata(rawResponse) {
  try {
      const results = rawResponse.results;

      // Map each result, accounting for the `$1` wrapper
      const metadata = results.map(result => {
          const metadataEntry = result.$1; // Access the `$1` object
          if (!metadataEntry) {
              throw new Error('Metadata entry is missing the $1 key');
          }

          const dataset = metadataEntry.Dataset;
          const datatype = metadataEntry.Datatype;
          const indexes = metadataEntry.Indexes;

          if (!dataset || !datatype || !indexes) {
              throw new Error('Missing Dataset, Datatype, or Indexes in metadata entry');
          }

          return {
              dataset: {
                  datasetName: dataset.DatasetName,
                  dataverseName: dataset.DataverseName,
                  primaryKey: dataset.InternalDetails.PrimaryKey,
                  partitioningKey: dataset.InternalDetails.PartitioningKey,
                  datasetType: dataset.DatasetType,
                  storageFormat: dataset.DatasetFormat?.Format || 'Unknown',
              },
              datatype: {
                  datatypeName: datatype.DatatypeName,
                  dataverseName: datatype.DataverseName,
                  fields: datatype.Derived.Record.Fields.map(field => ({
                      name: field.FieldName,
                      type: field.FieldType,
                      nullable: field.IsNullable,
                      missable: field.IsMissable,
                  })),
              },
              indexes: indexes.map(index => ({
                  indexName: index.IndexName,
                  datasetName: index.DatasetName,
                  dataverseName: index.DataverseName,
                  indexType: index.IndexStructure,
                  searchKey: index.SearchKey,
                  isPrimary: index.IsPrimary,
              })),
          };
      });

      return metadata;
  } catch (error) {
      console.error('Error extracting metadata:', error.message);
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

module.exports = {
  fetchAllMetadata,
  extractMetadata,
  executeQuery
};