import { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import Emulator from './Emulator';
import { Controller } from 'jsnes';

export const roms = [
  { url: '/roms/Super Mario Bros Europe.nes', label: 'Super Mario Bros' },
  { url: '/roms/Contra.nes', label: 'Contra' },
];

const JnesEmulator = forwardRef(({ width, height }, ref) => {
  const [romUrl, setRomUrl] = useState(roms[0].url);

  const [romData, setRomData] = useState(null);
  const [paused, setPaused] = useState(false);
  const emulator = useRef(null);

  useImperativeHandle(
    ref,
    () => ({
      pressPadButton: button => {
        emulator.current?.nes.buttonDown(1, button);
      },
      releasePadButton: button => {
        emulator.current?.nes.buttonUp(1, button);
      },
    }),
    [emulator.current]
  );

  function loadRom() {
    let req = new XMLHttpRequest();
    req.open('GET', romUrl);
    req.overrideMimeType('text/plain; charset=x-user-defined');
    req.onerror = () => console.log(`Error loading ${romUrl}: ${req.statusText}`);

    req.onload = function () {
      if (this.status === 200) {
        setRomData(this.responseText);
      } else if (this.status === 0) {
        // Aborted, so ignore error
      } else {
        req.onerror();
      }
    };

    req.send();
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <select
          value={romUrl}
          onChange={e => setRomUrl(e.target.value)}
          className="p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          {roms.map((rom, index) => (
            <option key={index} value={rom.url}>
              {rom.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          id="loadROMButton"
          onClick={loadRom}
          className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          Load Rom
        </button>
      </div>

      <div className="flex items-start gap-4">
        <div>
          {romData && (
            <Emulator
              romData={romData}
              paused={paused}
              ref={emulator_ => {
                emulator.current = emulator_;
              }}
              width={width}
              height={height}
            />
          )}
        </div>
      </div>

      {romData && (
        <div className="flex gap-4">
          <button
            disabled={!romData}
            onClick={() => setPaused(val => !val)}
            className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md disabled:opacity-50 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:outline-none"
          >
            {paused ? 'Continue' : 'Pause'}
          </button>
        </div>
      )}
    </div>
  );
});

export default JnesEmulator;
