import * as faceapi from 'face-api.js';
import { useState } from 'react';

export const useFace = () => {
  const addAR = async (videoElement, canvasElement, socket) => {
    await faceapi.loadTinyFaceDetectorModel('/models');
    await faceapi.loadFaceLandmarkModel('/models');

    const width = videoElement.videoWidth;
    const height = videoElement.videoHeight;
    const ctx = canvasElement.getContext('2d');
    let startTime;
    let currentTime;
    let angle = 0;

    const getAngle = (landmarks) => {
      const point1 = landmarks.getLeftEyeBrow()[0];
      const point2 = landmarks.getRightEyeBrow()[4];
      return (
        (Math.atan2(point2.y - point1.y, point2.x - point1.x) * 180) / Math.PI
      );
    };

    const drawCard = (landmarks, question) => {
      const { text, leftAnswer, rightAnswer } = question;

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
        ) * 1.5;
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
      ctx.fillText(text, 0, 0, cardWidth, cardHeight);
      ctx.restore();
    };

    const animate = async (question) => {
      const detectionWithLandmarks = await faceapi
        .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();
      if (detectionWithLandmarks) {
        ctx.clearRect(0, 0, width, height);
        // faceapi.draw.drawFaceLandmarks(canvasElement, detectionWithLandmarks);
        drawCard(detectionWithLandmarks.landmarks, question);
        angle = getAngle(detectionWithLandmarks.landmarks);
      }
      if (angle < 30 && angle > -30) {
        startTime = new Date();
      }
      if (angle > 30) {
        currentTime = new Date();
        if (currentTime - startTime > 3000) {
          startTime = new Date();
          socket.emit('new-answer', 'left' === question.correctAnswer);
          ctx.clearRect(0, 0, width, height);
          return;
        }
      }
      if (angle < -30) {
        currentTime = new Date();
        if (currentTime - startTime > 3000) {
          startTime = new Date();
          socket.emit('new-answer', 'right' === question.correctAnswer);
          ctx.clearRect(0, 0, width, height);
          return;
        }
      }
      setTimeout(async () => {
        await animate(question);
      }, 100);
    };

    socket.on('new-question', async (question) => {
      await animate(question);
    });
  };
  return { addAR };
};
