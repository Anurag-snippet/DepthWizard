import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
  Activity, 
  ArrowRight, 
  FileImage, 
  ShieldCheck, 
  Sliders,
  Layers,
  Terminal
} from 'lucide-react';
import MetricsCard from '../components/common/MetricsCard';
import EmptyState from '../components/common/EmptyState';
import { projectStore } from '../services/projectStore';

export default function Dashboard() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    calibratedAnalyses: 0,
    relativeAnalyses: 0,
    completedAnalyses: 0,
    totalMegapixelsProcessed: 0,
    hasRecords: false,
  });

  const loadData = () => {
    const list = projectStore.getProjects();
    setProjects(list);
    setStats(projectStore.getStatistics());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLoadSample = () => {
    const sample = projectStore.createSampleProject();
    loadData();
    navigate(`/workspace?id=${sample.id}`);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Top Banner / Mission Header */}
      <div className="bg-geo-900/90 border border-geo-700/80 rounded-xl p-6 shadow-geo-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                SIH Problem Statement 26175
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Single-View Height Estimation & 3D Flythrough
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1">Geospatial Intelligence Dashboard</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Accepts single-view optical satellite imagery, estimates relative relief gradients with monocular AI, 
              and calibrates predictions against reference elevation datasets for interactive 3D terrain simulation.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleLoadSample}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-300 bg-geo-850 hover:bg-geo-800 border border-geo-700/60 transition-colors"
            >
              <span>Load Sample Crop</span>
            </button>

            <Link
              to="/new-analysis"
              className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold text-xs transition-colors shadow-lg shadow-blue-900/40"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Analysis</span>
            </Link>
          </div>
        </div>

        {/* Live Metrics Grid — Computed strictly from actual project records */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <MetricsCard
            title="Total Analyses"
            value={stats.totalAnalyses}
            subtitle={stats.hasRecords ? 'Stored project runs' : 'No records yet'}
            icon={Layers}
            highlight={stats.totalAnalyses > 0}
          />
          <MetricsCard
            title="Calibrated (Metric)"
            value={stats.calibratedAnalyses}
            subtitle="Validated with reference DEM"
            icon={ShieldCheck}
            badge="Metric Elevation"
          />
          <MetricsCard
            title="Relative Disparity"
            value={stats.relativeAnalyses}
            subtitle="Unitless [0, 1] gradient"
            icon={Sliders}
            badge="Relative Mode"
          />
          <MetricsCard
            title="Megapixels Processed"
            value={`${stats.totalMegapixelsProcessed} MP`}
            subtitle="Derived from image metadata"
            icon={Activity}
          />
        </div>
      </div>

      {/* Geospatial Scientific Integrity Protocol Notice */}
      <div className="bg-blue-950/20 border border-blue-800/40 rounded-xl p-4 flex items-start space-x-3">
        <Terminal className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-slate-300 space-y-1">
          <p className="font-semibold text-cyan-300">Metric Accuracy Protocol:</p>
          <p className="text-slate-400 leading-relaxed">
            Neural monocular depth estimation models produce relative disparity maps $[0, 1]$ indicating visual depth ambiguity. 
            In compliance with SIH evaluation guidelines, <strong>uncalibrated predictions are strictly labeled as relative disparity</strong>. 
            Actual metric elevation (metres above mean sea level) is only presented after calibration against reference DEMs or GCP ground truths.
          </p>
        </div>
      </div>

      {/* Recent Projects Section */}
      <div className="bg-geo-900/70 border border-geo-700/60 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Recent Project Records</h2>
            <p className="text-xs text-slate-400">Chronological history of ingested imagery and analyses</p>
          </div>
          {projects.length > 0 && (
            <Link
              to="/history"
              className="text-xs text-blue-400 hover:text-blue-300 font-mono flex items-center space-x-1"
            >
              <span>View All Records ({projects.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {projects.length === 0 ? (
          <EmptyState
            icon={FileImage}
            title="No analyses recorded yet"
            description="Start a new analysis with a satellite image crop or load the verified sample dataset to explore the pipeline."
            actionLabel="Start New Analysis"
            onAction={() => navigate('/new-analysis')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.slice(0, 3).map((p) => (
              <div
                key={p.id}
                className="bg-geo-850/80 border border-geo-700/60 hover:border-blue-500/50 rounded-xl p-4 flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-geo-950 text-slate-300 border border-geo-700/50">
                      {p.mode === 'calibrated' ? 'Calibrated (Metric)' : 'Relative Disparity'}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-800/40 capitalize">
                      {p.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors line-clamp-1">
                    {p.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                    {p.description || 'Single-view optical crop.'}
                  </p>

                  <div className="mt-3 text-[11px] font-mono text-slate-400 space-y-1">
                    <div className="flex justify-between">
                      <span>Dimensions:</span>
                      <span className="text-slate-200">
                        {p.metadata?.width ? `${p.metadata.width}×${p.metadata.height}` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>File Size:</span>
                      <span className="text-slate-200">{p.metadata?.formattedSize || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-geo-700/50 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-mono text-slate-500">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/workspace?id=${p.id}`}
                      className="text-blue-400 hover:text-blue-300 font-medium text-xs flex items-center space-x-1"
                    >
                      <span>Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
