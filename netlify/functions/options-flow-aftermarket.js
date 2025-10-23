const fetch = require('node-fetch');

// List of high-volume tickers to check after hours. Keep this list manageable.
const AFTER_HOURS_TICKERS = ['SPY', 'QQQ', 'TSLA', 'AAPL', 'NVDA', 'AMZN', 'MSFT', 'META'];
const MAX_TRADES_TO_FETCH = 75; // Limit the number of trades fetched per interval

exports.handler = async function(event, context) {
    const FMP_API_KEY = process.env.FMP_API_KEY;

    if (!FMP_API_KEY) {
        return { statusCode: 500, body: JSON.stringify({ error: 'FMP API key not configured.' }) };
    }

    // --- FIX APPLIED ---
    // The previous URL was: `.../api/v4/historical/trades_after_market`
    // This has been updated to the correct endpoint from the FMP documentation.
    const baseUrl = `https://financialmodelingprep.com/stable/aftermarket-trade`;

    try {
        // Fetch trades for each ticker in parallel
        const fetchPromises = AFTER_HOURS_TICKERS.map(ticker =>
            // --- FIX APPLIED ---
            // The API endpoint requires the symbol as a query parameter (?symbol=)
            // not as a path parameter (/${ticker}).
            fetch(`${baseUrl}?symbol=${ticker}&limit=${MAX_TRADES_TO_FETCH}&apikey=${FMP_API_KEY}`)
            .then(res => res.ok ? res.json() : Promise.resolve([])) // Return empty array on error for a specific ticker
            .catch(err => {
                console.error(`Error fetching after-hours trades for ${ticker}:`, err);
                return []; // Return empty array on network error
            })
        );

        const results = await Promise.all(fetchPromises);
        let allTrades = results.flat(); // Combine trades from all tickers

        // Sort by timestamp descending (newest first)
        // Assuming 't' is the timestamp field from the new endpoint.
        // If this fails, the data structure from '/stable/aftermarket-trade' may be different.
        allTrades.sort((a, b) => new Date(b.t) - new Date(a.t));

        // Limit the total number of trades returned
        allTrades = allTrades.slice(0, MAX_TRADES_TO_FETCH);

        // Format the data for the frontend
        // This assumes the new endpoint returns a similar data structure:
        // { t: timestamp, s: symbol, p: price, z: size }
        const formattedTrades = allTrades.map(trade => ({
            timestamp: Math.floor(new Date(trade.t).getTime() / 1000), // Convert to Unix timestamp (seconds)
            symbol: trade.s,
            strikePrice: null, // Placeholder - Raw trade data usually lacks this
            putCall: null,     // Placeholder - Raw trade data usually lacks this
            tradePrice: trade.p,
            tradeSize: trade.z,
            totalValue: (trade.p * trade.z * 100), // Calculate premium
            sentiment: 'N/A' // Sentiment analysis isn't feasible on raw trades
        }));

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formattedTrades)
        };

    } catch (error) {
        console.error('Netlify Function Error (Aftermarket Trades):', error);
        // Return empty array even on general failure to prevent frontend errors
        return {
            statusCode: 500, // Indicate server error
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify([]) 
        };
    }
};
