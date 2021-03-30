import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePeer } from '../hooks/peer.hook';
import { useHttp } from '../hooks/http.hook';

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
  const { loading, error, clearError, request } = useHttp();

  useEffect(async () => {
    try {
      const data = await request('/api/room/join', 'POST', { roomId });
      alert('Вы успешно зашли в комнату!');
    } catch (e) {
      alert(e.message);
    }
  }, []);

  return <div>Hello</div>
  /*
  const roomId = useParams().id;
  const peer = usePeer(roomId);
  const peers = peer.myPeers;
  const myVideoRef = useRef();

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((myStream) => {
        myVideoRef.current.srcObject = myStream;
        peer.initialize(myStream);
      });
  }, []);

  return (
    <div>
      <h6>You are in room {roomId}</h6>
      <video muted playsInLine autoPlay ref={myVideoRef} />
      {peers.map((peers, index) => {
        return <Video key={index} peer={peer} />;
      })}
    </div>
  );*/
};
