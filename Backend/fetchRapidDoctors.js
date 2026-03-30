require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runRapidApiImporter() {
  try {
    console.log("Connecting to RapidAPI AI Medical Chatbot to source Doctor data...");
    
    // Prompting the RapidAPI Medical AI to generate realistic doctor profiles
    const prompt = `Generate a JSON array of exactly 15 highly realistic Doctor profiles. Each doctor should have:
- "name" (Full name with Dr. title, Indian names preferred)
- "specialization" (e.g. Cardiologist, Dermatologist, etc.)
- "experience" (integer years)
- "fees" (integer in INR)
- "degree" (e.g. MBBS, MD, MS)
- "hospital" (Realistic hospital name in India)
- "bio" (1 short sentence describing expertise)

Return ONLY valid JSON. No markdown, no extra text. Format:
[{"name": "...", "specialization": "...", "experience": 10, "fees": 500, "degree": "MBBS, MD", "hospital": "...", "bio": "..."}]`;

    const response = await fetch('https://ai-doctor-api-ai-medical-chatbot-healthcare-ai-assistant.p.rapidapi.com/chat?noqueue=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': 'ai-doctor-api-ai-medical-chatbot-healthcare-ai-assistant.p.rapidapi.com',
        'x-rapidapi-key': process.env.RAPIDAPI_KEY
      },
      body: JSON.stringify({ message: prompt, specialization: "general", language: "en" })
    });

    const aiData = await response.json();
    let jsonStr = aiData.response || aiData.message || aiData.text || '';
    
    // Clean up markdown if AI returned any
    jsonStr = jsonStr.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    let doctors = [];
    try {
      doctors = JSON.parse(jsonStr);
    } catch(e) {
      console.log("AI returned malformed JSON! Retrying payload parsing...");
      const match = jsonStr.match(/\[.*\]/s);
      if (match) doctors = JSON.parse(match[0]);
    }

    if (!Array.isArray(doctors) || doctors.length === 0) {
      console.log("Failed to extract array from AI response:", jsonStr);
      return;
    }

    console.log(`RapidAPI successfully generated ${doctors.length} Doctors!`);

    console.log("Wiping old fake doctors...");
    await pool.query('DELETE FROM doctors');

    console.log("Injecting RapidAPI Doctors into your Postgres Database...");
    for (const doc of doctors) {
      const split = doc.name.split(' ');
      let first = split[0];
      let last = split.slice(1).join(' ');
      if (first.toLowerCase() === 'dr.') {
        first = split[1];
        last = split.slice(2).join(' ');
      }
      first = first || 'Dr. Unknown';
      last = last || '';

      await pool.query(
        `INSERT INTO doctors (first_name, last_name, specialization, experience, fees, hospital, about, degree)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [first, last, doc.specialization, doc.experience, doc.fees, doc.hospital, doc.bio, doc.degree]
      );
    }
    
    console.log("SUCCESS! All RapidAPI doctors are now securely stored and ready for Bookings & Video Calls!");

  } catch (err) {
    console.error("RapidAPI Import Failed:", err);
  } finally {
    pool.end();
  }
}

runRapidApiImporter();
