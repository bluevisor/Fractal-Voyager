import React, { useState } from 'react';
import { FractalState, FractalType, GeminiAnalysis } from '../types';
import { analyzeFractalView } from '../services/geminiService';

interface OverlayProps {
  fractalState: FractalState;
  setFractalState: React.Dispatch<React.SetStateAction<FractalState>>;
}

const Overlay: React.FC<OverlayProps> = ({ fractalState, setFractalState }) => {
  const [analysis, setAnalysis] = useState<GeminiAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalysis = async () => {
    setAnalyzing(true);
    const result = await analyzeFractalView(fractalState);
    setAnalysis(result);
    setAnalyzing(false);
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-10">
      {/* Header */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-widest drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]">
            FRACTAL VOYAGER
          </h1>
          <div className="text-cyan-400 text-sm tracking-wider mt-1 opacity-80">
            COORDINATES: {fractalState.center.x.toFixed(6)} : {fractalState.center.y.toFixed(6)}
          </div>
          <div className="text-cyan-400 text-sm tracking-wider opacity-80">
            ZOOM: {fractalState.zoom.toExponential(2)}
          </div>
        </div>

        <div className="flex flex-col gap-2">
            {Object.values(FractalType).map(type => (
                <button
                    key={type}
                    onClick={() => setFractalState(prev => ({ ...prev, type }))}
                    className={`px-4 py-1 border border-cyan-500/50 text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                        fractalState.type === type 
                        ? 'bg-cyan-500/20 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.5)]' 
                        : 'bg-black/40 text-cyan-700 hover:bg-cyan-900/30'
                    }`}
                >
                    {type}
                </button>
            ))}
        </div>
      </div>

      {/* Center Analysis Modal */}
      {analysis && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 bg-black/80 border border-cyan-500/50 backdrop-blur-md p-6 rounded-lg shadow-[0_0_50px_rgba(6,182,212,0.2)] pointer-events-auto animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl text-white font-bold">{analysis.title}</h2>
                <button onClick={() => setAnalysis(null)} className="text-cyan-500 hover:text-white">✕</button>
            </div>
            <p className="text-cyan-100 text-sm leading-relaxed mb-4 border-l-2 border-cyan-500 pl-3">
                {analysis.description}
            </p>
            <div className="bg-cyan-900/20 p-3 rounded border border-cyan-500/20">
                <span className="text-cyan-400 text-xs font-bold block mb-1">DATA NODE:</span>
                <p className="text-cyan-200 text-xs">{analysis.mathFact}</p>
            </div>
        </div>
      )}

      {/* Footer / Controls */}
      <div className="flex items-end justify-between pointer-events-auto">
        <div className="flex gap-4">
             <button
                onClick={handleAnalysis}
                disabled={analyzing}
                className="group relative px-6 py-2 bg-black/60 border border-cyan-500 text-cyan-400 uppercase font-bold tracking-widest text-sm hover:bg-cyan-500/20 transition-all overflow-hidden"
             >
                 {analyzing ? (
                     <span className="animate-pulse">Scanning...</span>
                 ) : (
                     <>
                        <span className="relative z-10">Analyze Sector</span>
                        <div className="absolute inset-0 bg-cyan-500/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
                     </>
                 )}
             </button>
        </div>

        <div className="text-right pointer-events-none">
            <div className="text-cyan-600 text-[10px] uppercase tracking-widest mb-1">Control Systems</div>
            <div className="flex flex-col items-end gap-1 text-cyan-300/70 text-xs">
                <div className="flex items-center gap-2">
                    <span>PAN</span> <div className="w-12 h-px bg-cyan-800"></div> <span>MOVE HAND</span>
                </div>
                <div className="flex items-center gap-2">
                    <span>ZOOM IN</span> <div className="w-12 h-px bg-cyan-800"></div> <span>OPEN PALM</span>
                </div>
                <div className="flex items-center gap-2">
                    <span>ZOOM OUT</span> <div className="w-12 h-px bg-cyan-800"></div> <span>CLOSE FIST</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Overlay;
