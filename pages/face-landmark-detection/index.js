import styles from '../../styles/Home.module.css';
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

export default function FaceLandmarkDetection() {
  const [direction, setDirection] = useState(null);
  const [tilt, setTilt] = useState(null);
  const [mouthOpened, setMouthOpened] = useState(false);
  const [leftHand, setLeftHand] = useState(null);
  const [eyes, setEyes] = useState(null);
  const emulatorRef = useRef(null);

  return (
    <div className={styles.container}>
      <Head>
        <script type="text/javascript" src="/nes.min.js"></script>
      </Head>
      <main className={styles.main}>
        <h2
          style={{
            fontWeight: 'normal',
          }}
        >
          <Link style={{ fontWeight: 'bold' }} href={'/'}>
            Home
          </Link>{' '}
          / Face Landmark Detection 🤓
        </h2>
        {/* <FaceMeshComponent></FaceMeshComponent> */}
        <div className="flex items-start gap-8 justify-between">
          <FaceLandmarksDetection
            onDirection={direction =>
              setDirection(old => {
                if (old != direction) {
                  if (direction != 'CENTER') {
                    emulatorRef.current.pressPadButton(
                      direction == 'LEFT' ? Controller.BUTTON_LEFT : Controller.BUTTON_RIGHT
                    );
                  } else {
                    emulatorRef.current.releasePadButton(
                      old == 'LEFT' ? Controller.BUTTON_LEFT : Controller.BUTTON_RIGHT
                    );
                  }
                }
                return direction;
              })
            }
            onTilt={direction =>
              setTilt(old => {
                if (old != direction) {
                  if (direction != 'CENTER') {
                    emulatorRef.current.pressPadButton(
                      direction == 'UP' ? Controller.BUTTON_UP : Controller.BUTTON_DOWN
                    );
                  } else {
                    emulatorRef.current.releasePadButton(
                      old == 'UP' ? Controller.BUTTON_UP : Controller.BUTTON_DOWN
                    );
                  }
                }
                return direction;
              })
            }
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
                if (old?.isIndexPressed != hand?.isIndexPressed) {
                  if (hand?.isIndexPressed) {
                    emulatorRef.current.pressPadButton(Controller.BUTTON_B);
                  } else {
                    emulatorRef.current.releasePadButton(Controller.BUTTON_B);
                  }
                }

                if (old?.isThumbPressed != hand?.isThumbPressed) {
                  if (hand?.isThumbPressed) {
                    emulatorRef.current.pressPadButton(Controller.BUTTON_A);
                  } else {
                    emulatorRef.current.releasePadButton(Controller.BUTTON_A);
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
          ></FaceLandmarksDetection>
          <JnesEmulator ref={emulatorRef} width={256} height={240} />
        </div>

        <DirectionPad
          uPressed={tilt == 'UP'}
          dPressed={tilt == 'DOWN'}
          lPressed={direction == 'LEFT'}
          rPressed={direction == 'RIGHT'}
          aPressed={leftHand?.isThumbPressed || eyes?.rightClosed}
          bPressed={leftHand?.isIndexPressed || eyes?.leftClosed}
          onPressButton={button => {
            emulatorRef.current.pressPadButton(button);
          }}
          onReleaseButton={button => {
            emulatorRef.current.releasePadButton(button);
          }}
        />
      </main>
    </div>
  );
}
