import Link from 'next/link';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useState, useRef } from 'react';
import DirectionPad from '../../components/nes/DirectionPad';
import JnesEmulator from '../../components/jsnes/JnesEmulator';
import { Controller } from 'jsnes';

const FaceLandmarksDetection = dynamic(() => import('../../components/FaceLandmarksDetections'), {
  ssr: false,
});

const directionButtonMapping = {
  left: Controller.BUTTON_LEFT,
  right: Controller.BUTTON_RIGHT,
  up: Controller.BUTTON_UP,
  down: Controller.BUTTON_DOWN,
  a: Controller.BUTTON_A,
  b: Controller.BUTTON_B,
};

export default function FaceLandmarkDetection() {
  const [direction, setDirection] = useState(null);
  const [tilt, setTilt] = useState(null);
  const [mouthOpened, setMouthOpened] = useState(false);
  const [leftHand, setLeftHand] = useState(null);
  const [eyes, setEyes] = useState(null);
  const [fingerDirection, setFingerDirection] = useState(null);
  const emulatorRef = useRef(null);

  const updateDirection = (setter, direction) => {
    setter(old => {
      if (old != direction) {
        if (direction != null) {
          emulatorRef.current.pressPadButton(directionButtonMapping[direction]);
        } else {
          emulatorRef.current.releasePadButton(directionButtonMapping[old]);
        }
      }
      return direction;
    });
  };

  return (
    <div className={'mx-auto container p-4'}>
      <Head>
        <script type="text/javascript" src="/nes.min.js"></script>
      </Head>
      <main className={''}>
        <h2 className="font-bold text-lg">Landmark & pose game controller</h2>
        <p className="text-xs text-gray-600">by Michée NONGA (mnonga@github.com)</p>
        {/* <FaceMeshComponent></FaceMeshComponent> */}
        <div className="flex items-start gap-8 justify-between">
          <FaceLandmarksDetection
            onDirection={direction => updateDirection(setDirection, direction)}
            onTilt={direction => updateDirection(setTilt, direction)}
            onMouthOpened={opened =>
              setMouthOpened(old => {
                if (old != opened) {
                  if (opened) {
                    emulatorRef.current.pressPadButton(Controller.BUTTON_A);
                  } else {
                    emulatorRef.current.releasePadButton(Controller.BUTTON_A);
                  }
                }
                return opened;
              })
            }
            onLeftHand={hand =>
              setLeftHand(old => {
                /* if (old?.isIndexPressed != hand?.isIndexPressed) {
                  if (hand?.isIndexPressed) {
                    emulatorRef.current.pressPadButton(Controller.BUTTON_B);
                  } else {
                    emulatorRef.current.releasePadButton(Controller.BUTTON_B);
                  }
                } */

                if (old?.isThumbPressed != hand?.isThumbPressed) {
                  if (hand?.isThumbPressed) {
                    emulatorRef.current.pressPadButton(Controller.BUTTON_A);
                  } else {
                    emulatorRef.current.releasePadButton(Controller.BUTTON_A);
                  }
                }

                if (old?.isPinkyPressed != hand?.isPinkyPressed) {
                  if (hand?.isPinkyPressed) {
                    emulatorRef.current.pressPadButton(Controller.BUTTON_B);
                  } else {
                    emulatorRef.current.releasePadButton(Controller.BUTTON_B);
                  }
                }

                return hand;
              })
            }
            onEyes={eyes =>
              setEyes(old => {
                if (old?.leftClosed != eyes?.leftClosed) {
                  if (eyes?.leftClosed) {
                    emulatorRef.current.pressPadButton(Controller.BUTTON_B);
                  } else {
                    emulatorRef.current.releasePadButton(Controller.BUTTON_B);
                  }
                }

                if (old?.rightClosed != eyes?.rightClosed) {
                  if (eyes?.rightClosed) {
                    emulatorRef.current.pressPadButton(Controller.BUTTON_A);
                  } else {
                    emulatorRef.current.releasePadButton(Controller.BUTTON_A);
                  }
                }

                return eyes;
              })
            }
            onFingerDirection={direction => updateDirection(setFingerDirection, direction)}
          ></FaceLandmarksDetection>
          <JnesEmulator ref={emulatorRef} width={256} height={240} />
        </div>

        <DirectionPad
          uPressed={tilt == 'up' || fingerDirection == 'up'}
          dPressed={tilt == 'down' || fingerDirection == 'down'}
          lPressed={direction == 'left' || fingerDirection == 'left'}
          rPressed={direction == 'right' || fingerDirection == 'right'}
          aPressed={leftHand?.isThumbPressed || eyes?.rightClosed}
          bPressed={leftHand?.isPinkyPressed || eyes?.leftClosed}
          onPressButton={button => {
            emulatorRef.current.pressPadButton(button);
          }}
          onReleaseButton={button => {
            emulatorRef.current.releasePadButton(button);
          }}
        />
        <div className="text-xs">
          {JSON.stringify({
            isThumbPressed: leftHand?.isThumbPressed,
            isPinkyPressed: leftHand?.isPinkyPressed,
          })}
        </div>
      </main>
    </div>
  );
}
