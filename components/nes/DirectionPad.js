import React, { useCallback } from 'react';
import { Controller } from 'jsnes';

const DirectionPad = ({
  aPressed,
  bPressed,
  uPressed,
  dPressed,
  rPressed,
  lPressed,
  onPressButton,
  onReleaseButton,
}) => {
  const pressPadButton = useCallback(
    button => {
      onPressButton?.(button);
    },
    [onPressButton]
  );

  const releasePadButton = useCallback(
    button => {
      onReleaseButton?.(button);
    },
    [onReleaseButton]
  );

  return (
    <div className="flex gap-5 items-start">
      {/* Directional Pad */}
      <div className="flex flex-col items-center gap-2 p-3 bg-gray-100 rounded-lg">
        <button
          className={`w-12 h-12 rounded-md text-lg font-bold transition-colors ${
            uPressed ? 'bg-blue-500 text-white' : 'bg-gray-300 hover:bg-gray-400'
          }`}
          onMouseDown={() => pressPadButton(Controller.BUTTON_UP)}
          onMouseUp={() => releasePadButton(Controller.BUTTON_UP)}
        >
          ↑
        </button>

        <div className="flex gap-2">
          <button
            className={`w-12 h-12 rounded-md text-lg font-bold transition-colors ${
              lPressed ? 'bg-blue-500 text-white' : 'bg-gray-300 hover:bg-gray-400'
            }`}
            onMouseDown={() => pressPadButton(Controller.BUTTON_LEFT)}
            onMouseUp={() => releasePadButton(Controller.BUTTON_LEFT)}
          >
            ←
          </button>
          <button className="w-12 h-12 bg-gray-400 rounded-md">○</button>
          <button
            className={`w-12 h-12 rounded-md text-lg font-bold transition-colors ${
              rPressed ? 'bg-blue-500 text-white' : 'bg-gray-300 hover:bg-gray-400'
            }`}
            onMouseDown={() => pressPadButton(Controller.BUTTON_RIGHT)}
            onMouseUp={() => releasePadButton(Controller.BUTTON_RIGHT)}
          >
            →
          </button>
        </div>

        <button
          className={`w-12 h-12 rounded-md text-lg font-bold transition-colors ${
            dPressed ? 'bg-blue-500 text-white' : 'bg-gray-300 hover:bg-gray-400'
          }`}
          onMouseDown={() => pressPadButton(Controller.BUTTON_DOWN)}
          onMouseUp={() => releasePadButton(Controller.BUTTON_DOWN)}
        >
          ↓
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col items-center gap-2 p-3 bg-gray-100 rounded-lg">
        <button
          className="w-16 h-8 bg-gray-300 hover:bg-gray-400 rounded-md"
          onMouseDown={() => pressPadButton(Controller.BUTTON_START)}
          onMouseUp={() => releasePadButton(Controller.BUTTON_START)}
        >
          Start
        </button>

        <div className="flex gap-2">
          <button
            className={`w-12 h-12 rounded-md ${aPressed ? 'bg-blue-500 text-white' : 'bg-gray-300 hover:bg-gray-400'}`}
            onMouseDown={() => pressPadButton(Controller.BUTTON_A)}
            onMouseUp={() => releasePadButton(Controller.BUTTON_A)}
          >
            A
          </button>
          <button className="w-12 h-12 bg-gray-400 rounded-md">○</button>
          <button
            className={`w-12 h-12 rounded-md ${bPressed ? 'bg-blue-500 text-white' : 'bg-gray-300 hover:bg-gray-400'}`}
            onMouseDown={() => pressPadButton(Controller.BUTTON_B)}
            onMouseUp={() => releasePadButton(Controller.BUTTON_B)}
          >
            B
          </button>
        </div>

        <button
          className="w-16 h-8 bg-gray-300 hover:bg-gray-400 rounded-md"
          onMouseDown={() => pressPadButton(Controller.BUTTON_SELECT)}
          onMouseUp={() => releasePadButton(Controller.BUTTON_BUTTON_SELECT)}
        >
          Select
        </button>
      </div>
    </div>
  );
};

export default DirectionPad;
