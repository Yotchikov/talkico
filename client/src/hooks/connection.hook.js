import { useRef, useState } from 'react';
import { io } from 'socket.io-client';
import Peer from 'peerjs';
import * as faceapi from 'face-api.js';

export const useConnection = (roomId) => {
  const [myId, setMyId] = useState('');
  const [connections, setConnections] = useState({});
  const socketRef = useRef();
  const [isFull, setIsFull] = useState(false);
  const [myStream, setMyStream] = useState(null);

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
    setConnections((prevConnections) => {
      if (prevConnections[socketId]) {
        console.log('adding');
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

  // Запуск конференции
  const start = async () => {
    await faceapi.loadFaceLandmarkModel('/models');
    await faceapi.loadTinyFaceDetectorModel('/models');
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setMyStream(stream);
        socketRef.current = io.connect('/');
        const videoContainer = document.getElementById('video-container');
        const video = document.getElementById('video');
        video.srcObject = stream;
        video.autoplay = true;
        
        video.addEventListener('playing', async () => {
          async function step() {
            console.log(video.videoWidth, video.videoHeight);
            const detectionWithLandmarks = await faceapi
              .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
              .withFaceLandmarks();
            const canvas = document.getElementById('overlay');
            console.log(canvas);
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            if (detectionWithLandmarks)
              faceapi.draw.drawFaceLandmarks(
                canvas,
                detectionWithLandmarks.landmarks
              );
            setTimeout(() => step());
          }
          step();
        });
        initializeSocketEvents(stream);
      });
  };

  return { start, connections, isFull, myId, myStream, leaveRoom };
};
