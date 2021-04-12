import { useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { v4 as uuid } from 'uuid';
import Peer from 'peerjs';

export const useConnection = (roomId) => {
  const myId = uuid();
  const [peerPairs, setPeerPairs] = useState([]);
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
  const addPeerPair = (myPeerId, otherUserPeerId) => {
    setPeerPairs([...peerPairs, { myPeerId, otherUserPeerId }]);
  };

  // Удаление связки peer'ов
  const deletePeerPair = (otherUserPeerId) => {
    setPeerPairs(
      peerPairs.filter(
        (peerPair) =>
          peerPair.otherUserPeerId &&
          peerPair.otherUserPeerId === otherUserPeerId
      )
    );
  };

  // Инициализация событий сокетов
  const initializeSocketEvents = (stream) => {
    socketRef.current.emit('join-room', roomId, myId);

    socketRef.current.on('room-full', () => {
      setIsFull(true);
    });

    socketRef.current.on('join-success', (userIdList) => {
      tryToConnectToOtherUsers(userIdList, stream);
    });

    socketRef.current.on('user-connected', (newUserPeerId) => {
      startConnection(newUserPeerId, stream);
    });

    socketRef.current.on('user-disconnected', (disconnectedUserId) => {
      disconnectFromUser(disconnectedUserId);
    });
  };

  // Попытка подключиться ко всем остальным пользователям в комнате
  const tryToConnectToOtherUsers = (userIdList, stream) => {
    userIdList.forEach((userId) => {
      const peer = initializeNewPeer();
      peer.on('open', (peerId) => {
        socketRef.emit('call', peerId, userId);
        peer.on('call', (call) => {
          call.answer(stream);
          call.on('stream', (otherUserStream) => {
            addPeerPair(peerId, call.id);
          });
        });
      });
    });
  };

  // Установка P2P соединения с пользователем
  const startConnection = (newUserPeerId, stream) => {
    const peer = initializeNewPeer();
    peer.on('open', (peerId) => {
      const call = peer.call(newUserPeerId, stream);
      call.on('stream', (otherUserStream) => {
        addPeerPair(peerId);
      });
    });
  };

  // Отключиться от другого пользователя
  const disconnectFromUser = (disconnectedUserId) => {
    deletePeerPair(disconnectedUserId);
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

  return { start, peerPairs, isFull };
};
