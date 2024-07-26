const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    const { resortName } = event.queryStringParameters;

    const rapidApiUrl = `https://ski-resort-forecast.p.rapidapi.com/${resortName.toLowerCase()}/snowConditions?units=m`;
    const rapidApiOptions = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': '5c48411b97msh43df63e7cfa00d6p11922bjsnaa3ea7a3a7f8',
            'x-rapidapi-host': 'ski-resort-forecast.p.rapidapi.com'
        }
    };

    try {
        const rapidResponse = await fetch(rapidApiUrl, rapidApiOptions);
        if (!rapidResponse.ok) throw new Error(`RapidAPI error: ${rapidResponse.statusText}`);
        const rapidData = await rapidResponse.json();

        return {
            statusCode: 200,
            body: JSON.stringify(rapidData)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
