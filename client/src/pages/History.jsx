import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  History as HistoryIcon, 
  Trash2, 
  ExternalLink, 
  Compass, 
  FileImage, 
  Database
} from 'lucide-react';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import Notification from '../components/common/Notification';
import { projectStore } from '../services/projectStore';

export default function History() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [notification, setNotification] = useState(null);

  const loadProjects = () => {
    setProjects(projectStore.getProjects());
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleDeleteConfirm = () => {
    if (!deleteCandidate) return;
    projectStore.deleteProject(deleteCandidate.id);
    setNotification({
      type: 'success',
      message: `Project "${deleteCandidate.name}" removed from local history.`,
    });
    setDeleteCandidate(null);
    loadProjects();
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <HistoryIcon className="w-5 h-5 text-blue-400" />
            <h1 className="text-xl font-bold text-white">Project History & Archives</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Browse previous monocular depth predictions, calibrated elevation runs, and generated 3D meshes.
          </p>
        </div>

        <button
          onClick={() => navigate('/new-analysis')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-blue-900/30 transition-colors self-start md:self-auto"
        >
          New Analysis
        </button>
      </div>

      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Projects Table / Cards */}
      {projects.length === 0 ? (
        <EmptyState
          icon={Database}
          title="No stored projects found"
          description="Your local history is empty. Ingest a satellite image crop to create your first analysis record."
          actionLabel="Start New Analysis"
          onAction={() => navigate('/new-analysis')}
        />
      ) : (
        <div className="bg-geo-900/80 border border-geo-700/70 rounded-xl overflow-hidden shadow-geo-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-geo-850/90 text-slate-400 uppercase font-mono text-[11px] border-b border-geo-700/60">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Project Details</th>
                  <th className="px-4 py-3.5 font-semibold">Mode</th>
                  <th className="px-4 py-3.5 font-semibold">Dimensions</th>
                  <th className="px-4 py-3.5 font-semibold">Status</th>
                  <th className="px-4 py-3.5 font-semibold">Date Created</th>
                  <th className="px-6 py-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-geo-700/40 text-slate-300">
                {projects.map((p) => {
                  const isMetric = p.mode === 'calibrated';
                  return (
                    <tr key={p.id} className="hover:bg-geo-850/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-geo-950 border border-geo-700/60 flex items-center justify-center text-blue-400 flex-shrink-0">
                            <FileImage className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-white hover:text-blue-300 transition-colors cursor-pointer truncate max-w-xs" onClick={() => navigate(`/workspace?id=${p.id}`)}>
                              {p.name}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {p.metadata?.filename || 'satellite_crop'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          isMetric
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40'
                            : 'bg-amber-950/60 text-amber-300 border-amber-800/40'
                        }`}>
                          {isMetric ? 'Calibrated (Metric)' : 'Relative Disparity'}
                        </span>
                      </td>

                      <td className="px-4 py-4 font-mono text-slate-400">
                        {p.metadata?.width ? `${p.metadata.width}×${p.metadata.height} px` : 'N/A'}
                      </td>

                      <td className="px-4 py-4">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-geo-950 text-slate-300 border border-geo-700/50 capitalize">
                          {p.status || 'Active'}
                        </span>
                      </td>

                      <td className="px-4 py-4 font-mono text-slate-400 text-[11px]">
                        {new Date(p.createdAt).toLocaleDateString()} {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={`/workspace?id=${p.id}`}
                            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-geo-800 transition-colors"
                            title="Open in Workspace"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>

                          <Link
                            to={`/terrain-viewer?id=${p.id}`}
                            className="p-1.5 text-blue-400 hover:text-blue-300 rounded hover:bg-geo-800 transition-colors"
                            title="Open 3D Terrain Viewer"
                          >
                            <Compass className="w-4 h-4" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => setDeleteCandidate(p)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-geo-800 transition-colors"
                            title="Delete Project Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteCandidate)}
        onClose={() => setDeleteCandidate(null)}
        title="Confirm Project Deletion"
        confirmLabel="Delete Record"
        onConfirm={handleDeleteConfirm}
        isDanger={true}
      >
        <p className="text-xs text-slate-300 leading-relaxed">
          Are you sure you want to permanently delete{' '}
          <strong className="text-white font-mono">{deleteCandidate?.name}</strong> from your local session history?
        </p>
        <p className="text-[11px] text-slate-500 mt-2">
          This will purge all cached relative depth maps and 3D mesh references for this dataset. This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
