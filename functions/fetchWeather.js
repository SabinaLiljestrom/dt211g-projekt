const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    const { lon, lat } = event.queryStringParameters;

    const smhiApiUrl = `https://opendata-download-metfcst.smhi.se/api/category/pmp3g/version/2/geotype/point/lon/${lon}/lat/${lat}/data.json`;

    try {
        const smhiResponse = await fetch(smhiApiUrl);
        if (!smhiResponse.ok) throw new Error(`SMHI API error: ${smhiResponse.statusText}`);
        const smhiData = await smhiResponse.json();

        return {
            statusCode: 200,
            body: JSON.stringify(smhiData)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
