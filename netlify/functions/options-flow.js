// This is your secure, serverless function for the FMP API.
const fetch = require('node-fetch'); // <-- ADDED THIS LINE

exports.handler = async function(event, context) {
    // 1. Securely access the FMP API key from Netlify's environment variables.
    const FMP_API_KEY = process.env.FMP_API_KEY;
    const ticker = event.queryStringParameters.symbol;

    if (!FMP_API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'FMP API key is not configured on the server.' })
        };
    }

    // 2. Construct the API URL. If a ticker is provided, add it as a query parameter.
    let url = `https://financialmodelingprep.com/api/v4/unusual-options-activity?apikey=${FMP_API_KEY}`;
    if (ticker) {
        url += `&symbol=${ticker}`;
    }

    try {
        // 3. Make the request to the FMP API.
        const response = await fetch(url);
        if (!response.ok) {
            const errorData = await response.json();
            return { statusCode: response.status, body: JSON.stringify(errorData) };
        }
        const data = await response.json();

        // 4. Return the successful response to your frontend application.
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error('Netlify Function Error (FMP):', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch data from FMP API.' })
        };
    }
};


