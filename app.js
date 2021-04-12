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
      socket.on('join-room', (roomId) => {
        console.log(
          `Пользователь ${socket.id} пытается войти в комнату ${roomId}`
        );

        // Добавление в массив с участниками комнат
        if (rooms[roomId]) {
          // Проверка на максимально допустимое число людей в комнате
          const length = rooms[roomId].length;
          if (length >= MAX_MEMBERS) {
            socket.emit('room-full');
            console.log(
              `Пользователю ${socket.id} не удалось зайти в комнату ${roomId} из-за превышения лимита`
            );
            return;
          }
          socket.emit('join-success', rooms[roomId]);
          rooms[roomId].push(socket.id);
          console.log(
            `Пользователь ${socket.id} успешно зашел зайти в комнату ${roomId}`
          );
        } else {
          rooms[roomId] = [socket.id];
          console.log(
            `Пользователь ${socket.id} стал первым участником комнаты ${roomId}`
          );
        }

        // Поступает звонок от пользователя
        socket.on('call', (peerId, userId) => {
          console.log(`Пользователь ${socket.id} звонит пользователю ${userId}`);
          io.to(userId).emit('user-connected', peerId);
        });

        /*socket.join(roomId);
        socket.to(roomId).broadcast.emit('user-connected', userId);

        socket.on('send-signal', (senderId, receiverId) => {
          socket
            .to(roomId)
            .broadcast.emit('return-signal', senderId, receiverId);
        });

        socket.on('disconnect', () => {
          rooms[roomId] = rooms[roomId].filter((id) => id !== userId);
          socket.to(roomId).broadcast.emit('user-disconnected', userId);
        });*/
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
