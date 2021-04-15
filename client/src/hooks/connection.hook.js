import { useRef, useState } from 'react';
import { io } from 'socket.io-client';
import Peer from 'peerjs';

export const useConnection = (roomId) => {
  const [myId, setMyId] = useState('');
  const [connections, setConnections] = useState({});
  const socketRef = useRef();
  const [isFull, setIsFull] = useState(false);

  // Инициализация нового peer'a
  const initializeNewPeer = (port = 3001) => {
    return new Peer('', {
      host: '/',
      port,
    });
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
        },
      };
    });
  };

  // Добавление видеопотока
  const addVideoStream = (socketId, stream) => {
    if (connections[socketId]) {
      setConnections((prevConnections) => {
        const modifiedConnection = {
          ...prevConnections[socketId],
          otherUserStream: stream,
        };
      });
    }
  };

  // Удаление связки peer'ов
  const deleteConnection = (otherUserSocketId) => {
    let modifiedConnections = { ...connections };
    delete modifiedConnections[otherUserSocketId];
    setConnections(modifiedConnections);
  };

  // Инициализация событий сокетов
  const initializeSocketEvents = (stream) => {
    socketRef.current.emit('join-room', roomId);

    socketRef.current.on('room-full', () => {
      setIsFull(true);
    });

    socketRef.current.on('join-success', (id, userIdList) => {
      setMyId(id);
      tryToConnectToOtherUsers(userIdList, stream);
    });

    socketRef.current.on('user-connected', (newUserSocketId, newUserPeerId) => {
      startConnection(newUserSocketId, newUserPeerId, stream);
    });

    socketRef.current.on('user-disconnected', (disconnectedUserId) => {
      disconnectFromUser(disconnectedUserId);
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
        addVideoStream(otherUserStream);
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

  // Запуск конференции
  const start = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((myStream) => {
        socketRef.current = io.connect('/');
        initializeSocketEvents(myStream);
      });
  };

  return { start, connections, isFull, myId, leaveRoom };
};
