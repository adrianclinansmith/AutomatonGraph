/*
    server.js
    create a server
*/
const http = require('http');
const path = require('path');
const fs = require('fs');

const server = http.createServer((req, res) => {
    console.log(`Incoming request for ${req.url}`);

    const reqUrl = req.url === '/' ? 'index.html' : req.url;
    const filepath = path.join(__dirname, 'public', reqUrl);
    const fileExtension = path.extname(filepath);
    const contentType = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json'
    }[fileExtension];

    fs.readFile(filepath, (error, content) => {
        if (!error) {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        } else if (error && error.code === 'ENOENT') {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 not found', 'utf-8');
        } else if (error) {
            res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end(`Server error: ${error.code}`, 'utf-8');
        }
    });
});

const port = process.env.PORT || 5000;
server.listen(port, () => {
    console.log(`Server running on port ${port}...\n`);
});
