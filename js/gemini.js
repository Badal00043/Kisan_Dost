/* ============================================================
   Kisan Dost — Gemini AI Service
   Integration with Google Gemini 2.5 Flash for:
   1. Daily Actionable Insights (weather-based)
   2. Voice assistant Q&A
   3. Crop disease prediction (image analysis)
   ============================================================ */

const GeminiAI = (() => {
  // ----------------------------------------------------------------
  // 🔑  CONFIGURATION
  // ----------------------------------------------------------------
  const API_KEY = 'AIzaSyDLZgGf22i4jJ6POPgeNs_SDwYeZamdxus';
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

  let _lastInsights = null;
  let _insightsTimestamp = 0;
  const INSIGHTS_TTL = 30 * 60 * 1000; // 30 min cache

  // ---- DAILY ACTIONABLE INSIGHTS ---- //

  /**
   * Generate daily actionable farming insights from weather data.
   * @param {Object} weatherData - Current weather data
   * @param {Object} forecastData - 5-day forecast data
   * @param {string} lang - Language code (en, hi, mr, bn)
   * @returns {Promise<Object>} Parsed insights
   */
  async function getDailyInsights(weatherData, forecastData, lang = 'hi') {
    // Check cache
    if (_lastInsights && (Date.now() - _insightsTimestamp) < INSIGHTS_TTL) {
      console.log('[Gemini] Serving insights from cache');
      return _lastInsights;
    }

    if (!navigator.onLine) {
      console.warn('[Gemini] Offline — cannot fetch insights');
      return getCachedInsights();
    }

    const langNames = { en: 'English', hi: 'Hindi', mr: 'Marathi', bn: 'Bengali' };
    const langName = langNames[lang] || 'Hindi';

    const prompt = buildInsightsPrompt(weatherData, forecastData, langName);

    try {
      const response = await callGemini(prompt);
      const insights = parseInsightsResponse(response);
      
      // Cache
      _lastInsights = insights;
      _insightsTimestamp = Date.now();

      // Persist to localStorage
      try {
        localStorage.setItem('kd_ai_insights', JSON.stringify(insights));
        localStorage.setItem('kd_ai_insights_ts', Date.now().toString());
      } catch (e) { /* storage full */ }

      return insights;
    } catch (err) {
      console.error('[Gemini] Insights error:', err);
      return getCachedInsights() || getDefaultInsights();
    }
  }

  function buildInsightsPrompt(weather, forecast, langName) {
    const w = weather || {};
    const f = forecast?.days || [];

    let forecastStr = '';
    f.forEach((day, i) => {
      forecastStr += `Day ${i + 1} (${day.dayName}): High ${day.tempHigh}°C, Low ${day.tempLow}°C, ${day.condition}, Humidity ${day.humidity}%, Wind ${day.wind} km/h, Rain probability ${day.rainProb}%\n`;
    });

    return `You are "Kisan Dost AI" — a smart farming assistant for Indian farmers.

CURRENT WEATHER DATA:
- Location: ${w.city || 'India'}, ${w.country || 'IN'}
- Temperature: ${w.temp}°C (Feels like: ${w.feels_like}°C)
- Humidity: ${w.humidity}%
- Wind Speed: ${w.wind_speed} km/h
- Condition: ${w.condition} (${w.description})
- Clouds: ${w.clouds}%
- Rain (1h): ${w.rain_1h} mm
- Visibility: ${w.visibility}m

5-DAY FORECAST:
${forecastStr}

INSTRUCTIONS:
1. Generate exactly 5 daily actionable farming insights based on this weather data.
2. Each insight must be practical, specific, and immediately actionable.
3. Use data to give precise advice (e.g., "Based on 34°C temp and 62% humidity, increase watering by 20% today").
4. Include crop-specific advice relevant to Indian farming (wheat, rice, cotton, sugarcane, etc.)
5. Respond in ${langName} language.
6. Format as JSON array with objects having "title", "description", "priority" (high/medium/low), and "icon" (emoji).

Example format:
[
  {"title": "🌡️ Title", "description": "Detailed advice...", "priority": "high", "icon": "🌡️"},
  ...
]

Return ONLY the JSON array, no additional text or markdown.`;
  }

  function parseInsightsResponse(text) {
    try {
      // Extract JSON from response
      let jsonStr = text.trim();
      
      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
      }
      
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) return parsed;
      return [parsed];
    } catch (e) {
      console.warn('[Gemini] Could not parse insights JSON:', e);
      // Try to extract JSON array from text
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        try { return JSON.parse(match[0]); } catch (e2) { /* fallback */ }
      }
      return getDefaultInsights();
    }
  }

  function getCachedInsights() {
    try {
      const cached = localStorage.getItem('kd_ai_insights');
      if (cached) return JSON.parse(cached);
    } catch (e) { /* no cache */ }
    return null;
  }

  function getDefaultInsights() {
    return [
      { title: '🌡️ तापमान सलाह', description: 'मौसम डेटा के आधार पर अपनी फसलों की देखभाल करें।', priority: 'medium', icon: '🌡️' },
      { title: '💧 सिंचाई टिप', description: 'मिट्टी की नमी जांचें और जरूरत अनुसार पानी दें।', priority: 'medium', icon: '💧' },
      { title: '🌿 फसल प्रबंधन', description: 'नियमित रूप से फसलों की निगरानी करें।', priority: 'low', icon: '🌿' }
    ];
  }

  // ---- VOICE ASSISTANT Q&A ---- //

  /**
   * Get AI response for voice assistant query.
   * @param {string} userQuery - User's spoken text
   * @param {Object} weatherData - Current weather for context
   * @param {string} lang - Language code
   * @returns {Promise<string>} AI reply text
   */
  async function getVoiceResponse(userQuery, weatherData, lang = 'hi') {
    if (!navigator.onLine) {
      return lang === 'en' 
        ? 'I need internet to answer your question. Please try again when online.'
        : 'आपके सवाल का जवाब देने के लिए इंटरनेट चाहिए। कृपया ऑनलाइन होने पर फिर से कोशिश करें।';
    }

    const langNames = { en: 'English', hi: 'Hindi', mr: 'Marathi', bn: 'Bengali' };
    const langName = langNames[lang] || 'Hindi';
    const w = weatherData || {};

    const prompt = `You are "Kisan Dost AI" — a smart farming voice assistant for Indian farmers.

CURRENT WEATHER CONTEXT:
- Location: ${w.city || 'India'}
- Temperature: ${w.temp || 'N/A'}°C, Humidity: ${w.humidity || 'N/A'}%, Wind: ${w.wind_speed || 'N/A'} km/h
- Condition: ${w.condition || 'N/A'}

USER'S QUESTION (spoken in ${langName}):
"${userQuery}"

INSTRUCTIONS:
1. Answer the farmer's question in ${langName} language.
2. Keep the response concise (2-3 sentences max) since it will be spoken aloud.
3. If the question is about farming, provide practical, actionable advice.
4. If the question is about weather, use the weather context above.
5. Be friendly and helpful, use simple language that a farmer would understand.
6. Do NOT use any markdown formatting, just plain text.`;

    try {
      const response = await callGemini(prompt);
      return response.trim();
    } catch (err) {
      console.error('[Gemini] Voice response error:', err);
      return lang === 'en'
        ? 'Sorry, I could not process your question. Please try again.'
        : 'माफ करें, मैं आपके सवाल का जवाब नहीं दे पाया। कृपया फिर से कोशिश करें।';
    }
  }

  // ---- CROP DISEASE PREDICTION ---- //

  /**
   * Analyze a crop image for disease prediction.
   * @param {string} base64Image - Base64-encoded image data
   * @param {string} mimeType - Image MIME type (e.g., 'image/jpeg')
   * @param {string} lang - Language code
   * @returns {Promise<Object>} Disease analysis result
   */
  async function analyzeCropDisease(base64Image, mimeType, lang = 'hi') {
    if (!navigator.onLine) {
      throw new Error('Internet connection required for crop analysis');
    }

    const langNames = { en: 'English', hi: 'Hindi', mr: 'Marathi', bn: 'Bengali' };
    const langName = langNames[lang] || 'Hindi';

    const prompt = `You are an expert agricultural plant pathologist AI assistant called "Kisan Dost AI".

Analyze this crop/plant image and provide:

1. **Plant/Crop Identification**: What crop or plant is shown?
2. **Health Status**: Is the plant healthy or diseased?
3. **Disease Identification**: If diseased, what is the specific disease name?
4. **Severity**: Rate severity as "Mild", "Moderate", or "Severe"
5. **Symptoms**: Describe visible symptoms
6. **Treatment**: Provide specific treatment recommendations (organic + chemical options)
7. **Prevention**: How to prevent this disease in future

IMPORTANT:
- Respond in ${langName} language
- Be specific about pesticide/fungicide names and dosages
- Include both organic and chemical treatment options
- Format as JSON with keys: "crop", "status", "disease", "severity", "symptoms", "treatment", "prevention", "confidence"
- "confidence" should be a percentage (0-100)
- If you cannot identify the plant or disease clearly, set confidence below 50 and mention that

Return ONLY the JSON object, no additional text or markdown.`;

    try {
      const response = await callGeminiWithImage(prompt, base64Image, mimeType);
      return parseDiseaseResponse(response);
    } catch (err) {
      console.error('[Gemini] Crop disease analysis error:', err);
      throw err;
    }
  }

  function parseDiseaseResponse(text) {
    try {
      let jsonStr = text.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
      }
      return JSON.parse(jsonStr);
    } catch (e) {
      // Try to extract JSON from text
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try { return JSON.parse(match[0]); } catch (e2) { /* fallback */ }
      }
      return {
        crop: 'Unknown',
        status: 'Could not analyze',
        disease: 'N/A',
        severity: 'N/A',
        symptoms: text,
        treatment: 'Please try with a clearer image',
        prevention: 'N/A',
        confidence: 0
      };
    }
  }

  // ---- CORE API CALLS ---- //

  /**
   * Call Gemini API with text-only prompt
   */
  async function callGemini(prompt) {
    const body = {
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024
      }
    };

    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Gemini API error ${resp.status}: ${errText}`);
    }

    const data = await resp.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  /**
   * Call Gemini API with image + text (multimodal)
   */
  async function callGeminiWithImage(prompt, base64Image, mimeType) {
    const body = {
      contents: [{
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType || 'image/jpeg',
              data: base64Image
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 2048
      }
    };

    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Gemini Vision API error ${resp.status}: ${errText}`);
    }

    const data = await resp.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  // ---- PUBLIC API ---- //
  return {
    getDailyInsights,
    getVoiceResponse,
    analyzeCropDisease,
    getDefaultInsights
  };
})();
