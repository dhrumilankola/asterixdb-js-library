const { queryOllama } = require('./src/llm/llm.js');

async function testOllamaConnection() {
    try {
        console.log('Testing Ollama connection...');
        const response = await queryOllama('SELECT 1;');
        console.log('Ollama response:', response);
        return true;
    } catch (error) {
        console.error('Ollama connection test failed:', error);
        return false;
    }
}

async function main() {
    const ollamaWorks = await testOllamaConnection();
    if (!ollamaWorks) {
        console.error('Cannot proceed with tests - Ollama is not responding correctly');
        return;
    }

    console.log('Ollama connection successful! You can now run the full test suite.');
}

main().catch(console.error);