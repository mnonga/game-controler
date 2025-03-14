import { useState, useRef, useCallback } from 'react';
import throttle from 'lodash/throttle';
import { getDistance } from '../utils';

export function useHandDirection({ timeMin = 50, timeMax = 300, threshold = 10 } = {}) {
  const [direction, setDirection] = useState(null);
  const [previousPosition, setPreviousPosition] = useState({ x: null, y: null });
  const lastPosition = useRef({ x: null, y: null, time: null, lastDir: null });

  const reset = () => {
    setPreviousPosition({ x: null, y: null });
    setDirection(null);
    lastPosition.current = { x: null, y: null, time: null, lastDir: null };
  };

  const updatePosition = useCallback(
    throttle(({ x, y }) => {
      const now = performance.now();

      if (x == null && y == null) {
        return reset();
      }

      if (lastPosition.current.x !== null) {
        const distance = getDistance({ x, y }, lastPosition.current);
        const dx = x - lastPosition.current.x;
        const dy = y - lastPosition.current.y;
        const dt = now - lastPosition.current.time;

        if (distance >= threshold) {
          //if (dt > timeMin && dt < timeMax) {
          let newDirection = null;

          if (Math.abs(dy) > Math.abs(dx)) {
            newDirection = dy > 0 ? 'down' : 'up';
          } else {
            newDirection = dx > 0 ? 'left' : 'right';
          }

          // 🔥 Annulation si le mouvement est l'inverse du précédent
          const opposite = { left: 'right', right: 'left', up: 'down', down: 'up' };
          if (newDirection === lastPosition.current.lastDir) {
            //if (newDirection === opposite[lastPosition.current.lastDir]) {
            newDirection = null;
          }

          setDirection(newDirection);
          lastPosition.current.lastDir = newDirection;
        }

        // Mise à jour de l'ancienne position pour le tracé
        setPreviousPosition({ x: lastPosition.current.x, y: lastPosition.current.y });
      }

      lastPosition.current = { x, y, time: now, lastDir: lastPosition.current.lastDir };
    }, timeMax),
    []
  );

  return { direction, previousPosition, updatePosition, reset };
}
