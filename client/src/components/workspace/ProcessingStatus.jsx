import { CheckCircle2, Clock, Loader2 } from 'lucide-react';

export default function ProcessingStatus({ currentStep = 1, isProcessing = false, statusText = 'Ready' }) {
  const steps = [
    { id: 1, label: 'Image Ingestion', desc: 'Format verified' },
    { id: 2, label: 'Preprocessing', desc: 'Contrast & tiling' },
    { id: 3, label: 'TensorFlow Inference', desc: 'Relative disparity [0, 1]' },
    { id: 4, label: 'Elevation Calibration', desc: 'Metric DEM regression' },
    { id: 5, label: '3D Terrain Mesh', desc: 'WebGL displacement' },
  ];

  return (
    <div className="bg-geo-850 border border-geo-700/60 rounded-xl p-4 shadow-geo-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Pipeline Execution Flow
          </span>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
            {statusText}
          </span>
        </div>

        {isProcessing && (
          <div className="flex items-center space-x-1.5 text-xs text-blue-400 font-mono">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Processing pipeline...</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {steps.map((step) => {
          const isDone = currentStep > step.id;
          const isActive = currentStep === step.id;

          return (
            <div
              key={step.id}
              className={`p-3 rounded-lg border transition-all ${
                isActive
                  ? 'bg-blue-950/40 border-blue-500/60 shadow-geo-glow'
                  : isDone
                  ? 'bg-geo-900/60 border-emerald-500/30'
                  : 'bg-geo-900/30 border-geo-700/30 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  0{step.id}
                </span>
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : isActive ? (
                  <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                )}
              </div>
              <p className={`text-xs font-semibold leading-tight ${isActive ? 'text-white' : 'text-slate-300'}`}>
                {step.label}
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5 leading-tight">
                {step.desc}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
