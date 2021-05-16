import { useRef } from 'react';

export const Video = (props) => {
  const { stream, userId } = props;
  const userVideo = useRef();

  if (stream) {
    userVideo.current.srcObject = stream;
  }

  return (
    <video
      className="card-img-top styled-video"
      id={userId}
      playsInline
      muted
      ref={userVideo}
      autoPlay
    ></video>
  );
};
