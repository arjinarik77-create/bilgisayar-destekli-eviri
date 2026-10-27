const https = require('https');

const url = 'https://mwfashfvwvhhqpyxmmsp.supabase.co/rest/v1/user_profiles?select=*';
const options = {
    headers: {
        'apikey': 'sb_publishable_kudAu7EYejeP1Quko8wBxw_3zsuR2hs',
        'Authorization': 'Bearer sb_publishable_kudAu7EYejeP1Quko8wBxw_3zsuR2hs'
    }
};

https.get(url, options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log("Status code:", res.statusCode);
        console.log("Response body:", data);
    });
}).on('error', (err) => {
    console.error("Request error:", err.message);
});
