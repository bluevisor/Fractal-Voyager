import React, { useEffect, useRef, useState } from 'react';
import { GestureState } from '../types';

interface GestureControlProps {
  gestureState: React.MutableRefObject<GestureState>;
}

// Types for MediaPipe Hands (loaded via global script)
interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

interface Results {
  multiHandLandmarks: HandLandmark[][];
}

const GestureControl: React.FC<GestureControlProps> = ({ gestureState }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!videoRef.current) return;

    // Access the global Hands class loaded via script tag
    const Hands = (window as any).Hands;
    if (!Hands) {
      console.error("MediaPipe Hands library not loaded.");
      setLoading(false);
      return;
    }

    const hands = new Hands({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults(onResults);

    let animationFrameId: number;
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Ensure video plays to trigger data flow
          await videoRef.current.play();
          setCameraActive(true);
          setLoading(false);
          predict();
        }
      } catch (err) {
        console.error("Error accessing camera:", err);
        setLoading(false);
      }
    };

    const predict = async () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        await hands.send({ image: videoRef.current });
      }
      animationFrameId = requestAnimationFrame(predict);
    };

    startCamera();

    return () => {
      cancelAnimationFrame(animationFrameId);
      hands.close();
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const drawSkeleton = (ctx: CanvasRenderingContext2D, landmarks: HandLandmark[]) => {
      // Finger Connections
      const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4],          // Thumb
        [0, 5], [5, 6], [6, 7], [7, 8],          // Index
        [0, 9], [9, 10], [10, 11], [11, 12],     // Middle
        [0, 13], [13, 14], [14, 15], [15, 16],   // Ring
        [0, 17], [17, 18], [18, 19], [19, 20],   // Pinky
        [5, 9], [9, 13], [13, 17]                // Palm
      ];

      const width = ctx.canvas.width;
      const height = ctx.canvas.height;

      // Draw Lines
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#00FFFF'; // Cyan
      ctx.beginPath();
      for (const [start, end] of connections) {
          const p1 = landmarks[start];
          const p2 = landmarks[end];
          ctx.moveTo(p1.x * width, p1.y * height);
          ctx.lineTo(p2.x * width, p2.y * height);
      }
      ctx.stroke();

      // Draw Joints
      ctx.fillStyle = '#FFFFFF';
      for (const lm of landmarks) {
          ctx.beginPath();
          ctx.arc(lm.x * width, lm.y * height, 3, 0, 2 * Math.PI);
          ctx.fill();
      }
  };

  const onResults = (results: Results) => {
    // 1. Draw Debug info
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Match dimensions
            if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
            if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            if (results.multiHandLandmarks) {
                for (const landmarks of results.multiHandLandmarks) {
                    drawSkeleton(ctx, landmarks);
                }
            }
        }
    }

    // 2. Process Logic
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];

      // Calculate Center (using Wrist (0) and Middle Finger MCP (9) average for stability)
      const cx = landmarks[9].x;
      const cy = landmarks[9].y;

      // Detect Open Palm vs Fist (Zoom)
      const isFingerOpen = (tipIdx: number, pipIdx: number) => {
        const dTip = dist(landmarks[tipIdx], landmarks[0]);
        const dPip = dist(landmarks[pipIdx], landmarks[0]);
        return dTip > dPip;
      };

      const indexOpen = isFingerOpen(8, 6);
      const middleOpen = isFingerOpen(12, 10);
      const ringOpen = isFingerOpen(16, 14);
      const pinkyOpen = isFingerOpen(20, 18);

      let zoomAction: 'IN' | 'OUT' | 'IDLE' = 'IDLE';
      // Strict Fist: All closed
      if (!indexOpen && !middleOpen && !ringOpen && !pinkyOpen) {
        zoomAction = 'OUT'; 
      } 
      // Strict Open: All open
      else if (indexOpen && middleOpen && ringOpen && pinkyOpen) {
        zoomAction = 'IN'; 
      } else {
        zoomAction = 'IDLE'; 
      }

      // Calculate Pan Vector
      // Center of screen is 0.5, 0.5. Map to -1 to 1.
      let dx = (cx - 0.5) * 2; 
      let dy = (cy - 0.5) * 2;

      const deadzone = 0.15; // Slightly reduced deadzone for better control
      if (Math.abs(dx) < deadzone) dx = 0;
      else dx = Math.sign(dx) * (Math.abs(dx) - deadzone);
      
      if (Math.abs(dy) < deadzone) dy = 0;
      else dy = Math.sign(dy) * (Math.abs(dy) - deadzone);

      gestureState.current = {
        isDetected: true,
        panVector: { x: dx, y: dy },
        zoomAction,
        handCenter: { x: cx, y: cy }
      };

    } else {
      gestureState.current = {
        ...gestureState.current,
        isDetected: false,
        zoomAction: 'IDLE',
        panVector: {x:0, y:0}
      };
    }
  };

  const dist = (p1: {x:number, y:number}, p2: {x:number, y:number}) => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  };

  return (
    <div className="absolute bottom-4 right-4 w-48 h-36 bg-black/50 border border-cyan-500/50 rounded-lg overflow-hidden shadow-lg z-50">
       <video 
         ref={videoRef}
         className="absolute top-0 left-0 w-full h-full object-cover transform -scale-x-100"
         playsInline
         muted
         autoPlay
         style={{ display: loading ? 'none' : 'block' }}
       />
       <canvas 
         ref={canvasRef}
         className="absolute top-0 left-0 w-full h-full object-cover transform -scale-x-100 pointer-events-none"
       />
       {loading && (
           <div className="flex items-center justify-center h-full text-cyan-400 text-xs animate-pulse">
               Initializing Vision...
           </div>
       )}
       <div className="absolute bottom-1 left-1 text-[10px] text-cyan-400 bg-black/60 px-1 rounded z-10">
           {cameraActive ? 'SYSTEM ONLINE' : 'WAITING FOR INPUT'}
       </div>
    </div>
  );
};

export default GestureControl;