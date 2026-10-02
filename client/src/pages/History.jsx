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
  const [query, setQuery] = useState('');
  const [modeFilter, setModeFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  const loadProjects = () => {
    setProjects(projectStore.getProjects());
  };

  useEffect(() => {
    loadProjects();
    projectStore.syncWithRemote().then((list) => {
      setProjects(list);
    });
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
  const visibleProjects = projects.filter((project) => {
    const nameMatch = project.name?.toLowerCase().includes(query.toLowerCase()) || project.metadata?.filename?.toLowerCase().includes(query.toLowerCase());
    return nameMatch && (modeFilter === 'all' || project.mode === modeFilter);
  }).sort((a, b) => sortOrder === 'newest' ? new Date(b.createdAt) - new Date(a.createdAt) : new Date(a.createdAt) - new Date(b.createdAt));

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <HistoryIcon className="w-5 h-5 text-blue-400" />
            <h1 className="text-xl font-bold text-white">Project History & Archives</h1>
          </div>
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

      {projects.length > 0 && <div className="flex flex-col sm:flex-row gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects" aria-label="Search projects" className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-200" />
        <select value={modeFilter} onChange={(event) => setModeFilter(event.target.value)} aria-label="Filter by output mode" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"><option value="all">All modes</option><option value="relative">Relative depth</option><option value="calibrated">Calibrated metric</option></select>
        <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} aria-label="Sort projects" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select>
      </div>}

      {/* Projects Table / Cards */}
      {projects.length === 0 ? (
        <EmptyState
          icon={Database}
          title="No stored projects found"
          description="Your local history is empty. Ingest a satellite image crop to create your first analysis record."
          actionLabel="Start New Analysis"
          onAction={() => navigate('/new-analysis')}
        />
      ) : visibleProjects.length === 0 ? <EmptyState icon={HistoryIcon} title="No projects match those filters" description="Try another search term or output-mode filter." /> : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-mono text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Project Details</th>
                  <th className="px-4 py-3.5 font-semibold">Mode</th>
                  <th className="px-4 py-3.5 font-semibold">Dimensions</th>
                  <th className="px-4 py-3.5 font-semibold">Status</th>
                  <th className="px-4 py-3.5 font-semibold">Date Created</th>
                  <th className="px-6 py-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {visibleProjects.map((p) => {
                  const isMetric = p.mode === 'calibrated';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-8 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-blue-500 flex-shrink-0">{p.imageSrc ? <img src={p.imageSrc} alt="" className="w-full h-full object-cover" /> : <FileImage className="w-4 h-4" />}</div>
                          <div>
                            <div className="font-semibold text-slate-900 hover:text-blue-700 transition-colors cursor-pointer truncate max-w-xs" onClick={() => navigate(`/workspace?id=${p.id}`)}>
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
