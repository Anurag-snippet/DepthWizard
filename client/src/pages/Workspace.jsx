import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Compass, ArrowRight } from 'lucide-react';
import ProcessingStatus from '../components/workspace/ProcessingStatus';
import VisualizationPanel from '../components/workspace/VisualizationPanel';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import { projectStore } from '../services/projectStore';

export default function Workspace() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const projectId = searchParams.get('id');

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedColormap, setSelectedColormap] = useState('viridis');
  const [statusMessage, setStatusMessage] = useState('Imagery loaded and validated');

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
      if (p.stage === '3d_ready') {
        setCurrentStep(5);
        setStatusMessage('Pipeline complete — 3D terrain mesh ready');
      } else {
        setCurrentStep(2);
        setStatusMessage('Ready for preprocessing & inference');
      }
    }
    setLoading(false);
  }, [projectId]);



  if (loading) {
    return <LoadingSpinner message="Loading workspace assets..." />;
  }

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

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Top Workspace Status Bar */}
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
              {project.metadata?.width ? `${project.metadata.width}×${project.metadata.height} px` : 'N/A'}
            </span>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center space-x-3 text-xs">
          <Link
            to={`/terrain-viewer?id=${project.id}`}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-900/30 transition-colors"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Launch 3D Viewer</span>
          </Link>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Pipeline Execution Stepper */}
        <ProcessingStatus
          currentStep={currentStep}
          isProcessing={isProcessing}
          statusText={statusMessage}
        />

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
            onColormapChange={setSelectedColormap}
            badgeText="Unitless [0, 1]"
            isMetric={false}
            elevationRange={{ min: '0.00', max: '1.00' }}
            emptyMessage="Awaiting Phase 3 TensorFlow Inference"
          />

          {/* Panel 3: Calibrated Elevation Map */}
          <VisualizationPanel
            title="3. Calibrated Elevation"
            subtitle={isCalibrated ? 'Scaled against reference DEM' : 'Uncalibrated relative mode'}
            imageSrc={isCalibrated ? project.elevationMapSrc : null}
            badgeText={isCalibrated ? 'Metres AMSL' : 'Uncalibrated'}
            isMetric={isCalibrated}
            elevationRange={isCalibrated ? { min: project.metadata?.minElevationMeters || '3120', max: project.metadata?.maxElevationMeters || '4890' } : null}
            emptyMessage={isCalibrated ? 'Awaiting Phase 5 Reference DEM Calibration' : 'Metric elevation unavailable in Relative Mode'}
          />
        </div>

        {/* 3D Terrain Viewer Teaser Card */}
        <div className="bg-geo-900/80 border border-geo-700/70 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-geo-card">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-geo-850 border border-geo-700/60 flex items-center justify-center text-blue-400">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Interactive 3D Terrain Flythrough Ready</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Explore the displaced elevation mesh with free orbit, nadir top-down, and simulated drone flightpath controls.
              </p>
            </div>
          </div>

          <Link
            to={`/terrain-viewer?id=${project.id}`}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/40 transition-colors whitespace-nowrap self-start md:self-auto"
          >
            <span>Open Dedicated 3D Canvas</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
