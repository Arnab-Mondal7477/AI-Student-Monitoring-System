const http = require('http');
const jwt = require('jsonwebtoken');

const token = jwt.sign({ id: 7, role: 'STUDENT' }, 'ashgrove_secret_key_2024');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/student/violations',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token
  }
};

const req = http.request(options, res => {
  console.log(`STATUS: ${res.statusCode}`);
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => { console.log(data); });
});

req.on('error', error => {
  console.error(error);
});

req.end();
