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
  const { start, connections, myId, leaveRoom } = useConnection(roomId);

  const stopConference = async () => {
    try {
      const data = await request('/api/room/delete', 'POST', { roomId });
      alert(data.message);
      props.history.push('/');
    } catch (e) {
      alert(e.message);
    }
  };

  const leaveConference = () => {
    leaveRoom();
    props.history.push('/');
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

  useEffect(() => {
    const videoContainer = document.getElementById('video-container');
    videoContainer.innerHTML = '';
    for (let id in connections) {
      const video = document.createElement('video');
      video.srcObject = connections[id].otherUserStream;
      video.autoplay = true;
      videoContainer.appendChild(video);
    }
  }, [connections]);

  return (
    <div className="m-3">
      <h3>Комната {roomId}</h3>
      <h4>Пользователь {myId}</h4>
      <div id="video-container"></div>
      <button className="btn btn-success m-3" onClick={stopConference} disabled>
        Завершить конференцию
      </button>
      <button className="btn btn-success m-3" onClick={leaveConference}>
        Выйти из конференции
      </button>
    </div>
  );
});
