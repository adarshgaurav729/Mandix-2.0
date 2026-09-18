/**
 * MandiX - Node.js + Express REST API Backend
 * Connected to MySQL with connection pool, CORS, and full REST endpoints.
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import pool, { testConnection } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from parent directory
app.use(express.static(rootDir));

// Helper: Ensure default farmer exists so foreign keys always resolve
async function ensureDefaultFarmer() {
  try {
    const [rows] = await pool.query('SELECT id FROM farmers WHERE id = 1');
    if (rows.length === 0) {
      await pool.query(
        `INSERT INTO farmers (id, name, village, district, state, phone, language, farm_size, soil_type, primary_crop)
         VALUES (1, 'रामेश्वर प्रसाद (Rameshwar Prasad)', 'Chakia (चकिया)', 'East Champaran (पूर्वी चंपारण)', 'Bihar (बिहार)', '+91 98765 43210', 'hi', '4.5 Acres', 'Alluvial Soil (जलोढ़ मिट्टी)', 'Wheat & Paddy (गेहूं और धान)')`
      );
    }
  } catch (err) {
    // Database might not be migrated yet or offline
  }
}

// ==========================================================
// 1. Health & Connection Test Endpoint
// ==========================================================
app.get('/api/health', async (req, res) => {
  const status = await testConnection();
  res.json({
    status: status.connected ? 'healthy' : 'database_error',
    timestamp: new Date().toISOString(),
    mysql: status
  });
});

// ==========================================================
// 2. Farmers Endpoints (/api/farmers)
// ==========================================================
app.get('/api/farmers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM farmers ORDER BY id ASC');
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/farmers/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM farmers WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Farmer not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/farmers', async (req, res) => {
  try {
    const { name, village, district, state, phone, language, farm_size, soil_type, primary_crop } = req.body;
    if (!name || !village || !district || !phone) {
      return res.status(400).json({ success: false, error: 'Name, village, district, and phone are required' });
    }

    const [result] = await pool.query(
      `INSERT INTO farmers (name, village, district, state, phone, language, farm_size, soil_type, primary_crop)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, village, district, state || 'Bihar', phone, language || 'hi', farm_size || '4.5 Acres', soil_type || 'Alluvial Soil', primary_crop || 'Wheat & Paddy']
    );

    res.status(201).json({
      success: true,
      message: 'Farmer registered successfully',
      data: { id: result.insertId, ...req.body }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/farmers/:id', async (req, res) => {
  try {
    const { name, village, district, state, phone, language, farm_size, soil_type, primary_crop } = req.body;
    await pool.query(
      `UPDATE farmers SET 
        name = COALESCE(?, name),
        village = COALESCE(?, village),
        district = COALESCE(?, district),
        state = COALESCE(?, state),
        phone = COALESCE(?, phone),
        language = COALESCE(?, language),
        farm_size = COALESCE(?, farm_size),
        soil_type = COALESCE(?, soil_type),
        primary_crop = COALESCE(?, primary_crop)
       WHERE id = ?`,
      [name, village, district, state, phone, language, farm_size, soil_type, primary_crop, req.params.id]
    );

    const [updated] = await pool.query('SELECT * FROM farmers WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Farmer profile updated', data: updated[0] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================================
// 3. Procurement Queue Endpoints (/api/queue)
// ==========================================================
app.get('/api/queue', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT q.*, f.name AS farmer_name, f.phone AS farmer_phone, f.village, f.district
      FROM procurement_queue q
      LEFT JOIN farmers f ON q.farmer_id = f.id
      ORDER BY q.id DESC
    `);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/queue', async (req, res) => {
  try {
    await ensureDefaultFarmer();
    const { farmer_id, mandi_name, crop, quantity_qtl, slot_date, slot_time, token_number, status } = req.body;

    const assignedFarmerId = farmer_id || 1;
    const finalToken = token_number || `TK-${Math.floor(100 + Math.random() * 900)}`;

    const [result] = await pool.query(
      `INSERT INTO procurement_queue (farmer_id, mandi_name, crop, quantity_qtl, slot_date, slot_time, token_number, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        assignedFarmerId,
        mandi_name || 'Chakia Central Procurement Hub #1',
        crop || 'Wheat Grade-A',
        quantity_qtl || 40.00,
        slot_date || new Date().toISOString().split('T')[0],
        slot_time || '10:30 AM - 11:30 AM',
        finalToken,
        status || 'Active'
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Procurement slot booked successfully',
      data: {
        id: result.insertId,
        token_number: finalToken,
        farmer_id: assignedFarmerId,
        ...req.body
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/queue/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    await pool.query('UPDATE procurement_queue SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true, message: `Queue token #${req.params.id} updated to ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================================
// 4. Fertilizer Orders Endpoints (/api/fertilizer-orders)
// ==========================================================
app.get('/api/fertilizer-orders', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT o.*, f.name AS farmer_name, f.phone AS farmer_phone
      FROM fertilizer_orders o
      LEFT JOIN farmers f ON o.farmer_id = f.id
      ORDER BY o.id DESC
    `);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/fertilizer-orders', async (req, res) => {
  try {
    await ensureDefaultFarmer();
    const { farmer_id, item_name, category, quantity, unit_price, total_price, delivery_slot, address, status } = req.body;

    if (!item_name || !quantity || !address) {
      return res.status(400).json({ success: false, error: 'Item name, quantity, and address are required' });
    }

    const assignedFarmerId = farmer_id || 1;
    const qty = parseInt(quantity, 10);
    const uPrice = parseFloat(unit_price) || 266.50;
    const totPrice = parseFloat(total_price) || (qty * uPrice);

    const [result] = await pool.query(
      `INSERT INTO fertilizer_orders (farmer_id, item_name, category, quantity, unit_price, total_price, delivery_slot, address, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        assignedFarmerId,
        item_name,
        category || 'Urea',
        qty,
        uPrice,
        totPrice,
        delivery_slot || 'Morning (09:00 - 12:00)',
        address,
        status || 'Ordered'
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Fertilizer order placed successfully',
      data: { id: result.insertId, orderId: `FD-${result.insertId}`, ...req.body }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/fertilizer-orders/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    await pool.query('UPDATE fertilizer_orders SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true, message: `Fertilizer order #${req.params.id} updated to ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================================
// 5. Equipment Bookings Endpoints (/api/equipment-bookings)
// ==========================================================
app.get('/api/equipment-bookings', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT b.*, f.name AS farmer_name, f.phone AS farmer_phone
      FROM equipment_bookings b
      LEFT JOIN farmers f ON b.farmer_id = f.id
      ORDER BY b.id DESC
    `);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/equipment-bookings', async (req, res) => {
  try {
    await ensureDefaultFarmer();
    const { farmer_id, equipment_name, category, provider, booking_date, duration, hours, total_cost, operator_required, status } = req.body;

    if (!equipment_name || !booking_date) {
      return res.status(400).json({ success: false, error: 'Equipment name and booking date are required' });
    }

    const assignedFarmerId = farmer_id || 1;

    const [result] = await pool.query(
      `INSERT INTO equipment_bookings (farmer_id, equipment_name, category, provider, booking_date, duration, hours, total_cost, operator_required, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        assignedFarmerId,
        equipment_name,
        category || 'Tractor',
        provider || 'Kisan Custom Hiring Center',
        booking_date,
        duration || '1 Day',
        hours || 8,
        total_cost || 1800.00,
        operator_required !== undefined ? operator_required : true,
        status || 'Confirmed'
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Equipment booked successfully',
      data: { id: result.insertId, bookingId: `EQ-${result.insertId}`, ...req.body }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/equipment-bookings/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    await pool.query('UPDATE equipment_bookings SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true, message: `Equipment booking #${req.params.id} updated to ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================================
// 6. Drone Requests Endpoints (/api/drone-requests)
// ==========================================================
app.get('/api/drone-requests', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT d.*, f.name AS farmer_name, f.phone AS farmer_phone
      FROM drone_requests d
      LEFT JOIN farmers f ON d.farmer_id = f.id
      ORDER BY d.id DESC
    `);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/drone-requests', async (req, res) => {
  try {
    await ensureDefaultFarmer();
    const { farmer_id, service_type, field_location, field_size_acres, preferred_date, preferred_slot, pilot_name, cost_estimate, status } = req.body;

    if (!service_type || !field_size_acres || !preferred_date) {
      return res.status(400).json({ success: false, error: 'Service type, field size, and preferred date are required' });
    }

    const assignedFarmerId = farmer_id || 1;
    const acres = parseFloat(field_size_acres) || 1.0;
    const est = parseFloat(cost_estimate) || (acres * 350);

    const [result] = await pool.query(
      `INSERT INTO drone_requests (farmer_id, service_type, field_location, field_size_acres, preferred_date, preferred_slot, pilot_name, cost_estimate, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        assignedFarmerId,
        service_type,
        field_location || 'Plot 4B, Chakia North, Bihar',
        acres,
        preferred_date,
        preferred_slot || 'Morning 07:00 AM',
        pilot_name || 'Aakash Kumar (DGCA Certified Pilot #AG-881)',
        est,
        status || 'Requested'
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Drone service requested successfully',
      data: { id: result.insertId, requestId: `DRN-${result.insertId}`, ...req.body }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/drone-requests/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    await pool.query('UPDATE drone_requests SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true, message: `Drone request #${req.params.id} updated to ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================================
// 7. Support Tickets Endpoints (/api/support-tickets)
// ==========================================================
app.get('/api/support-tickets', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT t.*, f.name AS farmer_name, f.phone AS farmer_phone
      FROM support_tickets t
      LEFT JOIN farmers f ON t.farmer_id = f.id
      ORDER BY t.id DESC
    `);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/support-tickets', async (req, res) => {
  try {
    await ensureDefaultFarmer();
    const { farmer_id, category, subject, message, urgency, status } = req.body;

    if (!category || !message) {
      return res.status(400).json({ success: false, error: 'Category and message are required' });
    }

    const assignedFarmerId = farmer_id || 1;

    const [result] = await pool.query(
      `INSERT INTO support_tickets (farmer_id, category, subject, message, urgency, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        assignedFarmerId,
        category,
        subject || 'General Inquiry',
        message,
        urgency || 'Normal',
        status || 'Open'
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: { id: result.insertId, ticketId: `TCK-${result.insertId}`, ...req.body }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/support-tickets/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    await pool.query('UPDATE support_tickets SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true, message: `Support ticket #${req.params.id} updated to ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Fallback for SPA routing - serve index.html for non-API routes
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api/')) return next();
  res.sendFile(path.join(rootDir, 'index.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`\n==========================================================`);
  console.log(`🌾 MandiX Express + MySQL Backend Server Active!`);
  console.log(`==========================================================`);
  console.log(`🌐 Base URL:            http://localhost:${PORT}`);
  console.log(`📊 API Health:          http://localhost:${PORT}/api/health`);
  console.log(`🎫 Queue API:           http://localhost:${PORT}/api/queue`);
  console.log(`🧪 Fertilizer Orders:   http://localhost:${PORT}/api/fertilizer-orders`);
  console.log(`🚜 Equipment Bookings:  http://localhost:${PORT}/api/equipment-bookings`);
  console.log(`🚁 Drone Requests:      http://localhost:${PORT}/api/drone-requests`);
  console.log(`🎧 Support Tickets:     http://localhost:${PORT}/api/support-tickets`);
  console.log(`👨‍🌾 Farmers API:        http://localhost:${PORT}/api/farmers`);
  console.log(`==========================================================\n`);

  const dbStatus = await testConnection();
  if (dbStatus.connected) {
    console.log(`✅ MySQL Database Status: CONNECTED (${dbStatus.database})`);
    await ensureDefaultFarmer();
  } else {
    console.log(`⚠️ MySQL Database Status: ${dbStatus.message}`);
  }
});
