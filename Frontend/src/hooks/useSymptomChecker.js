import { useState, useEffect } from 'react'

const SYMPTOM_MAP = [
  {
    keywords:    ['chest pain', 'chest tightness', 'heart', 'palpitation'],
    primary:     'Cardiologist',
    secondary:   'General Physician',
    urgent:      true,
    tips:        ['Sit down and rest immediately', 'Avoid any physical exertion'],
  },
  {
    keywords:    ['severe headache', 'worst headache', 'sudden headache', 'thunderclap'],
    primary:     'Neurologist',
    secondary:   'General Physician',
    urgent:      true,
    tips:        ['Rest in a quiet, dark room', 'Avoid screens and bright lights'],
  },
  {
    keywords:    ['fever', 'cold', 'flu', 'cough', 'sore throat', 'runny nose', 'chills', 'body ache'],
    primary:     'General Physician',
    secondary:   null,
    urgent:      false,
    tips:        ['Stay hydrated and take rest', 'Monitor temperature every few hours'],
  },
  {
    keywords:    ['headache', 'migraine', 'dizziness', 'vertigo', 'numbness', 'seizure'],
    primary:     'Neurologist',
    secondary:   'General Physician',
    urgent:      false,
    tips:        ['Rest in a quiet place', 'Avoid triggers like bright light or loud noise'],
  },
  {
    keywords:    ['skin', 'rash', 'itching', 'acne', 'eczema', 'psoriasis', 'hives', 'allergy'],
    primary:     'Dermatologist',
    secondary:   'General Physician',
    urgent:      false,
    tips:        ['Avoid allergens and keep the area clean', 'Do not scratch — it worsens inflammation'],
  },
  {
    keywords:    ['tooth', 'teeth', 'gum', 'dental', 'cavity', 'toothache', 'jaw'],
    primary:     'Dentist',
    secondary:   null,
    urgent:      false,
    tips:        ['Rinse with warm salt water', 'Avoid very hot or cold foods'],
  },
  {
    keywords:    ['eye', 'vision', 'blurry', 'blind', 'redness in eye', 'eye pain', 'watery eyes'],
    primary:     'Ophthalmologist',
    secondary:   'General Physician',
    urgent:      false,
    tips:        ['Avoid rubbing your eyes', 'Rest your eyes and reduce screen time'],
  },
  {
    keywords:    ['stomach', 'abdomen', 'nausea', 'vomiting', 'diarrhea', 'constipation', 'bloating', 'indigestion', 'acid'],
    primary:     'Gastroenterologist',
    secondary:   'General Physician',
    urgent:      false,
    tips:        ['Eat light, bland foods and stay hydrated', 'Avoid spicy or oily food'],
  },
  {
    keywords:    ['breathing', 'shortness of breath', 'asthma', 'wheezing', 'lung', 'respiratory'],
    primary:     'Pulmonologist',
    secondary:   'General Physician',
    urgent:      false,
    tips:        ['Stay in a well-ventilated area', 'Avoid dust, smoke, and strong odors'],
  },
  {
    keywords:    ['joint', 'bone', 'fracture', 'sprain', 'back pain', 'knee', 'shoulder', 'arthritis'],
    primary:     'Orthopedist',
    secondary:   'General Physician',
    urgent:      false,
    tips:        ['Rest the affected area and apply ice', 'Avoid putting weight on the injured area'],
  },
  {
    keywords:    ['anxiety', 'depression', 'stress', 'mental', 'panic', 'mood', 'sleep', 'insomnia'],
    primary:     'Psychiatrist',
    secondary:   'General Physician',
    urgent:      false,
    tips:        ['Practice deep breathing or meditation', 'Talk to someone you trust about how you feel'],
  },
  {
    keywords:    ['diabetes', 'thyroid', 'hormone', 'weight gain', 'fatigue', 'blood sugar'],
    primary:     'Endocrinologist',
    secondary:   'General Physician',
    urgent:      false,
    tips:        ['Monitor your diet and avoid sugary foods', 'Track your symptoms daily'],
  },
  {
    keywords:    ['ear', 'hearing', 'nose', 'throat', 'tonsil', 'sinus', 'snoring'],
    primary:     'ENT Specialist',
    secondary:   'General Physician',
    urgent:      false,
    tips:        ['Avoid inserting objects into the ear', 'Steam inhalation may help with sinus congestion'],
  },
  {
    keywords:    ['urine', 'kidney', 'bladder', 'urination', 'uti', 'burning urination'],
    primary:     'Urologist',
    secondary:   'General Physician',
    urgent:      false,
    tips:        ['Drink plenty of water', 'Avoid holding urine for long periods'],
  },
  {
    keywords:    ['child', 'infant', 'baby', 'toddler', 'pediatric'],
    primary:     'Pediatrician',
    secondary:   'General Physician',
    urgent:      false,
    tips:        ['Keep the child comfortable and monitor temperature', 'Ensure adequate fluid intake'],
  },
]

const URGENT_PHRASES = [
  'chest pain', 'severe headache', 'can\'t breathe', 'unconscious',
  'stroke', 'heart attack', 'seizure', 'severe bleeding', 'paralysis',
  'sudden vision loss', 'thunderclap headache',
]

const LAST_SEARCH_KEY = 'mediconnect_last_symptom'

const scoreEntry = (input, entry) => {
  let score = 0
  let matchedCount = 0
  for (const kw of entry.keywords) {
    if (input.includes(kw)) {
      score += kw.includes(' ') ? 2 : 1  // multi-word keywords score higher
      matchedCount++
    }
  }
  return { score, matchedCount }
}

const getConfidence = (score, matchedCount, totalKeywords) => {
  if (matchedCount === 0) return 'Low'
  const ratio = matchedCount / totalKeywords
  if (score >= 3 || ratio >= 0.3) return 'High'
  if (score >= 1 || ratio >= 0.1) return 'Medium'
  return 'Low'
}

export const useSymptomChecker = () => {
  const [input, setInput]       = useState('')
  const [result, setResult]     = useState(null)
  const [lastSearch, setLastSearch] = useState(() => localStorage.getItem(LAST_SEARCH_KEY) || '')

  const analyze = () => {
    const text = input.trim().toLowerCase()
    if (!text) return

    // Save to memory
    localStorage.setItem(LAST_SEARCH_KEY, input.trim())
    setLastSearch(input.trim())

    // Urgency check
    const isUrgent = URGENT_PHRASES.some(p => text.includes(p))

    // Score all entries
    const scored = SYMPTOM_MAP.map(entry => ({
      ...entry,
      ...scoreEntry(text, entry),
    })).filter(e => e.score > 0).sort((a, b) => b.score - a.score)

    if (scored.length === 0) {
      // Fallback
      setResult({
        primary:    'General Physician',
        secondary:  null,
        confidence: 'Low',
        tips:       ['Describe your symptoms in more detail for a better suggestion', 'A General Physician can help assess your condition'],
        urgent:     isUrgent,
      })
      return
    }

    const top    = scored[0]
    const second = scored[1] && scored[1].primary !== top.primary ? scored[1] : null

    const confidence = getConfidence(top.score, top.matchedCount, top.keywords.length)

    setResult({
      primary:    top.primary,
      secondary:  second?.primary || top.secondary || null,
      confidence,
      tips:       top.tips,
      urgent:     isUrgent || top.urgent,
    })
  }

  const reset = () => {
    setInput('')
    setResult(null)
  }

  const clearMemory = () => {
    localStorage.removeItem(LAST_SEARCH_KEY)
    setLastSearch('')
  }

  return { input, setInput, result, analyze, reset, lastSearch, clearMemory }
}
