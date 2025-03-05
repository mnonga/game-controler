import { useCallback } from "react";

function GamePad({ nes }) {
  const pressPadButton = useCallback(
    (button) => {
      if (!nes) return;
      nes.pad1.pressButton(button);
    },
    [nes]
  );

  const releasePadButton = useCallback(
    (button) => {
      if (!nes) return;
      nes.pad1.releaseButton(button);
    },
    [nes]
  );

  return (
    <div>
      <table>
        <tbody>
          <tr>
            <td></td>
            <td>
              <button
                id="pad1_4"
                onMouseDown={() => pressPadButton(Joypad.BUTTONS.UP)}
                onMouseUp={() => releasePadButton(Joypad.BUTTONS.UP)}
              >
                U
              </button>
            </td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <td>
              <button
                id="pad1_6"
                onMouseDown={() => pressPadButton(Joypad.BUTTONS.LEFT)}
                onMouseUp={() => releasePadButton(Joypad.BUTTONS.LEFT)}
              >
                L
              </button>
            </td>
            <td></td>
            <td>
              <button
                id="pad1_7"
                onMouseDown={() => pressPadButton(Joypad.BUTTONS.RIGHT)}
                onMouseUp={() => releasePadButton(Joypad.BUTTONS.RIGHT)}
              >
                R
              </button>
            </td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <td></td>
            <td>
              <button
                id="pad1_5"
                onMouseDown={() => pressPadButton(Joypad.BUTTONS.DOWN)}
                onMouseUp={() => releasePadButton(Joypad.BUTTONS.DOWN)}
              >
                D
              </button>
            </td>
            <td></td>
            <td>
              <button
                id="pad1_2"
                onMouseDown={() => pressPadButton(Joypad.BUTTONS.SELECT)}
                onMouseUp={() => releasePadButton(Joypad.BUTTONS.SELECT)}
              >
                SELECT
              </button>
            </td>
            <td>
              <button
                id="pad1_3"
                onMouseDown={() => pressPadButton(Joypad.BUTTONS.START)}
                onMouseUp={() => releasePadButton(Joypad.BUTTONS.START)}
              >
                START
              </button>
            </td>
            <td>
              <button
                id="pad1_1"
                onMouseDown={() => pressPadButton(Joypad.BUTTONS.B)}
                onMouseUp={() => releasePadButton(Joypad.BUTTONS.B)}
              >
                B
              </button>
            </td>
            <td>
              <button
                id="pad1_0"
                onMouseDown={() => pressPadButton(Joypad.BUTTONS.A)}
                onMouseUp={() => releasePadButton(Joypad.BUTTONS.A)}
              >
                A
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default GamePad;

// le package ne l'a pas exporté, mais dans le web ca marche
const Joypad = {};

Joypad.BUTTONS = {
  A:      0,
  B:      1,
  SELECT: 2,
  START:  3,
  UP:     4,
  DOWN:   5,
  LEFT:   6,
  RIGHT:  7
};