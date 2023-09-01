const socketio = require('socket.io');

let io;

function init(server) {
  io = socketio(server);
  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

module.exports = {
  init,
  getIO
};