// Import required libraries
const dotenv = require('dotenv');
const { fetchAllMetadata, extractMetadata } = require('../asterixdb/asterixdb');

dotenv.config();

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const MODEL_ENDPOINT = 'https://api-inference.huggingface.co/models/defog/sqlcoder-7b-2';


const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

/**
 * Query the Hugging Face Inference API with a given input.
 * @param {string} prompt - The prompt to send to the model.
 * @returns {Promise<string>} The response from the model.
 */
async function queryHuggingFaceAPI(prompt) {
  try {
      const response = await fetch(MODEL_ENDPOINT, {
          method: 'POST',
          headers: {
              Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ inputs: prompt }),
      });

      if (!response.ok) {
          const errorDetails = await response.text();
          throw new Error(`Hugging Face API error: ${response.status} - ${errorDetails}`);
      }

      const result = await response.json();
      return result[0]?.generated_text || '';
  } catch (error) {
      console.error('Error querying Hugging Face API:', error.message);
      throw error;
  }
}

/**
 * Generate a SQL++ query from a natural language question.
 * @param {string} naturalQuery - The natural language question.
 * @param {string} schemaMetadata - The database schema metadata in DDL format.
 * @returns {Promise<string>} The generated SQL++ query.
 */
async function generateSQLpp(naturalQuery, schemaMetadata) {
    try {
        // Construct the prompt
        const prompt = `
### Task
Generate a SQL query to answer [QUESTION]${naturalQuery}[/QUESTION]

### Database Schema
The query will run on a database with the following schema:
${schemaMetadata}

### Answer
Given the database schema, here is the SQL query that [QUESTION]${naturalQuery}[/QUESTION]
[SQL]
`;

        // Query the Hugging Face Inference API
        const sqlppQuery = await queryHuggingFaceAPI(prompt);
        return sqlppQuery.trim();
    } catch (error) {
        console.error('Error generating SQL++ query:', error.message);
        throw error;
    }
}

/**
 * Infer the relevant dataset and fields from a natural language query.
 * @param {string} naturalQuery - The natural language query.
 * @param {Array<Object>} metadata - The metadata for all datasets in the dataverse.
 * @returns {Promise<string>} The inferred dataset and fields.
 */
async function inferDatasetAndFields(naturalQuery, metadata) {
    try {
        // Construct the prompt for dataset inference
        const prompt = `
### Task
Identify the relevant dataset and fields from the following natural language query:
[QUERY]${naturalQuery}[/QUERY]

### Available Datasets
${metadata.map(ds => ds.dataset.datasetName).join(', ')}

### Answer
The relevant dataset and fields are:
`;

        // Query the Hugging Face Inference API
        const inferenceResult = await queryHuggingFaceAPI(prompt);
        return inferenceResult.trim();
    } catch (error) {
        console.error('Error inferring dataset and fields:', error.message);
        throw error;
    }
}

/**
 * Process a natural language query by fetching metadata, inferring the dataset, and generating a SQL++ query.
 * @param {string} dataverseName - The name of the dataverse.
 * @param {string} naturalQuery - The natural language query.
 * @returns {Promise<string>} The generated SQL++ query.
 */
async function processQuery(dataverseName, naturalQuery) {
    try {
        const rawMetadata = await fetchAllMetadata(dataverseName);
        const metadata = extractMetadata(rawMetadata);

        if (!metadata?.length) {
            throw new Error(`No metadata found for dataverse: ${dataverseName}`);
        }

        const inferenceResult = await inferDatasetAndFields(naturalQuery, metadata);
        const relevantMetadata = metadata.find(
            ds => ds.dataset.datasetName === inferenceResult.datasetName
        );

        if (!relevantMetadata) {
            throw new Error(`Dataset not found in metadata: ${inferenceResult.datasetName}`);
        }

        return await generateSQLpp(naturalQuery, JSON.stringify(relevantMetadata));
    } catch (error) {
        console.error('Query processing failed:', error.message);
        throw error;
    }
}

module.exports = { generateSQLpp, inferDatasetAndFields, processQuery };
