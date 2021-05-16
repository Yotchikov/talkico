import { Video } from './Video';
import { useRef } from 'react';

export const VideoContainer = (props) => {
  const { connections, myPoints, myStream , myId} = props;
  const videoList = () => {
    const list = [];
    for (const id in connections) {
      list.push({ ...connections[id], id });
    }
    return list;
  };
  const myVideo = useRef();
  if (myStream) {
    myVideo.current.srcObject = myStream;
  }

  return (
    <div className="row justify-content-center">
      <div className="col-6">
        <div className="card">
          <video className="card-img-top styled-video" id={myId} ref={myVideo} playsInline muted autoPlay />
          <div className="card-body">
            <h6 className="card-title">{myPoints} очков</h6>
          </div>
        </div>
      </div>
      {videoList().length > 0 && (
        <div className="col-3">
          {videoList().map((element) => {
            return (
              <div className="card">
                <Video stream={element.otherUserStream} userId={element.id} />
                <div className="card-body">
                  <h6>{element.points}</h6>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
