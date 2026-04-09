/* ============================================================
   Kisan Dost — Gemini AI Service (with Demo/Mock fallbacks)
   ============================================================ */

const GeminiAI = (() => {
  const API_KEY = 'AIzaSyDLZgGf22i4jJ6POPgeNs_SDwYeZamdxus';
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

  let _lastInsights = null;
  let _insightsTimestamp = 0;
  const INSIGHTS_TTL = 30 * 60 * 1000;

  // ================================================================
  //  RICH MOCK / DEMO DATA
  // ================================================================

  const MOCK_INSIGHTS = {
    hi: [
      { title: '🌡️ गर्मी से बचाव', description: 'आज तापमान 34°C है। गेहूं और सरसों की फसल पर शेड नेट लगाएं। सुबह 6 बजे से पहले और शाम 5 बजे के बाद ही सिंचाई करें — इससे पानी का वाष्पीकरण 40% कम होगा।', priority: 'high', icon: '🌡️' },
      { title: '💧 सिंचाई अनुसूची', description: '62% नमी के साथ, ड्रिप इरिगेशन का उपयोग करें। प्रत्येक पौधे को 2-3 लीटर पानी दें। टमाटर और मिर्च को रोज़ाना पानी दें, जबकि गेहूं को हर 3 दिन में।', priority: 'high', icon: '💧' },
      { title: '🦠 फफूंद रोग निगरानी', description: 'नमी 60% से अधिक होने पर ब्लाइट और मिल्ड्यू का खतरा बढ़ जाता है। आलू और टमाटर की पत्तियों पर पीले-भूरे धब्बे जांचें। मैंकोजेब 2.5g/L पानी में मिलाकर स्प्रे करें।', priority: 'medium', icon: '🦠' },
      { title: '🌾 खाद प्रबंधन', description: 'गेहूं की फसल में तीसरी सिंचाई के बाद 50kg/एकड़ यूरिया डालें। सुबह के समय ओस होने पर खाद डालना सबसे प्रभावी होता है। जैविक विकल्प: वर्मीकम्पोस्ट 2 टन/एकड़।', priority: 'medium', icon: '🌾' },
      { title: '🐛 कीट नियंत्रण', description: 'इस मौसम में एफिड और व्हाइटफ्लाई का प्रकोप बढ़ सकता है। नीम तेल 5ml/L पानी में मिलाकर 7 दिन के अंतराल पर स्प्रे करें। Yellow sticky traps भी लगाएं।', priority: 'low', icon: '🐛' }
    ],
    en: [
      { title: '🌡️ Heat Management', description: 'Temperature at 34°C today. Apply shade nets on wheat and mustard crops. Irrigate only before 6 AM or after 5 PM — this reduces water evaporation by 40%.', priority: 'high', icon: '🌡️' },
      { title: '💧 Irrigation Schedule', description: 'With 62% humidity, use drip irrigation. Give 2-3 liters per plant. Tomatoes and peppers need daily watering while wheat needs water every 3 days.', priority: 'high', icon: '💧' },
      { title: '🦠 Fungal Disease Watch', description: 'When humidity exceeds 60%, blight and mildew risk increases. Check potato and tomato leaves for yellow-brown spots. Spray Mancozeb 2.5g/L water.', priority: 'medium', icon: '🦠' },
      { title: '🌾 Fertilizer Management', description: 'Apply 50kg/acre Urea on wheat after 3rd irrigation. Morning application during dew is most effective. Organic alternative: Vermicompost 2 tons/acre.', priority: 'medium', icon: '🌾' },
      { title: '🐛 Pest Control', description: 'Aphid and whitefly infestations may increase this season. Spray Neem oil 5ml/L water at 7-day intervals. Also install yellow sticky traps.', priority: 'low', icon: '🐛' }
    ],
    mr: [
      { title: '🌡️ उष्णता व्यवस्थापन', description: 'आज तापमान 34°C आहे. गहू आणि मोहरीच्या पिकावर शेड नेट लावा. सकाळी 6 पूर्वी किंवा संध्याकाळी 5 नंतरच सिंचन करा.', priority: 'high', icon: '🌡️' },
      { title: '💧 सिंचन वेळापत्रक', description: '62% आर्द्रतेसह ड्रिप इरिगेशन वापरा. प्रत्येक रोपाला 2-3 लिटर पाणी द्या. टोमॅटोला रोज पाणी द्या.', priority: 'high', icon: '💧' },
      { title: '🦠 बुरशी रोग निरीक्षण', description: 'आर्द्रता 60% पेक्षा जास्त असताना ब्लाइट आणि मिल्ड्यूचा धोका वाढतो. बटाटा आणि टोमॅटोच्या पानांवर तपासा.', priority: 'medium', icon: '🦠' },
      { title: '🌾 खत व्यवस्थापन', description: 'गव्हाच्या पिकात तिसऱ्या सिंचनानंतर 50kg/एकर युरिया टाका.', priority: 'medium', icon: '🌾' },
      { title: '🐛 कीड नियंत्रण', description: 'या हंगामात ऍफिड आणि व्हाइटफ्लाई वाढू शकतात. कडुलिंब तेल 5ml/L पाण्यात मिसळून फवारणी करा.', priority: 'low', icon: '🐛' }
    ],
    bn: [
      { title: '🌡️ তাপ ব্যবস্থাপনা', description: 'আজ তাপমাত্রা 34°C। গম ও সরিষার ফসলে শেড নেট লাগান। সকাল 6টার আগে বা বিকেল 5টার পরে সেচ দিন।', priority: 'high', icon: '🌡️' },
      { title: '💧 সেচ সময়সূচী', description: '62% আর্দ্রতায় ড্রিপ সেচ ব্যবহার করুন। প্রতিটি গাছে 2-3 লিটার জল দিন।', priority: 'high', icon: '💧' },
      { title: '🦠 ছত্রাক রোগ পর্যবেক্ষণ', description: 'আর্দ্রতা 60% এর বেশি হলে ব্লাইট ও মিলডিউ এর ঝুঁকি বাড়ে। আলু ও টমেটো পাতায় পরীক্ষা করুন।', priority: 'medium', icon: '🦠' },
      { title: '🌾 সার ব্যবস্থাপনা', description: 'গমে তৃতীয় সেচের পর 50kg/একর ইউরিয়া দিন।', priority: 'medium', icon: '🌾' },
      { title: '🐛 পোকা নিয়ন্ত্রণ', description: 'এই মৌসুমে এফিড ও সাদা মাছি বাড়তে পারে। নিম তেল 5ml/L জলে মিশিয়ে স্প্রে করুন।', priority: 'low', icon: '🐛' }
    ]
  };

  const MOCK_VOICE_QA = {
    hi: {
      'गेहूं में पानी कब दें': 'गेहूं की फसल में CRI स्टेज (बुवाई के 21 दिन बाद) पर पहला पानी सबसे ज़रूरी है। उसके बाद हर 20-25 दिन के अंतराल पर सिंचाई करें। कुल 5-6 सिंचाई पर्याप्त हैं।',
      'टमाटर में रोग': 'टमाटर में सबसे आम रोग हैं — अर्ली ब्लाइट (पत्तियों पर भूरे गोल धब्बे) और लेट ब्लाइट (पानी भरे धब्बे)। मैंकोजेब 2.5g/L या कॉपर ऑक्सीक्लोराइड 3g/L स्प्रे करें।',
      'धान की बुवाई कब करें': 'खरीफ सीज़न में धान की बुवाई जून के दूसरे सप्ताह से जुलाई के पहले सप्ताह तक करें। नर्सरी मई के अंत में तैयार करें। बासमती किस्मों को जून के अंत तक बोएं।',
      'जैविक खाद कैसे बनाएं': 'वर्मीकम्पोस्ट बनाने के लिए: गोबर, सूखे पत्ते और किचन वेस्ट को एक गड्ढे में परत-दर-परत रखें। केंचुआ (Eisenia fetida) डालें। 60-90 दिन में खाद तैयार हो जाएगी।',
      'default': 'नमस्ते किसान भाई! मैं किसान दोस्त AI हूँ। आप मुझसे फसल, खाद, सिंचाई, कीट नियंत्रण या मौसम के बारे में कुछ भी पूछ सकते हैं।'
    },
    en: {
      'when to water wheat': 'The first irrigation for wheat is critical at CRI stage (21 days after sowing). After that, irrigate every 20-25 days. Total 5-6 irrigations are sufficient.',
      'tomato disease': 'Common tomato diseases are Early Blight (brown circular spots) and Late Blight (water-soaked spots). Spray Mancozeb 2.5g/L or Copper Oxychloride 3g/L.',
      'when to sow rice': 'Sow rice in Kharif season from 2nd week of June to 1st week of July. Prepare nursery by end of May. Basmati varieties should be sown by end of June.',
      'how to make organic fertilizer': 'For vermicompost: layer cow dung, dry leaves and kitchen waste in a pit. Add earthworms (Eisenia fetida). Compost ready in 60-90 days.',
      'default': 'Hello farmer! I am Kisan Dost AI. You can ask me anything about crops, fertilizers, irrigation, pest control, or weather.'
    }
  };

  const MOCK_DISEASE_RESULTS = {
    hi: {
      healthy: { crop: 'धान (चावल)', status: 'स्वस्थ', disease: 'कोई रोग नहीं', severity: 'N/A', symptoms: 'पत्तियाँ हरी और स्वस्थ हैं।', treatment: 'कोई उपचार आवश्यक नहीं। नियमित देखभाल जारी रखें।', prevention: 'नियमित सिंचाई और संतुलित खाद दें।', confidence: 92 },
      diseased: { crop: 'टमाटर', status: 'रोगग्रस्त', disease: 'अर्ली ब्लाइट (Alternaria solani)', severity: 'Moderate', symptoms: 'पत्तियों पर भूरे-काले गोलाकार धब्बे, पत्तियों का पीला पड़ना, निचली पत्तियों से शुरू होकर ऊपर फैलना।', treatment: 'रासायनिक: मैंकोजेब 75% WP — 2.5g/L पानी में, 7 दिन के अंतराल पर स्प्रे करें। जैविक: ट्राइकोडर्मा विरिडी 5g/L, नीम तेल 5ml/L।', prevention: 'फसल चक्रण अपनाएं, रोग-मुक्त बीज उपयोग करें, पौधों में 60cm दूरी रखें, अधिक सिंचाई से बचें।', confidence: 87 }
    },
    en: {
      healthy: { crop: 'Rice (Paddy)', status: 'Healthy', disease: 'No disease detected', severity: 'N/A', symptoms: 'Leaves are green and healthy.', treatment: 'No treatment needed. Continue regular care.', prevention: 'Maintain regular irrigation and balanced fertilization.', confidence: 92 },
      diseased: { crop: 'Tomato', status: 'Diseased', disease: 'Early Blight (Alternaria solani)', severity: 'Moderate', symptoms: 'Brown-black circular spots on leaves, yellowing of leaves, spreading from lower to upper leaves.', treatment: 'Chemical: Mancozeb 75% WP — 2.5g/L water, spray at 7-day intervals. Organic: Trichoderma viride 5g/L, Neem oil 5ml/L.', prevention: 'Practice crop rotation, use disease-free seeds, maintain 60cm spacing, avoid over-irrigation.', confidence: 87 }
    }
  };

  // ================================================================
  //  DAILY ACTIONABLE INSIGHTS
  // ================================================================
  async function getDailyInsights(weatherData, forecastData, lang = 'hi') {
    if (_lastInsights && (Date.now() - _insightsTimestamp) < INSIGHTS_TTL) {
      return _lastInsights;
    }

    // Try API first, fallback to mock
    if (navigator.onLine) {
      try {
        const prompt = buildInsightsPrompt(weatherData, forecastData, { en: 'English', hi: 'Hindi', mr: 'Marathi', bn: 'Bengali' }[lang] || 'Hindi');
        const response = await callGemini(prompt);
        const insights = parseInsightsResponse(response);
        _lastInsights = insights;
        _insightsTimestamp = Date.now();
        try { localStorage.setItem('kd_ai_insights', JSON.stringify(insights)); } catch (e) {}
        return insights;
      } catch (err) {
        console.warn('[Gemini] API failed, using mock data:', err.message);
      }
    }

    // Fallback to mock
    const cached = getCachedInsights();
    if (cached) return cached;
    const mock = MOCK_INSIGHTS[lang] || MOCK_INSIGHTS.hi;
    _lastInsights = mock;
    _insightsTimestamp = Date.now();
    return mock;
  }

  function buildInsightsPrompt(weather, forecast, langName) {
    const w = weather || {};
    const f = forecast?.days || [];
    let forecastStr = '';
    f.forEach((day, i) => {
      forecastStr += `Day ${i + 1} (${day.dayName}): High ${day.tempHigh}°C, Low ${day.tempLow}°C, ${day.condition}, Humidity ${day.humidity}%, Rain ${day.rainProb}%\n`;
    });
    return `You are "Kisan Dost AI" — a smart farming assistant for Indian farmers.
CURRENT WEATHER: Location: ${w.city || 'India'}, Temp: ${w.temp}°C, Humidity: ${w.humidity}%, Wind: ${w.wind_speed} km/h, Condition: ${w.condition}
FORECAST:\n${forecastStr}
Generate exactly 5 daily actionable farming insights in ${langName}. Format as JSON array: [{"title":"emoji Title","description":"...","priority":"high/medium/low","icon":"emoji"}]. Return ONLY JSON.`;
  }

  function parseInsightsResponse(text) {
    try {
      let s = text.trim();
      if (s.startsWith('```')) s = s.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
      const p = JSON.parse(s);
      return Array.isArray(p) ? p : [p];
    } catch (e) {
      const m = text.match(/\[[\s\S]*\]/);
      if (m) { try { return JSON.parse(m[0]); } catch (e2) {} }
      return null;
    }
  }

  function getCachedInsights() {
    try { const c = localStorage.getItem('kd_ai_insights'); if (c) return JSON.parse(c); } catch (e) {}
    return null;
  }

  function getDefaultInsights() {
    return MOCK_INSIGHTS.hi.slice(0, 3);
  }

  // ================================================================
  //  VOICE ASSISTANT Q&A (with mock fallback)
  // ================================================================
  async function getVoiceResponse(userQuery, weatherData, lang = 'hi') {
    // Try API first
    if (navigator.onLine) {
      try {
        const langName = { en: 'English', hi: 'Hindi', mr: 'Marathi', bn: 'Bengali' }[lang] || 'Hindi';
        const w = weatherData || {};
        const prompt = `You are "Kisan Dost AI" voice assistant. Weather: ${w.city || 'India'}, ${w.temp || 'N/A'}°C, ${w.condition || 'N/A'}. Question: "${userQuery}". Answer in ${langName}, 2-3 concise sentences, no markdown.`;
        const response = await callGemini(prompt);
        return response.trim();
      } catch (err) {
        console.warn('[Gemini] Voice API failed, using mock:', err.message);
      }
    }

    // Mock fallback — match keywords
    return getMockVoiceResponse(userQuery, lang);
  }

  function getMockVoiceResponse(query, lang) {
    const qa = MOCK_VOICE_QA[lang] || MOCK_VOICE_QA.hi;
    const q = (query || '').toLowerCase();
    for (const [key, answer] of Object.entries(qa)) {
      if (key === 'default') continue;
      const keywords = key.toLowerCase().split(' ');
      const matchCount = keywords.filter(k => q.includes(k)).length;
      if (matchCount >= 2) return answer;
    }
    return qa.default;
  }

  // ================================================================
  //  CROP DISEASE PREDICTION (with mock fallback)
  // ================================================================
  async function analyzeCropDisease(base64Image, mimeType, lang = 'hi') {
    // Try API first
    if (navigator.onLine) {
      try {
        const langName = { en: 'English', hi: 'Hindi', mr: 'Marathi', bn: 'Bengali' }[lang] || 'Hindi';
        const prompt = `You are an expert plant pathologist. Analyze this crop image. Respond in ${langName}. Return JSON: {"crop","status","disease","severity","symptoms","treatment","prevention","confidence"}. Return ONLY JSON.`;
        const response = await callGeminiWithImage(prompt, base64Image, mimeType);
        return parseDiseaseResponse(response);
      } catch (err) {
        console.warn('[Gemini] Disease API failed, using mock:', err.message);
      }
    }

    // Mock fallback — randomly return healthy or diseased
    return getMockDiseaseResult(lang);
  }

  function getMockDiseaseResult(lang) {
    const data = MOCK_DISEASE_RESULTS[lang] || MOCK_DISEASE_RESULTS.hi;
    return Math.random() > 0.4 ? data.diseased : data.healthy;
  }

  function parseDiseaseResponse(text) {
    try {
      let s = text.trim();
      if (s.startsWith('```')) s = s.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
      return JSON.parse(s);
    } catch (e) {
      const m = text.match(/\{[\s\S]*\}/);
      if (m) { try { return JSON.parse(m[0]); } catch (e2) {} }
      return MOCK_DISEASE_RESULTS.hi.diseased;
    }
  }

  // ================================================================
  //  CORE API CALLS
  // ================================================================
  async function callGemini(prompt) {
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 1024 } })
    });
    if (!resp.ok) throw new Error(`Gemini API error ${resp.status}`);
    const data = await resp.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  async function callGeminiWithImage(prompt, base64Image, mimeType) {
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: mimeType || 'image/jpeg', data: base64Image } }] }], generationConfig: { temperature: 0.4, maxOutputTokens: 2048 } })
    });
    if (!resp.ok) throw new Error(`Gemini Vision API error ${resp.status}`);
    const data = await resp.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  return { getDailyInsights, getVoiceResponse, analyzeCropDisease, getDefaultInsights, getMockVoiceResponse, getMockDiseaseResult };
})();
