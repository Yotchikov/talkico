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
app.use('/api/room', require('./routes/room.routes'));

async function start() {
  try {
    await mongoose.connect(config.get('mongoUri'), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });

    io.on('connection', (socket) => {
      // Пользователь заходит в комнату
      socket.on('join-room', (roomId, userId) => {
        console.log(
          `Пользователь ${userId} пытается войти в комнату ${roomId}`
        );
        // Если комната уже существует
        if (rooms[roomId]) {
          // Проверка на максимально допустимое число людей в комнате
          const length = rooms[roomId].length;
          if (length >= MAX_MEMBERS) {
            socket.emit('room-full');
            console.log(
              `Пользователю ${userId} не удалось зайти в комнату ${roomId} из-за превышения лимита`
            );
            return;
          }
          socket.to(userId).emit('join-success', rooms[roomId]);
          rooms[roomId].push(userId);
          console.log(
            `Пользователь ${userId} успешно зашел зайти в комнату ${roomId}`
          );
        } else {
          rooms[roomId] = [userId];
          console.log(
            `Пользователь ${userId} стал первым участником комнаты ${roomId}`
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
