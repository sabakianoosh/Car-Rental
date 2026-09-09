import bcrypt from 'bcryptjs';
import db, { initDb } from './db.js';
import { ADMIN_PASS, ADMIN_USER } from './routes/admin.js';

const cars = [
  {
    id: 'c1',
    name: 'پژو ۲۰۷',
    trim: 'اتوماتیک · ۱۴۰۲',
    base_price: 1200000,
    extra_price: 700000,
    seats: 5,
    fuel: 'بنزین',
    gear: 'اتوماتیک',
    km: '۱۸٬۰۰۰',
    color: 'سفید',
    image_url: '207.webp',
    active: 1
  },

  {
    id: 'c2',
    name: 'سمند LX',
    trim: 'دنده‌ای · ۱۴۰۱',
    base_price: 900000,
    extra_price: 500000,
    seats: 5,
    fuel: 'دوگانه',
    gear: 'دستی',
    km: '۴۲٬۰۰۰',
    color: 'نقره‌ای',
    image_url: 'samandLX.webp',
    active: 1
  },

  {
    id: 'c3',
    name: 'کیا سراتو',
    trim: 'اتوماتیک · ۱۳۹۹',
    base_price: 2200000,
    extra_price: 1300000,
    seats: 5,
    fuel: 'بنزین',
    gear: 'اتوماتیک',
    km: '۶۵٬۰۰۰',
    color: 'مشکی',
    image_url: 'kiaserato.webp',
    active: 1
  },

  {
    id: 'c4',
    name: 'هیوندای i20',
    trim: 'اتوماتیک · ۱۴۰۰',
    base_price: 1800000,
    extra_price: 1000000,
    seats: 5,
    fuel: 'بنزین',
    gear: 'اتوماتیک',
    km: '۳۰٬۰۰۰',
    color: 'آبی',
    image_url: 'هیوندا ابی.webp',
    active: 1
  },

  {
    id: 'c5',
    name: 'پژو پارس',
    trim: 'دنده‌ای · ۱۴۰۲',
    base_price: 1000000,
    extra_price: 600000,
    seats: 5,
    fuel: 'بنزین',
    gear: 'دستی',
    km: '۱۲٬۰۰۰',
    color: 'سفید',
    image_url: 'پژو پارس.webp',
    active: 1
  },

  {
    id: 'c6',
    name: 'رنو ساندرو',
    trim: 'اتوماتیک · ۱۳۹۸',
    base_price: 1500000,
    extra_price: 850000,
    seats: 5,
    fuel: 'بنزین',
    gear: 'اتوماتیک',
    km: '۷۰٬۰۰۰',
    color: 'قرمز',
    image_url: 'رنو قرمز.webp',
    active: 1
  },

  {
    id: 'c7',
    name: 'تویوتا کرولا',
    trim: 'اتوماتیک · ۱۴۰۱',
    base_price: 3500000,
    extra_price: 2000000,
    seats: 5,
    fuel: 'بنزین',
    gear: 'اتوماتیک',
    km: '۲۵٬۰۰۰',
    color: 'خاکستری',
    image_url: 'toyota.webp',
    active: 1
  },

  {
    id: 'c8',
    name: 'نیسان اسکای‌لاین',
    trim: 'اتوماتیک · ۱۳۹۸',
    base_price: 4800000,
    extra_price: 2800000,
    seats: 4,
    fuel: 'بنزین',
    gear: 'اتوماتیک',
    km: '۳۸٬۰۰۰',
    color: 'نقره‌ای',
    image_url: 'skyline.webp',
    active: 1
  },
];

initDb();

const insertCar = db.prepare(`
  INSERT OR IGNORE INTO vehicles (id, name, trim, base_price, extra_price, seats, fuel, gear, km, color, image_url, active)
  VALUES (@id, @name, @trim, @base_price, @extra_price, @seats, @fuel, @gear, @km, @color, @image_url, @active)
`);

const updateCarImage = db.prepare('UPDATE vehicles SET image_url = ? WHERE id = ?');

for (const car of cars) {
  insertCar.run(car);
  updateCarImage.run(car.image_url, car.id);
}

const adminExists = db.prepare('SELECT id FROM admin_users WHERE username = ?').get(ADMIN_USER);
if (!adminExists) {
  const hash = bcrypt.hashSync(ADMIN_PASS, 10);
  db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run(ADMIN_USER, hash);
}

// Demo user with active delivered rental for V2 testing
const demoPhone = '09120000000';
let demoUser = db.prepare('SELECT id FROM users WHERE phone = ?').get(demoPhone);
if (!demoUser) {
  const info = db.prepare(`
    INSERT INTO users (phone, username, kyc_status) VALUES (?, ?, 'approved')
  `).run(demoPhone, 'کاربر_دمو');
  demoUser = { id: info.lastInsertRowid };
}

const demoRental = db.prepare(`
  SELECT id FROM rentals WHERE user_id = ? AND status = 'delivered'
`).get(demoUser.id);

if (!demoRental) {
  const now = new Date();
  const start = new Date(now.getTime() - 2 * 3600000);
  const end = new Date(now.getTime() + 22 * 3600000);
  const fmt = (d) => d.toISOString().slice(0, 16).replace('T', ' ');
  db.prepare(`
    INSERT INTO rentals (
      user_id, vehicle_id, purpose, start_at, end_at, hours,
      base_price, extra_blocks, extra_unit_price, total_amount,
      coverage_type, coverage_amount,
      status, reservation_code, payment_status, delivered_at
    ) VALUES (?, 'c4', 'سفر شهری', ?, ?, 24, 1800000, 1, 1000000, 3150000,
      'comprehensive', 350000, 'delivered', 'RK-DEMO1', 'paid', datetime('now'))
  `).run(demoUser.id, fmt(start), fmt(end));
}

console.log('Database seeded successfully.');
console.log(`Admin login: ${ADMIN_USER} / ${ADMIN_PASS}`);
console.log(`Demo user: ${demoPhone} (OTP: 111111) — has active delivered rental`);
console.log(`Vehicles: ${cars.length}`);
