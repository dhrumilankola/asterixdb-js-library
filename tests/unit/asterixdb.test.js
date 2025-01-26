const {
    fetchAllMetadata,
    extractMetadata,
    executeQuery,
} = require('../../src/asterixdb/asterixdb');
const axios = require('axios');

// Mock axios for network requests
jest.mock('axios');

describe('asterixdb.js Unit Tests', () => {
    describe('fetchAllMetadata', () => {
        it('should fetch metadata for all datasets in a dataverse', async () => {
            const dataverseName = 'TinySocial';
            const mockResponse = {
                data: {
                    results: [
                        { Dataset: {}, Datatype: {}, Indexes: [] },
                    ],
                },
            };

            axios.post.mockResolvedValueOnce(mockResponse);

            const metadata = await fetchAllMetadata(dataverseName);
            expect(metadata).toBeDefined();
            expect(metadata.results).toBeInstanceOf(Array);
        });

        it('should throw an error for an invalid dataverse', async () => {
            axios.post.mockRejectedValueOnce(new Error('Invalid dataverse'));
            const dataverseName = 'InvalidDataverse';
            
            await expect(fetchAllMetadata(dataverseName)).rejects.toThrow('Invalid dataverse');
        });
    });

    describe('extractMetadata', () => {
        it('should extract and format metadata from the raw response', () => {
            const rawResponse = {
                results: [
                    {
                        Dataset: { DatasetName: 'Users', DataverseName: 'MyDataverse' },
                        Datatype: { DatatypeName: 'UserType', Fields: [] },
                        Indexes: [],
                    },
                ],
            };

            const metadata = extractMetadata(rawResponse);
            expect(metadata).toBeDefined();
            expect(metadata[0].dataset.datasetName).toBe('Users');
        });
    });

    describe('executeQuery', () => {
        it('should execute a SQL++ query and return results', async () => {
            const query = 'USE MyDataverse; SELECT * FROM Users;';
            const mockResults = [{ name: 'John Doe' }];
            
            axios.post.mockResolvedValueOnce({ data: { results: mockResults } });

            const results = await executeQuery(query);
            expect(results).toBeDefined();
            expect(results).toEqual(mockResults);
        });

        it('should throw an error for an invalid query', async () => {
            const query = 'INVALID QUERY';
            axios.post.mockRejectedValueOnce(new Error('Query execution error'));

            await expect(executeQuery(query)).rejects.toThrow('Query execution error');
        });
    });
});
