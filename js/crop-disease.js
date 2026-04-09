/* ============================================================
   Kisan Dost — Crop Disease Prediction Module
   Camera capture & image upload for AI-powered disease analysis
   ============================================================ */

const CropScanner = (() => {
  let _stream = null;
  let _capturedImage = null;

  /**
   * Open camera for live capture.
   * @returns {Promise<MediaStream>}
   */
  async function openCamera() {
    try {
      _stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      return _stream;
    } catch (err) {
      console.error('[CropScanner] Camera error:', err);
      throw err;
    }
  }

  /** Stop camera stream */
  function closeCamera() {
    if (_stream) {
      _stream.getTracks().forEach(track => track.stop());
      _stream = null;
    }
  }

  /**
   * Capture a frame from video element.
   * @param {HTMLVideoElement} video
   * @returns {{base64: string, mimeType: string}}
   */
  function captureFrame(video) {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const base64 = dataUrl.split(',')[1];
    _capturedImage = { base64, mimeType: 'image/jpeg', dataUrl };
    return _capturedImage;
  }

  /**
   * Process an uploaded file.
   * @param {File} file
   * @returns {Promise<{base64: string, mimeType: string, dataUrl: string}>}
   */
  function processUpload(file) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Please select an image file'));
        return;
      }

      // Limit to 10MB
      if (file.size > 10 * 1024 * 1024) {
        reject(new Error('Image too large. Max 10MB'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        const base64 = dataUrl.split(',')[1];
        const mimeType = file.type;
        _capturedImage = { base64, mimeType, dataUrl };
        resolve(_capturedImage);
      };
      reader.onerror = () => reject(new Error('Could not read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Analyze the captured/uploaded image.
   * @param {string} lang - Language code
   * @returns {Promise<Object>} Disease analysis result
   */
  async function analyze(lang = 'hi') {
    if (!_capturedImage) {
      throw new Error('No image captured. Please take a photo or upload one.');
    }
    return GeminiAI.analyzeCropDisease(
      _capturedImage.base64,
      _capturedImage.mimeType,
      lang
    );
  }

  /** Get the captured image data */
  function getCapturedImage() {
    return _capturedImage;
  }

  /** Clear captured image */
  function clearImage() {
    _capturedImage = null;
  }

  /** Check if camera is supported */
  function isCameraSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  return {
    openCamera,
    closeCamera,
    captureFrame,
    processUpload,
    analyze,
    getCapturedImage,
    clearImage,
    isCameraSupported
  };
})();
