const fetch = require('node-fetch')

const getDoctorAdvice = async (req, res) => {
  try {
    const { message, specialization, language } = req.body
    if (!message) return res.status(400).json({ error: 'Message is strictly required.' })

    const response = await fetch('https://ai-doctor-api-ai-medical-chatbot-healthcare-ai-assistant.p.rapidapi.com/chat?noqueue=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': 'ai-doctor-api-ai-medical-chatbot-healthcare-ai-assistant.p.rapidapi.com',
        'x-rapidapi-key': process.env.RAPIDAPI_KEY
      },
      body: JSON.stringify({ 
        message, 
        specialization: specialization || 'general', 
        language: language || 'en' 
      })
    })

    const data = await response.json()
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Failed to contact the AI Medical Assistant API' })
  }
}

module.exports = { getDoctorAdvice }
