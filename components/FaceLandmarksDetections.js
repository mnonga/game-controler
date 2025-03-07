import { useEffect, useRef, useState } from 'react'
import { useAnimationFrame } from '../lib/hooks/useAnimationFrame'
import '@tensorflow/tfjs-backend-webgl'
import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm'
import { drawFaces, drawNoses, drawHands } from '../lib/utils'
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection'
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection'
import * as faceMesh from '@mediapipe/face_mesh'
import '@tensorflow-models/face-detection'
import { LABEL_TO_COLOR } from '../lib/utils'
import {
  detectHeadTilt,
  detectHeadTiltByNose,
  detectHeadTiltByShape,
  detectHeadTurn,
  detectHeadTurnByNose,
  isLeftEyeOpen,
  isMouthOpen,
} from '../lib/controls'

// open https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm/
//tfjsWasm.setWasmPaths(`https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm`);
tfjsWasm.setWasmPaths(`/@tensorflow/tfjs-backend-wasm.js`)

console.log(faceMesh.VERSION) // https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619

async function setupDetectorFace() {
  const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh
  const detector = await faceLandmarksDetection.createDetector(model, {
    runtime: 'mediapipe',
    //solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@${faceMesh.VERSION}`,
    solutionPath: `/@mediapipe/face_mesh`,
    maxFaces: 2,
    refineLandmarks: true,
  })

  return detector
}

async function setupDetectorHand() {
  const model = handPoseDetection.SupportedModels.MediaPipeHands
  const detector = await handPoseDetection.createDetector(model, {
    runtime: 'mediapipe',
    maxHands: 2,
    // open https://cdn.jsdelivr.net/npm/@mediapipe/hands/, voir dans Network les trucs à download
    //solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands'
    solutionPath: '/@mediapipe/hands',
  })

  return detector
}

async function setupVideo() {
  const video = document.getElementById('video')
  const stream = await window.navigator.mediaDevices.getUserMedia({
    video: true,
  })

  video.srcObject = stream
  await new Promise(resolve => {
    video.onloadedmetadata = () => {
      resolve()
    }
  })
  video.play()

  video.width = video.videoWidth
  video.height = video.videoHeight

  return video
}

async function setupCanvas(video) {
  const canvas = document.getElementById('canvas')
  const ctx = canvas.getContext('2d')

  canvas.width = video.width
  canvas.height = video.height

  return ctx
}

export default function FaceLandmarksDetection({ onDirection, onMouthOpened, onTilt }) {
  const detectorFaceRef = useRef()
  const detectorHandRef = useRef()
  const videoRef = useRef()
  const [ctx, setCtx] = useState()

  const contours = faceLandmarksDetection.util.getKeypointIndexByContour(
    faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh
  )

  const [direction, setDirection] = useState(null)
  const [mouthOpened, setMouthOpened] = useState(false)
  const [tilt, setTilt] = useState(null)
  const [leftEyeOpened, setLeftEyeOpened] = useState(false)

  useEffect(() => {
    async function initialize() {
      videoRef.current = await setupVideo()
      const ctx = await setupCanvas(videoRef.current)
      detectorFaceRef.current = await setupDetectorFace()
      detectorHandRef.current = await setupDetectorHand()

      setCtx(ctx)
    }

    console.log({ contours })

    initialize()
  }, [])

  useEffect(() => {
    onDirection?.(direction)
  }, [direction])

  useEffect(() => {
    onMouthOpened?.(mouthOpened)
  }, [mouthOpened])

  useEffect(() => {
    onTilt?.(tilt)
  }, [tilt])

  useAnimationFrame(
    async delta => {
      const faces = await detectorFaceRef.current.estimateFaces(videoRef.current)
      const hands = await detectorHandRef.current.estimateHands(videoRef.current, {
        flipHorizontal: false,
      })

      ctx.clearRect(0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight)
      ctx.drawImage(videoRef.current, 0, 0)
      drawFaces(faces, ctx, contours)
      drawNoses(ctx, faces)
      drawHands(hands, ctx)

      if (faces.length > 0) {
        //setDirection(detectHeadTurnByNose(faces[0]))
        //setMouthOpened(isMouthOpen(faces[0]))
        //setTilt(detectHeadTiltByNose(faces[0]))
        //setLeftEyeOpened(isLeftEyeOpen(faces[0]))
      }
    },
    !!(detectorFaceRef.current && detectorHandRef.current && videoRef.current && ctx)
  )

  return (
    <>
      <canvas
        id="canvas"
        className="scale-x-[-1] z-[1] rounded-md shadow-lg max-w-[85vw] h-[300px] aspect-video"
      ></canvas>
      <video
        id="video"
        playsInline
        className="invisible scale-x-[-1] absolute top-0 left-0 w-0 h-0"
      ></video>
      <div>letEye: {leftEyeOpened}</div>
    </>
  )
}
