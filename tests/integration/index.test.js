jest.mock('../../src/llm/llm', () => ({
    processQuery: jest.fn().mockResolvedValue('MOCK_SQLPP_QUERY'),
}));
jest.mock('../../src/asterixdb/asterixdb', () => ({
    executeQuery: jest.fn().mockResolvedValue([{ result: 'mock data' }]),
}));

describe('Integration Tests', () => {
    it('returns mock query results', async () => {
        const { queryAsterixDB } = require('../../src');
        
        const results = await queryAsterixDB('testDataverse', 'test query');
        
        // Check that results are defined
        expect(results).toBeDefined();
        // Verify that the mock executeQuery is returning the expected data
        expect(results).toEqual([{ result: 'mock data' }]);
    });

    it('throws an error when processQuery fails', async () => {
        const { processQuery } = require('../../src/llm/llm');
        processQuery.mockRejectedValueOnce(new Error('Mock processQuery error'));

        const { queryAsterixDB } = require('../../src');
        
        await expect(queryAsterixDB('testDataverse', 'test query')).rejects.toThrow('Mock processQuery error');
    });

    it('throws an error when executeQuery fails', async () => {
        const { executeQuery } = require('../../src/asterixdb/asterixdb');
        executeQuery.mockRejectedValueOnce(new Error('Mock executeQuery error'));

        const { queryAsterixDB } = require('../../src');
        
        await expect(queryAsterixDB('testDataverse', 'test query')).rejects.toThrow('Mock executeQuery error');
    });
});
