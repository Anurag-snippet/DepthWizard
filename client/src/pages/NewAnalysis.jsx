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
import ImagePreview from '../components/upload/ImagePreview';
import Notification from '../components/common/Notification';
import { projectStore } from '../services/projectStore';
import { createProject } from '../services/api';

export default function NewAnalysis() {
  const navigate = useNavigate();

  const [fileInfo, setFileInfo] = useState(null);
  const [analysisMode, setAnalysisMode] = useState('relative'); // best default for ordinary PNG/JPG uploads
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [referenceDemType, setReferenceDemType] = useState('copernicus');
  const [referenceDemFile, setReferenceDemFile] = useState(null);
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

  const handleStartAnalysis = async (e) => {
    e.preventDefault();
    if (!fileInfo) {
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
        imageFile: fileInfo.file,
        referenceDemFile: analysisMode === 'calibrated' ? referenceDemFile : null,
        name: projectName || 'Untitled Satellite Analysis',
        description: projectDescription,
      });
      const newProject = {
        id: backendProject.id,
        backendProjectId: backendProject.id,
        name: projectName || 'Untitled Satellite Analysis',
        description: projectDescription,
        mode: analysisMode,
        createdAt: new Date().toISOString(),
        status: backendProject.status,
        stage: 'ready_for_inference',
        referenceDemType: analysisMode === 'calibrated' ? referenceDemType : null,
        referenceDemFilename: analysisMode === 'calibrated' ? referenceDemFile?.name || null : null,
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
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create a terrain view</h1>
          <p className="text-sm text-slate-500 mt-1">Upload a satellite or aerial image. Most users only need Relative Depth.</p>
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

      <form onSubmit={handleStartAnalysis} className="space-y-6">
        <ol className="grid grid-cols-3 gap-2 text-xs" aria-label="Analysis steps">
          {['Upload', 'Choose output', 'Create project'].map((label, index) => <li key={label} className={`rounded-lg border px-3 py-2 font-medium ${index === 0 && !fileInfo ? 'border-blue-300 bg-blue-50 text-blue-800' : index === 1 && fileInfo ? 'border-blue-300 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-600'}`}><span className="mr-1.5 font-mono">{index + 1}</span>{label}</li>)}
        </ol>
        {/* Step 1: Upload Card */}
        <div className="bg-geo-900/80 border border-geo-700/70 rounded-xl p-6 space-y-4">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-mono">
              1
            </span>
            <span>1. Upload an image</span>
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

        {/* Keep advanced metric work optional so ordinary users see one clear path. */}
        <div className="bg-geo-900/80 border border-geo-700/70 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-mono">
                2
              </span>
              <span>2. Choose output</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Calibrated Mode */}
            <div
              onClick={() => setAnalysisMode('calibrated')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                analysisMode === 'calibrated'
                  ? 'bg-blue-50 border-blue-500 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-900">Metric elevation (advanced)</span>
                </div>
                {analysisMode === 'calibrated' && <CheckCircle2 className="w-5 h-5 text-blue-600" aria-label="Selected" />}
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Use only when you have an aligned GeoTIFF image and reference DEM.
              </p>
              <div className="mt-3 pt-2 border-t border-geo-700/40 flex items-center space-x-1.5 text-[10px] font-mono text-emerald-400">
                <FileCheck className="w-3.5 h-3.5" />
                <span>Needs a reference DEM</span>
              </div>
            </div>

            {/* Relative Disparity Mode */}
            <div
              onClick={() => setAnalysisMode('relative')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                analysisMode === 'relative'
                  ? 'bg-blue-50 border-blue-500 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-900">Relative depth (recommended)</span>
                </div>
                {analysisMode === 'relative' && <CheckCircle2 className="w-5 h-5 text-blue-600" aria-label="Selected" />}
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Works with JPG and PNG. It creates a useful 3D surface without metre labels.
              </p>
              <div className="mt-3 pt-2 border-t border-geo-700/40 flex items-center space-x-1.5 text-[10px] font-mono text-amber-400">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Best for normal image uploads</span>
              </div>
            </div>
          </div>

          {/* Calibrated Options Subpanel */}
          {analysisMode === 'calibrated' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3 mt-2">
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
              <label className="block text-xs font-medium text-slate-300 pt-2">
                Reference DEM GeoTIFF <span className="text-rose-300">(required for metric output)</span>
                <input
                  type="file"
                  accept=".tif,.tiff,.geotiff"
                  onChange={(e) => setReferenceDemFile(e.target.files?.[0] || null)}
                  className="mt-2 block w-full text-xs text-slate-300 file:mr-3 file:rounded file:border-0 file:bg-geo-700 file:px-3 file:py-1.5 file:text-xs file:text-white"
                />
              </label>
              <p className="text-[11px] text-amber-900">The input image must also be a GeoTIFF with CRS and geotransform. No metre values are produced if alignment or held-out validation fails.</p>
            </div>
          )}
        </div>

        {/* Step 3: Project Metadata */}
        <div className="bg-geo-900/80 border border-geo-700/70 rounded-xl p-6 space-y-4">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-mono">
              3
            </span>
            <span>3. Name your project (optional)</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Project Name
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g., Mount Rainier Aerial Survey"
                className="w-full bg-white text-slate-900 text-sm rounded-lg px-3 py-2.5 border border-geo-700 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Description & Notes
              </label>
              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Optional notes regarding acquisition sensor, latitude/longitude, or target terrain features..."
                rows={2}
                className="w-full bg-white text-slate-900 text-sm rounded-lg px-3 py-2 border border-geo-700 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Submission Actions */}
        <div className="sticky bottom-3 z-10 bg-white/95 backdrop-blur border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between shadow-lg">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={!fileInfo || isSubmitting || (analysisMode === 'calibrated' && !referenceDemFile)}
            className={`inline-flex items-center space-x-2 px-6 py-2.5 rounded-lg text-xs font-semibold text-white shadow-lg transition-all ${
              !fileInfo || isSubmitting
                ? 'bg-geo-800 text-slate-500 cursor-not-allowed border border-geo-700/50'
                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/40'
            }`}
          >
            <span>{isSubmitting ? 'Creating project…' : 'Run analysis'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
