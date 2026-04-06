const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = '/Users/princepaulselibio/Desktop/viral-scale-ai';
const PORT = 3000;

const mime = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

http.createServer((req, res) => {
  let url = req.url === '/' ? '/index.html' : req.url;
  url = url.split('?')[0];
  const filePath = path.join(ROOT, url);
  const ext = path.extname(filePath);
  const contentType = mime[ext] || 'text/plain';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
}).listen(PORT, () => {
  process.stdout.write(`Serving at http://localhost:${PORT}\n`);
});
