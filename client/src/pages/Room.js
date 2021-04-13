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
  const { start, peerPairs, myId, leaveRoom } = useConnection(roomId);

  const stopConference = async () => {
    try {
      const data = await request('/api/room/delete', 'POST', { roomId });
      alert(data.message);
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
    <div className="m-3">
      <div>Вы - пользователь {myId}</div>
      <div>Список пиров комнаты:</div>
      <ul>
        {peerPairs.map((peerPair) => (
          <li key={peerPair.myPeerId}>
            {peerPair.myPeerId} - {peerPair.otherUserPeerId}
          </li>
        ))}
      </ul>
      <button className="btn btn-success m-3" onClick={stopConference} disabled>
        Завершить конференцию
      </button>
      <button className="btn btn-success m-3" onClick={leaveRoom}>
        Выйти из конференции
      </button>
    </div>
  );
});
