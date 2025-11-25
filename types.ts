export enum FractalType {
  MANDELBROT = 'Mandelbrot',
  JULIA = 'Julia',
  BURNING_SHIP = 'Burning Ship'
}

export interface FractalState {
  center: { x: number; y: number };
  zoom: number;
  iterations: number;
  type: FractalType;
  colorOffset: number;
}

export interface GestureState {
  isDetected: boolean;
  panVector: { x: number; y: number }; // -1 to 1
  zoomAction: 'IN' | 'OUT' | 'IDLE';
  handCenter: { x: number; y: number }; // 0 to 1 (screen coords)
}

export interface GeminiAnalysis {
  title: string;
  description: string;
  mathFact: string;
}