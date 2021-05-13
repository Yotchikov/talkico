import { Video } from './Video';

export const VideoContainer = (props) => {
  const { myPoints, connections } = props;
  const videoList = () => {
    const list = [];
    for (const id in connections) {
      list.push(connections[id]);
    }
    return list;
  };
  return (
    <div className="row justify-content-center">
      <div className="col-6">
        <div className="card">
          <video className="card-img-top" id="video" />
          <canvas
            id="overlay"
            style={{
              position: 'absolute',
              zIndex: '100',
            }}
          ></canvas>
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
                <Video stream={element.otherUserStream} />
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
