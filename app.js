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
          socket.emit('join-success', socket.id, []);
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
            questionsCounter: 1,
            winStreakCounter: 0,
          };

          rooms[roomId].forEach((player) => {
            player.points = 0;
            socket.emit('my-points-changed', 0);
            socket.to(roomId).broadcast.emit('points-changed', socket.id, 0);
          });

          // Задаем вопрос 1-му игроку
          io.sockets
            .in(roomId)
            .emit('new-question', rooms[roomId][0].id, questions[0]);
          console.log(`Отвечает игрок ${rooms[roomId][0].id}`);
        });

        // Игрок ответил на вопрос
        socket.on('new-answer', (answer) => {
          if (answer) {
            console.log(`Игрок ${socket.id} ответил правильно`);

            // Увеличивем количество очков игрока и количество побед подряд
            rooms[roomId][gameSessions[roomId].playersCounter].points++;
            gameSessions[roomId].winStreak++;

            // Если игрок сделал 5 побед подряд
            if (gameSessions[roomId].winStreak == 5) {
              // Начисление бонуса за винстрик
              rooms[roomId][gameSessions[roomId].playersCounter].points += 5;

              // Если кол-во очков больше 20 - игра окончена
              if (
                rooms[roomId][gameSessions[roomId].playersCounter].points >= 20
              ) {
                io.sockets.in(roomId).emit('win', {
                  id: rooms[roomId][gameSessions[roomId].playersCounter].id,
                  points:
                    rooms[roomId][gameSessions[roomId].playersCounter].points,
                });
              } else {
                // Передача хода следующему игроку
                gameSessions[roomId].playersCounter =
                  (gameSessions[roomId].playersCounter + 1) %
                  rooms[roomId].length;
                io.sockets
                  .in(roomId)
                  .emit(
                    'new-question',
                    rooms[roomId][gameSessions[roomId].playersCounter].id,
                    questions[gameSessions[roomId].questionsCounter++ % 2]
                  );
              }
            } else if (
              rooms[roomId][gameSessions[roomId].playersCounter].points >= 2
            ) {
              // Если кол-во очков больше 20 - игра окончена
              io.sockets.in(roomId).emit('win', {
                id: rooms[roomId][gameSessions[roomId].playersCounter].id,
                points:
                  rooms[roomId][gameSessions[roomId].playersCounter].points,
              });
            } else {
              // Задается еще один вопрос
              io.sockets
                .in(roomId)
                .emit(
                  'new-question',
                  rooms[roomId][gameSessions[roomId].playersCounter].id,
                  questions[gameSessions[roomId].questionsCounter++ % 2]
                );
            }
            socket.emit(
              'my-points-changed',
              rooms[roomId][gameSessions[roomId].playersCounter].points
            );
            socket
              .to(roomId)
              .broadcast.emit(
                'points-changed',
                socket.id,
                rooms[roomId][gameSessions[roomId].playersCounter].points
              );
          } else {
            console.log(`Игрок ${socket.id} ответил неправильно`);

            // Ход передается следующему игроку
            gameSessions[roomId].playersCounter =
              (gameSessions[roomId].playersCounter + 1) % rooms[roomId].length;
            io.sockets
              .in(roomId)
              .emit(
                'new-question',
                rooms[roomId][gameSessions[roomId].playersCounter].id,
                questions[gameSessions[roomId].questionsCounter++ % 2]
              );
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

    server.listen(PORT, '192.168.1.57', () => {
      console.log(`App has been started on port ${PORT}...`);
    });
  } catch (e) {
    console.log('Server error:', e.message);
    process.exit(1);
  }
}

start();
