const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
const mysql = require('mysql');
const crypto = require('crypto');

// Load environment variables from .env file
dotenv.config(); 

// Connect to the MySQL database
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
  } else {
    console.log('Connected to MySQL database in login_routes.js');
  }
});

// Define a login route
router.post('/', (req, res) => {
  const { username, password } = req.body;

  // // Hash the password using MD5
  // const hash = crypto.createHash('md5').update(password).digest('hex');

  // // Execute a SELECT query to find the user with the given username and hashed password
  // const query = `SELECT * FROM tb_login_user WHERE username = ? AND password = ?`;
  // connection.query(query, [username, hash], (err, results) => {
  //   if (err) {
  //     console.error('Error executing query:', err);
  //     res.status(500).json({ message: 'Internal server error' });
  //   } else if (results.length === 1) {
  //     const check_data = `SELECT * FROM tb_user WHERE id_user = ?`;
  //     connection.query(check_data, [results[0].id_user], (err, results) => {
  //       if (err) {
  //         console.error('Error executing query:', err);
  //         res.status(500).json({ message: 'Internal server error' });
  //       } else if (results.length === 1) {
  //         // Return the user object
  //         res.json(results[0]);
  //       } else {
  //         // Return an error message
  //         res.status(401).json({ message: 'Invalid username or password' });
  //       }
  //     })
  //   } else {
  //     // Return an error message
  //     res.status(401).json({ message: 'Invalid username or password' });
  //   }
  // });
});

module.exports = router;