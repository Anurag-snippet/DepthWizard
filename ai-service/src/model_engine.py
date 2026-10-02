"""
DepthWizard AI Monocular Depth Model Engine
Manages singleton TensorFlow Lite Interpreter for Intel ISL MiDaS v2.1 Small model.
Provides memory-conscious inference, thread safety, and scientific metadata.
"""
import os
import time
import logging
import threading
import numpy as np
import tensorflow as tf

from .preprocessing import decode_image_bytes, validate_image_dimensions, prepare_input_tensor
from .postprocessing import resize_to_source_dimensions, normalize_disparity, save_outputs

logger = logging.getLogger("depthwizard.ai.engine")

MODEL_METADATA = {
    "model_name": "MiDaS v2.1 Small (TFLite)",
    "architecture": "EfficientNet-Lite3 / MobileNet Multi-Scale Feature Fusion",
    "developer": "Intel Intelligent Systems Lab (ISL) / René Ranftl et al.",
    "license": "MIT License",
    "input_dimensions": [1, 256, 256, 3],
    "input_range": "ImageNet Normalized (mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])",
    "output_dimensions": [1, 256, 256, 1],
    "output_type": "Relative Inverse Depth / Disparity (Unitless)",
    "framework": "TensorFlow Lite with XNNPACK Delegate",
    "is_metric": False,
    "metric_notice": (
        "Output is scale-ambiguous relative disparity [0, 1]. "
        "Physical metric elevation (metres) requires explicit reference DEM/GCP calibration (Phase 5)."
    )
}

class DepthEstimationEngine:
    _instance = None
    _lock = threading.Lock()

    def __init__(self, model_path: str):
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found at: {model_path}")
        
        self.model_path = model_path
        self.interpreter = None
        self.input_details = None
        self.output_details = None
        self.input_index = None
        self.output_index = None
        self._inference_lock = threading.Lock()
        
        self._load_model()

    @classmethod
    def get_instance(cls, model_path: str = None):
        """Thread-safe singleton pattern for model loading once at startup."""
        with cls._lock:
            if cls._instance is None:
                if model_path is None:
                    # Default path
                    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                    model_path = os.path.join(base_dir, "models", "weights", "midas_v21_small.tflite")
                logger.info(f"Initializing DepthEstimationEngine with model: {model_path}")
                cls._instance = cls(model_path)
            return cls._instance

    def _load_model(self):
        t0 = time.time()
        logger.info(f"Loading TensorFlow Lite interpreter from {self.model_path}...")
        
        self.interpreter = tf.lite.Interpreter(
            model_path=self.model_path,
            num_threads=4
        )
        self.interpreter.allocate_tensors()
        
        self.input_details = self.interpreter.get_input_details()
        self.output_details = self.interpreter.get_output_details()
        self.input_index = self.input_details[0]['index']
        self.output_index = self.output_details[0]['index']
        
        # Warmup inference
        dummy_input = np.zeros(self.input_details[0]['shape'], dtype=np.float32)
        self.interpreter.set_tensor(self.input_index, dummy_input)
        self.interpreter.invoke()
        
        logger.info(f"Model loaded and warmed up in {(time.time() - t0):.2f}s.")

    def run_inference(
        self,
        image_bytes: bytes,
        filename: str,
        output_dir: str,
        processing_id: str,
        colormap: str = "turbo"
    ) -> dict:
        """
        Executes end-to-end depth estimation on input image bytes.
        """
        start_time = time.time()

        # 1. Decode & validate image
        t_decode = time.time()
        rgb_img = decode_image_bytes(image_bytes, filename=filename)
        validate_image_dimensions(rgb_img)
        orig_h, orig_w = rgb_img.shape[:2]

        # 2. Preprocess & normalize tensor
        input_tensor, orig_shape = prepare_input_tensor(rgb_img, target_size=256)

        # 3. Model inference (thread-safe execution)
        t_infer_start = time.time()
        with self._inference_lock:
            self.interpreter.set_tensor(self.input_index, input_tensor)
            self.interpreter.invoke()
            raw_output = self.interpreter.get_tensor(self.output_index)
        infer_duration_ms = (time.time() - t_infer_start) * 1000.0

        # 4. Postprocessing: restore source dimensions & normalize
        raw_disparity_full = resize_to_source_dimensions(raw_output, orig_shape)
        normalized_disparity = normalize_disparity(raw_disparity_full)

        # 5. Save outputs (.npy and .png)
        saved_files = save_outputs(
            raw_depth=raw_disparity_full,
            normalized_depth=normalized_disparity,
            output_dir=output_dir,
            base_id=processing_id,
            colormap=colormap
        )

        total_duration_ms = (time.time() - start_time) * 1000.0

        # Disparity numerical metrics (clearly labeled as relative)
        stats = {
            "min_raw_disparity": float(np.nanmin(raw_disparity_full)),
            "max_raw_disparity": float(np.nanmax(raw_disparity_full)),
            "mean_raw_disparity": float(np.nanmean(raw_disparity_full)),
            "std_raw_disparity": float(np.nanstd(raw_disparity_full)),
            "is_finite": bool(np.all(np.isfinite(raw_disparity_full))),
        }

        return {
            "processing_id": processing_id,
            "filename": filename,
            "original_dimensions": {"width": orig_w, "height": orig_h, "channels": 3},
            "prediction_dimensions": {"width": orig_w, "height": orig_h},
            "inference_duration_ms": round(infer_duration_ms, 2),
            "total_processing_duration_ms": round(total_duration_ms, 2),
            "model_info": MODEL_METADATA,
            "files": saved_files,
            "statistics": stats,
            "output_type": "relative_inverse_depth",
            "is_metric": False,
        }
