// --- THIS IS THE FIX ---
// This line was also missing from this file.
const fetch = require('node-fetch');

// This is your secure, serverless function that will run on Netlify's cloud infrastructure.

// The handler function is the main entry point.
exports.handler = async function(event, context) {
    // 1. Securely access the API key from Netlify's environment variables.
    const CMC_PRO_API_KEY = process.env.CMC_PRO_API_KEY;
    // const cryptoIds = event.queryStringParameters.id; // Original line
    const cryptoIds = '1'; // --- TESTING: Request only Bitcoin ---

    // Check if the key has been set in the Netlify UI.
    if (!CMC_PRO_API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'API key is not configured on the server.' })
        };
    }

    // The API endpoint for CoinMarketCap.
    // Using the simplified ID list for testing
    const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?id=${cryptoIds}`;
    console.log("Attempting to fetch crypto data from:", url); // Add logging

    try {
        // 2. Make the request to the CoinMarketCap API, adding your secret key in the header.
        const response = await fetch(url, {
            headers: {
                'X-CMC_PRO_API_KEY': CMC_PRO_API_KEY,
                'Accept': 'application/json'
            }
        });
        console.log("CMC API Response Status:", response.status); // Add logging

        if (!response.ok) {
            const errorData = await response.text(); // Use text to catch non-JSON errors
            console.error(`CMC API Error (${response.status}): ${errorData}`);
            return { 
                statusCode: response.status, 
                // Try parsing as JSON, but fall back to raw text if it fails
                body: JSON.stringify({ error: `CMC API request failed (${response.status}). See logs.`, rawError: errorData }) 
            };
        }

        const data = await response.json();
        console.log("Successfully fetched CMC crypto data.");

        // 3. Return the successful response to your frontend application.
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error('Netlify Function Error (Crypto Catch Block):', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Netlify function failed: ${error.message}` })
        };
    }
};

