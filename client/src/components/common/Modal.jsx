import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, confirmLabel, onConfirm, isDanger }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-geo-900 border border-geo-700 rounded-xl shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        <div className="px-6 py-4 border-b border-geo-700/60 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {isDanger && <AlertTriangle className="w-5 h-5 text-rose-400" />}
            <h3 className="text-base font-semibold text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-geo-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 text-sm text-slate-300">
          {children}
        </div>

        <div className="px-6 py-3.5 bg-geo-950/80 border-t border-geo-700/60 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-geo-800 hover:bg-geo-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          {onConfirm && (
            <button
              type="button"
              onClick={onConfirm}
              className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors ${
                isDanger
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-900/30'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/30'
              }`}
            >
              {confirmLabel || 'Confirm'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
