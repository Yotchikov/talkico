import { useRef } from 'react';

export const Video = (props) => {
  const { stream } = props;
  const userVideo = useRef();

  if (stream) {
    userVideo.current.srcObject = stream;
  }
  return (
    <video
      className="card-img-top"
      playsInline
      muted
      ref={userVideo}
      autoPlay
    ></video>
  );
};
