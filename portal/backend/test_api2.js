const jwt = require('jsonwebtoken');

const token = jwt.sign({ id: 7, role: 'STUDENT' }, 'ashgrove_secret_key_2024');
console.log(token);
