import { useCallback, useEffect, useRef, useState } from 'react'
import { useAnimationFrame } from '../lib/hooks/useAnimationFrame'
import '@tensorflow/tfjs-backend-webgl'
import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm'
import {
  drawFaces,
  drawNoses,
  drawHands,
  drawCircle,
  drawXCross,
  getQuadrant,
  drawFilledCircle,
  fillXQuadrant,
} from '../lib/utils'
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection'
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection'
import * as faceMesh from '@mediapipe/face_mesh'
import '@tensorflow-models/face-detection'
import throttle from 'lodash/throttle'
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

const Mode = {
  Face: 1,
  Hand: 2,
  FaceAndHand: 3,
}

const ModeOptions = Object.entries(Mode).map(([label, value]) => ({ label, value }))

export default function FaceLandmarksDetection({
  onDirection,
  onMouthOpened,
  onTilt,
  onLeftHand,
  onEyes,
}) {
  const detectorFaceRef = useRef()
  const detectorHandRef = useRef()
  const videoRef = useRef()
  const [ctx, setCtx] = useState()
  const [mode, setMode] = useState(Mode.Hand)

  const contours = faceLandmarksDetection.util.getKeypointIndexByContour(
    faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh
  )

  const isFaceEnabled = useCallback(() => mode == Mode.Face || mode == Mode.FaceAndHand, [mode])
  const isHandEnabled = useCallback(() => mode == Mode.Hand || mode == Mode.FaceAndHand, [mode])

  const [direction, setDirection] = useState(null)
  const [mouthOpened, setMouthOpened] = useState(false)
  const [tilt, setTilt] = useState(null)
  const [eyes, setEyes] = useState(null)
  const [leftHand, setLeftHand] = useState(null)

  const referencePoint = useRef(null)

  useEffect(() => {
    async function initialize() {
      videoRef.current = await setupVideo()
      const ctx = await setupCanvas(videoRef.current)
      detectorFaceRef.current = await setupDetectorFace()
      detectorHandRef.current = await setupDetectorHand()

      setCtx(ctx)
    }
    initialize()
  }, [])

  useEffect(() => {
    onDirection?.(direction)
  }, [direction])

  useEffect(() => {
    onEyes?.(eyes)
  }, [eyes])

  useEffect(() => {
    onMouthOpened?.(mouthOpened)
  }, [mouthOpened])

  useEffect(() => {
    onTilt?.(tilt)
  }, [tilt])

  useEffect(() => {
    onLeftHand?.(leftHand)
  }, [leftHand?.isIndexPressed, leftHand?.isThumbPressed, leftHand?.hand])

  const updateReferencePoint = useCallback(
    throttle(hand => {
      let radius = (hand.keypoints[0].y - hand.keypoints[5].y) * 1.5
      if (radius > 0)
        referencePoint.current = {
          point: hand.keypoints[0],
          radius,
        }
    }, 3000),
    []
  )

  const detect = useCallback(async () => {
    const faces = isFaceEnabled()
      ? await detectorFaceRef.current.estimateFaces(videoRef.current)
      : null
    const hands = isHandEnabled()
      ? await detectorHandRef.current.estimateHands(videoRef.current, {
          flipHorizontal: false,
        })
      : null

    ctx.clearRect(0, 0, videoRef.current.videoWidth, videoRef.current.videoHeight)
    ctx.drawImage(videoRef.current, 0, 0)

    if (isFaceEnabled()) {
      drawFaces(faces, ctx, contours)
      drawNoses(ctx, faces)
    }
    if (isHandEnabled()) {
      drawHands(hands, ctx)
    }

    if (isFaceEnabled()) {
      if (faces?.length) {
        setDirection(detectHeadTurnByNose(faces[0]))
        setMouthOpened(isMouthOpen(faces[0]))
        setTilt(detectHeadTiltByNose(faces[0]))
        setEyes(eyesOpened(faces[0], ctx))
      } else {
        setEyes(null)
        setMouthOpened(null)
        if (!isHandEnabled()) {
          setDirection(null)
          setTilt(null)
        }
      }
    }

    if (isHandEnabled()) {
      if (!hands?.length) {
        setLeftHand(null)
        if (!isFaceEnabled()) {
          setDirection(null)
          setMouthOpened(null)
        }
      } else {
        let found = false
        for (let hand of hands) {
          let data = analyzeHand(hand)
          if (data?.hand === 'left') {
            setLeftHand(data)
            found = true

            if (referencePoint.current) {
              let center = referencePoint.current.point
              let radius = referencePoint.current.radius
              //drawCircle({ ctx, point: center, radius, color: 'rgba(0, 200, 200, 0.7)' })
              drawFilledCircle({
                ctx,
                point: center,
                radius,
                color: 'rgba(0, 200, 200, 0.7)',
                innerRadius: radius * 0.4,
              })
              drawXCross(ctx, center, radius)
              let quadrant = getQuadrant(center, hand.keypoints[0], radius * 0.4, radius)
              if (quadrant) {
                fillXQuadrant(ctx, center, radius, radius * 0.4, quadrant, 'rgba(242, 255, 5, 0.7)')
                if (quadrant == 'left') setDirection('LEFT')
                else if (quadrant == 'right') setDirection('RIGHT')
                else if (quadrant == 'top') setTilt('UP')
                else if (quadrant == 'bottom') setTilt('DOWN')
              }
            }

            updateReferencePoint(hand)
          }
        }
        if (!found) setLeftHand(null)
      }
    }
  }, [mode, detectorFaceRef.current, detectorHandRef.current, videoRef.current, ctx])

  useAnimationFrame(
    detect,
    !!(detectorFaceRef.current && detectorHandRef.current && videoRef.current && ctx && mode)
  )

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
  )
}
