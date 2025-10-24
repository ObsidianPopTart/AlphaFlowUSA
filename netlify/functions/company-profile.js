const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    const FMP_API_KEY = process.env.FMP_API_KEY;
    if (!FMP_API_KEY) {
        return { statusCode: 500, body: JSON.stringify({ error: 'FMP API key not configured.' }) };
    }

    // Fetches the real-time sector performance
    const url = `https://financialmodelingprep.com/api/v3/sector-performance-snapshot?apikey=${FMP_API_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to fetch sector performance:', errorText);
            return { statusCode: response.status, body: JSON.stringify({ error: 'Failed to fetch sector performance.' }) };
        }

        const data = await response.json();

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error('Sector Performance Function Error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
