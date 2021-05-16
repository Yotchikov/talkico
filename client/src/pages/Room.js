import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useConnection } from '../hooks/connection.hook';
import { useHttp } from '../hooks/http.hook';
import { withRouter } from 'react-router-dom';
import { VideoContainer } from '../components/VideoContainer';
import { ErrorPage } from './ErrorPage';
import { FullRoom } from './FullRoom';

export const Room = withRouter((props) => {
  const roomId = useParams().id;
  const { request } = useHttp();
  const {
    start,
    connections,
    myPoints,
    myStream,
    leaveRoom,
    isFull,
    startGame,
    myId,
  } = useConnection(roomId);
  const [error, setError] = useState(null);

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
      await request('/api/room/join', 'POST', { roomId });
      alert('Вы успешно зашли в комнату!');
      start();
    } catch (e) {
      setError(e);
    }
  }, []);

  if (isFull) {
    return <FullRoom roomId={roomId} />;
  }

  if (error) {
    return <ErrorPage error={error} />;
  }

  return (
    <div className="m-3">
      <h3>Комната {roomId}</h3>
      <h3>Игрок {myId}</h3>
      <div id="video-container">
        {<VideoContainer connections={connections} myPoints={myPoints} myStream={myStream} myId={myId} />}
      </div>
      <button className="btn btn-success m-3" onClick={startGame}>
        Начать игру
      </button>
      <button className="btn btn-success m-3" onClick={leaveConference}>
        Выйти из конференции
      </button>
    </div>
  );
});
