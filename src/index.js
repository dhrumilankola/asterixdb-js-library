const { generateSQLpp } = require('./llm/llm');
const { executeQuery } = require('./asterixdb/asterixdb');

async function main() {
  const naturalQuery = "Get the names of users older than 30.";
  const sqlppQuery = await generateSQLpp(naturalQuery);
  console.log(`Generated SQL++ Query: ${sqlppQuery}`);

  const result = await executeQuery(sqlppQuery);
  console.log('Query Result:', result);
}

main().catch(console.error);