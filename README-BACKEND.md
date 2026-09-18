# MandiX 2.0 - MySQL Backend Setup Guide

This guide provides step-by-step instructions to set up, configure, and run the **Node.js + Express + MySQL REST API Backend** for the **MandiX Smart Farmer Digital Platform**.

---

## 📋 Architecture Overview

The platform uses a decoupled client-server architecture:
* **Frontend**: HTML5, CSS3, ES6 Modules (served statically from root or Express).
* **Backend**: Node.js + Express (`server/server.js`) connected via `mysql2/promise` connection pooling.
* **Database**: MySQL 8.0 (`mandix`) with relational tables and foreign keys.

---

## 🗄️ Database Tables (`mandix`)

| Table Name | Description | Key Fields |
|---|---|---|
| `farmers` | Registered farmer profiles | `id`, `name`, `village`, `district`, `state`, `phone`, `language` |
| `procurement_queue` | Mandi slot booking & live queue | `id`, `farmer_id`, `mandi_name`, `slot_date`, `slot_time`, `token_number`, `status` |
| `fertilizer_orders` | Doorstep fertilizer orders | `id`, `farmer_id`, `item_name`, `quantity`, `unit_price`, `total_price`, `address`, `status` |
| `equipment_bookings` | Farm machinery rental bookings | `id`, `farmer_id`, `equipment_name`, `booking_date`, `hours`, `total_cost`, `status` |
| `drone_requests` | Precision agricultural drone services | `id`, `farmer_id`, `service_type`, `field_size_acres`, `preferred_date`, `status` |
| `support_tickets` | 24x7 Farmer helpdesk tickets | `id`, `farmer_id`, `category`, `subject`, `message`, `urgency`, `status` |

---

## 🚀 Step-by-Step Setup Instructions

### Step 1: Verify MySQL Installation

Make sure MySQL Server 8.0 is installed and running.

1. On Windows, press `Win + R`, type `services.msc`, and ensure the **MySQL80** service status is **Running**.
2. Alternatively, check via PowerShell:
   ```powershell
   Get-Service -Name MySQL80
   ```

---

### Step 2: Import `schema.sql` into MySQL

You can import the database schema using **MySQL Command Line Client**, **MySQL Workbench**, or **PowerShell**:

#### Option A: Using MySQL Command Line Client (Recommended)
1. Open the **MySQL 8.0 Command Line Client** from your Windows Start Menu.
2. Enter your MySQL `root` password when prompted.
3. Run the following command (replace with your file path):
   ```sql
   source C:/Users/adars/OneDrive/Desktop/Project SIH/server/schema.sql;
   ```
4. Verify the tables were created:
   ```sql
   USE mandix;
   SHOW TABLES;
   ```

#### Option B: Using PowerShell / Command Prompt
Run this in PowerShell:
```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < "c:\Users\adars\OneDrive\Desktop\Project SIH\server\schema.sql"
```
*(Enter your MySQL root password when prompted)*

#### Option C: Using MySQL Workbench
1. Open **MySQL Workbench** and connect to your local MySQL instance.
2. Go to **File** > **Open SQL Script...** and select `server/schema.sql`.
3. Click the **Lightning Bolt (Execute)** icon to run the script.

---

### Step 3: Configure Environment Variables (`.env`)

1. Inside the `server/` directory, open `.env` (or copy `.env.example` to `.env`):
   ```
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password_here
   DB_NAME=mandix
   ```
2. Replace `your_mysql_password_here` with your actual MySQL `root` password.
3. Save the file.

> [!NOTE]
> `.env` is listed in `.gitignore` so your database credentials will **never** be committed to GitHub.

---

### Step 4: Install Dependencies

From the project root, navigate to the `server/` directory and install the packages:

```powershell
cd server
npm install
```

Installed packages:
* `express`: Fast, minimalist REST API framework.
* `mysql2`: MySQL client with promise-based connection pool.
* `cors`: Cross-Origin Resource Sharing middleware.
* `dotenv`: Environment variable loader.

---

### Step 5: Start the Backend Server

You can start the server in any of the following ways:

#### Way 1: Direct Node.js (inside `server/`)
```powershell
cd server
node server.js
```

#### Way 2: From Project Root via NPM
```powershell
npm start
```

#### Way 3: Double-Click Launcher (Windows Explorer)
Double-click [`start-server.bat`](file:///c:/Users/adars/OneDrive/Desktop/Project%20SIH/start-server.bat) in the project folder.

When the server starts successfully, you will see:
```
==========================================================
🌾 MandiX Express + MySQL Backend Server Active!
==========================================================
🌐 Base URL:            http://localhost:3000
📊 API Health:          http://localhost:3000/api/health
🎫 Queue API:           http://localhost:3000/api/queue
🧪 Fertilizer Orders:   http://localhost:3000/api/fertilizer-orders
🚜 Equipment Bookings:  http://localhost:3000/api/equipment-bookings
🚁 Drone Requests:      http://localhost:3000/api/drone-requests
🎧 Support Tickets:     http://localhost:3000/api/support-tickets
👨‍🌾 Farmers API:        http://localhost:3000/api/farmers
==========================================================
✅ MySQL Database Status: CONNECTED (mandix)
```

---

## 📡 REST API Reference

All endpoints accept and return JSON.

### 1. Health Check
* `GET /api/health` — Tests MySQL connection pool and returns database status.

### 2. Farmers (`/api/farmers`)
* `GET /api/farmers` — List all registered farmers.
* `GET /api/farmers/:id` — Get single farmer profile.
* `POST /api/farmers` — Register new farmer:
  ```json
  {
    "name": "सुरेश कुमार",
    "village": "Pipra",
    "district": "East Champaran",
    "state": "Bihar",
    "phone": "+91 98765 11223"
  }
  ```
* `PUT /api/farmers/:id` — Update farmer profile.

### 3. Procurement Queue (`/api/queue`)
* `GET /api/queue` — List all queue tokens.
* `POST /api/queue` — Book new procurement slot:
  ```json
  {
    "farmer_id": 1,
    "mandi_name": "Chakia Central Hub #1",
    "crop": "Wheat Grade-A",
    "quantity_qtl": 45.0,
    "slot_date": "2026-09-20",
    "slot_time": "10:30 AM - 11:30 AM",
    "token_number": "TK-204"
  }
  ```
* `PUT /api/queue/:id` — Update token status (`Active`, `Serving`, `Completed`, `Cancelled`).

### 4. Fertilizer Orders (`/api/fertilizer-orders`)
* `GET /api/fertilizer-orders` — List orders.
* `POST /api/fertilizer-orders` — Place delivery order:
  ```json
  {
    "farmer_id": 1,
    "item_name": "IFFCO Neem Coated Urea (45kg)",
    "category": "Urea",
    "quantity": 2,
    "unit_price": 266.5,
    "total_price": 533.0,
    "delivery_slot": "Morning (09:00 - 12:00)",
    "address": "Village Chakia, Bihar"
  }
  ```
* `PUT /api/fertilizer-orders/:id` — Update status (`Ordered`, `Confirmed`, `Dispatched`, `Delivered`).

### 5. Equipment Bookings (`/api/equipment-bookings`)
* `GET /api/equipment-bookings` — List machinery rentals.
* `POST /api/equipment-bookings` — Book machinery:
  ```json
  {
    "farmer_id": 1,
    "equipment_name": "Mahindra 575 DI Tractor",
    "category": "Tractor",
    "provider": "Kisan Seva Kendra",
    "booking_date": "2026-09-22",
    "duration": "1 Day",
    "hours": 8,
    "total_cost": 1800.0,
    "operator_required": true
  }
  ```
* `PUT /api/equipment-bookings/:id` — Update status (`Confirmed`, `In Progress`, `Completed`, `Cancelled`).

### 6. Drone Requests (`/api/drone-requests`)
* `GET /api/drone-requests` — List drone requests.
* `POST /api/drone-requests` — Request drone spraying:
  ```json
  {
    "farmer_id": 1,
    "service_type": "Nano Urea Aerial Spraying",
    "field_location": "Plot 4B, Chakia North",
    "field_size_acres": 5.0,
    "preferred_date": "2026-09-25",
    "preferred_slot": "Morning 07:00 AM",
    "cost_estimate": 1750.0
  }
  ```
* `PUT /api/drone-requests/:id` — Update mission status (`Requested`, `Pilot Assigned`, `Scheduled`, `Completed`).

### 7. Support Tickets (`/api/support-tickets`)
* `GET /api/support-tickets` — List helpdesk tickets.
* `POST /api/support-tickets` — Create support ticket:
  ```json
  {
    "farmer_id": 1,
    "category": "Fertilizer Delivery",
    "subject": "डिलीवरी समय पूछताछ",
    "message": "कृपया ऑर्डर डिलीवरी का अनुमानित समय बताएं।",
    "urgency": "Normal"
  }
  ```
* `PUT /api/support-tickets/:id` — Update ticket status (`Open`, `In Progress`, `Resolved`).

---

## 🛠️ Troubleshooting

### Error: `Access denied for user 'root'@'localhost'` (Code: 1045)
* **Cause**: Incorrect MySQL password in `server/.env`.
* **Fix**: Open `server/.env` and ensure `DB_PASSWORD=` matches your actual root password set during MySQL installation.

### Error: `Unknown database 'mandix'` (Code: 1049)
* **Cause**: Database has not been created yet.
* **Fix**: Run `CREATE DATABASE mandix;` or re-import `schema.sql` as shown in Step 2.

### Error: `Port 3000 already in use`
* **Cause**: Another process (or previous server instance) is already running on port 3000.
* **Fix**: In `server/.env`, change `PORT=3000` to `PORT=3001` or `PORT=5000`.

---
