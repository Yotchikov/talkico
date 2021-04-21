import * as faceapi from 'face-api.js';

export const useFace = (stream) => {
    await faceapi.loadFaceLandmarkModel('/models');
}