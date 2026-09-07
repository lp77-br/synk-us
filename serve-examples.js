const http = require('http');
const fs = require('fs');
const path = require('path');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/examples/04-canvas-game/index.html';

  const filePath = path.join(__dirname, reqPath);

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(content);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`\n🚀 Exemplos rodando em: http://localhost:${PORT}\n`);
  console.log(` -> Canvas Game : http://localhost:${PORT}/examples/04-canvas-game/index.html`);
  console.log(` -> Slides Deck : http://localhost:${PORT}/examples/05-presentation-slides/index.html`);
  console.log(` -> HTML5 Video : http://localhost:${PORT}/examples/02-html5-video/index.html`);
  console.log(` -> YouTube Iframe: http://localhost:${PORT}/examples/03-youtube-iframe/index.html\n`);
});