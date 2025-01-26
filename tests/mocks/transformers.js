module.exports = {
    pipeline: jest.fn().mockImplementation(() => ({
        mockModel: true,
        mockGenerate: async (prompt) => ({
            generated_text: `MOCK_QUERY FOR: ${prompt}`
        })
    }))
};