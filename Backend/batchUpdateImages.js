require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  try {
    const res = await pool.query("SELECT id, name FROM products WHERE images::text LIKE '%unsplash.com%' OR images IS NULL OR images = '[]'::jsonb OR jsonb_array_length(images) = 0");
    const products = res.rows;
    console.log(`Found ${products.length} products with no images.`);

    const host = process.env.RAPIDAPI_HOST;
    const key = process.env.RAPIDAPI_KEY;

    for (let p of products) {
      console.log(`Fetching image for: ${p.name}...`);
      const url = `https://${host}/search?query=${encodeURIComponent(p.name + ' medicine product')}&limit=3`;
      
      const fetchRes = await fetch(url, { headers: { 'x-rapidapi-host': host, 'x-rapidapi-key': key } });
      if (!fetchRes.ok) {
        console.log(`Failed for ${p.name}`);
        continue;
      }
      
      const json = await fetchRes.json();
      let imageUrl = null;
      if (json.data && json.data.length > 0) {
        // Try to get the HD source image first, falback to google cache
        imageUrl = json.data[0].thumbnail_url || json.data[0].url;
      }

      if (imageUrl) {
        await pool.query("UPDATE products SET images = $1::jsonb WHERE id = $2", [JSON.stringify([imageUrl]), p.id]);
        console.log(`✅ Updated ${p.name} with: ${imageUrl}`);
      } else {
        console.log(`❌ No image found for ${p.name}`);
      }
      
      // Delay to avoid hitting rate limits
      await new Promise(r => setTimeout(r, 1500));
    }
    
    console.log('Batch update complete!');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

run();
