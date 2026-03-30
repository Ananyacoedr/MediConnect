const pool = require('../db')

const mapProduct = (p) => {
  if (!p) return null
  return {
    ...p,
    _id: p.id,
    subCategory: p.sub_category,
    discountPercent: parseFloat(p.discount_percent || 0),
    sideEffects: p.side_effects,
    requiresPrescription: p.requires_prescription,
    reviewCount: p.review_count,
    isActive: p.is_active,
    price: parseFloat(p.price || 0),
    rating: parseFloat(p.rating || 0),
    createdAt: p.created_at,
    updatedAt: p.updated_at
  }
}

const getProducts = async (req, res) => {
  try {
    const { category, brand, minPrice, maxPrice, search, requiresPrescription, sort } = req.query
    const conditions = ['is_active = TRUE']
    const values = []
    let i = 1

    if (category) { conditions.push(`category = $${i++}`); values.push(category) }
    if (brand) { conditions.push(`brand ILIKE $${i++}`); values.push(`%${brand}%`) }
    if (requiresPrescription !== undefined) { conditions.push(`requires_prescription = $${i++}`); values.push(requiresPrescription === 'true') }
    if (minPrice) { conditions.push(`price >= $${i++}`); values.push(Number(minPrice)) }
    if (maxPrice) { conditions.push(`price <= $${i++}`); values.push(Number(maxPrice)) }
    if (search) {
      conditions.push(`(name ILIKE $${i} OR brand ILIKE $${i} OR tags::text ILIKE $${i})`)
      values.push(`%${search}%`); i++
    }

    const sortMap = { price_asc: 'price ASC', price_desc: 'price DESC', rating: 'rating DESC', newest: 'created_at DESC' }
    const orderBy = sortMap[sort] || 'created_at DESC'
    
    // Default search to return everything correctly without alias conflicts, we map it manually
    const { rows } = await pool.query(`SELECT * FROM products WHERE ${conditions.join(' AND ')} ORDER BY ${orderBy}`, values)
    res.json(rows.map(mapProduct))
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const getProduct = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Product not found' })
    res.json(mapProduct(rows[0]))
  } catch (err) { res.status(500).json({ error: err.message }) }
}

const createProduct = async (req, res) => {
  try {
    const { name, brand, category, subCategory, description, usage, ingredients, warnings, sideEffects, price, discountPercent, stock, images, requiresPrescription, rating, reviewCount, tags } = req.body
    const { rows } = await pool.query(
      `INSERT INTO products (name, brand, category, sub_category, description, usage, ingredients, warnings, side_effects, price, discount_percent, stock, images, requires_prescription, rating, review_count, tags)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17) RETURNING *`,
      [name, brand||'', category, subCategory||'', description||'', usage||'', ingredients||'', warnings||'', sideEffects||'', price, discountPercent||0, stock||0, JSON.stringify(images||[]), requiresPrescription||false, rating||0, reviewCount||0, JSON.stringify(tags||[])]
    )
    res.status(201).json(mapProduct(rows[0]))
  } catch (err) { res.status(400).json({ error: err.message }) }
}

const updateProduct = async (req, res) => {
  try {
    const colMap = { name:'name', brand:'brand', category:'category', subCategory:'sub_category', description:'description', usage:'usage', ingredients:'ingredients', warnings:'warnings', sideEffects:'side_effects', price:'price', discountPercent:'discount_percent', stock:'stock', images:'images', requiresPrescription:'requires_prescription', rating:'rating', reviewCount:'review_count', tags:'tags', isActive:'is_active' }
    const fields = []; const values = []; let i = 1
    Object.keys(colMap).forEach(k => { if (req.body[k] !== undefined) { fields.push(`${colMap[k]} = $${i++}`); values.push(['images','tags'].includes(colMap[k]) ? JSON.stringify(req.body[k]) : req.body[k]) } })
    if (!fields.length) return res.status(400).json({ error: 'No fields to update' })
    values.push(req.params.id)
    const { rows } = await pool.query(`UPDATE products SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`, values)
    if (!rows.length) return res.status(404).json({ error: 'Product not found' })
    res.json(mapProduct(rows[0]))
  } catch (err) { res.status(400).json({ error: err.message }) }
}

const deleteProduct = async (req, res) => {
  try {
    await pool.query('UPDATE products SET is_active = FALSE, updated_at = NOW() WHERE id = $1', [req.params.id])
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
}

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct }
