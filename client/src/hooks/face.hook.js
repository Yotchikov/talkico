import * as faceapi from 'face-api.js';
import { useState } from 'react';

export const useFace = () => {
  const addAR = async (videoElement, canvasElement, socket) => {
    await faceapi.loadTinyFaceDetectorModel('/models');
    await faceapi.loadFaceLandmarkModel('/models');

    const width = videoElement.videoWidth;
    const height = videoElement.videoHeight;
    const ctx = canvasElement.getContext('2d');
    let startTime, currentTime, initTime;
    let angle = 0;

    const getAngle = (landmarks) => {
      const point1 = landmarks.getLeftEyeBrow()[0];
      const point2 = landmarks.getRightEyeBrow()[4];
      return (
        (Math.atan2(point2.y - point1.y, point2.x - point1.x) * 180) / Math.PI
      );
    };

    const drawCard = (landmarks, questionImg) => {
      ctx.drawImage(videoElement, 0, 0);
      const leftEyeBrow = landmarks.getLeftEyeBrow();
      const rightEyeBrow = landmarks.getRightEyeBrow();
      const cardWidth =
        Math.hypot(
          rightEyeBrow[4].x - leftEyeBrow[0].x,
          rightEyeBrow[4].y - leftEyeBrow[0].y
        ) * 1.5;
      const cardHeight = questionImg.height * (cardWidth / questionImg.width);
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
            2,
      };
      ctx.save();
      ctx.translate(cardCenter.x, cardCenter.y);
      ctx.rotate(cardAngle);
      ctx.scale(-1, 1);
      ctx.drawImage(
        questionImg,
        -cardWidth / 2,
        -cardHeight * 1.5,
        cardWidth,
        cardHeight
      );
      ctx.restore();
    };

    const animate = async (question, questionImg) => {
      // Если игрок думает больше 10 секунд
      // if (new Date() - initTime > 10000) {
      //   socket.emit('new-answer', false);
      //   ctx.clearRect(0, 0, width, height);
      //   return;
      // }

      // Распознавание лица
      const detectionWithLandmarks = await faceapi
        .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();

      // Рендеринг карточки с вопросом и высчитывание угла наклона головы
      if (detectionWithLandmarks) {
        ctx.clearRect(0, 0, width, height);
        // faceapi.draw.drawFaceLandmarks(canvasElement, detectionWithLandmarks);
        drawCard(detectionWithLandmarks.landmarks, questionImg);
        angle = getAngle(detectionWithLandmarks.landmarks);
      }

      // Если игрок не наклонил голову - обнулить время наклона
      if (angle < 30 && angle > -30) {
        startTime = new Date();
      }

      // Игрок наклонил голову влево
      if (angle > 30) {
        currentTime = new Date();
        if (currentTime - startTime > 3000) {
          startTime = new Date();
          socket.emit('new-answer', 'left' === question.correctAnswer);
          ctx.clearRect(0, 0, width, height);
          return;
        }
      }

      // Игрок наклонил голову вправо
      if (angle < -30) {
        currentTime = new Date();
        if (currentTime - startTime > 3000) {
          startTime = new Date();
          socket.emit('new-answer', 'right' === question.correctAnswer);
          ctx.clearRect(0, 0, width, height);
          return;
        }
      }

      // Новый кадр анимации
      setTimeout(async () => {
        await animate(question, questionImg);
      }, 100);
    };

    // Поступил новый вопрос от сервера
    socket.on('new-question', async (question) => {
      initTime = new Date();
      const questionImg = new Image();
      questionImg.src =
        'https://i.ibb.co/jbhbwfb/text2image-J5832538-20210509-220145.png';
      questionImg.style.transform = 'scale(-1, 1)';
      await animate(question, questionImg);
    });
  };

  return { addAR };
};
