// --- THIS IS THE FIX ---
// This line was also missing from this file.
const fetch = require('node-fetch');

// This is your secure, serverless function that will run on Netlify's cloud infrastructure.

// The handler function is the main entry point.
exports.handler = async function(event, context) {
    // 1. Securely access the API key from Netlify's environment variables.
    const CMC_PRO_API_KEY = process.env.CMC_PRO_API_KEY;
    const cryptoIds = event.queryStringParameters.id;

    // Check if the key has been set in the Netlify UI.
    if (!CMC_PRO_API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'API key is not configured on the server.' })
        };
    }

    // The API endpoint for CoinMarketCap.
    const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?id=${cryptoIds}`;

    try {
        // 2. Make the request to the CoinMarketCap API, adding your secret key in the header.
        const response = await fetch(url, {
            headers: {
                'X-CMC_PRO_API_KEY': CMC_PRO_API_KEY,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            return { statusCode: response.status, body: JSON.stringify(errorData) };
        }

        const data = await response.json();

        // 3. Return the successful response to your frontend application.
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error('Netlify Function Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch data from CoinMarketCap API.' })
        };
    }
};

