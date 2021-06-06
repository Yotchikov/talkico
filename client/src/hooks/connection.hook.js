import { useRef, useState } from 'react';
import { io } from 'socket.io-client';
import Peer from 'peerjs';
import { useFace } from './face.hook';

export const useConnection = (roomId) => {
  const [myId, setMyId] = useState('');
  const [connections, setConnections] = useState({});
  const [answeringUserId, setAnsweringUserId] = useState('');
  const socketRef = useRef();
  const [isFull, setIsFull] = useState(false);
  const [myStream, setMyStream] = useState(null);
  const [myPoints, setMyPoints] = useState(0);
  const [winner, setWinner] = useState(null);
  const { addAR, answerOutline } = useFace();

  // Инициализация нового peer'a
  const initializeNewPeer = (port = 3001) => {
    return new Peer();
  };

  // Добавление новой связки peer'ов
  const addConnection = (otherUserSocketId, myPeerId, otherUserPeerId) => {
    setConnections((prevConnections) => {
      return {
        ...prevConnections,
        [otherUserSocketId]: {
          myPeerId,
          otherUserPeerId,
          otherUserStream: null,
          points: 0,
        },
      };
    });
  };

  // Добавление видеопотока
  const addVideoStream = (socketId, stream) => {
    setConnections((prevConnections) => {
      if (prevConnections[socketId]) {
        const modifiedConnection = {
          ...prevConnections[socketId],
          otherUserStream: stream,
        };
        return { ...prevConnections, [socketId]: modifiedConnection };
      }
      return prevConnections;
    });
  };

  // Удаление связки peer'ов
  const deleteConnection = (otherUserSocketId) => {
    setConnections((prevConnections) => {
      let modifiedConnections = { ...prevConnections };
      delete modifiedConnections[otherUserSocketId];
      return modifiedConnections;
    });
  };

  const addPoints = (socketId, points) => {
    setConnections((prevConnections) => {
      if (prevConnections[socketId]) {
        let modifiedConnection = { ...prevConnections[socketId], points };
        return { ...prevConnections, [socketId]: modifiedConnection };
      }
      return prevConnections;
    });
  };

  // Инициализация событий сокетов
  const initializeSocketEvents = (stream) => {
    let mySocketId = '';

    socketRef.current.emit('join-room', roomId);

    socketRef.current.on('room-full', () => {
      setIsFull(true);
    });

    socketRef.current.on('join-success', (id, userIdList) => {
      setMyId(id);
      mySocketId = id;
      tryToConnectToOtherUsers(userIdList, stream);
    });

    socketRef.current.on('user-connected', (newUserSocketId, newUserPeerId) => {
      startConnection(newUserSocketId, newUserPeerId, stream);
    });

    socketRef.current.on('user-disconnected', (disconnectedUserId) => {
      disconnectFromUser(disconnectedUserId);
    });

    socketRef.current.on('new-question', async (userId, question) => {
      setWinner(null);
      answerQuestion(mySocketId, userId, question);
    });

    socketRef.current.on('win', (newWinner) => setWinner(newWinner));

    socketRef.current.on('my-points-changed', (points) => setMyPoints(points));

    socketRef.current.on('points-changed', (socketId, points) => {
      addPoints(socketId, points);
    });

    socketRef.current.on('error', (error) => {
      console.log('Ошибка сокет-соединения:', error);
    });
  };

  // Попытка подключиться ко всем остальным пользователям в комнате
  const tryToConnectToOtherUsers = (userIdList, stream) => {
    userIdList.forEach((userId) => {
      const peer = initializeNewPeer();
      peer.on('open', (peerId) => {
        socketRef.current.emit('start-call', peerId, userId);
        peer.on('call', (call) => {
          addConnection(userId, peerId, call.peer);
          call.answer(stream);
          call.on('stream', (otherUserStream) => {
            addVideoStream(userId, otherUserStream);
          });
        });
      });
      peer.on('error', (error) => {
        console.log('Ошибка P2P соединения:', error);
        peer.reconnect();
      });
    });
  };

  // Установка P2P соединения с пользователем
  const startConnection = (newUserSocketId, newUserPeerId, stream) => {
    const peer = initializeNewPeer();
    peer.on('open', (peerId) => {
      const call = peer.call(newUserPeerId, stream);
      addConnection(newUserSocketId, peerId, newUserPeerId);
      call.on('stream', (otherUserStream) => {
        addVideoStream(newUserSocketId, otherUserStream);
      });
    });
    peer.on('error', (error) => {
      console.log('Ошибка P2P соединения:', error);
      peer.reconnect();
    });
  };

  // Отключиться от другого пользователя
  const disconnectFromUser = (disconnectedUserId) => {
    deleteConnection(disconnectedUserId);
  };

  // Выйти из комнаты
  const leaveRoom = () => {
    socketRef.current.disconnect();
  };

  // Начать игру
  const startGame = () => {
    setWinner(null);
    socketRef.current.emit('start-game');
  };

  const answerQuestion = async (mySocketId, userId, question) => {
    console.log('Новый вопрос');
    const userVideoElement = document.getElementById(userId);
    const canvasElement = document.createElement('canvas');
    canvasElement.className = 'ar-canvas';
    canvasElement.width = userVideoElement.clientWidth;
    canvasElement.height = userVideoElement.clientHeight;
    userVideoElement.parentNode.appendChild(canvasElement);

    const angle = await addAR(userVideoElement, canvasElement, question);
    userVideoElement.parentNode.removeChild(canvasElement);
    if (userId === mySocketId) {
      if (angle > 30) {
        await answerOutline(
          userVideoElement,
          'left' === question.correctAnswer
        );
        socketRef.current.emit('new-answer', 'left' === question.correctAnswer);
      } else if (angle < -30) {
        await answerOutline(
          userVideoElement,
          'right' === question.correctAnswer
        );
        socketRef.current.emit(
          'new-answer',
          'right' === question.correctAnswer
        );
      }
    }
  };

  // Запуск конференции
  const start = async () => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then(async (stream) => {
        setMyStream(stream);
        socketRef.current = io.connect('/');
        initializeSocketEvents(stream);
      });
  };

  return {
    start,
    connections,
    isFull,
    myId,
    myStream,
    leaveRoom,
    startGame,
    myPoints,
    winner,
  };
};
