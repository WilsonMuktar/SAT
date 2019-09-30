var http = require('http');
var fs = require('fs');
var index = fs.readFileSync('index.html');
http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/html','text/js','text/css'});
    res.end(index);
}).listen(8080, "127.0.0.1");
console.log('Server running at http://localhost:8080/');