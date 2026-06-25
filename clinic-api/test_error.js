const http = require('http');

const data = JSON.stringify({
  test_names: ['FBC'],
  notes: 'test'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/cases/1/lab-tests',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Body: ${body}`);
  });
});

req.on('error', (e) => {
  console.error(`Problem: ${e.message}`);
});

req.write(data);
req.end();
