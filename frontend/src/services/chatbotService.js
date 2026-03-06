import api from './authService';

export const chatbotService = {
    /**
     * Send a message to the AI chatbot.
     * @param {string} message - The user's message
     * @param {Array} history - Array of { role: 'user'|'assistant', content: string }
     * @returns {Promise<string>} The AI's reply
     */
    sendMessage: async (message, history = []) => {
        const response = await api.post('/chatbot/chat', { message, history });
        return response.data.reply;
    },
};
