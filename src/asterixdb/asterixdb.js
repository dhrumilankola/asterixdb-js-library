const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const ASTERIXDB_URL = process.env.ASTERIXDB_URL || 'http://localhost:19002/query/service';

/**
 * Prepends USE dataverse statement to a query
 * @param {string} dataverseName - The name of the dataverse
 * @param {string} query - The SQL++ query
 * @returns {string} The complete query with USE statement
 */
function prependDataverseContext(dataverseName, query) {
    return `USE \`${dataverseName}\`;\n${query}`;
}

/**
 * Fetch metadata for all datasets in a dataverse.
 * @param {string} dataverseName - The name of the dataverse.
 * @returns {Promise<Object>} The raw metadata response from AsterixDB.
 */
async function fetchAllMetadata(dataverseName) {
    try {
        const metadataQuery = `
            SELECT VALUE {
                "datasetName": ds.DatasetName,
                "primaryKey": ds.InternalDetails.PrimaryKey,
                "fields": (
                    SELECT VALUE {
                        "name": f.FieldName,
                        "type": f.FieldType
                    }
                    FROM tp.Derived.Record.Fields f
                )
            }
            FROM \`Metadata\`.\`Dataset\` ds
            JOIN \`Metadata\`.\`Datatype\` tp
            ON ds.DataverseName = tp.DataverseName 
            AND ds.DatatypeName = tp.DatatypeName
            WHERE ds.DataverseName = "${dataverseName}";
        `;

        console.log("Debug: Executing metadata query:", metadataQuery);

        const response = await axios.post(ASTERIXDB_URL, {
            statement: metadataQuery,
            format: 'json',
        });

        console.log("Debug: Full raw response:", JSON.stringify(response.data, null, 2));

        if (!response.data || !response.data.results) {
            throw new Error(`Invalid or empty metadata results for dataverse: ${dataverseName}`);
        }

        return response.data;
    } catch (error) {
        console.error(`Error fetching metadata for dataverse "${dataverseName}":`, error.message);
        if (error.response?.data) {
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
        throw error;
    }
}

/**
 * Extract structured metadata from the raw AsterixDB response.
 * @param {Object} rawResponse - The raw response from AsterixDB.
 * @returns {Array} Array of structured metadata objects.
 */
function extractMetadata(rawResponse) {
    try {
        const results = rawResponse.results;

        if (!Array.isArray(results) || results.length === 0) {
            console.error("Debug: rawResponse.results structure:", JSON.stringify(results, null, 2));
            throw new Error('Metadata results are empty or not an array.');
        }

        return results.map(dataset => ({
            datasetName: dataset.datasetName,
            primaryKey: dataset.primaryKey || [],
            fields: dataset.fields || []
        }));
    } catch (error) {
        console.error('Error extracting metadata:', error.message);
        throw error;
    }
}

/**
 * Execute a SQL++ query on AsterixDB.
 * @param {string} query - The SQL++ query to execute.
 * @param {string} dataverseName - The name of the dataverse to use.
 * @returns {Promise<Array>} The query results.
 */
async function executeQuery(query, dataverseName) {
    try {
        // Prepend the USE statement to the query
        const fullQuery = prependDataverseContext(dataverseName, query);
        console.log("Debug: Executing full query:", fullQuery);

        const response = await axios.post(ASTERIXDB_URL, {
            statement: fullQuery,
            format: 'json',
        });

        if (!response.data || !response.data.results) {
            throw new Error('Query returned no results.');
        }

        return response.data.results;
    } catch (error) {
        console.error('Error executing query:', error.message);
        if (error.response?.data) {
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
        throw error;
    }
}

module.exports = {
    fetchAllMetadata,
    extractMetadata,
    executeQuery,
    prependDataverseContext, // Exported for testing
};