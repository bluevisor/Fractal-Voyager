import React, { useRef, useState } from 'react';
import FractalCanvas from './components/FractalCanvas';
import GestureControl from './components/GestureControl';
import Overlay from './components/Overlay';
import DebugCursor from './components/DebugCursor';
import { FractalState, GestureState, FractalType } from './types';
import { DEFAULT_FRACTAL_STATE } from './constants';

const App: React.FC = () => {
  const [fractalState, setFractalState] = useState<FractalState>(DEFAULT_FRACTAL_STATE);
  
  // Gesture state is mutable ref to avoid React Render Loop lag for high-frequency updates
  const gestureState = useRef<GestureState>({
    isDetected: false,
    panVector: { x: 0, y: 0 },
    zoomAction: 'IDLE',
    handCenter: { x: 0.5, y: 0.5 }
  });

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <FractalCanvas 
        fractalState={fractalState} 
        setFractalState={setFractalState}
        gestureState={gestureState} 
      />
      
      <GestureControl gestureState={gestureState} />
      
      <DebugCursor gestureState={gestureState} />
      
      <Overlay 
        fractalState={fractalState} 
        setFractalState={setFractalState} 
      />
      
      {/* Scanline Effect Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 bg-[length:100%_2px,3px_100%] opacity-20"></div>
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.9)] z-20"></div>
    </div>
  );
};

export default App;