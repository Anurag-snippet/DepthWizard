import { UploadCloud, FileImage } from 'lucide-react';

const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'tif', 'tiff'];
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

export default function UploadDropzone({ onFileSelected, onError, isProcessing }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const validateAndProcessFile = (file) => {
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
      onError(`Unsupported file format (.${extension || 'unknown'}). Please upload a PNG, JPG, or GeoTIFF (.tif) image.`);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      onError(`File exceeds the 50 MB limit (detected: ${sizeMB} MB). Please choose a smaller crop.`);
      return;
    }

    // Read dimensions using HTML5 Image
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const img = new Image();
      img.onload = () => {
        onFileSelected({
          file,
          dataUrl,
          filename: file.name,
          extension: extension.toUpperCase(),
          sizeBytes: file.size,
          formattedSize: formatBytes(file.size),
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
        });
      };
      img.onerror = () => {
        // Fallback for GeoTIFFs or images browser can't directly render as img
        onFileSelected({
          file,
          dataUrl: null,
          filename: file.name,
          extension: extension.toUpperCase(),
          sizeBytes: file.size,
          formattedSize: formatBytes(file.size),
          width: 'Raster (GeoTIFF)',
          height: 'Multi-band',
        });
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      onError('Failed to read the selected file from disk.');
    };
    reader.readAsDataURL(file);
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
    if (isProcessing) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
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
            Click to browse or drop satellite / aerial image here
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Supports GeoTIFF (.tif, .tiff), PNG, and JPEG up to 50 MB
          </p>
        </div>

        <div className="inline-flex items-center space-x-2 text-[11px] font-mono text-slate-400 bg-geo-950 px-3 py-1 rounded-md border border-geo-700/50">
          <FileImage className="w-3.5 h-3.5 text-cyan-400" />
          <span>Recommended: Orthorectified high-resolution RGB crop</span>
        </div>
      </div>
    </div>
  );
}
