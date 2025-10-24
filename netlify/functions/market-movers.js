const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    const FMP_API_KEY = process.env.FMP_API_KEY;
    if (!FMP_API_KEY) {
        return { statusCode: 500, body: JSON.stringify({ error: 'FMP API key not configured.' }) };
    }

    const gainersUrl = `https://financialmodelingprep.com/api/v3/biggest-gainers?apikey=${FMP_API_KEY}`;
    const losersUrl = `https://financialmodelingprep.com/api/v3/biggest-losers?apikey=${FMP_API_KEY}`;

    try {
        // Fetch gainers and losers in parallel
        const [gainersRes, losersRes] = await Promise.all([
            fetch(gainersUrl),
            fetch(losersUrl)
        ]);

        if (!gainersRes.ok || !losersRes.ok) {
            console.error("Failed to fetch market movers");
            return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch market movers.' }) };
        }

        const gainers = await gainersRes.json();
        const losers = await losersRes.json();

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                // Return top 10 of each
                gainers: gainers.slice(0, 10),
                losers: losers.slice(0, 10)
            })
        };
    } catch (error) {
        console.error('Market Movers Function Error:', error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
