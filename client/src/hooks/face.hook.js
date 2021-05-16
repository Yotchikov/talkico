import * as faceapi from 'face-api.js';
import { useState } from 'react';

export const useFace = () => {
  const addAR = async (videoElement, canvasElement, question) => {
    // Подготовка моделей
    await faceapi.loadTinyFaceDetectorModel('/models');
    await faceapi.loadFaceLandmarkModel('/models');

    // Задание необходимых констант и переменных
    const width = videoElement.clientWidth;
    const height = videoElement.clientHeight;
    const ctx = canvasElement.getContext('2d');
    let startTime,
      currentTime,
      initTime = new Date();
    let angle = 0;

    // Подготовка картинок с вопросом и ответами
    const images = {};
    images.question = new Image();
    images.question.src = question.text;
    images.leftAnswer = new Image();
    images.leftAnswer.src = question.leftAnswer;
    images.rightAnswer = new Image();
    images.rightAnswer.src = question.rightAnswer;

    // Метод определения угла наклона головы
    const getAngle = (landmarks) => {
      const point1 = landmarks.getLeftEyeBrow()[0];
      const point2 = landmarks.getRightEyeBrow()[4];
      return (
        (Math.atan2(point2.y - point1.y, point2.x - point1.x) * 180) / Math.PI
      );
    };

    // Отрисовка карточек с вопросом и ответами поверх головы игрока
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
      ctx.globalAlpha = cardAngleDegrees < -15 ? 1 - cardAngleDegrees / -45 : 1;
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
      ctx.globalAlpha = cardAngleDegrees > 15 ? 1 - cardAngleDegrees / 45 : 1;
      ctx.drawImage(
        rightAnswer,
        -cardWidth / 3,
        -cardHeight / 3,
        cardWidth / 1.5,
        cardHeight / 1.5
      );
      ctx.restore();
    };

    // Функция анимации
    const animate = async () => {
      // Если игрок думает больше 10 секунд
      // if (new Date() - initTime > 10000) {
      //   socket.emit('new-answer', false);
      //   ctx.clearRect(0, 0, width, height);
      //   return;
      // }
      const videoCanvas = document.createElement('canvas');
      videoCanvas.width = videoElement.clientWidth;
      videoCanvas.height = videoElement.clientHeight;
      videoCanvas.getContext('2d').drawImage(videoElement, 0, 0, width, height);

      // Распознавание лица
      const detectionWithLandmarks = await faceapi
        .detectSingleFace(videoCanvas, new faceapi.TinyFaceDetectorOptions())
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

      // Игрок наклонил голову влево или вправо
      if (angle > 30 || angle < -30) {
        currentTime = new Date();
        if (currentTime - startTime > 3000) {
          startTime = new Date();
          // socket.emit('new-answer', 'left' === question.correctAnswer);
          ctx.clearRect(0, 0, width, height);
          return angle;
        }
      }

      return animate();
    };

    return await animate();
  };

  return { addAR };
};
