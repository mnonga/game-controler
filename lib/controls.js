/* new Set([
    "lips",
    null,
    "rightEye",
    "faceOval",
    "rightEyebrow",
    "leftEye",
    "leftEyebrow",
    "rightIris",
    "leftIris"
]) */

//https://mediapipe.readthedocs.io/en/latest/solutions/hands.html
// https://github.com/tensorflow/tfjs-models/blob/838611c02f51159afdd77469ce67f0e26b7bbb23/face-landmarks-detection/src/mediapipe-facemesh/keypoints.ts
//https://storage.googleapis.com/mediapipe-assets/documentation/mediapipe_face_landmark_fullsize.png

import maxBy from 'lodash/maxBy';
import minBy from 'lodash/minBy';
import { drawCircle } from './utils';

export const isMouthOpen = (face, threshold = 5) => {
  if (!face || !face.keypoints) return null;

  const keypoints = face.keypoints;
  const upperLip = keypoints[13];
  const lowerLip = keypoints[14];

  if (!upperLip || !lowerLip) return null;

  const mouthOpening = Math.abs(lowerLip.y - upperLip.y);

  return mouthOpening > threshold; // True si la bouche est ouverte
};

/*

En vision par ordinateur, le repère de coordonnées sur les images fonctionne différemment du repère cartésien classique :

Origine (0,0) : En haut à gauche de l'image
Axe X : Augmente vers la droite
Axe Y : Augmente vers le bas
Donc, un point plus bas sur l'image a un Y plus grand, et un point plus haut a un Y plus petit.

*/

export const detectHeadTiltByNose = (face, threshold = 5) => {
  if (!face || !face.keypoints) return null;

  const keypoints = face.keypoints;
  const noseTip = keypoints[1];
  const noseBottom = keypoints[2];
  const noseLeft = keypoints[327];
  const noseRight = keypoints[98];

  if (!noseTip || !noseBottom || !noseLeft || !noseRight) return null;

  let max = Math.max(noseLeft.y, noseRight.y);
  let min = Math.min(noseLeft.y, noseRight.y);

  if (noseTip.y < max && noseBottom.y > min && max - min <= threshold) return null;
  if (noseTip.y < max) return 'up';
  if (noseTip.y > min) return 'down';
  return null;
};

export const detectHeadTurnByNose = (face, threshold = 5) => {
  if (!face || !face.keypoints) return null;

  const keypoints = face.keypoints;
  const noseTip = keypoints[1];
  const noseBottom = keypoints[2];
  const noseLeft = keypoints[327];
  const noseRight = keypoints[98];

  if (!noseTip || !noseBottom || !noseLeft || !noseRight) return null;

  if (Math.abs(noseTip.x - noseBottom.x) <= threshold) return null;
  if (noseTip.x < noseBottom.x) return 'right';
  if (noseTip.x > noseBottom.x) return 'left';
  return null;
};

export function isLeftEyeOpen(face, threshold = 5) {
  if (!face || !face.keypoints) return null;

  const keypoints = face.keypoints;

  let iris = MESH_ANNOTATIONS.leftEyeIris.map(i => keypoints[i]);
  let maxIrisY = maxBy(iris, p => p.y).y;
  let minIrisY = minBy(iris, p => p.y).y;

  let points = [
    ...MESH_ANNOTATIONS.leftEyeLower0,
    ...MESH_ANNOTATIONS.leftEyeLower1,
    ...MESH_ANNOTATIONS.leftEyeLower2,
    ...MESH_ANNOTATIONS.leftEyeLower3,
    ...MESH_ANNOTATIONS.leftEyeUpper0,
    ...MESH_ANNOTATIONS.leftEyeUpper1,
    ...MESH_ANNOTATIONS.leftEyeUpper2,
  ]
    .map(i => keypoints[i])
    .filter(Boolean);

  let maxEyeY = maxBy(points, p => p.y).y;
  let minEyeY = minBy(points, p => p.y).y;

  console.log({ maxEyeY, minEyeY, maxIrisY, minIrisY });

  return maxIrisY - minIrisY >= 2 * (maxEyeY - minEyeY);
}

export function eyesOpened(face, ctx, threshold = 1.5) {
  if (!face || !face.keypoints) return null;

  let keypoints = face.keypoints;

  //Ne pas trop se fier au json, faut verifier sur l'interface
  let lIrisTop = keypoints[475];
  let lIrisBottom = keypoints[477];
  let lTop = keypoints[386];
  let lBottom = keypoints[374];

  let rIrisTop = keypoints[470];
  let rIrisBottom = keypoints[472];
  let rTop = keypoints[159];
  let rBottom = keypoints[145];

  if (
    !lIrisTop ||
    !lIrisBottom ||
    !lTop ||
    !lBottom ||
    !rIrisTop ||
    !rIrisBottom ||
    !rTop ||
    !rBottom
  ) {
    return null;
  }

  //lefteye
  /*drawCircle({ctx, point: lTop, radius: 5, color: 'yellow'});
  drawCircle({ctx, point: lBottom, radius: 5, color: 'black'});
  drawCircle({ctx, point: lIrisTop, radius: 5, color: 'yellow'});
  drawCircle({ctx, point: lIrisBottom, radius: 5, color: 'black'});*/

  //righteye (mon oeil droit)
  /*drawCircle({ctx, point: rTop, radius: 5, color: 'blue'});
  drawCircle({ctx, point: rBottom, radius: 5, color: 'orange'});
  drawCircle({ctx, point: rIrisTop, radius: 5, color: 'yellow'});
  drawCircle({ctx, point: rIrisBottom, radius: 5, color: 'black'});*/

  return {
    rightClosed: Math.abs(rIrisBottom.y - rIrisTop.y) >= threshold * Math.abs(rBottom.y - rTop.y),
    leftClosed: Math.abs(lIrisBottom.y - lIrisTop.y) >= threshold * Math.abs(lBottom.y - lTop.y),
  };
}

export const MESH_ANNOTATIONS /*: {[key: string]: number[]}*/ = {
  silhouette: [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152,
    148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
  ],

  lipsUpperOuter: [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291],
  lipsLowerOuter: [146, 91, 181, 84, 17, 314, 405, 321, 375, 291],
  lipsUpperInner: [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308],
  lipsLowerInner: [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308],

  rightEyeUpper0: [246, 161, 160, 159, 158, 157, 173],
  rightEyeLower0: [33, 7, 163, 144, 145, 153, 154, 155, 133],
  rightEyeUpper1: [247, 30, 29, 27, 28, 56, 190],
  rightEyeLower1: [130, 25, 110, 24, 23, 22, 26, 112, 243],
  rightEyeUpper2: [113, 225, 224, 223, 222, 221, 189],
  rightEyeLower2: [226, 31, 228, 229, 230, 231, 232, 233, 244],
  rightEyeLower3: [143, 111, 117, 118, 119, 120, 121, 128, 245],

  rightEyebrowUpper: [156, 70, 63, 105, 66, 107, 55, 193],
  rightEyebrowLower: [35, 124, 46, 53, 52, 65],

  rightEyeIris: [473, 474, 475, 476, 477],

  leftEyeUpper0: [466, 388, 387, 386, 385, 384, 398],
  leftEyeLower0: [263, 249, 390, 373, 374, 380, 381, 382, 362],
  leftEyeUpper1: [467, 260, 259, 257, 258, 286, 414],
  leftEyeLower1: [359, 255, 339, 254, 253, 252, 256, 341, 463],
  leftEyeUpper2: [342, 445, 444, 443, 442, 441, 413],
  leftEyeLower2: [446, 261, 448, 449, 450, 451, 452, 453, 464],
  leftEyeLower3: [372, 340, 346, 347, 348, 349, 350, 357, 465],

  leftEyebrowUpper: [383, 300, 293, 334, 296, 336, 285, 417],
  leftEyebrowLower: [265, 353, 276, 283, 282, 295],

  leftEyeIris: [468, 469, 470, 471, 472],

  midwayBetweenEyes: [168],

  noseTip: [1],
  noseBottom: [2],
  noseRightCorner: [98],
  noseLeftCorner: [327],

  rightCheek: [205],
  leftCheek: [425],
};

export function analyzeHand(hand) {
  if (!hand?.keypoints) return null;
  let keypoints = hand.keypoints;

  let thumbTip = keypoints[4]; // keypoints.find(p=> p.name ==="thumb_tip");
  let thumbIp = keypoints[3]; // keypoints.find(p=> p.name ==="thumb_ip");

  let indexFingerTip = keypoints[8]; // keypoints.find(p=> p.name ==="index_finger_tip");
  let indexFingerDip = keypoints[7]; // keypoints.find(p=> p.name ==="index_finger_dip");

  let pinkyTip = keypoints[19];
  let pinkyDip = keypoints[18];

  let isThumbPressed = thumbIp.x > thumbTip.x;
  let isIndexPressed = indexFingerTip.y > indexFingerDip.y;
  let isPinkyPressed = pinkyTip.y > pinkyDip.y;

  return {
    isIndexPressed,
    isThumbPressed,
    isPinkyPressed,
    hand: hand.handedness.toLowerCase(),
    keypoints,
  };
}
