const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const formData = require('express-form-data');
const dotenv = require('dotenv');
const fileUpload = require('express-fileupload');
const mysql = require('mysql');
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Load environment variables from .env file
dotenv.config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(formData.parse());
app.use(fileUpload());
// app.use(express.static('assets'));
app.options('*', cors())
app.use(cors())

const login = require('./routes/login_routes');

// Define a route
app.get('/', (req, res) => {
  res.send('Hello, world!');
});

app.get('/assets/makanan/:id/:filename', (req, res) => {
  res.sendFile(__dirname + '/assets/makanan/' + req.params.id + '/' + req.params.filename);
})

app.use('/login', login);
app.use('/table', require('./routes/table_routes'));

// app error handler
app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).send('Something broke!');
} );

// Socket.IO connection handler
io.on('connection', (socket) => {
  let userId = socket.id;
  console.log('A user connected', userId);

  // Handle incoming messages
  socket.on('message', (data) => {
    console.log(`Received message: ${data}`);
    io.emit('message', data);
  });

  // handle table
  socket.on('table', (data) => {
    socket.broadcast.emit('table_admin',{});
  });

  socket.on('makanan', (data) => {
    socket.broadcast.emit('makanan_user');
  });

  // Handle disconnections
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// // Connect to the MySQL database
// const connection = mysql.createConnection({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME
// });

// connection.connect((err) => {
//   if (err) {
//     console.error('Error connecting to MySQL database:', err);
//   } else {
//     console.log('Connected to MySQL database');
//   }
// });

// Start the server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server started on port ${port}`);
});