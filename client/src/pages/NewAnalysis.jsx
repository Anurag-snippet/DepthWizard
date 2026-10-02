import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sliders, 
  ShieldCheck, 
  ArrowRight, 
  HelpCircle,
  FileCheck,
  Sparkles
} from 'lucide-react';
import UploadDropzone from '../components/upload/UploadDropzone';
import ImagePreview from '../components/upload/ImagePreview';
import Notification from '../components/common/Notification';
import { projectStore } from '../services/projectStore';

export default function NewAnalysis() {
  const navigate = useNavigate();

  const [fileInfo, setFileInfo] = useState(null);
  const [analysisMode, setAnalysisMode] = useState('calibrated'); // 'relative' | 'calibrated'
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [referenceDemType, setReferenceDemType] = useState('copernicus');
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileSelected = (info) => {
    setFileInfo(info);
    setErrorMessage(null);
    if (!projectName) {
      const defaultName = info.filename.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setProjectName(defaultName.charAt(0).toUpperCase() + defaultName.slice(1));
    }
  };

  const handleClearFile = () => {
    setFileInfo(null);
  };

  const handleLoadSample = () => {
    const sample = projectStore.createSampleProject();
    navigate(`/workspace?id=${sample.id}`);
  };

  const handleStartAnalysis = (e) => {
    e.preventDefault();
    if (!fileInfo) {
      setErrorMessage('Please select or drop a valid satellite image first.');
      return;
    }

    setIsSubmitting(true);

    try {
      const newProject = {
        id: `proj_${Date.now()}`,
        name: projectName || 'Untitled Satellite Analysis',
        description: projectDescription,
        mode: analysisMode,
        createdAt: new Date().toISOString(),
        status: 'ingested',
        stage: 'ready_for_inference',
        referenceDemType: analysisMode === 'calibrated' ? referenceDemType : null,
        metadata: {
          filename: fileInfo.filename,
          extension: fileInfo.extension,
          fileSize: fileInfo.sizeBytes,
          formattedSize: fileInfo.formattedSize,
          width: fileInfo.width,
          height: fileInfo.height,
        },
        imageSrc: fileInfo.dataUrl,
        depthMapSrc: null,
        elevationMapSrc: null,
      };

      const saved = projectStore.saveProject(newProject);
      navigate(`/workspace?id=${saved.id}`);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to initialize project analysis.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Initialize New Terrain Analysis</h1>
          <p className="text-xs text-slate-400 mt-1">
            Upload a single-view optical crop and select elevation calibration constraints.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoadSample}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-cyan-300 bg-cyan-950/40 hover:bg-cyan-950/80 border border-cyan-800/60 transition-colors self-start md:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Load Demo Sample Dataset</span>
        </button>
      </div>

      {errorMessage && (
        <Notification
          type="error"
          title="Validation Warning"
          message={errorMessage}
          onClose={() => setErrorMessage(null)}
        />
      )}

      <form onSubmit={handleStartAnalysis} className="space-y-6">
        {/* Step 1: Upload Card */}
        <div className="bg-geo-900/80 border border-geo-700/70 rounded-xl p-6 space-y-4">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-mono">
              1
            </span>
            <span>Satellite / Aerial Imagery Ingestion</span>
          </div>

          {!fileInfo ? (
            <UploadDropzone
              onFileSelected={handleFileSelected}
              onError={(err) => setErrorMessage(err)}
              isProcessing={isSubmitting}
            />
          ) : (
            <ImagePreview fileInfo={fileInfo} onClear={handleClearFile} />
          )}
        </div>

        {/* Step 2: Mode Selection (Strict SIH Scientific Requirement) */}
        <div className="bg-geo-900/80 border border-geo-700/70 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-mono">
                2
              </span>
              <span>Elevation Mode Selection</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
              SIH Metric Compliance Guard
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Calibrated Mode */}
            <div
              onClick={() => setAnalysisMode('calibrated')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                analysisMode === 'calibrated'
                  ? 'bg-blue-950/30 border-blue-500 shadow-geo-glow'
                  : 'bg-geo-850/60 border-geo-700/60 hover:border-slate-500'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Calibrated Metric Elevation</span>
                </div>
                <input
                  type="radio"
                  name="analysisMode"
                  checked={analysisMode === 'calibrated'}
                  onChange={() => setAnalysisMode('calibrated')}
                  className="text-blue-600 focus:ring-blue-500"
                />
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Scales relative monocular disparity into true physical heights in metres using reference elevation bounds (Copernicus / SRTM DEM or GCPs).
              </p>
              <div className="mt-3 pt-2 border-t border-geo-700/40 flex items-center space-x-1.5 text-[10px] font-mono text-emerald-400">
                <FileCheck className="w-3.5 h-3.5" />
                <span>Provides metric accuracy (metres AMSL)</span>
              </div>
            </div>

            {/* Relative Disparity Mode */}
            <div
              onClick={() => setAnalysisMode('relative')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                analysisMode === 'relative'
                  ? 'bg-blue-950/30 border-blue-500 shadow-geo-glow'
                  : 'bg-geo-850/60 border-geo-700/60 hover:border-slate-500'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">Relative Disparity Only</span>
                </div>
                <input
                  type="radio"
                  name="analysisMode"
                  checked={analysisMode === 'relative'}
                  onChange={() => setAnalysisMode('relative')}
                  className="text-blue-600 focus:ring-blue-500"
                />
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Raw output from the monocular neural network. Produces a normalized $[0, 1]$ relief surface without absolute metre scaling.
              </p>
              <div className="mt-3 pt-2 border-t border-geo-700/40 flex items-center space-x-1.5 text-[10px] font-mono text-amber-400">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Unitless gradient (Never presented as metres)</span>
              </div>
            </div>
          </div>

          {/* Calibrated Options Subpanel */}
          {analysisMode === 'calibrated' && (
            <div className="bg-geo-850/80 border border-geo-700/60 rounded-lg p-4 space-y-3 mt-2">
              <label className="text-xs font-medium text-slate-300 block">
                Reference Elevation Baseline
              </label>
              <select
                value={referenceDemType}
                onChange={(e) => setReferenceDemType(e.target.value)}
                className="w-full bg-geo-950 text-slate-200 text-xs font-mono rounded-lg px-3 py-2 border border-geo-700 focus:outline-none focus:border-blue-500"
              >
                <option value="copernicus">Copernicus GLO-30 Digital Elevation Model (30m)</option>
                <option value="srtm">NASA Shuttle Radar Topography Mission (SRTM 30m)</option>
                <option value="alos">ALOS World 3D (AW3D30 30m)</option>
                <option value="gcp">Survey Ground Control Points (GCP Vector Table)</option>
              </select>
            </div>
          )}
        </div>

        {/* Step 3: Project Metadata */}
        <div className="bg-geo-900/80 border border-geo-700/70 rounded-xl p-6 space-y-4">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 uppercase tracking-wider">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-mono">
              3
            </span>
            <span>Project Information</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., Mount Rainier Aerial Survey"
                className="w-full bg-geo-950 text-white text-xs rounded-lg px-3 py-2.5 border border-geo-700 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Description & Notes
              </label>
              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Optional notes regarding acquisition sensor, latitude/longitude, or target terrain features..."
                rows={2}
                className="w-full bg-geo-950 text-white text-xs rounded-lg px-3 py-2 border border-geo-700 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Submission Actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={!fileInfo || isSubmitting}
            className={`inline-flex items-center space-x-2 px-6 py-2.5 rounded-lg text-xs font-semibold text-white shadow-lg transition-all ${
              !fileInfo || isSubmitting
                ? 'bg-geo-800 text-slate-500 cursor-not-allowed border border-geo-700/50'
                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/40'
            }`}
          >
            <span>Proceed to Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
