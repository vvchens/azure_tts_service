const http = require('http');

async function test() {
    console.log("Starting server...");
    const server = require('child_process').spawn('node', ['index.js']);

    server.stdout.on('data', (data) => console.log(`Server: ${data}`));
    server.stderr.on('data', (data) => console.error(`Server Error: ${data}`));

    // wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log("\nTesting TTS (GET /tts)...");
    const ttsReq = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/tts?txt=hello',
        method: 'GET'
    }, (res) => {
        console.log(`TTS STATUS: ${res.statusCode}`);
        if (res.statusCode !== 200 && res.statusCode !== 500) {
           console.log("TTS Failed");
        }

        let data = [];
        res.on('data', chunk => data.push(chunk));
        res.on('end', () => {
             console.log(`TTS Response Length: ${Buffer.concat(data).length} bytes`);
             server.kill();
        });
    });
    ttsReq.on('error', e => console.error(e));
    ttsReq.end();
}

test();
