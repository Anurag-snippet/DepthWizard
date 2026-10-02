import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, ArrowRight, ExternalLink, Mountain, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function BatchProcessingModal({
  isOpen,
  queue,
  currentIndex,
  isFinished,
  onClose,
}) {
  const navigate = useNavigate();
  if (!isOpen) return null;

  const total = queue.length;
  const completedCount = queue.filter((q) => q.status === 'completed').length;
  const failedCount = queue.filter((q) => q.status === 'failed').length;
  const percent = total > 0 ? Math.round(((completedCount + failedCount) / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-geo-900 border border-geo-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-geo-800 bg-geo-950/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                {isFinished ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {isFinished ? 'Batch Terrain Analysis Complete' : 'Processing Satellite Imagery Batch'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isFinished
                    ? `Successfully processed ${completedCount} of ${total} satellite images with TensorFlow MiDaS`
                    : `Estimating monocular depth for image ${currentIndex + 1} of ${total}...`}
                </p>
              </div>
            </div>

            <span className="font-mono text-xs font-semibold text-blue-400 bg-blue-950/60 border border-blue-800/60 px-3 py-1.5 rounded-lg">
              {percent}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-4 w-full bg-geo-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isFinished ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-cyan-400'
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Queue Items List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 divide-y divide-geo-800/60">
          {queue.map((item, idx) => {
            const isProcessing = item.status === 'processing';
            const isCompleted = item.status === 'completed';
            const isFailed = item.status === 'failed';

            return (
              <div key={idx} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-12 h-12 rounded-lg bg-geo-950 border border-geo-800 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                    {item.fileInfo?.objectUrl ? (
                      <img src={item.fileInfo.objectUrl} alt={item.fileInfo.filename} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-mono text-slate-500">TIF</span>
                    )}

                    {isCompleted && item.depthPreviewUrl && (
                      <img
                        src={item.depthPreviewUrl}
                        alt="Depth"
                        className="absolute inset-0 w-full h-full object-cover opacity-90"
                      />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate" title={item.fileInfo?.filename}>
                      {item.fileInfo?.filename}
                    </p>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono mt-0.5">
                      <span>{item.fileInfo?.formattedSize}</span>
                      {item.durationMs && <span>· {(item.durationMs / 1000).toFixed(1)}s</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 flex-shrink-0">
                  {isProcessing && (
                    <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-blue-950/60 border border-blue-800/60 text-blue-400 text-[11px] font-mono">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Estimating Depth</span>
                    </div>
                  )}

                  {isCompleted && (
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-[11px] font-mono">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Done</span>
                      </span>

                      {item.projectId && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            navigate(`/workspace?id=${item.projectId}`);
                          }}
                          className="p-1.5 text-slate-400 hover:text-white bg-geo-800 hover:bg-geo-750 border border-geo-750 rounded-lg transition-colors"
                          title="Open in Workspace"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}

                  {isFailed && (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-rose-950/60 border border-rose-800/60 text-rose-400 text-[11px] font-mono">
                      <AlertCircle className="w-3 h-3" />
                      <span>Failed</span>
                    </span>
                  )}

                  {item.status === 'queued' && (
                    <span className="text-[11px] font-mono text-slate-500">Queued</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-geo-950 border-t border-geo-800 flex items-center justify-between">
          <button
            type="button"
            disabled={!isFinished}
            onClick={onClose}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors ${
              isFinished
                ? 'text-slate-400 hover:text-white hover:bg-geo-800'
                : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            Close
          </button>

          <div className="flex items-center space-x-3">
            {isFinished && completedCount > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/history');
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-geo-800 hover:bg-geo-750 border border-geo-700 transition-colors"
                >
                  View All in History
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const firstCompleted = queue.find((q) => q.status === 'completed');
                    onClose();
                    if (firstCompleted?.projectId) {
                      navigate(`/workspace?id=${firstCompleted.projectId}`);
                    }
                  }}
                  className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/30 transition-all"
                >
                  <span>Open in 3D Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
