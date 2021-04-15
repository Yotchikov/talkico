import { useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { v4 as uuid } from 'uuid';
import Peer from 'peerjs';

export const useConnection = (roomId) => {
  const [myId, setMyId] = useState('');
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
    console.log('Добавляем новую пару пиров');
    setPeerPairs((peerPairs) => [{ myPeerId, otherUserPeerId }, ...peerPairs]);
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
    console.log('Я считаю что peerPairs теперь такой:');
    console.log(peerPairs);
  };

  // Инициализация событий сокетов
  const initializeSocketEvents = (stream) => {
    socketRef.current.emit('join-room', roomId);

    socketRef.current.on('room-full', () => {
      console.log('Комната полна');
      setIsFull(true);
    });

    socketRef.current.on('join-success', (userIdList) => {
      console.log('Успешно вошли в комнату');
      tryToConnectToOtherUsers(userIdList, stream);
    });

    socketRef.current.on('user-connected', (newUserPeerId) => {
      console.log('startConnection');
      startConnection(newUserPeerId, stream);
    });

    socketRef.current.on('user-disconnected', (disconnectedUserId) => {
      disconnectFromUser(disconnectedUserId);
    });

    socketRef.current.on('error', (error) => {
      console.log('Ошибка socket:', error);
    });
  };

  // Попытка подключиться ко всем остальным пользователям в комнате
  const tryToConnectToOtherUsers = (userIdList, stream) => {
    console.log('tryToConnect');
    userIdList.forEach((userId) => {
      const peer = initializeNewPeer();
      peer.on('open', (peerId) => {
        socketRef.current.emit('start-call', peerId, userId);
        peer.on('call', (call) => {
          addPeerPair(peerId, call.peer);
          call.answer(stream);
          call.on('stream', (otherUserStream) => {
            createVideo(otherUserStream);
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
  const startConnection = (newUserPeerId, stream) => {
    const peer = initializeNewPeer();
    peer.on('open', (peerId) => {
      const call = peer.call(newUserPeerId, stream);
      addPeerPair(peerId, newUserPeerId);
      call.on('stream', (otherUserStream) => {
        createVideo(otherUserStream);
      });
    });
    peer.on('error', (error) => {
      console.log('Ошибка P2P соединения:', error);
      peer.reconnect();
    });
  };

  // Отключиться от другого пользователя
  const disconnectFromUser = (disconnectedUserId) => {
    deletePeerPair(disconnectedUserId);
  };

  // Выйти из комнаты
  const leaveRoom = () => {
    peerPairs.forEach((peerPair) => {
      socketRef.current.emit('stop-call', peerPair.myPeerId);
    });
    socketRef.current.disconnect();
  };

  const createVideo = (stream) => {
    const videoContainer = document.getElementById('video-container');
    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    videoContainer.appendChild(video);
  };

  // Запуск конференции
  const start = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((myStream) => {
        socketRef.current = io.connect('/');
        setMyId(socketRef.current.id);
        initializeSocketEvents(myStream);
        createVideo(myStream);
      });
  };

  return { start, peerPairs, isFull, myId, leaveRoom };
};
