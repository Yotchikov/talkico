import * as faceapi from 'face-api.js';

export const useFace = () => {
  const addAR = async (videoElement, canvasElement) => {
    await faceapi.loadTinyFaceDetectorModel('/models');
    await faceapi.loadFaceLandmarkModel('/models');

    const width = videoElement.videoWidth;
    const height = videoElement.videoHeight;
    const ctx = canvasElement.getContext('2d');

    const drawCard = (landmarks) => {
      ctx.drawImage(videoElement, 0, 0);
      const leftEyeBrow = landmarks.getLeftEyeBrow();
      const rightEyeBrow = landmarks.getRightEyeBrow();
      const cardHeight =
        Math.hypot(
          leftEyeBrow[4].x - leftEyeBrow[0].x,
          leftEyeBrow[4].y - leftEyeBrow[0].y
        ) * 2;
      const cardWidth =
        Math.hypot(
          rightEyeBrow[4].x - leftEyeBrow[0].x,
          rightEyeBrow[4].y - leftEyeBrow[0].y
        ) * 2;
      const cardAngle = Math.atan2(
        rightEyeBrow[4].y - leftEyeBrow[0].y,
        rightEyeBrow[4].x - leftEyeBrow[0].x
      );
      const cardCenter = {
        x: rightEyeBrow[4].x - (rightEyeBrow[4].x - leftEyeBrow[0].x) / 2,
        y:
          Math.min(rightEyeBrow[2].y, leftEyeBrow[2].y) +
          (Math.max(rightEyeBrow[2].y, leftEyeBrow[2].y) -
            Math.min(rightEyeBrow[2].y, leftEyeBrow[2].y)) /
            2 -
          cardHeight,
      };
      ctx.save();
      ctx.clearRect(0, 0, width, height);
      ctx.translate(cardCenter.x, cardCenter.y);
      ctx.rotate(cardAngle);
      ctx.fillRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'white';
      ctx.fillText('Question 1?', 0, 0, cardWidth, cardHeight);
      ctx.restore();
    };

    const animate = async () => {
      const detectionWithLandmarks = await faceapi
        .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();
      if (detectionWithLandmarks) {
        drawCard(detectionWithLandmarks.landmarks);
      }
      requestAnimationFrame(animate);
    };

    animate();
  };
  return { addAR };
};
