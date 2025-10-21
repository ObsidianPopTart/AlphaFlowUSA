// This new Netlify function securely fetches market news data.
// It acts as a proxy, hiding your FMP_API_KEY from the client-side application.
// This completes the security refactor by ensuring no API keys are exposed publicly.

const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    // Retrieve the secure API key from Netlify's environment variables.
    const { FMP_API_KEY } = process.env;
    const url = `https://financialmodelingprep.com/api/v3/stock_news?limit=20&apikey=${FMP_API_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            // Forward the error status from the API if the request was not successful.
            return { statusCode: response.status, body: response.statusText };
        }
        const data = await response.json();
        
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };
    } catch (error) {
        // Handle network errors or issues with the fetch operation itself.
        console.error('Error fetching news data:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch news data' })
        };
    }
};
