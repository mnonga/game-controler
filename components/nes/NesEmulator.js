import { useState, useCallback, useRef, useEffect } from "react";
import GamePad from "./GamePad";

const roms = [
  { url: "/roms/Super Mario Bros Europe.nes", label: "Super Mario Bros" },
  { url: "/roms/Contra.nes", label: "Contra" },
];

export default function NesEmulator() {
  const [fps, setFps] = useState("");
  const [romUrl, setRomUrl] = useState(roms[0].url);
  const [nes, setNes] = useState(null);

  const [romLoaded, setRomLoaded] = useState(false);
  const [ran, setRan] = useState(false);
  const [stopped, setStopped] = useState(false);

  const nesCanvas = useRef(null);

  const [messages, setMessages] = useState("");
  const dumpRef = useRef(null);

  const putMessage = (str) => {
    setMessages((prev) => prev + str + "\n");
  };

  useEffect(() => {
    if (dumpRef.current) {
      dumpRef.current.scrollTop = dumpRef.current.scrollHeight;
    }
  }, [messages]);

  const pushStopButton = useCallback(() => {
    if (!nes) return;
    nes.stop();
    putMessage("stopped.");
    setStopped(true);
    setRan(false);
  }, [nes]);

  const pushStepButton = useCallback(() => {
    if (!nes) return;
    nes.runStep();
    putMessage(nes.dumpCpu());
  }, [nes]);

  const pushResumeButton = useCallback(() => {
    if (!nes) return;
    nes.resume();
    putMessage("resumed.");
    setRan(true);
    setStopped(false);
  }, [nes]);

  const run = useCallback((buffer) => {
    try {
      var rom = new NesJs.Rom(buffer);
    } catch (e) {
      putMessage("");
      putMessage(e.toString());
      return;
    }

    putMessage("");
    putMessage("Rom Header info");
    putMessage(rom.header.dump());

    let nes = new NesJs.Nes();
    setNes(nes);

    nes.addEventListener("fps", function (fps) {
      setFps(fps.toFixed(2));
    });

    nes.setRom(rom);

    //nes.setDisplay(new NesJs.Display(document.getElementById("mainCanvas")));
    nes.setDisplay(new NesJs.Display(nesCanvas.current));

    try {
      nes.setAudio(new NesJs.Audio());
    } catch (e) {
      putMessage("");
      putMessage(
        "Disables audio because this browser does not seems to support WebAudio."
      );
    }

    window.onkeydown = function (e) {
      nes.handleKeyDown(e);
    };
    window.onkeyup = function (e) {
      nes.handleKeyUp(e);
    };

    putMessage("");

    putMessage("bootup.");
    nes.bootup();

    putMessage("runs.");
    setRan(true);
    setStopped(false);
    nes.run();
  }, []);

  function loadRom() {
    let request = new XMLHttpRequest();
    request.responseType = "arraybuffer";

    request.onload = function () {
      putMessage("Loading done.");
      run(request.response);
    };

    request.onerror = function (e) {
      putMessage("failed to load.");
    };

    request.open("GET", romUrl, true);
    request.send(null);

    putMessage("");
    putMessage("Loading rom image...");
    setRomLoaded(true);
  }

  return (
    <div>
      <select
        value={romUrl}
        onChange={(e) => setRomUrl(e.target.value)}
      >
        {roms.map((rom, index) => (
          <option key={index} value={rom.url}>
            {rom.label}
          </option>
        ))}
      </select>
      <button type="button" id="loadROMButton" onClick={loadRom}>
        Load Rom
      </button>
      <br />
      <div style={{ display: "flex", alignItems: "start" }}>
        <div>
          <canvas
            ref={nesCanvas}
            id="mainCanvas"
            width="256"
            height="240"
            style={{
              border: "1px solid black",
              width: "512px",
              height: "480px",
            }}
          ></canvas>
          {romLoaded && <div>{fps} fps</div>}
        </div>

        {romLoaded && <GamePad nes={nes}/>}
      </div>

      <div>

        {romLoaded && <div>
          <button disabled={stopped || !ran} onClick={pushStopButton}>Stop</button>
          <button disabled={!stopped || ran} onClick={pushStepButton}>Step</button>
          <button disabled={!stopped || ran} onClick={pushResumeButton}>Resume</button>
        </div>}

        <textarea
          cols="128"
          rows="16"
          ref={dumpRef}
          value={messages}
          readOnly
        />
      </div>
    </div>
  );
}
