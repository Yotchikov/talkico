import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useConnection } from '../hooks/connection.hook';
import { useHttp } from '../hooks/http.hook';
import { withRouter } from 'react-router-dom';

const Video = (props) => {
  const ref = useRef();
  useEffect(() => {
    props.peer.on('stream', (stream) => {
      ref.current.srcObject = stream;
    });
  }, []);
};

export const Room = withRouter((props) => {
  const roomId = useParams().id;
  const { request } = useHttp();
  const { start, peerPairs } = useConnection();

  const stopConference = async () => {
    try {
      const data = await request('/api/room/delete', 'POST', { roomId });
      alert(data.message)
      props.history.push('/create');
    } catch (e) {
      alert(e.message);
    }
  };

  useEffect(async () => {
    try {
      const data = await request('/api/room/join', 'POST', { roomId });
      alert('Вы успешно зашли в комнату!');
      start();
    } catch (e) {
      alert(e.message);
    }
  }, []);

  return (
    <>
      <div>Hello</div>
      <button className="btn btn-success m-3" onClick={stopConference}>
        Завершить конференцию
      </button>
    </>
  );
});
