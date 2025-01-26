require('dotenv').config();
const { queryAsterixDB } = require('./src');

(async () => {
    try {
        // Dataverse and natural language query
        const dataverseName = "TinySocial"; // Replace with your actual dataverse
        const naturalQuery = "Get all users who joined in 2022";

        // Execute query
        console.log(`Testing with dataverse: ${dataverseName}`);
        const results = await queryAsterixDB(dataverseName, naturalQuery);

        // Display results
        console.log("Query Results:");
        console.log(JSON.stringify(results, null, 2));
    } catch (error) {
        console.error("End-to-end test failed:", error);
    }
})();
