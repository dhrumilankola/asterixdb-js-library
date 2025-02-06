// test.js
require('dotenv').config();
const { generateVerifiableQuery } = require('./src/llm/llm.js');
const { executeQuery } = require('./src/asterixdb/asterixdb.js');

/**
 * Verify if the generated query is safe to execute
 * @param {Object} queryPackage - The query package to verify
 * @returns {boolean} - Whether the query passed verification
 */
function verifyQuery(queryPackage) {
    console.log("\nVerifying query...");
    
    // Basic safety checks
    const checks = {
        noUnsafeCommands: !/(DROP|DELETE|UPDATE|ALTER|INSERT)\s/i.test(queryPackage.query),
        hasRequiredClauses: /(SELECT|FROM)\s/i.test(queryPackage.query),
        hasLimit: /LIMIT\s+\d+/i.test(queryPackage.query),
        validDataverse: typeof queryPackage.dataverseName === 'string' && queryPackage.dataverseName.length > 0,
        hasMetadata: Array.isArray(queryPackage.metadata) && queryPackage.metadata.length > 0
    };

    // Log verification results
    console.log("Verification results:");
    Object.entries(checks).forEach(([check, passed]) => {
        console.log(`- ${check}: ${passed ? 'PASSED' : 'FAILED'}`);
    });

    // All checks must pass
    return Object.values(checks).every(result => result);
}

async function runTest() {
    const dataverseName = "YelpDataverse";
    const testCases = [
        {
            description: "Basic business search",
            query: "How do cities rank based on the total number of reviews received by businesses, and what are the review counts?",
            expectedToPass: true
        },
        {
            description: "Complex aggregation",
            query: "What are the average review scores for the top 10 cities with the highest number of reviews?",
            expectedToPass: true
        }
    ];

    try {
        for (const testCase of testCases) {
            console.log(`\n=== Testing: ${testCase.description} ===`);
            
            // Step 1: Generate verifiable query
            console.log("\n1. Generating query...");
            const queryPackage = await generateVerifiableQuery(
                dataverseName,
                testCase.query,
                50  // limit for testing
            );

            // Log generated query package
            console.log("\nGenerated Query Package:");
            console.log("------------------------");
            console.log("Natural Query:", queryPackage.naturalQuery);
            console.log("SQL Query:", queryPackage.query);
            console.log("Dataverse:", queryPackage.dataverseName);
            console.log("Limit:", queryPackage.limit);
            console.log("Generated at:", queryPackage.timestamp);

            // Step 2: Verify query
            const isVerified = verifyQuery(queryPackage);
            
            if (!isVerified) {
                console.log("❌ Query verification failed");
                if (testCase.expectedToPass) {
                    throw new Error("Expected query to pass verification but it failed");
                }
                continue;
            }

            console.log("✅ Query verification passed");

            // Step 3: Execute verified query
            if (isVerified) {
                console.log("\n3. Executing verified query...");
                const results = await executeQuery(queryPackage.query, dataverseName);
                
                console.log(`Query returned ${results.length} results`);
                if (results.length > 0) {
                    console.log("Sample results (first 2):", JSON.stringify(results.slice(0, 2), null, 2));
                }
            }
        }

    } catch (error) {
        console.error('Test failed:', error);
        console.error('Error details:', error.message);
        if (error.response?.data) {
            console.error('Response data:', error.response.data);
        }
        process.exit(1);
    }
}

// Run the tests
console.log("Starting tests...");
runTest()
    .then(() => {
        console.log("\n✅ All tests completed");
    })
    .catch(error => {
        console.error("\n❌ Tests failed:", error);
    })
    .finally(() => {
        console.log("\nTest run completed");
    });