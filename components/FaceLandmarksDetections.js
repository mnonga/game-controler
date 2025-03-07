import { useCallback, useEffect, useRef, useState } from 'react'
import { useAnimationFrame } from '../lib/hooks/useAnimationFrame'
import '@tensorflow/tfjs-backend-webgl'
import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm'
import { drawFaces, drawNoses, drawHands, drawCircle, drawXCross, getQuadrant } from '../lib/utils'
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

export default function FaceLandmarksDetection({ onDirection, onMouthOpened, onTilt, onLeftHand }) {
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
  const [leftEyeOpened, setLeftEyeOpened] = useState(false)
  const [leftHand, setLeftHand] = useState(null)

  const referencePoint = useRef(null)
  const lastMoveTime = useRef(Date.now())
  const [currentQuadrant, setCurrentQuadrant] = useState(null)
  const movementThreshold = 3 // Seuil de mouvement minimal
  const resetTime = 1000 // Temps avant de réinitialiser le centre (1s)

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
      console.log('throttling...', hand.keypoints[0])
      referencePoint.current = {
        point: hand.keypoints[0],
        radius: (hand.keypoints[0].y - hand.keypoints[5].y) * 1.5,
      }
    }, 300),
    []
  )

  /*useEffect(() => {
    if (!leftHand) return // Ne fait rien si aucune main n'est détectée

    
    const wrist = leftHand.keypoints[0]

    if (!referencePoint.current) {
      referencePoint.current = wrist // Initialisation du centre
      return
    }

    console.log("here")

    // Calcul de la distance par rapport au centre de référence
    const dx = wrist.x - referencePoint.current.x
    const dy = wrist.y - referencePoint.current.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > movementThreshold) {
      setCurrentQuadrant(getQuadrant(referencePoint.current, wrist))
      lastMoveTime.current = Date.now() // Mise à jour du dernier mouvement
    }

    // Réinitialisation du centre après `resetTime` d'inactivité
    if (Date.now() - lastMoveTime.current > resetTime) {
      referencePoint.current = wrist
    }
  }, [leftHand])*/

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
      if (faces.length > 0) {
        //setDirection(detectHeadTurnByNose(faces[0]))
        //setMouthOpened(isMouthOpen(faces[0]))
        //setTilt(detectHeadTiltByNose(faces[0]))
        //setLeftEyeOpened(isLeftEyeOpen(faces[0]))
      }
    }

    if (isHandEnabled()) {
      if (!hands?.length) {
        setLeftHand(null)
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
              //let radius = (hand.keypoints[0].y - hand.keypoints[5].y) * 1.5
              drawCircle({ ctx, point: center, radius, color: 'rgba(0, 200, 200, 0.7)' })
              drawXCross(ctx, center, radius)
            }

            /*debouncer(() => {
              console.log('debouncing...', hand.keypoints[0])
              referencePoint.current = {
                point: hand.keypoints[0],
                radius: (hand.keypoints[0].y - hand.keypoints[5].y) * 1.5,
              }
            })*/

            updateReferencePoint(hand)

            if (currentQuadrant) {
              fillQuadrant(ctx, referencePoint.current, radius, currentQuadrant)
            }
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
    <>
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
      <div>letEye: {leftEyeOpened}</div>
    </>
  )
}
