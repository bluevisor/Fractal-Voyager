import React, { useEffect, useRef } from 'react';
import { FractalState, GestureState } from '../types';
import { VERTEX_SHADER, FRAGMENT_SHADER, FRACTAL_TYPE_MAP } from '../constants';

interface FractalCanvasProps {
  fractalState: FractalState;
  setFractalState: React.Dispatch<React.SetStateAction<FractalState>>;
  gestureState: React.MutableRefObject<GestureState>;
}

const FractalCanvas: React.FC<FractalCanvasProps> = ({ fractalState, setFractalState, gestureState }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animationRef = useRef<number>(0);
  
  // Store state in ref to avoid re-compiling shaders or re-binding too often,
  // but mostly to allow the animation loop to access the latest without closure staleness
  const stateRef = useRef(fractalState);

  useEffect(() => {
    stateRef.current = fractalState;
  }, [fractalState]);

  // Initialize WebGL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }
    glRef.current = gl;

    const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vert = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const frag = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);

    if (!vert || !frag) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }
    programRef.current = program;

    // Setup Quad Buffer
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Resize handler
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Render Loop & Physics
  useEffect(() => {
    const gl = glRef.current;
    const program = programRef.current;
    if (!gl || !program) return;

    const render = () => {
      const gesture = gestureState.current;
      const currentState = stateRef.current;

      // Physics Update
      let newZoom = currentState.zoom;
      let newCenter = { ...currentState.center };
      
      if (gesture.isDetected) {
        // Zoom Logic
        if (gesture.zoomAction === 'IN') {
          newZoom *= 1.02;
        } else if (gesture.zoomAction === 'OUT') {
          newZoom *= 0.98;
        }

        // Pan Logic
        // Calculate pan speed relative to zoom to keep movement feeling natural
        const panSpeed = 0.02 / newZoom; 
        if (Math.abs(gesture.panVector.x) > 0.1 || Math.abs(gesture.panVector.y) > 0.1) {
            newCenter.x += gesture.panVector.x * panSpeed;
            newCenter.y -= gesture.panVector.y * panSpeed; // Y is inverted in screen vs fractals often
        }
      }
      
      // Animate colors slightly always
      const newColorOffset = currentState.colorOffset + 0.002;

      // Update Local State Ref (for physics continuity in next frame)
      stateRef.current = {
        ...currentState,
        zoom: newZoom,
        center: newCenter,
        colorOffset: newColorOffset
      };

      // Sync back to React state periodically or on interaction stop? 
      // For performance, we might not setReactState every frame.
      // However, to keep UI updated, we probably should, or use a throttled update.
      // For this demo, setting state every frame might be heavy for React rendering the Overlay.
      // We will set the WebGL uniforms directly from `stateRef`.
      // We will use a separate requestAnimationFrame for React State updates if needed, 
      // or just let the Overlay read from a shared ref/callback.
      // *Decision*: Let's update React state every frame for simplicity, 
      // React 18 batching is good. If laggy, we decouple.
      setFractalState(stateRef.current);

      // Draw
      gl.useProgram(program);

      const locationResolution = gl.getUniformLocation(program, "u_resolution");
      const locationCenter = gl.getUniformLocation(program, "u_center");
      const locationZoom = gl.getUniformLocation(program, "u_zoom");
      const locationIterations = gl.getUniformLocation(program, "u_iterations");
      const locationType = gl.getUniformLocation(program, "u_type");
      const locationColor = gl.getUniformLocation(program, "u_color_offset");

      gl.uniform2f(locationResolution, gl.canvas.width, gl.canvas.height);
      gl.uniform2f(locationCenter, stateRef.current.center.x, stateRef.current.center.y);
      gl.uniform1f(locationZoom, stateRef.current.zoom);
      gl.uniform1i(locationIterations, stateRef.current.iterations);
      gl.uniform1i(locationType, FRACTAL_TYPE_MAP[stateRef.current.type]);
      gl.uniform1f(locationColor, stateRef.current.colorOffset);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationRef.current);
  }, [setFractalState, gestureState]); // Dependencies here are minimal as we use refs

  return <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0" />;
};

export default FractalCanvas;
