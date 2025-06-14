const express = require('express');
const http = require('http');
const cors = require('cors');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: '*',
  }
});

app.use(cors());

let players = {};

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  players[socket.id] = {
    id: socket.id,
    x: 0,
    y: 1.8,
    z: 0
  };

  socket.emit('currentPlayers', players);
  socket.broadcast.emit('newPlayer', players[socket.id]);

  socket.on('move', (data) => {
    if (players[socket.id]) {
      players[socket.id].x = data.x;
      players[socket.id].y = data.y;
      players[socket.id].z = data.z;
      socket.broadcast.emit('playerMoved', players[socket.id]);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    delete players[socket.id];
    io.emit('playerDisconnected', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
