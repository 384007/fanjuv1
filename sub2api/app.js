const express = require('express');
const fs = require('fs');
const https = require('https');
const app = express();
app.use(express.json({ limit: '50mb' }));

const accountData = JSON.parse(fs.readFileSync('./data/accounts.json', 'utf8'));
const token = accountData.accounts[0].credentials.access_token;

app.post('/v1/responses', (req, res) => {
    const body = JSON.stringify(req.body);
    const options = {
        hostname: 'chatgpt.com',
        path: '/backend-api/codex/responses',
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
            'User-Agent': 'Mozilla/5.0',
            'Origin': 'https://chatgpt.com'
        }
    };
    let headersSent = false;
    const proxy = https.request(options, (upstream) => {
        console.log('upstream status:', upstream.statusCode);
        headersSent = true;
        res.status(upstream.statusCode);
        Object.entries(upstream.headers).forEach(([k, v]) => res.setHeader(k, v));
        upstream.pipe(res);
    });
    proxy.on('error', (e) => {
        console.error('proxy error:', e.message);
        if (!headersSent) res.status(500).send(e.message);
    });
    proxy.write(body);
    proxy.end();
});

app.listen(8080, () => console.log('🚀 http://127.0.0.1:8080 启动成功'));
