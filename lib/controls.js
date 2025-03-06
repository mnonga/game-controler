
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


export const detectHeadTurn = (face, threshold = 20) => {
    //console.log(face);
    if (!face || !face.keypoints) return null;

    const keypoints = face.keypoints;
    //const lips = keypoints.find(p => p.name === "lips");
    const leftEye = keypoints.find(p => p.name === "leftEye");
    const rightEye = keypoints.find(p => p.name === "rightEye");
    //const rightEyebrow = keypoints.find(p => p.name === "rightEyebrow");
    //const leftEyebrow = keypoints.find(p => p.name === "leftEyebrow");
    const faceOval = keypoints.find(p => p.name === "faceOval");
    //const rightIris = keypoints.find(p => p.name === "rightIris");
    //const leftIris = keypoints.find(p => p.name === "leftIris");

    //console.log(new Set(keypoints.map(p=> p.name)));

    if (!faceOval || !leftEye || !rightEye) return null;

    const nose = face.keypoints[1];

    // Calcul de la distance du nez aux yeux
    const distToLeftEye = Math.abs(nose.x - leftEye.x);
    const distToRightEye = Math.abs(nose.x - rightEye.x);

    // Si le nez est nettement plus proche d'un œil, la tête est tournée
    if (distToLeftEye - distToRightEye > threshold) {
        return "RIGHT"; // Tourné vers la droite
    } else if (distToRightEye - distToLeftEye > threshold) {
        return "LEFT"; // Tourné vers la gauche
    }
    return "CENTER"; // Face centrée
};



const getAngleBetweenLines = (p1, p2, p3) => {
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };

    const dotProduct = v1.x * v2.x + v1.y * v2.y;
    const magnitude1 = Math.sqrt(v1.x ** 2 + v1.y ** 2);
    const magnitude2 = Math.sqrt(v2.x ** 2 + v2.y ** 2);

    const angle = Math.acos(dotProduct / (magnitude1 * magnitude2));
    return (angle * 180) / Math.PI; // Convertir en degrés
};

export const isMouthOpen = (face, threshold = 20) => {
    if (!face || !face.keypoints) return null;

    const keypoints = face.keypoints;
    const upperLip = keypoints[13];
    const lowerLip = keypoints[14];
    const leftCorner = keypoints[61];
    const rightCorner = keypoints[291];
    const leftBottom = keypoints[78];
    const rightBottom = keypoints[308];

    if (!upperLip || !lowerLip || !leftCorner || !rightCorner || !leftBottom || !rightBottom) {
        return null;
    }

    const upperAngle = getAngleBetweenLines(leftCorner, upperLip, rightCorner);
    const lowerAngle = getAngleBetweenLines(leftBottom, lowerLip, rightBottom);

    return (upperAngle + lowerAngle) > threshold;
};
