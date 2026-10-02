"""
DepthWizard AI Preprocessing Engine
Handles image decoding, multi-format validation, aspect-ratio preserving resizing, and normalization.
"""
import io
import cv2
import numpy as np
from PIL import Image
import tifffile

ALLOWED_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.tif', '.tiff', '.bmp', '.webp'}
MAX_DIMENSION = 8192
MIN_DIMENSION = 16

class PreprocessingError(Exception):
    """Raised when image preprocessing fails validation or decoding."""
    pass

def decode_image_bytes(image_bytes: bytes, filename: str = "image.png") -> np.ndarray:
    """
    Decodes raw bytes into a standard RGB uint8 numpy array (H, W, 3).
    Supports standard formats (JPEG, PNG) as well as GeoTIFF (via tifffile).
    """
    if not image_bytes or len(image_bytes) == 0:
        raise PreprocessingError("Uploaded image payload is empty (0 bytes).")

    ext = "." + filename.split(".")[-1].lower() if "." in filename else ""

    # 1. GeoTIFF / TIFF Handling
    if ext in {'.tif', '.tiff'}:
        try:
            with io.BytesIO(image_bytes) as bio:
                tiff_data = tifffile.imread(bio)
                if tiff_data is None:
                    raise PreprocessingError("Could not decode GeoTIFF raster data.")
                
                # Normalize multi-band or single-band 16-bit to 8-bit RGB
                if tiff_data.ndim == 2:
                    # Single band elevation or panchromatic
                    norm = cv2.normalize(tiff_data, None, 0, 255, cv2.NORM_MINMAX)
                    rgb = cv2.cvtColor(norm.astype(np.uint8), cv2.COLOR_GRAY2RGB)
                elif tiff_data.ndim == 3:
                    # tifffile can expose GeoTIFF bands as either H×W×C or C×H×W.
                    if tiff_data.shape[0] <= 4 and tiff_data.shape[-1] > 4:
                        tiff_data = np.moveaxis(tiff_data, 0, -1)
                    # Take first 3 bands (RGB)
                    bands = tiff_data[:, :, :3]
                    if bands.dtype != np.uint8:
                        bands = cv2.normalize(bands, None, 0, 255, cv2.NORM_MINMAX).astype(np.uint8)
                    rgb = bands
                else:
                    raise PreprocessingError(f"Unsupported GeoTIFF dimensions: {tiff_data.shape}")
                return rgb
        except Exception as e:
            # Fallback to OpenCV if tifffile fails
            pass

    # 2. Standard Formats via OpenCV / Pillow
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is not None:
            # OpenCV loads as BGR; convert to RGB
            return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    except Exception:
        pass

    # 3. Fallback via Pillow
    try:
        pil_img = Image.open(io.BytesIO(image_bytes))
        pil_img.verify() # Verify file integrity
        # Re-open after verify()
        pil_img = Image.open(io.BytesIO(image_bytes))
        return np.array(pil_img.convert('RGB'))
    except Exception as e:
        raise PreprocessingError(f"Corrupted or unsupported image file. Decoding failed: {e}")

def validate_image_dimensions(img: np.ndarray):
    """Ensures image dimensions are within safe processing bounds."""
    h, w = img.shape[:2]
    if h < MIN_DIMENSION or w < MIN_DIMENSION:
        raise PreprocessingError(f"Image too small ({w}x{h} px). Minimum required is {MIN_DIMENSION}x{MIN_DIMENSION} px.")
    if h > MAX_DIMENSION or w > MAX_DIMENSION:
        raise PreprocessingError(f"Image exceeds maximum dimensions ({w}x{h} px). Maximum allowed is {MAX_DIMENSION}x{MAX_DIMENSION} px.")

def prepare_input_tensor(img_rgb: np.ndarray, target_size: int = 256):
    """
    Prepares input tensor for MiDaS v2.1 Small model:
    - Resizes to target_size x target_size
    - Normalizes with ImageNet mean/std
    - Returns formatted float32 tensor of shape (1, target_size, target_size, 3)
    """
    orig_h, orig_w = img_rgb.shape[:2]
    
    # Resize to model input size using bicubic interpolation
    resized = cv2.resize(img_rgb, (target_size, target_size), interpolation=cv2.INTER_CUBIC)
    
    # Normalize to [0, 1]
    normalized = resized.astype(np.float32) / 255.0
    
    # ImageNet normalization
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    normalized = (normalized - mean) / std

    # Expand dims for batch: (1, 256, 256, 3)
    tensor = np.expand_dims(normalized, axis=0).astype(np.float32)
    
    return tensor, (orig_h, orig_w)
