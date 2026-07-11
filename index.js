const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS if you are hosting the frontend separately
app.use(cors());

// Serve the static HTML file
app.use(express.static(path.join(__dirname)));

// Proxy the HLS stream
// This will hide the target IP and token from the client, and bypass mixed content blocks
const targetUrl = process.env.STREAM_URL;

if (!targetUrl) {
    console.error('STREAM_URL is missing in .env file');
    process.exit(1);
}

// Proxy middleware to forward /stream requests to the actual server
app.use('/stream', createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    pathRewrite: (pathReq, req) => {
        const token = process.env.STREAM_TOKEN;
        let newPath = pathReq.replace(/^\/stream/, ''); // remove /stream prefix
        if (token) {
            newPath += (newPath.includes('?') ? '&' : '?') + 'token=' + token;
        }
        return newPath;
    },
    onProxyReq: (proxyReq, req, res) => {
        // Optional: you can inject headers here if needed by the stream server
    }
}));

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser to view the player.`);
});
