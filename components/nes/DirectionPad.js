import React, { useCallback } from 'react'

const DirectionPad = ({ direction, tilt, aPressed, bPressed, onPressButton, onReleaseButton }) => {
  const getButtonClass = dir =>
    `w-12 h-12 rounded-md text-lg font-bold transition-colors ${
      direction === dir || tilt === dir ? 'bg-blue-500 text-white' : 'bg-gray-300 hover:bg-gray-400'
    }`

  const pressPadButton = useCallback(
    button => {
      onPressButton?.(button)
    },
    [onPressButton]
  )

  const releasePadButton = useCallback(
    button => {
      onReleaseButton?.(button)
    },
    [onReleaseButton]
  )

  return (
    <div className="flex gap-5 items-start">
      {/* Directional Pad */}
      <div className="flex flex-col items-center gap-2 p-3 bg-gray-100 rounded-lg">
        <button
          className={getButtonClass('UP')}
          onMouseDown={() => pressPadButton(Joypad.BUTTONS.UP)}
          onMouseUp={() => releasePadButton(Joypad.BUTTONS.UP)}
        >
          ↑
        </button>

        <div className="flex gap-2">
          <button
            className={getButtonClass('LEFT')}
            onMouseDown={() => pressPadButton(Joypad.BUTTONS.LEFT)}
            onMouseUp={() => releasePadButton(Joypad.BUTTONS.LEFT)}
          >
            ←
          </button>
          <button className="w-12 h-12 bg-gray-400 rounded-md">○</button>
          <button
            className={getButtonClass('RIGHT')}
            onMouseDown={() => pressPadButton(Joypad.BUTTONS.RIGHT)}
            onMouseUp={() => releasePadButton(Joypad.BUTTONS.RIGHT)}
          >
            →
          </button>
        </div>

        <button
          className={getButtonClass('DOWN')}
          onMouseDown={() => pressPadButton(Joypad.BUTTONS.DOWN)}
          onMouseUp={() => releasePadButton(Joypad.BUTTONS.DOWN)}
        >
          ↓
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col items-center gap-2 p-3 bg-gray-100 rounded-lg">
        <button
          className="w-16 h-8 bg-gray-300 hover:bg-gray-400 rounded-md"
          onMouseDown={() => pressPadButton(Joypad.BUTTONS.START)}
          onMouseUp={() => releasePadButton(Joypad.BUTTONS.START)}
        >
          Start
        </button>

        <div className="flex gap-2">
          <button
            className={`w-12 h-12 rounded-md ${aPressed ? 'bg-blue-500 text-white' : 'bg-gray-300 hover:bg-gray-400'}`}
            onMouseDown={() => pressPadButton(Joypad.BUTTONS.A)}
            onMouseUp={() => releasePadButton(Joypad.BUTTONS.A)}
          >
            A
          </button>
          <button className="w-12 h-12 bg-gray-400 rounded-md">○</button>
          <button
            className={`w-12 h-12 rounded-md ${bPressed ? 'bg-blue-500 text-white' : 'bg-gray-300 hover:bg-gray-400'}`}
            onMouseDown={() => pressPadButton(Joypad.BUTTONS.B)}
            onMouseUp={() => releasePadButton(Joypad.BUTTONS.B)}
          >
            B
          </button>
        </div>

        <button
          className="w-16 h-8 bg-gray-300 hover:bg-gray-400 rounded-md"
          onMouseDown={() => pressPadButton(Joypad.BUTTONS.SELECT)}
          onMouseUp={() => releasePadButton(Joypad.BUTTONS.SELECT)}
        >
          Select
        </button>
      </div>
    </div>
  )
}

export default DirectionPad

// Joypad Config
const Joypad = {
  BUTTONS: {
    A: 0,
    B: 1,
    SELECT: 2,
    START: 3,
    UP: 4,
    DOWN: 5,
    LEFT: 6,
    RIGHT: 7,
  },
}

export { Joypad }
