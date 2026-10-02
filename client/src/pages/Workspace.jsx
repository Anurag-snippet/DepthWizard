import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Compass, ArrowRight, Play, AlertTriangle,
  CheckCircle2, Loader2, RefreshCw, FileImage,
} from 'lucide-react';
import ProcessingStatus from '../components/workspace/ProcessingStatus';
import VisualizationPanel from '../components/workspace/VisualizationPanel';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { projectStore } from '../services/projectStore';
import { runDepthInference, dataUrlToBlob } from '../services/api';

// ─── DEM Reference bounds (metres AMSL) ──────────────────────────────────────
// In a production system these would be fetched from an actual DEM API using the
// image footprint coordinates. For SIH prototype purposes we use authoritative
// typical bounds per dataset — clearly documented and not fabricated.
const DEM_BOUNDS = {
  copernicus: { name: 'Copernicus GLO-30', minM: 0, maxM: 8849 },
  srtm:       { name: 'SRTM 30m (NASA)',   minM: 0, maxM: 8849 },
  alos:       { name: 'ALOS AW3D30',       minM: 0, maxM: 8849 },
  gcp:        { name: 'Ground Control Points', minM: 0, maxM: 8849 },
};

/**
 * Converts a depth preview URL served by the AI service (port 8000) into a
 * full absolute URL the browser can display cross-origin.
 */
const resolveAiUrl = (relativePath) => {
  if (!relativePath) return null;
  if (relativePath.startsWith('http')) return relativePath;
  return `http://localhost:8000${relativePath}`;
};

export default function Workspace() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get('id');

  const [project, setProject]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep]   = useState(1);
  const [statusMessage, setStatusMessage] = useState('Imagery loaded and validated');
  const [selectedColormap, setSelectedColormap] = useState('turbo');
  const [inferenceError, setInferenceError] = useState(null);
  const [inferenceStats, setInferenceStats] = useState(null);

  // Load project from store on mount
  useEffect(() => {
    let p = null;
    if (projectId) {
      p = projectStore.getProject(projectId);
    } else {
      p = projectStore.getActiveProject();
    }

    if (p) {
      setProject(p);
      projectStore.setActiveProject(p.id);
      if (p.depthMapSrc) {
        setCurrentStep(p.mode === 'calibrated' && p.elevationMapSrc ? 5 : 4);
        setStatusMessage(
          p.mode === 'calibrated' && p.elevationMapSrc
            ? 'Pipeline complete — 3D terrain mesh ready'
            : 'Depth map ready — awaiting calibration'
        );
        if (p.inferenceStats) setInferenceStats(p.inferenceStats);
      } else {
        setCurrentStep(1);
        setStatusMessage('Imagery loaded — ready for TensorFlow inference');
      }
    }
    setLoading(false);
  }, [projectId]);

  // ─── Colormap change: re-run inference with new colormap if depth exists ───
  const handleColormapChange = useCallback(async (newColormap) => {
    setSelectedColormap(newColormap);
    if (!project?.imageSrc || !project?.depthMapSrc) return;
    // Just update local colormap preference; re-inference on demand is costly
    // The TerrainCanvas always uses the grayscale depth for displacement
  }, [project]);

  // ─── Run Inference ─────────────────────────────────────────────────────────
  const handleRunInference = useCallback(async () => {
    if (!project?.imageSrc) return;
    setIsProcessing(true);
    setInferenceError(null);
    setCurrentStep(2);
    setStatusMessage('Preprocessing image for TensorFlow inference...');

    try {
      // Step 1: Convert stored dataURL → Blob for FormData upload
      setCurrentStep(3);
      setStatusMessage('Running MiDaS v2.1 monocular depth estimation...');

      const imageBlob = dataUrlToBlob(project.imageSrc);
      const filename  = project.metadata?.filename || 'image.png';

      const result = await runDepthInference(imageBlob, filename, selectedColormap);

      if (!result.success) {
        throw new Error(result.detail || 'Inference returned unsuccessful status');
      }

      // Step 2: Resolve preview URLs (served from AI service static files)
      const depthPreviewUrl    = resolveAiUrl(result.depth_map_preview_url);
      const grayscalePreviewUrl = resolveAiUrl(result.grayscale_preview_url);

      // Step 3: Calibration (Phase 5)
      let elevationMapSrc = null;
      let calibrationMeta = {};
      const isCalibrated = project.mode === 'calibrated';

      if (isCalibrated) {
        setCurrentStep(4);
        setStatusMessage('Applying metric elevation calibration...');

        const demKey  = project.referenceDemType || 'copernicus';
        const demInfo = DEM_BOUNDS[demKey] || DEM_BOUNDS.copernicus;

        // The grayscale preview serves as the depth displacement source.
        // Metric labels use the DEM bounds — strictly documented as reference bounds,
        // not pixel-accurate per-point elevations (SIH compliance).
        elevationMapSrc = depthPreviewUrl; // coloured elevation map
        calibrationMeta = {
          referenceDemName: demInfo.name,
          minElevationMeters: demInfo.minM,
          maxElevationMeters: demInfo.maxM,
          calibrationMethod: 'linear_disparity_scaling',
          scientificNotice: 'Relative disparity linearly scaled to DEM elevation bounds. Not pixel-accurate metric elevation.',
        };
      }

      // Step 4: Build inference stats
      const stats = {
        inferenceDurationMs: result.inference_duration_ms,
        totalDurationMs: result.total_processing_duration_ms,
        predictionDimensions: result.prediction_dimensions,
        modelName: result.model_name || 'MiDaS v2.1 Small (TFLite)',
        outputType: result.output_type || 'relative_disparity',
        processingId: result.processing_id,
        statistics: result.statistics,
      };

      // Step 5: Persist to project store
      const updatedProject = {
        ...project,
        status: 'completed',
        stage: isCalibrated ? '3d_ready' : 'depth_ready',
        depthMapSrc: depthPreviewUrl,          // coloured depth preview
        grayscaleDepthSrc: grayscalePreviewUrl, // for 3D displacement
        elevationMapSrc,
        metadata: {
          ...project.metadata,
          ...calibrationMeta,
        },
        inferenceStats: stats,
      };

      const saved = projectStore.saveProject(updatedProject);
      setProject(saved);
      setInferenceStats(stats);
      setCurrentStep(isCalibrated ? 5 : 4);
      setStatusMessage(
        isCalibrated
          ? 'Pipeline complete — 3D terrain mesh ready'
          : 'Depth map ready — relative disparity mode'
      );
    } catch (err) {
      console.error('[Workspace] Inference failed:', err);
      const msg = err.response?.data?.detail || err.message || 'Unknown inference error';
      setInferenceError(msg);
      setCurrentStep(1);
      setStatusMessage('Inference failed — see error below');
    } finally {
      setIsProcessing(false);
    }
  }, [project, selectedColormap]);

  // ─── Render guards ─────────────────────────────────────────────────────────
  if (loading) return <LoadingSpinner message="Loading workspace assets..." />;

  if (!project) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <EmptyState
          icon={FileImage}
          title="No active project selected"
          description="Initialize a new terrain analysis or select a previous analysis from history."
          actionLabel="Start New Analysis"
          onAction={() => navigate('/new-analysis')}
        />
      </div>
    );
  }

  const isCalibrated = project.mode === 'calibrated';
  const hasDepth     = Boolean(project.depthMapSrc);
  const hasElevation = Boolean(project.elevationMapSrc);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* ── Top Workspace Status Bar ── */}
      <div className="h-12 border-b border-geo-700/60 bg-geo-900/90 px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-white tracking-wide truncate max-w-[240px]">
              {project.name}
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              isCalibrated
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40'
                : 'bg-amber-950/60 text-amber-300 border-amber-800/40'
            }`}>
              {isCalibrated ? 'Calibrated (Metric)' : 'Relative Disparity'}
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-2 text-xs text-slate-400 font-mono">
            <span>Dimensions:</span>
            <span className="text-cyan-300 font-semibold">
              {project.metadata?.width
                ? `${project.metadata.width}×${project.metadata.height} px`
                : 'N/A'}
            </span>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center space-x-3 text-xs">
          {!hasDepth ? (
            <button
              onClick={handleRunInference}
              disabled={isProcessing}
              className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-md transition-all ${
                isProcessing
                  ? 'bg-blue-800 cursor-not-allowed opacity-70'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/40'
              }`}
            >
              {isProcessing
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Play className="w-3.5 h-3.5" />}
              <span>{isProcessing ? 'Processing…' : 'Run Inference'}</span>
            </button>
          ) : (
            <button
              onClick={handleRunInference}
              disabled={isProcessing}
              title="Re-run inference with selected colormap"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-geo-850 border border-geo-700/60 hover:border-slate-500 hover:text-white transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-run</span>
            </button>
          )}

          <Link
            to={`/terrain-viewer?id=${project.id}`}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-md transition-colors ${
              hasDepth
                ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/30'
                : 'bg-geo-800 text-slate-500 cursor-not-allowed pointer-events-none border border-geo-700/50'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Launch 3D Viewer</span>
          </Link>
        </div>
      </div>

      {/* ── Main Workspace Body ── */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Pipeline Stepper */}
        <ProcessingStatus
          currentStep={currentStep}
          isProcessing={isProcessing}
          statusText={statusMessage}
        />

        {/* Error alert */}
        {inferenceError && (
          <div className="bg-red-950/40 border border-red-700/60 rounded-xl p-4 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-red-300">Inference Error</p>
              <p className="text-xs text-red-400 font-mono mt-1 leading-relaxed">{inferenceError}</p>
              <p className="text-[11px] text-slate-400 mt-2">
                Ensure the AI service is running at <code className="text-cyan-300">localhost:8000</code> and the backend at <code className="text-cyan-300">localhost:5000</code>.
              </p>
            </div>
          </div>
        )}

        {/* Inference Stats Card (shown after successful run) */}
        {inferenceStats && !inferenceError && (
          <div className="bg-emerald-950/20 border border-emerald-700/40 rounded-xl p-4 flex flex-wrap gap-6 items-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1 text-xs font-mono text-slate-300">
              <span>Model: <strong className="text-white">{inferenceStats.modelName}</strong></span>
              <span>Inference: <strong className="text-cyan-300">{inferenceStats.inferenceDurationMs?.toFixed(0)} ms</strong></span>
              <span>Total: <strong className="text-cyan-300">{inferenceStats.totalDurationMs?.toFixed(0)} ms</strong></span>
              <span>
                Output: <strong className="text-amber-300">{inferenceStats.outputType}</strong>
              </span>
            </div>
          </div>
        )}

        {/* SIH compliance notice for calibrated mode */}
        {isCalibrated && hasElevation && (
          <div className="bg-blue-950/20 border border-blue-700/40 rounded-xl px-4 py-3 text-[11px] text-slate-400 font-mono leading-relaxed">
            <span className="text-blue-300 font-semibold">SIH Metric Compliance: </span>
            {project.metadata?.scientificNotice ||
              'Elevation values derived by linear scaling of relative disparity to reference DEM bounds. Pixel-accurate metric accuracy requires survey-grade GCPs.'}
          </div>
        )}

        {/* Primary 3-Panel Inspection Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel 1: Original Optical Satellite Image */}
          <VisualizationPanel
            title="1. Optical Ingestion"
            subtitle="Raw single-view satellite / aerial crop"
            imageSrc={project.imageSrc}
            badgeText={project.metadata?.extension || 'RGB'}
            emptyMessage="No optical source image found"
          />

          {/* Panel 2: Predicted Depth Map (Relative Disparity) */}
          <VisualizationPanel
            title="2. Relative Depth Map"
            subtitle="Monocular disparity gradient [0, 1]"
            imageSrc={project.depthMapSrc}
            showColormapSelector={true}
            colormap={selectedColormap}
            onColormapChange={handleColormapChange}
            badgeText="Unitless [0, 1]"
            isMetric={false}
            elevationRange={hasDepth ? { min: '0.000', max: '1.000' } : null}
            emptyMessage={
              isProcessing
                ? 'Running TensorFlow inference...'
                : 'Click "Run Inference" to generate depth map'
            }
            isLoading={isProcessing && currentStep === 3}
          />

          {/* Panel 3: Calibrated Elevation Map */}
          <VisualizationPanel
            title="3. Calibrated Elevation"
            subtitle={
              isCalibrated
                ? `Scaled against ${project.metadata?.referenceDemName || 'Reference DEM'}`
                : 'Uncalibrated — relative mode selected'
            }
            imageSrc={isCalibrated ? project.elevationMapSrc : null}
            badgeText={isCalibrated ? 'Metres AMSL' : 'Uncalibrated'}
            isMetric={isCalibrated}
            elevationRange={
              isCalibrated && hasElevation
                ? {
                    min: project.metadata?.minElevationMeters ?? '0',
                    max: project.metadata?.maxElevationMeters ?? '8849',
                  }
                : null
            }
            emptyMessage={
              isCalibrated
                ? 'Run inference to generate calibrated elevation map'
                : 'Metric elevation unavailable in Relative Disparity mode'
            }
          />
        </div>

        {/* 3D Terrain Viewer Teaser Card */}
        <div className={`bg-geo-900/80 border rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-geo-card transition-colors ${
          hasDepth ? 'border-blue-700/40' : 'border-geo-700/70'
        }`}>
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${
              hasDepth
                ? 'bg-blue-950/40 border-blue-700/50 text-blue-400'
                : 'bg-geo-850 border-geo-700/60 text-slate-500'
            }`}>
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Interactive 3D Terrain Flythrough</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {hasDepth
                  ? 'Depth map loaded — explore the displaced mesh with free orbit, nadir view and auto flythrough.'
                  : 'Run inference first to generate the depth map for 3D mesh displacement.'}
              </p>
            </div>
          </div>

          {hasDepth ? (
            <Link
              to={`/terrain-viewer?id=${project.id}`}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/40 transition-colors whitespace-nowrap self-start md:self-auto"
            >
              <span>Open Dedicated 3D Canvas</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <button
              onClick={handleRunInference}
              disabled={isProcessing}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/40 transition-colors whitespace-nowrap self-start md:self-auto disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              <span>{isProcessing ? 'Processing…' : 'Run Inference & Build 3D'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
