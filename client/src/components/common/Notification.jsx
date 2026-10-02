import React from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export default function Notification({ type = 'info', title, message, onClose }) {
  const styles = {
    info: 'bg-blue-950/40 border-blue-800/60 text-blue-200',
    error: 'bg-rose-950/40 border-rose-800/60 text-rose-200',
    warning: 'bg-amber-950/40 border-amber-800/60 text-amber-200',
    success: 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200',
  };

  const icons = {
    info: <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />,
    warning: <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />,
    success: <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />,
  };

  return (
    <div className={`p-3.5 rounded-lg border text-xs flex items-start justify-between space-x-3 ${styles[type] || styles.info}`}>
      <div className="flex items-start space-x-2.5">
        {icons[type]}
        <div>
          {title && <p className="font-semibold">{title}</p>}
          <p className="opacity-90 leading-relaxed">{message}</p>
        </div>
      </div>
      {onClose && (
        <button onClick={onClose} className="p-0.5 opacity-60 hover:opacity-100 transition-opacity">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
