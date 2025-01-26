const { processQuery } = require('./llm/llm');
const { executeQuery } = require('./asterixdb/asterixdb');

/**
 * Main interface function for developers
 */
async function queryAsterixDB(dataverseName, naturalQuery) {
  try {
      const sqlppQuery = await processQuery(dataverseName, naturalQuery);

      if (!sqlppQuery || typeof sqlppQuery !== 'string') {
          throw new Error('Invalid SQL++ query generated.');
      }

      return await executeQuery(sqlppQuery);
  } catch (error) {
      console.error('Error processing query:', error.message);
      throw error;
  }
}

module.exports = {
    queryAsterixDB,
    fetchAllMetadata: require('./asterixdb/asterixdb').fetchAllMetadata,
    extractMetadata: require('./asterixdb/asterixdb').extractMetadata
};