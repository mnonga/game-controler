import styles from "../../styles/Home.module.css";
import Link from "next/link";
import dynamic from "next/dynamic";
import NesEmulator from "../../components/nes/NesEmulator";
import Head from "next/head";
import { useState, useRef } from "react";
import { Joypad } from "../../components/nes/GamePad";

const FaceLandmarksDetection = dynamic(
  () => import("../../components/FaceLandmarksDetections"),
  {
    ssr: false,
  }
);

export default function FaceLandmarkDetection() {
  const [direction, setDirection] = useState(null);
  const emulatorRef = useRef(null);

  return (
    <div className={styles.container}>
      <Head>
        <script type="text/javascript" src="/nes.min.js"></script>
      </Head>
      <main className={styles.main}>
        <h2
          style={{
            fontWeight: "normal",
          }}
        >
          <Link style={{ fontWeight: "bold" }} href={"/"}>
            Home
          </Link>{" "}
          / Face Landmark Detection 🤓
        </h2>
        <code style={{ marginBottom: "1rem" }}>Work in progress...</code>
        {/* <FaceMeshComponent></FaceMeshComponent> */}
        <FaceLandmarksDetection
          onDirection={(direction) =>
            setDirection((old) => {
              if (old != direction) {
                console.log({ old, direction });
                if (direction != "CENTER") {
                  emulatorRef.current.pressPadButton(
                    direction == "LEFT"
                      ? Joypad.BUTTONS.LEFT
                      : Joypad.BUTTONS.RIGHT
                  );
                } else {
                  emulatorRef.current.releasePadButton(
                    old == "LEFT" ? Joypad.BUTTONS.LEFT : Joypad.BUTTONS.RIGHT
                  );
                }
              }
              return direction;
            })
          }
        ></FaceLandmarksDetection>
        <NesEmulator ref={emulatorRef} />
      </main>
    </div>
  );
}
