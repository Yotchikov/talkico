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
    winner,
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

  if (winner) {
    return (
      <div className="d-flex align-items-end justify-content-center h-100 m-5">
        <div className="container jumbotron w-50 text-center">
          <h1>У нас есть победитель!</h1>
          <h5 className="mt-3">
            В этой игре победил {winner.id}, набрав {winner.points} очков!
          </h5>
          <hr />
          <button className="btn btn-success m-3" onClick={startGame}>
            Начать новую игру
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="m-3">
      <div id="video-container">
        {
          <VideoContainer
            connections={connections}
            myPoints={myPoints}
            myStream={myStream}
            myId={myId}
          />
        }
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
