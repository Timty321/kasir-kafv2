const http = require('http');

function sendAdminMessage(message) {
    const data = JSON.stringify({ message });

    const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/send',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data)
        }
    };

    const req = http.request(options, (res) => { 
        // ignore res 
    });
    
    req.on('error', (error) => {
        // Probably bot is down, just ignore silently or log minimal
        console.error('[WhatsApp Bridge] Bot not reachable. Skipping WA notification.');
    });
    
    req.write(data);
    req.end();
}

module.exports = { sendAdminMessage };
