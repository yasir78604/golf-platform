const http = require('http');
const data = JSON.stringify({ email: 'test_http_request@example.com', password: 'password123', name: 'HTTP Test' });
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};
const req = http.request(options, res => {
  console.log('STATUS', res.statusCode);
  console.log('HEADERS', JSON.stringify(res.headers, null, 2));
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('BODY', body);
  });
});
req.on('error', err => console.error('REQUEST ERROR', err));
req.write(data);
req.end();
