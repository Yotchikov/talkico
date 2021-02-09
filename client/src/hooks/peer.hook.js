import { useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { v4 as uuid } from 'uuid';
import Peer from 'peerjs';

export const usePeer = (roomId) => {
  const socketRef = useRef();
  const myId = uuid();
  const [myPeers, setMyPeers] = useState([]);
  const [isFull, setIsFull] = useState(false);

  const initialize = (myStream) => {
    socketRef.current = io.connect('/');

    // Текущий пользователь заходит в комнату roomId
    socketRef.current.emit('join-room', roomId, myId);

    // Комната roomId полна
    socketRef.current.on('room-full', () => {
      setIsFull(true);
    });

    // Подключается другой пользователь
    socketRef.current.on('user-connected', (userId) => {
      // Создаем новый peer
      const peer = new Peer(undefined, { host: '/', port: '3001' });
      peer.on('open', (peerId) => {
        // Посылаем свой peerId пользователю userId
        socketRef.current.emit('send-signal', peerId, userId);
        // При поступлении звонка от пользователя userId отправляем свой медиапоток
        peer.on('call', (call) => {
          call.answer(myStream);
          setMyPeers((myPeers) => [...myPeers, call]);
        });
      });
    });

    // Мы подключились и получили peerId от отправителя
    socketRef.current.on('return-signal', (senderId, receiverId) => {
      // Если пытаются связаться с нами
      if (receiverId == myId) {
        // Создаем новый peer
        const peer = new Peer(undefined, { host: '/', port: '3001' });
        peer.on('open', () => {
          // Звоним пользователю senderId
          const call = peer.call(senderId, myStream);
          setMyPeers((myPeers) => [...myPeers, call]);
        });
      }
    });

    // Пользователь отключился
    socketRef.current.on('user-disconnected', (userId) => {
      // TODO
    });
  };

  return { myPeers, initialize };
};
