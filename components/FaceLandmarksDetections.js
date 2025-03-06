import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "../lib/hooks/useAnimationFrame";
import "@tensorflow/tfjs-backend-webgl";
import * as tfjsWasm from "@tensorflow/tfjs-backend-wasm";
import { drawFaces, drawNoses } from "../lib/utils";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import * as faceMesh from "@mediapipe/face_mesh";
import "@tensorflow-models/face-detection";
import { LABEL_TO_COLOR } from "../lib/utils";
import { detectHeadTurn, isMouthOpen } from "../lib/controls";

//tfjsWasm.setWasmPaths(`https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm`);
tfjsWasm.setWasmPaths(`/@tensorflow/tfjs-backend-wasm.js`);

console.log(faceMesh.VERSION); // https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619

async function setupDetector() {
  const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
  const detector = await faceLandmarksDetection.createDetector(model, {
    runtime: "mediapipe",
    //solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@${faceMesh.VERSION}`,
    solutionPath: `/@mediapipe/face_mesh`,
    maxFaces: 2,
    refineLandmarks: true,
  });

  return detector;
}

async function setupVideo() {
  const video = document.getElementById("video");
  const stream = await window.navigator.mediaDevices.getUserMedia({
    video: true,
  });

  video.srcObject = stream;
  await new Promise((resolve) => {
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
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = video.width;
  canvas.height = video.height;

  return ctx;
}

export default function FaceLandmarksDetection({ onDirection, onMouthOpened }) {
  const detectorRef = useRef();
  const videoRef = useRef();
  const [ctx, setCtx] = useState();
  const contours = faceLandmarksDetection.util.getKeypointIndexByContour(
    faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh
  );

  const [direction, setDirection] = useState(null);
  const [mouthOpened, setMouthOpened] = useState(false);

  useEffect(() => {
    async function initialize() {
      videoRef.current = await setupVideo();
      const ctx = await setupCanvas(videoRef.current);
      detectorRef.current = await setupDetector();

      setCtx(ctx);
    }

    initialize();
  }, []);

  useEffect(() => {
    onDirection?.(direction);
  }, [direction]);

  useEffect(() => {
    onMouthOpened?.(mouthOpened);
  }, [mouthOpened]);

  useAnimationFrame(async (delta) => {
    const faces = await detectorRef.current.estimateFaces(videoRef.current);

    ctx.clearRect(
      0,
      0,
      videoRef.current.videoWidth,
      videoRef.current.videoHeight
    );
    ctx.drawImage(videoRef.current, 0, 0);
    drawFaces(faces, ctx, contours);
    drawNoses(ctx, faces);

    if (faces.length > 0) {
      setDirection(detectHeadTurn(faces[0]));
      setMouthOpened(isMouthOpen(faces[0]));
    }
  }, !!(detectorRef.current && videoRef.current && ctx));

  return (
    <>
      <canvas
        style={{
          transform: "scaleX(-1)",
          zIndex: 1,
          borderRadius: "1rem",
          boxShadow: "0 3px 10px rgb(0 0 0)",
          maxWidth: "85vw",
        }}
        id="canvas"
      ></canvas>
      <video
        style={{
          visibility: "hidden",
          transform: "scaleX(-1)",
          position: "absolute",
          top: 0,
          left: 0,
          width: 0,
          height: 0,
        }}
        id="video"
        playsInline
      ></video>
      <div>Looking: {direction} / {mouthOpened ? "Mouth opened": "Mouth closed"}</div>
    </>
  );
}
