import * as faceapi from 'face-api.js';
import * as THREE from 'three';

export const useFace = () => {
  const addAR = async (videoElement, canvasElement) => {
    await faceapi.loadTinyFaceDetectorModel('/models');
    await faceapi.loadFaceLandmarkModel('/models');

    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasElement,
      alpha: true,
    });
    renderer.setSize(videoElement.videoWidth, videoElement.videoHeight);
    const camera = new THREE.PerspectiveCamera(
      75,
      videoElement.videoWidth / videoElement.videoHeight,
      0.1,
      1000
    );
    const geometry = new THREE.PlaneGeometry(10, 10);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const card = new THREE.Mesh(geometry, material);
    scene.add(card);
    camera.position.z = 25;

    const animate = async () => {
      const detectionWithLandmarks = await faceapi
        .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks();
      if (detectionWithLandmarks) {
        card.position.set(
          detectionWithLandmarks.landmarks.getRightEyeBrow()[0].x / 100,
          detectionWithLandmarks.landmarks.getRightEyeBrow()[0].y / 100,
          0
        );
        renderer.render(scene, camera);
      }
      requestAnimationFrame(animate);
    };

    animate();
  };
  return { addAR };
};
