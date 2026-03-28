require('dotenv').config()
const { Pool } = require('pg')
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const products = [
  { name: 'Paracetamol 500mg', brand: 'Calpol', category: 'medicines', price: 25, discountPercent: 10, stock: 200, description: 'Fever and pain relief tablet.', usage: 'Take 1-2 tablets every 4-6 hours as needed.', ingredients: 'Paracetamol 500mg', warnings: 'Do not exceed 8 tablets in 24 hours.', sideEffects: 'Rare: skin rash, liver issues with overdose.', requiresPrescription: false, rating: 4.5, reviewCount: 1200, tags: ['fever','pain','otc'] },
  { name: 'Amoxicillin 500mg', brand: 'Mox', category: 'medicines', price: 85, discountPercent: 5, stock: 100, description: 'Antibiotic for bacterial infections.', usage: 'As prescribed by doctor.', ingredients: 'Amoxicillin trihydrate 500mg', warnings: 'Complete the full course.', sideEffects: 'Nausea, diarrhea, allergic reactions.', requiresPrescription: true, rating: 4.2, reviewCount: 450, tags: ['antibiotic','infection'] },
  { name: 'Vitamin C 1000mg', brand: 'Limcee', category: 'vitamins', price: 120, discountPercent: 15, stock: 300, description: 'Immunity booster vitamin C supplement.', usage: 'Take 1 tablet daily after meals.', ingredients: 'Ascorbic Acid 1000mg', warnings: 'Consult doctor if pregnant.', sideEffects: 'High doses may cause stomach upset.', requiresPrescription: false, rating: 4.7, reviewCount: 2300, tags: ['immunity','vitamin','supplement'] },
  { name: 'Digital Thermometer', brand: 'Omron', category: 'health-devices', price: 350, discountPercent: 20, stock: 80, description: 'Fast and accurate digital thermometer.', usage: 'Place under tongue or armpit for 60 seconds.', ingredients: 'N/A', warnings: 'Not for rectal use.', sideEffects: 'None', requiresPrescription: false, rating: 4.6, reviewCount: 890, tags: ['thermometer','fever','device'] },
  { name: 'BP Monitor (Automatic)', brand: 'Omron', category: 'health-devices', price: 2499, discountPercent: 12, stock: 40, description: 'Automatic upper arm blood pressure monitor.', usage: 'Sit quietly for 5 minutes before measuring.', ingredients: 'N/A', warnings: 'Not a substitute for medical diagnosis.', sideEffects: 'None', requiresPrescription: false, rating: 4.4, reviewCount: 560, tags: ['bp','blood pressure','device'] },
  { name: 'Hand Sanitizer 500ml', brand: 'Dettol', category: 'personal-care', price: 180, discountPercent: 8, stock: 500, description: '70% alcohol-based hand sanitizer.', usage: 'Apply 2-3ml on palms and rub for 20 seconds.', ingredients: 'Ethanol 70%, Glycerin', warnings: 'Flammable. Keep away from fire.', sideEffects: 'May cause skin dryness.', requiresPrescription: false, rating: 4.3, reviewCount: 3400, tags: ['sanitizer','hygiene','personal-care'] },
  { name: 'Omega-3 Fish Oil', brand: 'HealthKart', category: 'supplements', price: 599, discountPercent: 18, stock: 150, description: 'High-potency omega-3 fatty acids for heart health.', usage: 'Take 2 capsules daily with meals.', ingredients: 'Fish Oil 1000mg (EPA 180mg, DHA 120mg)', warnings: 'Consult doctor if on blood thinners.', sideEffects: 'Fishy aftertaste, mild stomach upset.', requiresPrescription: false, rating: 4.5, reviewCount: 780, tags: ['omega3','heart','supplement'] },
  { name: 'N95 Face Mask (Pack of 5)', brand: '3M', category: 'personal-care', price: 299, discountPercent: 0, stock: 250, description: 'NIOSH-approved N95 respirator mask.', usage: 'Wear over nose and mouth. Replace after 8 hours.', ingredients: 'N/A', warnings: 'Not for children under 2.', sideEffects: 'None', requiresPrescription: false, rating: 4.8, reviewCount: 1500, tags: ['mask','n95','protection'] },
  { name: 'Glucometer Kit', brand: 'Accu-Chek', category: 'health-devices', price: 1299, discountPercent: 10, stock: 60, description: 'Blood glucose monitoring system with 10 test strips.', usage: 'Prick fingertip, apply blood to strip, read result.', ingredients: 'N/A', warnings: 'For external use only.', sideEffects: 'None', requiresPrescription: false, rating: 4.6, reviewCount: 420, tags: ['glucometer','diabetes','device'] },
  { name: 'Multivitamin Daily', brand: 'Revital', category: 'vitamins', price: 450, discountPercent: 22, stock: 200, description: 'Complete daily multivitamin with minerals.', usage: 'Take 1 capsule daily after breakfast.', ingredients: 'Vitamins A, B, C, D, E, Zinc, Iron', warnings: 'Keep out of reach of children.', sideEffects: 'Mild nausea if taken on empty stomach.', requiresPrescription: false, rating: 4.4, reviewCount: 1100, tags: ['multivitamin','daily','supplement'] },
]

async function seed() {
  const client = await pool.connect()
  try {
    let inserted = 0
    for (const p of products) {
      const { rowCount } = await client.query(
        `INSERT INTO products (name, brand, category, description, usage, ingredients, warnings, side_effects, price, discount_percent, stock, requires_prescription, rating, review_count, tags)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         ON CONFLICT DO NOTHING`,
        [p.name, p.brand, p.category, p.description, p.usage, p.ingredients, p.warnings, p.sideEffects, p.price, p.discountPercent, p.stock, p.requiresPrescription, p.rating, p.reviewCount, JSON.stringify(p.tags)]
      )
      if (rowCount > 0) inserted++
    }
    console.log(`✅ Seeded ${inserted} products (${products.length - inserted} already existed)`)
  } finally {
    client.release()
    await pool.end()
  }
}

seed().catch(err => { console.error('❌', err.message); process.exit(1) })
