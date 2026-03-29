const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const MOCK_PRODUCTS = [
  { name: "Ibuprofen 400mg", brand: "Advil", category: "Pain Relief", subCategory: "NSAID", price: 12.99, discount: 10, stock: 150, rx: false, tags: ["headache", "pain", "fever"] },
  { name: "Loratadine 10mg", brand: "Claritin", category: "Allergy", subCategory: "Antihistamine", price: 18.50, discount: 5, stock: 80, rx: false, tags: ["allergy", "sneezing", "pollen"] },
  { name: "Amoxicillin 500mg", brand: "Generic", category: "Antibiotics", subCategory: "Penicillin", price: 25.00, discount: 0, stock: 40, rx: true, tags: ["infection", "bacteria", "prescription"] },
  { name: "Vitamin C 1000mg", brand: "NatureMade", category: "Vitamins", subCategory: "Immune Support", price: 15.00, discount: 20, stock: 200, rx: false, tags: ["vitamin", "immunity", "health"] },
  { name: "Melatonin 5mg", brand: "ZzzQuil", category: "Sleep Aids", subCategory: "Hormone", price: 9.99, discount: 0, stock: 120, rx: false, tags: ["sleep", "insomnia", "rest"] },
  { name: "Hydrocortisone Cream 1%", brand: "Cortizone", category: "Skin Care", subCategory: "Topical Steroid", price: 7.50, discount: 15, stock: 65, rx: false, tags: ["rash", "itch", "skin"] },
  { name: "Omeprazole 20mg", brand: "Prilosec", category: "Digestive Health", subCategory: "Antacid", price: 22.99, discount: 5, stock: 90, rx: false, tags: ["heartburn", "acid", "stomach"] },
  { name: "Cetirizine 10mg", brand: "Zyrtec", category: "Allergy", subCategory: "Antihistamine", price: 19.99, discount: 10, stock: 110, rx: false, tags: ["allergy", "drowsy", "relief"] },
  { name: "Acetaminophen 500mg", brand: "Tylenol", category: "Pain Relief", subCategory: "Analgesic", price: 11.49, discount: 0, stock: 300, rx: false, tags: ["fever", "pain", "headache"] },
  { name: "Cough Syrup with Dextromethorphan", brand: "Robitussin", category: "Cold & Flu", subCategory: "Cough Suppressant", price: 13.99, discount: 0, stock: 85, rx: false, tags: ["cough", "cold", "throat"] },
  { name: "Daily Multivitamin Gummies", brand: "Centrum", category: "Vitamins", subCategory: "Supplement", price: 16.50, discount: 25, stock: 140, rx: false, tags: ["gummies", "health", "daily"] },
  { name: "Atorvastatin 20mg", brand: "Lipitor", category: "Heart Health", subCategory: "Statin", price: 45.00, discount: 0, stock: 45, rx: true, tags: ["cholesterol", "heart", "prescription"] },
  { name: "Metformin 500mg", brand: "Glucophage", category: "Diabetes", subCategory: "Blood Sugar", price: 12.00, discount: 0, stock: 200, rx: true, tags: ["diabetes", "sugar", "prescription"] },
  { name: "Thermometer Digital", brand: "Braun", category: "Medical Devices", subCategory: "Diagnostic", price: 29.99, discount: 15, stock: 30, rx: false, tags: ["fever", "temperature", "device"] },
  { name: "Blood Pressure Monitor", brand: "Omron", category: "Medical Devices", subCategory: "Diagnostic", price: 49.99, discount: 20, stock: 25, rx: false, tags: ["blood pressure", "heart", "monitor"] }
];

async function seed() {
  try {
    for (const p of MOCK_PRODUCTS) {
      await pool.query(
        `INSERT INTO products (name, brand, category, sub_category, description, price, discount_percent, stock, requires_prescription, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [p.name, p.brand, p.category, p.subCategory, \`High quality \${p.name} for daily medical needs.\`, p.price, p.discount, p.stock, p.rx, JSON.stringify(p.tags)]
      );
    }
    console.log("Seeded 15 new realistic medical products into the database!");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
seed();
