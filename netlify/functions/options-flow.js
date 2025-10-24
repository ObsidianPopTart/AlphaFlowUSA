// --- THIS IS THE FIX ---
// This line was missing. The function was crashing because 'fetch' was not defined
// in the Node.js server environment. I am so sorry this was missed.
const fetch = require('node-fetch');

// This is your secure, serverless function for the FMP API.
// The URL 'https://financialmodelingprep.com/api/v4/unusual-options-activity'
// is the correct endpoint for premium plans.

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

    // 2. Construct the API URL.
    // This is the correct endpoint for the premium 'unusual-options-activity' feed.
    let url = `https://financialmodelingprep.com/api/v4/unusual-options-activity?apikey=${FMP_API_KEY}`;
    
    if (ticker) {
        url += `&symbol=${ticker}`; 
    }

    console.log("Attempting to fetch options flow from:", url); // Add logging

    try {
        // 3. Make the request to the FMP API.
        const response = await fetch(url);
        
        console.log("FMP API Response Status:", response.status); // Add logging

        if (!response.ok) {
            const errorData = await response.text(); // Use .text() to capture potential non-JSON errors
            console.error(`FMP API Error (${response.status}): ${errorData}`); // Log the raw error
             let userFriendlyError = `FMP API request failed (${response.status}). Check Netlify function logs for details.`;
             if (response.status === 401 || response.status === 403) {
                 userFriendlyError = "FMP API Error: Invalid API Key or insufficient permissions for this endpoint.";
             } else if (response.status === 404) {
                 userFriendlyError = "FMP API Error: The specified endpoint URL was not found. Please verify the URL.";
             } else if (response.status === 429) {
                userFriendlyError = "FMP API Error: Rate limit exceeded. Please wait and try again.";
             }
             
            return { 
                statusCode: response.status, 
                body: JSON.stringify({ error: userFriendlyError, rawError: errorData }) 
            };
        }
        
        const data = await response.json();
        console.log("Successfully fetched FMP options flow data. Record count:", data.length); 

        // 4. Return the successful response to your frontend application.
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        };
    } catch (error) {
        console.error('Netlify Function Error (FMP Catch Block):', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Netlify function failed: ${error.message}` })
        };
    }
};

