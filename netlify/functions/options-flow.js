// --- DIAGNOSIS: THIS ENDPOINT IS NOT WORKING ---
//
// This function is attempting to call an endpoint that does not exist 
// in the FMP API documentation you provided:
//
// https://financialmodelingprep.com/api/v4/unusual-options-activity
//
// This is why the main "Flow" table on your site is empty and shows a 
// "LIVE DATA-FEED FAILED" error. The FMP API is likely returning a 404 Not Found.
//
// To fix this, you must find a new API provider (like Barchart, Tradier, 
// or Unusual Whales) that specifically sells "unusual options activity" data, 
// as this is a premium feature not offered by FMP (according to their docs).
//
// You will then need to update this file to call that new API service.
// ---

// This is your secure, serverless function for the FMP API.
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
    // !!! THIS URL IS THE PROBLEM - IT DOES NOT EXIST IN THE FMP DOCS !!!
    let url = `https://financialmodelingprep.com/api/v4/unusual-options-activity?apikey=${FMP_API_KEY}`;
    if (ticker) {
        url += `&symbol=${ticker}`;
    }

    try {
        // 3. Make the request to the FMP API.
        const response = await fetch(url);
        if (!response.ok) {
            // This 'if' block is being triggered because the API returns a 404 or other error.
            const errorData = await response.text(); // Use .text() for 404s
            console.error(`FMP API Error (${response.status}): ${errorData}`);
            return { statusCode: response.status, body: JSON.stringify({ error: errorData }) };
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
