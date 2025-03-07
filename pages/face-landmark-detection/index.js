import styles from '../../styles/Home.module.css'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import NesEmulator from '../../components/nes/NesEmulator'
import Head from 'next/head'
import { useState, useRef } from 'react'
import { Joypad } from '../../components/nes/GamePad'
import DirectionPad from '../../components/nes/DirectionPad'

const FaceLandmarksDetection = dynamic(() => import('../../components/FaceLandmarksDetections'), {
  ssr: false,
})

export default function FaceLandmarkDetection() {
  const [direction, setDirection] = useState(null)
  const [tilt, setTilt] = useState(null)
  const [mouthOpened, setMouthOpened] = useState(false)
  const emulatorRef = useRef(null)

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
                      direction == 'LEFT' ? Joypad.BUTTONS.LEFT : Joypad.BUTTONS.RIGHT
                    )
                  } else {
                    emulatorRef.current.releasePadButton(
                      old == 'LEFT' ? Joypad.BUTTONS.LEFT : Joypad.BUTTONS.RIGHT
                    )
                  }
                }
                return direction
              })
            }
            onTilt={direction =>
              setTilt(old => {
                if (old != direction) {
                  if (direction != 'CENTER') {
                    emulatorRef.current.pressPadButton(
                      direction == 'UP' ? Joypad.BUTTONS.UP : Joypad.BUTTONS.DOWN
                    )
                  } else {
                    emulatorRef.current.releasePadButton(
                      old == 'UP' ? Joypad.BUTTONS.UP : Joypad.BUTTONS.DOWN
                    )
                  }
                }
                return direction
              })
            }
            onMouthOpened={opened =>
              setMouthOpened(old => {
                if (old != opened) {
                  if (opened) {
                    emulatorRef.current.pressPadButton(Joypad.BUTTONS.A)
                  } else {
                    emulatorRef.current.releasePadButton(Joypad.BUTTONS.A)
                  }
                }
                return opened
              })
            }
          ></FaceLandmarksDetection>
          <NesEmulator ref={emulatorRef} />
        </div>

        <DirectionPad
          direction={direction}
          tilt={tilt}
          onPressButton={button => emulatorRef.current.pressPadButton(button)}
          onReleaseButton={button => emulatorRef.current.releasePadButton(button)}
        />
      </main>
    </div>
  )
}
