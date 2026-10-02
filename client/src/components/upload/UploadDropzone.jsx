import { useRef, useState } from 'react';
import { UploadCloud, FileImage } from 'lucide-react';

const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'tif', 'tiff'];
const MAX_FILE_SIZE_BYTES = 200 * 1024 * 1024; // 200MB

export default function UploadDropzone({ onFileSelected, onError, isProcessing }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const processSingleFile = (file) => {
    return new Promise((resolve, reject) => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
        reject(new Error(`"${file.name}": Unsupported format (.${extension || 'unknown'}). Use PNG, JPG, or GeoTIFF.`));
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        reject(new Error(`"${file.name}": Exceeds 200 MB limit (${sizeMB} MB).`));
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        resolve({
          file,
          objectUrl,
          filename: file.name,
          extension: extension.toUpperCase(),
          sizeBytes: file.size,
          formattedSize: formatBytes(file.size),
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
        });
      };

      img.onerror = () => {
        // Fallback for multi-band GeoTIFFs that browser native rasterizer can't draw
        resolve({
          file,
          objectUrl,
          filename: file.name,
          extension: extension.toUpperCase(),
          sizeBytes: file.size,
          formattedSize: formatBytes(file.size),
          width: 'Raster (GeoTIFF)',
          height: 'Multi-band',
        });
      };

      img.src = objectUrl;
    });
  };

  const handleFiles = async (fileList) => {
    if (!fileList || fileList.length === 0 || isProcessing) return;

    if (fileList.length > 1) {
      onError?.('Please select one image at a time.');
      return;
    }

    try {
      const info = await processSingleFile(fileList[0]);
      onFileSelected?.(info);
    } catch (err) {
      onError?.(err.message);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
    // Reset so same files can be re-selected if needed
    e.target.value = '';
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isProcessing && fileInputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
        isDragOver
          ? 'border-blue-400 bg-blue-950/20 scale-[0.99]'
          : 'border-geo-700/80 hover:border-blue-500/60 bg-geo-900/40 hover:bg-geo-850/50'
      } ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.tif,.tiff"
        onChange={handleInputChange}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-geo-850 border border-geo-700/70 flex items-center justify-center text-blue-400 shadow-md">
          <UploadCloud className="w-6 h-6" />
        </div>

        <div>
          <p className="text-sm font-semibold text-white">
            Click to browse or drop satellite / aerial imagery here
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Upload one GeoTIFF (.tif, .tiff), PNG, or JPEG file up to 200 MB
          </p>
        </div>

        <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-400">
          <div className="inline-flex items-center space-x-1.5 bg-geo-950 px-2.5 py-1 rounded-md border border-geo-700/50">
            <FileImage className="w-3.5 h-3.5 text-cyan-400" />
            <span>Orthorectified RGB recommended</span>
          </div>
        </div>
      </div>
    </div>
  );
}
