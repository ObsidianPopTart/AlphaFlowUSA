// This is your new "smart search" function.
// It checks if a ticker is a crypto or a stock.
const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    const { CMC_PRO_API_KEY } = process.env;
    const ticker = event.queryStringParameters.symbol;

    if (!CMC_PRO_API_KEY) {
        return { statusCode: 500, body: JSON.stringify({ error: 'API key is not configured.' }) };
    }
    if (!ticker) {
        return { statusCode: 400, body: JSON.stringify({ error: 'No symbol provided.' }) };
    }

    // Use the 'quotes' endpoint to see if this symbol exists on CMC
    const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${ticker}`;

    try {
        const response = await fetch(url, {
            headers: {
                'X-CMC_PRO_API_KEY': CMC_PRO_API_KEY,
                'Accept': 'application/json'
            }
        });

        const data = await response.json();

        // If the response is OK AND the data object for the ticker exists, it's a crypto
        if (response.ok && data.data && data.data[ticker]) {
            return {
                statusCode: 200,
                body: JSON.stringify({ isCrypto: true, symbol: ticker })
            };
        } else {
            // Otherwise, it's not a crypto (or not found), so we'll treat it as a stock
            return {
                statusCode: 200,
                body: JSON.stringify({ isCrypto: false, symbol: ticker })
            };
        }
    } catch (error) {
        console.error('Search Function Error:', error);
        // On error, default to treating it as a stock
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to search', isCrypto: false, symbol: ticker })
        };
    }
};
