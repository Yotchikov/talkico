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

    const drawCard = (landmarks, images) => {
      // ctx.drawImage(videoElement, 0, 0);
      const { question, leftAnswer, rightAnswer } = images;
      const leftEyeBrow = landmarks.getLeftEyeBrow();
      const rightEyeBrow = landmarks.getRightEyeBrow();
      const cardWidth =
        Math.hypot(
          rightEyeBrow[4].x - leftEyeBrow[0].x,
          rightEyeBrow[4].y - leftEyeBrow[0].y
        ) * 1.5;
      const cardHeight = question.height * (cardWidth / question.width);
      const cardAngle = Math.atan2(
        rightEyeBrow[4].y - leftEyeBrow[0].y,
        rightEyeBrow[4].x - leftEyeBrow[0].x
      );
      const cardAngleDegrees = (cardAngle * 180) / Math.PI;
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
        question,
        -cardWidth / 2,
        -cardHeight * 1.5,
        cardWidth,
        cardHeight
      );
      ctx.translate(-cardWidth * 0.9, -cardHeight * 0.5);
      ctx.rotate(-Math.PI / 8);
      ctx.globalAlpha = cardAngleDegrees < -30 ? 1 - cardAngleDegrees / -45 : 1;
      ctx.drawImage(
        leftAnswer,
        -cardWidth / 3,
        -cardHeight / 3,
        cardWidth / 1.5,
        cardHeight / 1.5
      );
      ctx.rotate(Math.PI / 8);
      ctx.translate(cardWidth * 1.8, 0);
      ctx.rotate(Math.PI / 8);
      ctx.globalAlpha = cardAngleDegrees > 30 ? 1 - cardAngleDegrees / 45 : 1;
      ctx.drawImage(
        rightAnswer,
        -cardWidth / 3,
        -cardHeight / 3,
        cardWidth / 1.5,
        cardHeight / 1.5
      );
      ctx.restore();
    };

    const animate = async (question, images) => {
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
        drawCard(detectionWithLandmarks.landmarks, images);
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
        await animate(question, images);
      }, 100);
    };

    // Поступил новый вопрос от сервера
    socket.on('new-question', async (question) => {
      initTime = new Date();
      const images = {};
      images.question = new Image();
      images.question.src =
        'https://i.ibb.co/jbhbwfb/text2image-J5832538-20210509-220145.png';
      images.leftAnswer = new Image();
      images.leftAnswer.src =
        'https://i.ibb.co/tKS1Z69/text2image-T9826036-20210509-233135.png';
      images.rightAnswer = new Image();
      images.rightAnswer.src =
        'https://i.ibb.co/48P7kQs/text2image-A4808767-20210509-234502.png';
      await animate(question, images);
    });
  };

  return { addAR };
};
