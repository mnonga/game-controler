import { useCallback, useEffect, useRef, useState } from 'react';
import { useAnimationFrame } from '../lib/hooks/useAnimationFrame';
import '@tensorflow/tfjs-backend-webgl';
import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm';
import {
  drawFaces,
  drawNoses,
  drawHands,
  drawCircle,
  drawXCross,
  getQuadrant,
  drawFilledCircle,
  fillXQuadrant,
  drawLine,
  getDistance,
} from '../lib/utils';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import * as faceMesh from '@mediapipe/face_mesh';
import '@tensorflow-models/face-detection';
import throttle from 'lodash/throttle';
import {
  analyzeHand,
  detectHeadTilt,
  detectHeadTiltByNose,
  detectHeadTiltByShape,
  detectHeadTurn,
  detectHeadTurnByNose,
  eyesOpened,
  isLeftEyeOpen,
  isMouthOpen,
} from '../lib/controls';
import { useHandDirection } from '../lib/hooks/useHandDirection';

// open https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm/
//tfjsWasm.setWasmPaths(`https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm`);
tfjsWasm.setWasmPaths(`/@tensorflow/tfjs-backend-wasm.js`);

console.log(faceMesh.VERSION); // https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619

async function setupDetectorFace() {
  const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
  const detector = await faceLandmarksDetection.createDetector(model, {
    runtime: 'mediapipe',
    //solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@${faceMesh.VERSION}`,
    solutionPath: `/@mediapipe/face_mesh`,
    maxFaces: 2,
    refineLandmarks: true,
  });

  return detector;
}

async function setupDetectorHand() {
  const model = handPoseDetection.SupportedModels.MediaPipeHands;
  const detector = await handPoseDetection.createDetector(model, {
    runtime: 'mediapipe',
    maxHands: 2,
    // open https://cdn.jsdelivr.net/npm/@mediapipe/hands/, voir dans Network les trucs à download
    //solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands'
    solutionPath: '/@mediapipe/hands',
  });

  return detector;
}

async function setupVideo() {
  const video = document.getElementById('video');
  const stream = await window.navigator.mediaDevices.getUserMedia({
    video: true,
  });

  video.srcObject = stream;
  await new Promise(resolve => {
    video.onloadedmetadata = () => {
      resolve();
    };
  });
  video.play();

  video.width = video.videoWidth;
  video.height = video.videoHeight;

  return video;
}

async function setupCanvas(video) {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');

  canvas.width = video.width;
  canvas.height = video.height;

  return ctx;
}

const Mode = {
  Face: 1,
  Hand: 2,
  FaceAndHand: 3,
};

const ModeOptions = Object.entries(Mode).map(([label, value]) => ({ label, value }));

const innerRadiusPercent = 0.3;
const fingerMoveDistance = 30;

export default function FaceLandmarksDetection({
  onDirection,
  onMouthOpened,
  onTilt,
  onLeftHand,
  onEyes,
  onFingerDirection,
}) {
  const detectorFaceRef = useRef();
  const detectorHandRef = useRef();
  const videoRef = useRef();
  const [ctx, setCtx] = useState();
  const [mode, setMode] = useState(Mode.Hand);

  const {
    direction: fingerDirection,
    updatePosition,
    previousPosition,
  } = useHandDirection({
    threshold: fingerMoveDistance,
  });

  const contours = faceLandmarksDetection.util.getKeypointIndexByContour(
    faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh
  );

  const isFaceEnabled = useCallback(() => mode == Mode.Face || mode == Mode.FaceAndHand, [mode]);
  const isHandEnabled = useCallback(() => mode == Mode.Hand || mode == Mode.FaceAndHand, [mode]);

  const [direction, setDirection] = useState(null);
  const [mouthOpened, setMouthOpened] = useState(false);
  const [tilt, setTilt] = useState(null);
  const [eyes, setEyes] = useState(null);
  const [leftHand, setLeftHand] = useState(null);

  const referencePoint = useRef(null);

  useEffect(() => {
    async function initialize() {
      videoRef.current = await setupVideo();
      const ctx = await setupCanvas(videoRef.current);
      detectorFaceRef.current = await setupDetectorFace();
      detectorHandRef.current = await setupDetectorHand();

      setCtx(ctx);
    }
    initialize();
  }, []);

  useEffect(() => {
    onDirection?.(direction);
  }, [direction]);

  useEffect(() => {
    onEyes?.(eyes);
  }, [eyes]);

  useEffect(() => {
    onMouthOpened?.(mouthOpened);
  }, [mouthOpened]);

  useEffect(() => {
    onFingerDirection?.(fingerDirection);
  }, [fingerDirection]);

  useEffect(() => {
    onTilt?.(tilt);
  }, [tilt]);

  useEffect(() => {
    onLeftHand?.(leftHand);
  }, [leftHand?.isIndexPressed, leftHand?.isThumbPressed, leftHand?.hand]);

  const updateReferencePoint = useCallback(
    throttle((point, radius) => {
      referencePoint.current = {
        point,
        radius,
      };
    }, 3000),
    []
  );

  const detect = useCallback(async () => {
    const faces = isFaceEnabled()
      ? await detectorFaceRef.current.estimateFaces(videoRef.current)
      : null;
    const hands = isHandEnabled()
      ? await detectorHandRef.current.estimateHands(videoRef.current, {
          flipHorizontal: false,
        })
      : null;

    ctx.clearRect(0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight);
    ctx.drawImage(videoRef.current, 0, 0);

    if (isFaceEnabled()) {
      drawFaces(faces, ctx, contours);
      drawNoses(ctx, faces);
    }
    if (isHandEnabled()) {
      drawHands(hands, ctx);
    }
    drawLine(ctx, { x: 0, y: 0 }, { x: fingerMoveDistance, y: fingerMoveDistance }, 'red', 10);

    if (isFaceEnabled()) {
      if (faces?.length) {
        setDirection(detectHeadTurnByNose(faces[0]));
        setMouthOpened(isMouthOpen(faces[0]));
        setTilt(detectHeadTiltByNose(faces[0]));
        setEyes(eyesOpened(faces[0], ctx));
      } else {
        setEyes(null);
        setMouthOpened(null);
        if (!isHandEnabled()) {
          setDirection(null);
          setTilt(null);
        }
      }
    }

    if (isHandEnabled()) {
      if (!hands?.length) {
        setLeftHand(null);
        if (!isFaceEnabled()) {
          setDirection(null);
          setTilt(null);
          setMouthOpened(null);
        }
      } else {
        let found = false;
        for (let hand of hands) {
          let data = analyzeHand(hand);
          if (data?.hand === 'left') {
            setLeftHand(data);
            found = true;

            let quadrant = null;
            let indexFingerTip = hand.keypoints[8];

            if (
              previousPosition?.x != null &&
              getDistance(indexFingerTip, previousPosition) >= fingerMoveDistance
            ) {
              drawLine(ctx, indexFingerTip, previousPosition, 'yellow', 5);
            }
            updatePosition(indexFingerTip);

            if (referencePoint.current) {
              let center = referencePoint.current.point;
              let radius = referencePoint.current.radius;
              /*drawFilledCircle({
                ctx,
                point: center,
                radius,
                color: 'rgba(0, 200, 200, 0.7)',
                innerRadius: radius * innerRadiusPercent,
              });*/
              //drawXCross(ctx, center, radius);
              //quadrant = getQuadrant(center, hand.keypoints[0], radius * innerRadiusPercent, radius);
              quadrant = getQuadrant(center, indexFingerTip, radius * innerRadiusPercent, radius);
              /*if (quadrant) {
                fillXQuadrant(
                  ctx,
                  center,
                  radius,
                  radius * innerRadiusPercent,
                  quadrant,
                  'rgba(242, 255, 5, 0.7)'
                );
                if(quadrant == 'left' || quadrant == 'right'){
                  setDirection(quadrant);
                  setTilt(null);
                }else if (quadrant == 'down' || quadrant == 'up'){
                  setTilt(quadrant);
                  setDirection(null);
                }
              }*/
            }

            //if(!quadrant) updateReferencePoint(hand, Math.abs(hand.keypoints[0].y - hand.keypoints[5].y));
            if (!quadrant)
              updateReferencePoint(
                indexFingerTip,
                Math.abs(hand.keypoints[0].y - hand.keypoints[5].y)
              );
          }
        }
        if (!found) {
          setLeftHand(null);
          updatePosition({ x: null, y: null });
          if (!isFaceEnabled()) {
            setDirection(null);
            setTilt(null);
            setMouthOpened(null);
          }
        }
      }
    }
  }, [
    mode,
    detectorFaceRef.current,
    detectorHandRef.current,
    videoRef.current,
    ctx,
    previousPosition,
    updatePosition,
  ]);

  useAnimationFrame(
    detect,
    !!(detectorFaceRef.current && detectorHandRef.current && videoRef.current && ctx && mode)
  );

  return (
    <div className="flex flex-col gap-4">
      <select
        value={mode}
        onChange={e => setMode(e.target.value)}
        className="p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
      >
        {ModeOptions.map((mode, index) => (
          <option key={index} value={mode.value}>
            {mode.label}
          </option>
        ))}
      </select>
      <canvas
        id="canvas"
        className="scale-x-[-1] z-[1] rounded-md shadow-lg max-w-[85vw] h-[300px] aspect-video"
      ></canvas>
      <video
        id="video"
        playsInline
        className="invisible scale-x-[-1] absolute top-0 left-0 w-0 h-0"
      ></video>
    </div>
  );
}
