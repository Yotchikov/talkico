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
      socket.on('join-room', (roomId, userId) => {
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
          console.log(
            `Пользователь ${socket.id} успешно зашел зайти в комнату`
          );
        } else {
          rooms[roomId] = [socket.id];
          console.log(
            `Пользователь ${socket.id} стал первым участником комнаты`
          );
        }

        socket.join(roomId);
        socket.to(roomId).broadcast.emit('user-connected', userId);

        socket.on('send-signal', (senderId, receiverId) => {
          socket
            .to(roomId)
            .broadcast.emit('return-signal', senderId, receiverId);
        });

        socket.on('disconnect', () => {
          rooms[roomId] = rooms[roomId].filter((id) => id !== userId);
          socket.to(roomId).broadcast.emit('user-disconnected', userId);
        });
      });
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
