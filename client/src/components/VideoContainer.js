import { Video } from './Video';
import { useRef } from 'react';

export const VideoContainer = (props) => {
  const { connections, myPoints, myStream, myId } = props;
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
    <div className="row justify-content-center align-items-center">
      <div className="col-6">
        <div className="card">
          <video
            className="card-img-top styled-video"
            id={myId}
            ref={myVideo}
            playsInline
            muted
            autoPlay
          />
          <div className="card-body">
            <h6 className="card-title">{myPoints} очков</h6>
          </div>
        </div>
      </div>

      {videoList().length > 0 && (
        <div className="col-6">
          <div className={'row' + (videoList().length > 1 ? ' row-cols-2' : '')}>
            {videoList().map((element) => {
              return (
                <div className="col">
                  <div className="card">
                    <Video
                      stream={element.otherUserStream}
                      userId={element.id}
                    />
                    <div className="card-body">
                      <h6>{element.points} очков</h6>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
