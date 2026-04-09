/* ============================================================
   Kisan Dost — Crop Disease Scanner  v2.0
   
   Analysis pipeline (in priority order):
   1. Python FastAPI backend  (EfficientNetB4, localhost:3000)
   2. Gemini Vision API       (cloud, online only)
   3. Mock / demo data        (offline fallback)
   ============================================================ */

const CropScanner = (() => {

  // ── Configuration ──────────────────────────────────────────
  const BACKEND_URL    = 'http://localhost:8000';
  const BACKEND_TIMEOUT = 30000; // 30 s — model inference can be slow

  let _stream        = null;
  let _capturedImage = null;
  let _backendOnline = null; // null = not yet checked

  /* ── Check if backend is reachable ── */
  async function _checkBackend() {
    if (_backendOnline !== null) return _backendOnline;
    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 3000);
      const res = await fetch(`${BACKEND_URL}/health`, { signal: ctrl.signal });
      _backendOnline = res.ok;
    } catch (_) {
      _backendOnline = false;
    }
    console.log('[CropScanner] Backend online:', _backendOnline);
    return _backendOnline;
  }

  /* Reset backend status so next scan retries */
  function _resetBackendStatus() { _backendOnline = null; }

  // ──────────────────────────────────────────────────────────
  //  Camera
  // ──────────────────────────────────────────────────────────

  async function openCamera() {
    try {
      _stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      return _stream;
    } catch (err) {
      console.error('[CropScanner] Camera error:', err);
      throw err;
    }
  }

  function closeCamera() {
    if (_stream) { _stream.getTracks().forEach(t => t.stop()); _stream = null; }
  }

  function captureFrame(video) {
    const canvas = document.createElement('canvas');
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    _capturedImage = { base64: dataUrl.split(',')[1], mimeType: 'image/jpeg', dataUrl };
    return _capturedImage;
  }

  function processUpload(file) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) { reject(new Error('Please select an image file')); return; }
      if (file.size > 10 * 1024 * 1024)   { reject(new Error('Image too large. Max 10MB'));    return; }
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target.result;
        _capturedImage = { base64: dataUrl.split(',')[1], mimeType: file.type, dataUrl, file };
        resolve(_capturedImage);
      };
      reader.onerror = () => reject(new Error('Could not read file'));
      reader.readAsDataURL(file);
    });
  }

  function getCapturedImage() { return _capturedImage; }
  function clearImage()       { _capturedImage = null; }
  function isCameraSupported() { return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia); }

  // ──────────────────────────────────────────────────────────
  //  Analysis — backend → Gemini → mock
  // ──────────────────────────────────────────────────────────

  async function analyze(lang = 'hi') {
    if (!_capturedImage) throw new Error('No image captured. Please take or upload a photo.');

    const img = _capturedImage;

    // ── 1. Try Python backend ──────────────────────────────
    const backendOk = await _checkBackend();
    if (backendOk) {
      try {
        const result = await _analyzeWithBackend(img, lang);
        console.log('[CropScanner] Backend result:', result);
        return result;
      } catch (err) {
        console.warn('[CropScanner] Backend failed, trying Gemini:', err.message);
        _backendOnline = false; // don't retry this session
      }
    }

    // ── 2. Try Gemini Vision API ───────────────────────────
    if (navigator.onLine) {
      try {
        const result = await GeminiAI.analyzeCropDisease(img.base64, img.mimeType, lang);
        return { ...result, source: 'gemini' };
      } catch (err) {
        console.warn('[CropScanner] Gemini failed, using mock:', err.message);
      }
    }

    // ── 3. Mock fallback ───────────────────────────────────
    console.info('[CropScanner] Using mock demo data');
    return { ...GeminiAI.getMockDiseaseResult(lang), source: 'demo' };
  }

  /* POST base64 image to /predict/base64 */
  async function _analyzeWithBackend(img, lang) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), BACKEND_TIMEOUT);

    let response;
    try {
      // If we have the raw File object, use multipart (faster, avoids base64 overhead)
      if (img.file instanceof File) {
        response = await _backendFileUpload(img.file, ctrl.signal);
      } else {
        // Camera capture — send as base64 JSON
        response = await fetch(`${BACKEND_URL}/predict/base64`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ image: img.base64, mime_type: img.mimeType, lang }),
          signal:  ctrl.signal,
        });
      }
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(`Backend ${response.status}: ${err.detail || response.statusText}`);
    }

    const data = await response.json();
    // Backend wraps in { prediction: ... } for old format OR returns flat for new format
    return data.prediction ? _normalise(data.prediction) : data;
  }

  async function _backendFileUpload(file, signal) {
    const form = new FormData();
    form.append('file', file, file.name || 'crop.jpg');
    return fetch(`${BACKEND_URL}/predict`, { method: 'POST', body: form, signal });
  }

  /* Normalise old-format backend response → frontend format */
  function _normalise(raw) {
    if (!raw || typeof raw !== 'object') return GeminiAI.getMockDiseaseResult('hi');
    // If backend already returns rich format (new app.py), pass through
    if (raw.status) return raw;
    // Old flat format: { class, confidence, top_predictions }
    const cls   = (raw.class || '').toLowerCase();
    const conf  = raw.confidence || 0;
    const isHlth = cls.includes('healthy');
    return {
      source:     'backend',
      crop:       _parseCropName(raw.class || 'Unknown'),
      status:     isHlth ? 'Healthy' : 'Diseased',
      disease:    isHlth ? 'No disease detected' : _parseDiseaseLabel(raw.class || ''),
      severity:   isHlth ? 'N/A' : 'Moderate',
      symptoms:   isHlth ? 'Plant looks healthy.' : 'See backend for detailed symptoms.',
      treatment:  isHlth ? 'Continue regular care.' : 'Consult local agronomist.',
      prevention: 'Maintain proper watering, fertilization and spacing.',
      confidence: typeof conf === 'number' && conf <= 1 ? Math.round(conf * 100) : Math.round(conf),
      top_predictions: raw.top_predictions || [],
    };
  }

  function _parseCropName(raw) {
    const p = (raw || '').split('___')[0];
    return p.replace(/_/g, ' ').replace(/\(.*?\)/g, '').trim() || 'Unknown';
  }

  function _parseDiseaseLabel(raw) {
    const parts = (raw || '').split('___');
    return (parts[1] || parts[0] || 'Unknown').replace(/_/g, ' ').trim();
  }

  return {
    openCamera, closeCamera, captureFrame,
    processUpload, analyze,
    getCapturedImage, clearImage,
    isCameraSupported,
    resetBackendStatus: _resetBackendStatus,
    checkBackend:       _checkBackend,
  };
})();
