"""
DepthWizard AI Postprocessing Engine
Converts raw model outputs to floating-point disparity arrays, restores source dimensions,
generates normalized previews (PNG), and serializes raw numpy arrays (.npy).
"""
import os
import cv2
import numpy as np
from PIL import Image

def resize_to_source_dimensions(prediction: np.ndarray, orig_shape: tuple) -> np.ndarray:
    """
    Resizes model prediction back to original image dimensions (orig_h, orig_w)
    using bicubic interpolation.
    """
    orig_h, orig_w = orig_shape
    # Squeeze batch / channel dimensions if present
    pred_2d = np.squeeze(prediction)
    resized = cv2.resize(pred_2d, (orig_w, orig_h), interpolation=cv2.INTER_CUBIC)
    return resized.astype(np.float32)

def normalize_disparity(raw_depth: np.ndarray) -> np.ndarray:
    """
    Normalizes a continuous relative disparity / depth array to [0.0, 1.0].
    Safeguards against zero-division for uniform inputs.
    """
    d_min = float(np.nanmin(raw_depth))
    d_max = float(np.nanmax(raw_depth))
    
    if abs(d_max - d_min) < 1e-7:
        # Perfectly flat output
        return np.zeros_like(raw_depth, dtype=np.float32)
    
    normalized = (raw_depth - d_min) / (d_max - d_min)
    return np.clip(normalized, 0.0, 1.0).astype(np.float32)

def generate_preview_image(normalized_depth: np.ndarray, colormap: str = "turbo") -> np.ndarray:
    """
    Generates an 8-bit color-mapped RGB preview image for web visualization.
    Note: This is strictly for visualization and is not metric elevation.
    """
    uint8_depth = (normalized_depth * 255.0).astype(np.uint8)

    colormap_map = {
        "turbo": cv2.COLORMAP_TURBO,
        "viridis": cv2.COLORMAP_VIRIDIS,
        "inferno": cv2.COLORMAP_INFERNO,
        "plasma": cv2.COLORMAP_PLASMA,
        "jet": cv2.COLORMAP_JET,
        "bone": cv2.COLORMAP_BONE,
    }

    if colormap == "grayscale":
        # Standard 3-channel grayscale
        rgb = cv2.cvtColor(uint8_depth, cv2.COLOR_GRAY2RGB)
    else:
        cv_cmap = colormap_map.get(colormap.lower(), cv2.COLORMAP_TURBO)
        bgr = cv2.applyColorMap(uint8_depth, cv_cmap)
        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
        
    return rgb

def save_outputs(
    raw_depth: np.ndarray,
    normalized_depth: np.ndarray,
    output_dir: str,
    base_id: str,
    colormap: str = "turbo"
) -> dict:
    """
    Saves:
    1. Raw float32 numpy array (.npy)
    2. Normalized 8-bit color-mapped preview (.png)
    3. Normalized 8-bit grayscale preview (.png)
    """
    os.makedirs(output_dir, exist_ok=True)

    npy_filename = f"{base_id}_raw_disparity.npy"
    png_filename = f"{base_id}_preview_{colormap}.png"
    gray_filename = f"{base_id}_preview_grayscale.png"

    npy_path = os.path.join(output_dir, npy_filename)
    png_path = os.path.join(output_dir, png_filename)
    gray_path = os.path.join(output_dir, gray_filename)

    # 1. Save raw float32 array
    np.save(npy_path, raw_depth.astype(np.float32))

    # 2. Save color-mapped preview
    color_preview = generate_preview_image(normalized_depth, colormap=colormap)
    Image.fromarray(color_preview).save(png_path, format="PNG", optimize=True)

    # 3. Save grayscale preview
    gray_preview = generate_preview_image(normalized_depth, colormap="grayscale")
    Image.fromarray(gray_preview).save(gray_path, format="PNG", optimize=True)

    return {
        "raw_npy_path": npy_path,
        "preview_png_path": png_path,
        "grayscale_png_path": gray_path,
        "raw_npy_filename": npy_filename,
        "preview_png_filename": png_filename,
        "grayscale_png_filename": gray_filename,
    }
