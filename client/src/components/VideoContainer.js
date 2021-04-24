import { Video } from './Video';

export const VideoContainer = (props) => {
  const { myStream, connections } = props;
  const videoList = () => {
    const list = [];
    for (const id in connections) {
      list.push(connections[id]);
    }
    return list;
  };
  return (
    <div>
      {videoList().map((element) => {
        return <Video stream={element.otherUserStream} />;
      })}
    </div>
  );
};
