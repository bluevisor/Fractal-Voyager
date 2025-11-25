import React, { useEffect, useRef } from 'react';
import { GestureState } from '../types';

interface DebugCursorProps {
  gestureState: React.MutableRefObject<GestureState>;
}

const DebugCursor: React.FC<DebugCursorProps> = ({ gestureState }) => {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationFrameId: number;

    const update = () => {
      const state = gestureState.current;
      if (cursorRef.current) {
        if (state.isDetected) {
            // Map normalized coordinates (0-1) to screen coordinates
            // We invert X (1 - x) because the camera feed is usually mirrored for natural interaction
            const x = (1 - state.handCenter.x) * window.innerWidth;
            const y = state.handCenter.y * window.innerHeight;
            
            cursorRef.current.style.transform = `translate(${x}px, ${y}px)`;
            cursorRef.current.style.opacity = '1';
            
            // Visual feedback for gestures
            let color = 'rgba(6, 182, 212, 0.5)'; // Default Cyan (Idle)
            let scale = 1;
            let borderColor = 'white';

            if (state.zoomAction === 'IN') {
                color = 'rgba(0, 255, 0, 0.5)'; // Green (Zoom In - Open Palm)
                scale = 1.5;
                borderColor = '#4ade80';
            } else if (state.zoomAction === 'OUT') {
                color = 'rgba(255, 0, 0, 0.5)'; // Red (Zoom Out - Fist)
                scale = 0.5;
                borderColor = '#f87171';
            }
            
            cursorRef.current.style.backgroundColor = color;
            cursorRef.current.style.borderColor = borderColor;
            cursorRef.current.style.scale = scale.toString();
        } else {
            cursorRef.current.style.opacity = '0';
        }
      }
      animationFrameId = requestAnimationFrame(update);
    };
    
    update();
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [gestureState]);

  return (
    <div 
        ref={cursorRef} 
        className="fixed top-0 left-0 w-8 h-8 rounded-full pointer-events-none z-50 transition-colors duration-200 ease-linear"
        style={{ 
            marginTop: -16, 
            marginLeft: -16, 
            boxShadow: '0 0 15px currentColor',
            borderWidth: '2px',
            borderStyle: 'solid'
        }}
    >
        {/* Crosshair lines */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-0.5 bg-current opacity-50"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-12 bg-current opacity-50"></div>
    </div>
  );
};

export default DebugCursor;