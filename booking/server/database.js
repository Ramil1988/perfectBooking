const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'customer',
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    service_name TEXT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration INTEGER DEFAULT 60,
    status TEXT DEFAULT 'confirmed',
    notes TEXT,
    created_by INTEGER,
    business_type TEXT DEFAULT 'general',
    staff_id INTEGER,
    resource_id INTEGER,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (created_by) REFERENCES users (id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS business_hours (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    day_of_week INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT 1
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS specialists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    business_type TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    business_type TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    duration INTEGER DEFAULT 60,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);


  db.run(`INSERT OR IGNORE INTO business_hours (day_of_week, start_time, end_time) VALUES
    (1, '09:00', '17:00'),
    (2, '09:00', '17:00'),
    (3, '09:00', '17:00'),
    (4, '09:00', '17:00'),
    (5, '09:00', '17:00')`);

  const bcrypt = require('bcryptjs');
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  
  db.run(`INSERT OR IGNORE INTO users (name, email, password, role, phone) VALUES 
    ('Admin User', 'admin@business.com', ?, 'admin', '555-0123')`, [hashedPassword]);

  // Add unique constraint to prevent duplicate specialists
  db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_specialists_unique
    ON specialists (name, specialty, business_type)`, (err) => {
    if (err && !err.message.includes('already exists')) {
      console.error('Error creating specialists unique index:', err);
    }
  });

  // Insert default specialists for different business types (will be ignored if they exist)
  db.run(`INSERT OR IGNORE INTO specialists (name, specialty, business_type, email) VALUES
    ('Sarah Johnson', 'Deep Tissue', 'massage', 'sarah@massage.com'),
    ('Maria Garcia', 'Swedish & Relaxation', 'massage', 'maria@massage.com'),
    ('Jennifer Lee', 'Hot Stone', 'massage', 'jennifer@massage.com'),
    ('Ashley Chen', 'Sports Massage', 'massage', 'ashley@massage.com'),
    ('Dr. Emily Davis', 'General Dentistry', 'dental', 'emily@dental.com'),
    ('Dr. Michael Chen', 'Endodontics', 'dental', 'michael@dental.com'),
    ('Dr. Lisa Rodriguez', 'Oral Surgery', 'dental', 'lisa@dental.com'),
    ('Dr. James Park', 'Cosmetic Dentistry', 'dental', 'james@dental.com'),
    ('Isabella Martinez', 'Hair Styling', 'beauty', 'isabella@beauty.com'),
    ('Sophie Anderson', 'Facial Treatments', 'beauty', 'sophie@beauty.com'),
    ('Emma Wilson', 'Nail Artistry', 'beauty', 'emma@beauty.com'),
    ('Olivia Brown', 'Makeup & Brows', 'beauty', 'olivia@beauty.com')`);

  // Insert default services for different business types
  db.run(`INSERT OR IGNORE INTO services (name, business_type, description, price, duration) VALUES 
    ('Swedish Massage', 'massage', 'Relaxing full-body massage with smooth strokes', 80.00, 60),
    ('Deep Tissue Massage', 'massage', 'Therapeutic massage targeting deep muscle layers', 90.00, 60),
    ('Hot Stone Massage', 'massage', 'Massage using heated stones for deep relaxation', 100.00, 90),
    ('Sports Massage', 'massage', 'Focused massage for athletes and active individuals', 85.00, 60),
    ('Prenatal Massage', 'massage', 'Gentle massage designed for expectant mothers', 85.00, 60),
    ('Dental Cleaning', 'dental', 'Professional teeth cleaning and polishing', 120.00, 60),
    ('Dental Exam', 'dental', 'Comprehensive oral health examination', 80.00, 30),
    ('Teeth Whitening', 'dental', 'Professional teeth whitening treatment', 200.00, 90),
    ('Root Canal', 'dental', 'Root canal therapy for infected teeth', 400.00, 120),
    ('Dental Filling', 'dental', 'Cavity filling with composite material', 150.00, 45),
    ('Haircut & Style', 'beauty', 'Professional haircut and styling service', 45.00, 60),
    ('Hair Coloring', 'beauty', 'Hair coloring and highlighting services', 80.00, 120),
    ('Facial Treatment', 'beauty', 'Rejuvenating facial treatment for all skin types', 65.00, 75),
    ('Manicure', 'beauty', 'Complete nail care and polish application', 25.00, 45),
    ('Pedicure', 'beauty', 'Foot care treatment with nail polish', 35.00, 60),
    ('Eyebrow Threading', 'beauty', 'Precise eyebrow shaping using threading technique', 15.00, 20),
    ('Makeup Application', 'beauty', 'Professional makeup for special occasions', 50.00, 60),
    ('Hair Extensions', 'beauty', 'Hair extension application and styling', 120.00, 180),
    ('Chemical Peel', 'beauty', 'Skin resurfacing treatment for smoother complexion', 75.00, 60),
    ('Eyelash Extensions', 'beauty', 'Semi-permanent eyelash enhancement', 60.00, 90)`);

});

// Specialist availability table
db.run(`CREATE TABLE IF NOT EXISTS specialist_availability (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  specialist_id INTEGER NOT NULL,
  business_type TEXT NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  is_available INTEGER DEFAULT 1,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (specialist_id) REFERENCES specialists (id)
)`);

// Business access permissions table
db.run(`CREATE TABLE IF NOT EXISTS user_business_access (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  business_type TEXT NOT NULL,
  access_level TEXT DEFAULT 'admin',
  is_active BOOLEAN DEFAULT 1,
  subscription_status TEXT DEFAULT 'trial',
  subscription_start_date DATETIME,
  subscription_end_date DATETIME,
  monthly_price DECIMAL(10,2) DEFAULT 0.00,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id),
  UNIQUE(user_id, business_type)
)`);

// Platform configuration table
db.run(`CREATE TABLE IF NOT EXISTS platform_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_type TEXT NOT NULL UNIQUE,
  monthly_price DECIMAL(10,2) DEFAULT 29.99,
  is_available BOOLEAN DEFAULT 1,
  features TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Insert default platform pricing
db.run(`INSERT OR IGNORE INTO platform_config (business_type, monthly_price, features, description) VALUES 
  ('massage', 49.99, '["booking_management", "staff_scheduling", "client_management", "payment_processing"]', 'Complete massage therapy practice management'),
  ('dental', 79.99, '["patient_records", "appointment_scheduling", "treatment_tracking", "insurance_billing"]', 'Comprehensive dental practice software'),
  ('beauty', 39.99, '["service_booking", "stylist_management", "inventory_tracking", "client_profiles"]', 'Full-service beauty salon management system')`);

// Create super admin user
const bcrypt = require('bcryptjs');
const superAdminPassword = bcrypt.hashSync('superadmin123', 10);

db.run(`INSERT OR IGNORE INTO users (name, email, password, role, phone) VALUES 
  ('Super Admin', 'superadmin@platform.com', ?, 'superadmin', '555-0000')`, [superAdminPassword]);

// Payment and subscription tables for Stripe integration
db.run(`CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  business_type TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT DEFAULT 'active',
  current_period_start DATETIME,
  current_period_end DATETIME,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  payment_method TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
)`);

db.run(`CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  booking_id INTEGER,
  subscription_id INTEGER,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'pending',
  payment_type TEXT DEFAULT 'booking',
  description TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id),
  FOREIGN KEY (booking_id) REFERENCES bookings (id),
  FOREIGN KEY (subscription_id) REFERENCES subscriptions (id)
)`);

db.run(`CREATE TABLE IF NOT EXISTS stripe_webhooks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed BOOLEAN DEFAULT 0,
  data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Add payment_status column to bookings if it doesn't exist
db.run(`ALTER TABLE bookings ADD COLUMN payment_status TEXT DEFAULT 'pending'`, (err) => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('Error adding payment_status column:', err);
  }
});

// Add payment_amount column to bookings if it doesn't exist
db.run(`ALTER TABLE bookings ADD COLUMN payment_amount DECIMAL(10,2) DEFAULT 0.00`, (err) => {
  if (err && !err.message.includes('duplicate column name')) {
    console.error('Error adding payment_amount column:', err);
  }
});

module.exports = db;