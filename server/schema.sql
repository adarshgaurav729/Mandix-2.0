-- ==========================================================
-- MandiX Smart Farmer Digital Platform Database Schema
-- Database Name: mandix
-- ==========================================================

CREATE DATABASE IF NOT EXISTS mandix CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mandix;

-- ----------------------------------------------------------
-- 1. Table: farmers
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS farmers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  village VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  language VARCHAR(10) DEFAULT 'hi',
  farm_size VARCHAR(50) DEFAULT '4.5 Acres',
  soil_type VARCHAR(100) DEFAULT 'Alluvial Soil',
  primary_crop VARCHAR(100) DEFAULT 'Wheat & Paddy',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------
-- 2. Table: procurement_queue
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS procurement_queue (
  id INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id INT NOT NULL,
  mandi_name VARCHAR(150) NOT NULL,
  crop VARCHAR(100) DEFAULT 'Wheat Grade-A',
  quantity_qtl DECIMAL(10, 2) DEFAULT 40.00,
  slot_date DATE NOT NULL,
  slot_time VARCHAR(50) NOT NULL,
  token_number VARCHAR(50) NOT NULL UNIQUE,
  status ENUM('Active', 'Serving', 'Completed', 'Cancelled') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------
-- 3. Table: fertilizer_orders
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS fertilizer_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id INT NOT NULL,
  item_name VARCHAR(150) NOT NULL,
  category VARCHAR(50) DEFAULT 'Urea',
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) DEFAULT 266.50,
  total_price DECIMAL(10, 2) DEFAULT 799.50,
  delivery_slot VARCHAR(100) DEFAULT 'Morning (09:00 - 12:00)',
  address TEXT NOT NULL,
  status ENUM('Ordered', 'Confirmed', 'Dispatched', 'Delivered') DEFAULT 'Ordered',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------
-- 4. Table: equipment_bookings
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS equipment_bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id INT NOT NULL,
  equipment_name VARCHAR(150) NOT NULL,
  category VARCHAR(50) DEFAULT 'Tractor',
  provider VARCHAR(150) DEFAULT 'Kisan Custom Hiring Center',
  booking_date DATE NOT NULL,
  duration VARCHAR(50) DEFAULT '1 Day',
  hours INT DEFAULT 8,
  total_cost DECIMAL(10, 2) DEFAULT 1800.00,
  operator_required BOOLEAN DEFAULT TRUE,
  status ENUM('Confirmed', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Confirmed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------
-- 5. Table: drone_requests
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS drone_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id INT NOT NULL,
  service_type VARCHAR(150) NOT NULL,
  field_location VARCHAR(200) DEFAULT 'Plot 4B, Chakia North',
  field_size_acres DECIMAL(5, 2) NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_slot VARCHAR(50) DEFAULT 'Morning 07:00 AM',
  pilot_name VARCHAR(100) DEFAULT 'Aakash Kumar (DGCA Certified)',
  cost_estimate DECIMAL(10, 2) DEFAULT 1400.00,
  status ENUM('Requested', 'Pilot Assigned', 'Scheduled', 'Completed') DEFAULT 'Requested',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------
-- 6. Table: support_tickets
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS support_tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id INT NOT NULL,
  category VARCHAR(100) NOT NULL,
  subject VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  urgency ENUM('Normal', 'Medium', 'Urgent') DEFAULT 'Normal',
  status ENUM('Open', 'In Progress', 'Resolved') DEFAULT 'Open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------
-- Seed Initial Sample Farmer and Test Records
-- ----------------------------------------------------------
INSERT INTO farmers (id, name, village, district, state, phone, language, farm_size, soil_type, primary_crop)
VALUES 
(1, 'रामेश्वर प्रसाद (Rameshwar Prasad)', 'Chakia (चकिया)', 'East Champaran (पूर्वी चंपारण)', 'Bihar (बिहार)', '+91 98765 43210', 'hi', '4.5 Acres', 'Alluvial Soil (जलोढ़ मिट्टी)', 'Wheat & Paddy (गेहूं और धान)')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO procurement_queue (id, farmer_id, mandi_name, crop, quantity_qtl, slot_date, slot_time, token_number, status)
VALUES
(1, 1, 'Chakia Central Procurement Hub #1', 'Wheat Grade-A', 45.00, CURDATE(), '10:30 AM - 11:30 AM', 'TK-142', 'Active')
ON DUPLICATE KEY UPDATE token_number=VALUES(token_number);

INSERT INTO fertilizer_orders (id, farmer_id, item_name, category, quantity, unit_price, total_price, delivery_slot, address, status)
VALUES
(1, 1, 'IFFCO Neem Coated Urea (45kg)', 'Urea', 3, 266.50, 799.50, 'Morning (09:00 - 12:00)', 'Village Chakia, Near Primary School, East Champaran, Bihar - 845412', 'Dispatched')
ON DUPLICATE KEY UPDATE item_name=VALUES(item_name);

INSERT INTO equipment_bookings (id, farmer_id, equipment_name, category, provider, booking_date, duration, hours, total_cost, operator_required, status)
VALUES
(1, 1, 'Mahindra 575 DI Tractor (45 HP)', 'Tractor', 'Kisan Seva Kendra, Chakia', CURDATE(), '1 Day', 8, 1800.00, TRUE, 'Confirmed')
ON DUPLICATE KEY UPDATE equipment_name=VALUES(equipment_name);

INSERT INTO drone_requests (id, farmer_id, service_type, field_location, field_size_acres, preferred_date, preferred_slot, pilot_name, cost_estimate, status)
VALUES
(1, 1, 'Nano Urea Aerial Spraying', 'Plot 4B, Chakia North, Bihar', 4.00, CURDATE(), 'Morning 07:00 AM', 'Aakash Kumar (DGCA Certified Pilot #AG-881)', 1400.00, 'Pilot Assigned')
ON DUPLICATE KEY UPDATE service_type=VALUES(service_type);

INSERT INTO support_tickets (id, farmer_id, category, subject, message, urgency, status)
VALUES
(1, 1, 'Mandi Queue / Procurement', 'मंडी स्लॉट समय में संशोधन (Reschedule Mandi Slot)', 'भारी बारिश के कारण टोकन संख्या #TK-142 का समय दोपहर 2:00 बजे करने का अनुरोध।', 'Medium', 'In Progress')
ON DUPLICATE KEY UPDATE subject=VALUES(subject);
