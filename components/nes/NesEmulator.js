import { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import GamePad from './GamePad'

const roms = [
  { url: '/roms/Super Mario Bros Europe.nes', label: 'Super Mario Bros' },
  { url: '/roms/Contra.nes', label: 'Contra' },
]

const NesEmulator = forwardRef(({ showDump = false }, ref) => {
  const [fps, setFps] = useState('')
  const [romUrl, setRomUrl] = useState(roms[0].url)
  const [nes, setNes] = useState(null)

  const [romLoaded, setRomLoaded] = useState(false)
  const [ran, setRan] = useState(false)
  const [stopped, setStopped] = useState(false)

  const nesCanvas = useRef(null)

  const [messages, setMessages] = useState('')
  const dumpRef = useRef(null)

  useImperativeHandle(
    ref,
    () => ({
      pressPadButton: button => {
        nes?.pad1.pressButton(button)
      },
      releasePadButton: button => {
        nes?.pad1.releaseButton(button)
      },
    }),
    [nes]
  )

  const putMessage = str => {
    setMessages(prev => prev + str + '\n')
  }

  useEffect(() => {
    if (dumpRef.current) {
      dumpRef.current.scrollTop = dumpRef.current.scrollHeight
    }
  }, [messages])

  const pushStopButton = useCallback(() => {
    if (!nes) return
    nes.stop()
    putMessage('stopped.')
    setStopped(true)
    setRan(false)
  }, [nes])

  const pushStepButton = useCallback(() => {
    if (!nes) return
    nes.runStep()
    putMessage(nes.dumpCpu())
  }, [nes])

  const pushResumeButton = useCallback(() => {
    if (!nes) return
    nes.resume()
    putMessage('resumed.')
    setRan(true)
    setStopped(false)
  }, [nes])

  const run = useCallback(buffer => {
    try {
      var rom = new NesJs.Rom(buffer)
    } catch (e) {
      putMessage('')
      putMessage(e.toString())
      return
    }

    putMessage('')
    putMessage('Rom Header info')
    putMessage(rom.header.dump())

    let nes = new NesJs.Nes()
    setNes(nes)

    nes.addEventListener('fps', function (fps) {
      setFps(fps.toFixed(2))
    })

    nes.setRom(rom)

    nes.setDisplay(new NesJs.Display(nesCanvas.current))

    try {
      nes.setAudio(new NesJs.Audio())
    } catch (e) {
      putMessage('')
      putMessage('Disables audio because this browser does not seems to support WebAudio.')
    }

    window.onkeydown = function (e) {
      nes.handleKeyDown(e)
    }
    window.onkeyup = function (e) {
      nes.handleKeyUp(e)
    }

    putMessage('')

    putMessage('bootup.')
    nes.bootup()

    putMessage('runs.')
    setRan(true)
    setStopped(false)
    nes.run()
  }, [])

  function loadRom() {
    let request = new XMLHttpRequest()
    request.responseType = 'arraybuffer'

    request.onload = function () {
      putMessage('Loading done.')
      run(request.response)
    }

    request.onerror = function (e) {
      putMessage('failed to load.')
    }

    request.open('GET', romUrl, true)
    request.send(null)

    putMessage('')
    putMessage('Loading rom image...')
    setRomLoaded(true)
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
          <canvas
            ref={nesCanvas}
            id="mainCanvas"
            width={534}
            height={300}
            className="border border-black h-[300px] aspect-video"
          ></canvas>
          {romLoaded && <div className="mt-2 text-sm font-semibold">{fps} fps</div>}
        </div>

        {/* {romLoaded && <GamePad nes={nes}/>} */}
      </div>

      {romLoaded && (
        <div className="flex gap-4">
          <button
            disabled={stopped || !ran}
            onClick={pushStopButton}
            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg shadow-md disabled:opacity-50 hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:outline-none"
          >
            Stop
          </button>
          <button
            disabled={!stopped || ran}
            onClick={pushStepButton}
            className="px-4 py-2 bg-yellow-500 text-white font-semibold rounded-lg shadow-md disabled:opacity-50 hover:bg-yellow-600 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
          >
            Step
          </button>
          <button
            disabled={!stopped || ran}
            onClick={pushResumeButton}
            className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md disabled:opacity-50 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:outline-none"
          >
            Resume
          </button>
        </div>
      )}

      {showDump && (
        <textarea
          cols="128"
          rows="16"
          ref={dumpRef}
          value={messages}
          readOnly
          className="w-full p-2 border border-gray-300 rounded-lg shadow-sm bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      )}
    </div>
  )
})

export default NesEmulator
