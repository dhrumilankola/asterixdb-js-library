// Import required libraries
const { pipeline } = require('@huggingface/transformers');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Load the SQLCoder-7B-2 model from Hugging Face.
 * @returns {Promise<Object>} The loaded model pipeline.
 */
async function loadModel() {
  try {
    // Load the text-generation pipeline with the SQLCoder-7B-2 model
    const model = await pipeline('text-generation', 'defog/sqlcoder-7b-2', {
      device: 'cpu', // Use 'cuda' for GPU acceleration if available
    });
    return model;
  } catch (error) {
    console.error('Error loading the model:', error);
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
    // Load the model
    const model = await loadModel();

    // Construct the prompt as per the model's requirements
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

    // Generate the SQL++ query
    const response = await model(prompt, {
      max_length: 200, // Adjust based on the expected query length
      num_beams: 4, // Use beam search for better results
      do_sample: false, // Disable sampling for deterministic output
    });

    // Extract the generated SQL++ query
    const sqlppQuery = response[0].generated_text;
    return sqlppQuery;
  } catch (error) {
    console.error('Error generating SQL++ query:', error);
    throw error;
  }
}

// Example usage
(async () => {
  try {
    // Example natural language query
    const naturalQuery = "Get the names of users older than 30.";

    // Example database schema metadata (in DDL format)
    const schemaMetadata = `
CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(255),
  age INT
);
`;

    // Generate the SQL++ query
    const sqlppQuery = await generateSQLpp(naturalQuery, schemaMetadata);
    console.log('Generated SQL++ Query:', sqlppQuery);
  } catch (error) {
    console.error('Error in example usage:', error);
  }
})();

module.exports = { generateSQLpp };