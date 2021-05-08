const express = require('express');
const config = require('config');
const mongoose = require('mongoose');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);
const PORT = config.get('port') || 5000;

const rooms = {};
const gameSessions = {};
const MAX_MEMBERS = config.get('maxMembers') || 4;
const questions = config.get('questions');

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
          socket.emit(
            'join-success',
            socket.id,
            rooms[roomId].map((user) => user.id)
          );
          rooms[roomId].push({ id: socket.id, points: 0 });
          console.log(
            `Пользователь ${socket.id} успешно зашел зайти в комнату ${roomId}`
          );
        } else {
          rooms[roomId] = [{ id: socket.id, points: 0 }];
          console.log(
            `Пользователь ${socket.id} стал первым участником комнаты ${roomId}`
          );
        }

        // Подписываем сокет на канал roomId
        socket.join(roomId);

        // Поступает звонок от пользователя
        socket.on('start-call', (peerId, userId) => {
          io.to(userId).emit('user-connected', socket.id, peerId);
          console.log(
            `Пользователь ${socket.id} звонит пользователю ${userId}`
          );
        });

        // Начинается новая игра
        socket.on('start-game', () => {
          // Если в комнате недостаточно игроков для начала игры - начать игру невозможно
          if (rooms[roomId].length <= 1) {
            io.to(socket.id).emit('not-enough-players');
          }

          console.log(`Игра в комнате ${roomId} началась`);
          gameSessions[roomId] = {
            playersCounter: 0,
            questionsCounter: 0,
            winStreakCounter: 0,
          };

          // Задаем вопрос 1-му игроку
          io.to(rooms[roomId][0].id).emit('new-question', questions[0]);
          console.log(`Отвечает игрок ${rooms[roomId][0].id}`);
        });

        // Игрок ответил на вопрос
        socket.on('new-answer', (answer) => {
          if (answer) {
            console.log(`Игрок ${socket.id} ответил правильно`);
            rooms[roomId][gameSessions[roomId].playersCounter].points++;
            gameSessions[roomId].winStreak++;
            if (gameSessions[roomId].winStreak == 5) {
              rooms[roomId][gameSessions[roomId].playersCounter].points += 5;
              if (
                rooms[roomId][gameSessions[roomId].playersCounter].points >= 20
              ) {
                socket
                  .to(roomId)
                  .emit(
                    'win',
                    rooms[roomId][gameSessions[roomId].playersCounter].id
                  );
              }
              gameSessions[roomId].playersCounter =
                (gameSessions[roomId].playersCounter + 1) %
                rooms[roomId].length;
              io.to(rooms[roomId][gameSessions[roomId].playersCounter].id).emit(
                'new-question',
                questions[gameSessions[roomId].questionsCounter]
              );
              gameSessions[roomId].questionsCounter++;
            } else {
              gameSessions[roomId].winStreak = 0;
              io.to(rooms[roomId][gameSessions[roomId].playersCounter].id).emit(
                'new-question',
                questions[gameSessions[roomId].questionsCounter]
              );
              gameSessions[roomId].questionsCounter++;
            }
            socket.to(roomId).emit('points-changed', rooms[roomId]);
          } else {
            console.log(`Игрок ${socket.id} ответил неправильно`);
            gameSessions[roomId].playersCounter =
              (gameSessions[roomId].playersCounter + 1) % rooms[roomId].length;
            io.to(rooms[roomId][gameSessions[roomId].playersCounter].id).emit(
              'new-question',
              questions[gameSessions[roomId].questionsCounter]
            );
            gameSessions[roomId].questionsCounter++;
          }
          console.log(
            `Отвечает игрок ${
              rooms[roomId][gameSessions[roomId].playersCounter].id
            }`
          );
        });

        // Пользователь выходит из комнаты
        socket.on('disconnect', () => {
          rooms[roomId] = rooms[roomId].filter((user) => user.id !== socket.id);

          socket.to(roomId).broadcast.emit('user-disconnected', socket.id);
          console.log(`Пользователь ${socket.id} вышел из комнаты ${roomId}`);
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
