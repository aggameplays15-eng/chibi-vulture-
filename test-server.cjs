require('dotenv').config();
const http = require('http');
const apiHandler = require('./api/index');

const server = http.createServer(async (req, res) => {
  res.status = function(code) { this.statusCode = code; return this; };
  res.json = function(data) { this.end(JSON.stringify(data)); };

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try { req.body = JSON.parse(body); } catch(e) { req.body = {}; }
      await apiHandler(req, res);
    });
  } else {
    await apiHandler(req, res);
  }
});

server.listen(5174, async () => {
  console.log('Test server running on 5174');
  const data = JSON.stringify({
    name: 'Test Mobile User',
    handle: 'test_mobile',
    email: 'test_mobile@example.com',
    password: 'password123',
    bio: 'test bio',
    avatarColor: '#ff0000'
  });

  const req = http.request({
    hostname: 'localhost',
    port: 5174,
    path: '/api/users',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    }
  }, (res) => {
    let responseBody = '';
    res.on('data', chunk => responseBody += chunk);
    res.on('end', async () => {
      console.log('Status (Valid Req):', res.statusCode);
      console.log('Body (Valid Req):', responseBody);

      // Try short password
      const badData = JSON.stringify({
        name: 'Test bad', handle: 'test_bad', email: 'bad@example.com', password: '123', avatarColor: '#000'
      });
      const req2 = http.request({
        hostname: 'localhost', port: 5174, path: '/api/users', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(badData) }
      }, (res2) => {
        let body2 = ''; res2.on('data', c => body2 += c);
        res2.on('end', async () => {
          console.log('Status (Bad Req):', res2.statusCode);
          console.log('Body (Bad Req):', body2);

          // Cleanup test user
          const db = require('./handlers/_lib/db');
          await db.query("DELETE FROM users WHERE email IN ('test_mobile@example.com', 'bad@example.com')");
          server.close();
          process.exit(0);
        });
      });
      req2.write(badData); req2.end();
    });
  });
  
  req.on('error', e => console.error(e));
  req.write(data);
  req.end();
});
