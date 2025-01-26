jest.mock('@huggingface/transformers', () => ({
    pipeline: jest.fn().mockImplementation(() => async (prompt) => [
        { generated_text: `MOCK_QUERY_FOR: ${prompt}` },
    ]),
}));

const { generateSQLpp, inferDatasetAndFields } = require('../../src/llm/llm');

describe('LLM Module', () => {
    it('generates mock SQL++ queries', async () => {
        const mockSchema = 'mock schema';
        const query = await generateSQLpp('test query', mockSchema);

        expect(query).toBeDefined();
        expect(query).toContain('MOCK_QUERY_FOR:');
    });

    it('infers dataset and fields from metadata', async () => {
        const mockMetadata = [
            { dataset: { datasetName: 'Users' } },
            { dataset: { datasetName: 'Orders' } },
        ];
        
        const result = await inferDatasetAndFields('test query', mockMetadata);
        
        expect(result).toBeDefined();
        expect(result).toContain('MOCK_QUERY_FOR:');
    });

    it('throws an error when the model fails to load', async () => {
        const { pipeline } = require('@huggingface/transformers');
        pipeline.mockImplementationOnce(() => {
            throw new Error('Model loading failed');
        });

        await expect(generateSQLpp('test query', 'mock schema')).rejects.toThrow('Model loading failed');
    });
});
