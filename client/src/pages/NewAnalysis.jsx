import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Sliders, 
  ShieldCheck, 
  ArrowRight, 
  HelpCircle,
  FileCheck,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import UploadDropzone from '../components/upload/UploadDropzone';
import Notification from '../components/common/Notification';
import { projectStore } from '../services/projectStore';
import { createProject } from '../services/api';

export default function NewAnalysis() {
  const navigate = useNavigate();
  const [filesList, setFilesList] = useState([]);

  const [analysisMode, setAnalysisMode] = useState('relative'); // best default for ordinary PNG/JPG uploads
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [referenceDemType, setReferenceDemType] = useState('copernicus');
  const [referenceDemFile, setReferenceDemFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileSelected = (newFile) => {
    setFilesList((prev) => {
      prev.forEach((file) => {
        if (file.objectUrl) URL.revokeObjectURL(file.objectUrl);
      });
      if (!projectName) {
        const defaultName = newFile.filename.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setProjectName(defaultName.charAt(0).toUpperCase() + defaultName.slice(1));
      }
      return [newFile];
    });
    setErrorMessage(null);
  };

  const handleClearImage = () => {
    setFilesList((prev) => {
      prev.forEach((file) => {
        if (file.objectUrl) URL.revokeObjectURL(file.objectUrl);
      });
      return [];
    });
  };

  const handleLoadSample = () => {
    const sample = projectStore.createSampleProject();
    navigate(`/workspace?id=${sample.id}`);
  };

  const activeFileInfo = filesList[0] || null;

  // Single Project Flow: Create project in MongoDB Atlas and open in Workspace
  const handleStartSingleAnalysis = async (e) => {
    if (e) e.preventDefault();
    if (!activeFileInfo) {
      setErrorMessage('Please select or drop a valid satellite image first.');
      return;
    }
    if (analysisMode === 'calibrated' && !referenceDemFile) {
      setErrorMessage('Calibrated mode requires a reference DEM GeoTIFF. Choose Relative Disparity for an uncalibrated result.');
      return;
    }

    setIsSubmitting(true);

    try {
      const backendProject = await createProject({
        imageFile: activeFileInfo.file,
        referenceDemFile: analysisMode === 'calibrated' ? referenceDemFile : null,
        name: projectName || activeFileInfo.filename.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
        description: projectDescription,
        mode: analysisMode,
      });

      const newProject = {
        id: backendProject.id,
        backendProjectId: backendProject.id,
        name: projectName || activeFileInfo.filename.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
        description: projectDescription,
        mode: analysisMode,
        createdAt: new Date().toISOString(),
        status: backendProject.status,
        stage: 'ready_for_inference',
        referenceDemType: analysisMode === 'calibrated' ? referenceDemType : null,
        referenceDemFilename: analysisMode === 'calibrated' ? referenceDemFile?.name || null : null,
        metadata: {
          filename: activeFileInfo.filename,
          extension: activeFileInfo.extension,
          fileSize: activeFileInfo.sizeBytes,
          formattedSize: activeFileInfo.formattedSize,
          width: activeFileInfo.width,
          height: activeFileInfo.height,
        },
        imageSrc: activeFileInfo.objectUrl,
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
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Create Terrain View</h1>
          <p className="text-sm text-slate-400 mt-1">
            Upload one satellite or aerial image to create an interactive 3D terrain model.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoadSample}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-cyan-300 bg-cyan-950/40 hover:bg-cyan-950/80 border border-cyan-800/60 transition-colors self-start md:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Try sample</span>
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

      <form onSubmit={handleStartSingleAnalysis} className="space-y-6">
        <ol className="grid grid-cols-3 gap-2 text-xs" aria-label="Analysis steps">
          {['1. Upload Imagery', '2. Choose Output', '3. Run Analysis'].map((label, index) => (
            <li
              key={label}
              className={`rounded-lg border px-3 py-2 font-medium ${
                index === 0 && filesList.length === 0
                  ? 'border-blue-500 bg-blue-950/40 text-blue-300'
                  : index === 1 && filesList.length > 0
                  ? 'border-blue-500 bg-blue-950/40 text-blue-300'
                  : 'border-geo-700/60 bg-geo-900/60 text-slate-400'
              }`}
            >
              {label}
            </li>
          ))}
        </ol>

        {/* Step 1: Upload a single image */}
        <div className="bg-geo-900/80 border border-geo-700/70 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-mono">
                1
              </span>
              <span>1. Satellite Imagery Ingestion</span>
            </div>

            {filesList.length > 0 && (
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2.5 py-0.5 rounded-full">
                Image ready
              </span>
            )}
          </div>

          {filesList.length === 0 ? (
            <UploadDropzone
              onFileSelected={handleFileSelected}
              onError={(err) => setErrorMessage(err)}
              isProcessing={isSubmitting}
            />
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-geo-700 bg-geo-950/60 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{activeFileInfo.filename}</p>
                <p className="mt-0.5 text-[11px] font-mono text-slate-400">{activeFileInfo.formattedSize} · {activeFileInfo.width} × {activeFileInfo.height} px</p>
              </div>
              <button type="button" onClick={handleClearImage} className="shrink-0 rounded-lg border border-geo-700 px-3 py-1.5 text-xs text-slate-300 hover:border-rose-500 hover:text-rose-300 transition-colors">
                Remove image
              </button>
            </div>
          )}
        </div>

        {/* Step 2: Choose Mode */}
        <div className="bg-geo-900/80 border border-geo-700/70 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-mono">
                2
              </span>
              <span>2. Choose Output Format</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Relative Disparity Mode */}
            <div
              onClick={() => setAnalysisMode('relative')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                analysisMode === 'relative'
                  ? 'bg-blue-950/40 border-blue-500 shadow-sm ring-1 ring-blue-500/50'
                  : 'bg-geo-850/60 border-geo-700 hover:border-slate-500'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">Relative depth (recommended)</span>
                </div>
                {analysisMode === 'relative' && <CheckCircle2 className="w-5 h-5 text-blue-400" aria-label="Selected" />}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Works with any satellite image (JPG, PNG, TIFF). Estimates depth disparity and constructs an interactive 3D terrain surface without requiring an external DEM.
              </p>
              <div className="mt-3 pt-2 border-t border-geo-700/40 flex items-center space-x-1.5 text-[10px] font-mono text-amber-400">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Ideal for monocular terrain analysis</span>
              </div>
            </div>

            {/* Calibrated Mode */}
            <div
              onClick={() => setAnalysisMode('calibrated')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                analysisMode === 'calibrated'
                  ? 'bg-blue-950/40 border-blue-500 shadow-sm ring-1 ring-blue-500/50'
                  : 'bg-geo-850/60 border-geo-700 hover:border-slate-500'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Metric elevation (advanced)</span>
                </div>
                {analysisMode === 'calibrated' && <CheckCircle2 className="w-5 h-5 text-blue-400" aria-label="Selected" />}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Calibrates disparity against an aligned Copernicus / SRTM GeoTIFF DEM to estimate physical elevation in metres.
              </p>
              <div className="mt-3 pt-2 border-t border-geo-700/40 flex items-center space-x-1.5 text-[10px] font-mono text-emerald-400">
                <FileCheck className="w-3.5 h-3.5" />
                <span>Requires reference DEM GeoTIFF</span>
              </div>
            </div>
          </div>

          {/* Calibrated Options Subpanel */}
          {analysisMode === 'calibrated' && (
            <div className="bg-geo-950 border border-geo-700 rounded-lg p-4 space-y-3 mt-2">
              <label className="text-xs font-medium text-slate-300 block">
                Reference Elevation Baseline
              </label>
              <select
                value={referenceDemType}
                onChange={(e) => setReferenceDemType(e.target.value)}
                className="w-full bg-geo-900 text-slate-200 text-xs font-mono rounded-lg px-3 py-2 border border-geo-700 focus:outline-none focus:border-blue-500"
              >
                <option value="copernicus">Copernicus GLO-30 Digital Elevation Model (30m)</option>
                <option value="srtm">NASA Shuttle Radar Topography Mission (SRTM 30m)</option>
                <option value="alos">ALOS World 3D (AW3D30 30m)</option>
                <option value="gcp">Survey Ground Control Points (GCP Vector Table)</option>
              </select>
              <label className="block text-xs font-medium text-slate-300 pt-2">
                Reference DEM GeoTIFF <span className="text-rose-400">(required for metric output)</span>
                <input
                  type="file"
                  accept=".tif,.tiff,.geotiff"
                  onChange={(e) => setReferenceDemFile(e.target.files?.[0] || null)}
                  className="mt-2 block w-full text-xs text-slate-300 file:mr-3 file:rounded file:border-0 file:bg-geo-700 file:px-3 file:py-1.5 file:text-xs file:text-white"
                />
              </label>
              <p className="text-[11px] text-amber-400">The input image must also be a GeoTIFF with CRS and geotransform.</p>
            </div>
          )}
        </div>

        {/* Step 3: Project Metadata */}
        <div className="bg-geo-900/80 border border-geo-700/70 rounded-xl p-6 space-y-4">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-mono">
              3
            </span>
            <span>3. Project Metadata</span>
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
                placeholder="e.g., Satellite Survey - Northern Mountain Range"
                className="w-full bg-white text-slate-900 placeholder-slate-400 text-sm rounded-lg px-3 py-2.5 border border-slate-300 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Description & Notes (persisted to MongoDB)
              </label>
              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Optional notes regarding acquisition sensor, latitude/longitude, or target terrain features..."
                rows={2}
                className="w-full bg-white text-slate-900 placeholder-slate-400 text-sm rounded-lg px-3 py-2 border border-slate-300 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Submission Actions */}
        <div className="sticky bottom-3 z-10 bg-geo-900/95 backdrop-blur border border-geo-700 rounded-xl px-4 py-3 flex items-center justify-between shadow-2xl">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center space-x-3">
            <button
              type="submit"
              disabled={filesList.length === 0 || isSubmitting || (analysisMode === 'calibrated' && !referenceDemFile)}
              className={`inline-flex items-center space-x-2 px-6 py-2.5 rounded-lg text-xs font-semibold text-white shadow-lg transition-all ${
                filesList.length === 0 || isSubmitting
                  ? 'bg-geo-800 text-slate-500 cursor-not-allowed border border-geo-700/50'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/40'
              }`}
            >
              <span>{isSubmitting ? 'Creating Project…' : 'Run Analysis in Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
