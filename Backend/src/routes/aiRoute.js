const express = require('express');
const { GoogleGenAI } = require('@google/genai');

const router = express.Router();
let ai = null;

router.post('/symptom-check', async (req, res) => {
  try {
    const { history, message } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY missing in .env file' });
    }
    
    if (!ai) {
      ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }

    const systemInstruction = `You are an expert AI triage medical assistant. Your job is to listen to the patient's symptoms and determine what might be wrong, and strongly recommend what type of specialized doctor they need.
RULES:
1. If the diagnosis is unclear, ask 1 to 3 "yes/no" follow-up questions to clarify their issue. Ask ONE consecutive question at a time.
2. If you have enough info to make a safe determination, provide a diagnosis hypothesis, a list of general precautions, and a "specialist" string.
3. You must use the "specialist" key exactly to map one of the standard medical specialties (e.g., "General Physician", "Cardiologist", "Dermatologist", "Neurologist", "Orthopedist", "Pediatrician").
4. Your output MUST always be exactly a JSON object conforming strictly to the following schema:
   {
      "clarifyingQuestion": "String (your yes/no question, or null if you have enough info)",
      "diagnosis": "String (what they might have, or null)",
      "precautions": ["String", "String"], /* array of strings, or null */
      "specialist": "String (e.g., 'Cardiologist', 'Neurologist', 'General Physician') or null"
   }
DO NOT RETURN MARKDOWN OR ANY TEXT OUTSIDE THE JSON.`;

    const formattedHistory = [];
    
    if (history && history.length > 0) {
      history.forEach(h => {
        formattedHistory.push({
          role: h.role === 'model' ? 'model' : 'user',
          parts: [{ text: typeof h.text === 'string' ? h.text : JSON.stringify(h.text) }]
        });
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        ...formattedHistory,
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      }
    });

    const replyRaw = response.text;
    let replyObj;
    try {
      replyObj = JSON.parse(replyRaw);
    } catch(err) {
      replyObj = { clarifyingQuestion: "I couldn't quite understand. Could you rephrase your symptom?", diagnosis: null, precautions: null, specialist: null };
    }

    res.json(replyObj);

  } catch (err) {
    console.error('[AI Symptom Checker] Error:', err);
    res.status(500).json({ error: 'AI check failed. ' + err.message });
  }
});

router.get('/image', async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'Query is required' });
    if (!process.env.RAPIDAPI_KEY || !process.env.RAPIDAPI_HOST) {
      return res.status(500).json({ error: 'RapidAPI credentials missing in .env' });
    }

    const host = process.env.RAPIDAPI_HOST;
    const key = process.env.RAPIDAPI_KEY;
    
    const url = `https://${host}/search?query=${encodeURIComponent(query + ' medicine box product')}&limit=10&size=any&color=any&type=any&time=any&usage_rights=any&file_type=any&aspect_ratio=any&safe_search=off&region=us`;

    const fetchRes = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': host,
        'x-rapidapi-key': key
      }
    });

    if (!fetchRes.ok) {
      const errText = await fetchRes.text();
      return res.status(fetchRes.status).json({ error: 'RapidAPI Error: ' + errText });
    }

    const json = await fetchRes.json();
    
    let imageUrl = null;
    if (json.data && Array.isArray(json.data) && json.data.length > 0) {
      imageUrl = json.data[0].url;
    } else if (Array.isArray(json) && json.length > 0) {
      imageUrl = json[0].url || json[0].image;
    } else if (json.results && Array.isArray(json.results) && json.results.length > 0) {
      imageUrl = json.results[0].url || json.results[0].image;
    }

    if (!imageUrl) {
      return res.status(404).json({ error: 'No images found for this product.' });
    }

    res.json({ url: imageUrl });
  } catch (err) {
    console.error('[AI Image Fetcher] Error:', err);
    res.status(500).json({ error: 'Image fetch failed. ' + err.message });
  }
});

module.exports = router;
