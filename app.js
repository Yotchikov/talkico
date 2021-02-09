const express = require('express');
const config = require('config');
const mongoose = require('mongoose');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);
const PORT = config.get('port') || 5000;

const rooms = {};
const MAX_MEMBERS = config.get('maxMembers') || 4;

app.use(express.json({ extended: true }));

app.use('/api/auth', require('./routes/auth.routes'));

async function start() {
  try {
    await mongoose.connect(config.get('mongoUri'), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });

    io.on('connection', (socket) => {
      socket.on('join-room', (roomId) => {
        console.log(rooms);
        console.log(`Пользователь ${socket.id} пытается войти в комнату`);
        if (rooms[roomId]) {
          const length = rooms[roomId].length;
          if (length >= MAX_MEMBERS) {
            socket.emit('room-full');
            console.log(`Пользователю ${socket.id} не удалось зайти в комнату`);
            return;
          }
          rooms[roomId].push(socket.id);
          console.log(`Пользователь ${socket.id} успешно зашел зайти в комнату`);
        } else {
          rooms[roomId] = [socket.id];
          console.log(`Пользователь ${socket.id} стал первым участником комнаты`);
        }
      });
      /*socket.on('join room', (roomID) => {
        console.log(`Пользователь ${socket.id} пытается войти в комнату`);
        if (users[roomID]) {
          const length = users[roomID].length;
          if (length === 4) {
            socket.emit('room full');
            return;
          }
          console.log(`Пользователь ${socket.id} вошел в комнату`);
          users[roomID].push(socket.id);
        } else {
          users[roomID] = [socket.id];
        }
        socketToRoom[socket.id] = roomID;
        const usersInThisRoom = users[roomID].filter((id) => id !== socket.id);

        socket.emit('all users', usersInThisRoom);
      });

      socket.on('sending signal', (payload) => {
        io.to(payload.userToSignal).emit('user joined', {
          signal: payload.signal,
          callerID: payload.callerID,
        });
      });

      socket.on('returning signal', (payload) => {
        io.to(payload.callerID).emit('receiving returned signal', {
          signal: payload.signal,
          id: socket.id,
        });
      });

      socket.on('disconnect', () => {
        const roomID = socketToRoom[socket.id];
        let room = users[roomID];
        if (room) {
          room = room.filter((id) => id !== socket.id);
          users[roomID] = room;
        }
      });*/
    });

    server.listen(PORT, () => {
      console.log(`App has been started on port ${PORT}...`);
    });
  } catch (e) {
    console.log('Server error:', e.message);
    process.exit(1);
  }
}

start();
