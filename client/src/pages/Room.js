import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { v4 as uuid } from 'uuid';
import Peer from 'peerjs';
import { useParams } from 'react-router-dom';

const Video = (props) => {
  const ref = useRef();
  useEffect(() => {
    props.peer.on('stream', (stream) => {
      ref.current.srcObject = stream;
    });
  }, []);
};

export const Room = () => {
  const roomId = useParams().id;
  const myId = uuid();
  const socketRef = useRef();
  const myVideoRef = useRef();
  const [peers, setPeers] = useState([]);

  useEffect(() => {
    socketRef.current = io.connect('/');
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((myStream) => {
        myVideoRef.current.srcObject = myStream;
        socketRef.current.emit('join-room', roomId, myId);

        // Подклюячается новый пользователь
        socketRef.current.on('user-connected', (userId) => {
          // Создаем новый peer
          const peer = new Peer(undefined, { host: '/', port: '3001' });
          peer.on('open', (peerId) => {
            // Посылаем свой peerId пользователю userId
            socketRef.current.emit('send-signal', peerId, userId);
            // При поступлении звонка от пользователя userId отправляем свой медиапоток
            peer.on('call', (call) => {
              call.answer(myStream);
              setPeers((peers) => [...peers, call]);
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
              setPeers((peers) => [...peers, call]);
            });
          }
        });

        // Пользователь отключился
        socketRef.current.on('user-disconnected', (userId) => {
          // TODO
        });
      });
  }, []);

  return (
    <div>
      <h6>You are in room {roomId}</h6>
      <video muted playsInLine autoPlay ref={myVideoRef} />
      {peers.map((peer, index) => {
        return <Video key={index} peer={peer} />;
      })}
    </div>
  );
};
