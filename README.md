# 🎯 Perfect Booking - Universal Appointment Booking Platform

A modern, flexible booking platform designed for small businesses across multiple industries (massage therapy, dental clinics, beauty salons, and more). Features both API-based and browser-only localStorage modes for maximum flexibility.

[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen)](https://github.com/Ramil1988/perfectBooking)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## ✨ Key Features

### 🔥 Dual Mode Operation
- **API Mode**: Full-featured with database backend
- **LocalStorage Mode**: Browser-only, perfect for demos and testing (no backend required!)

### 👥 For Customers
- User registration & secure login
- Browse services by business type (massage, dental, beauty)
- View specialist profiles and availability
- Book appointments with available time slots
- Manage upcoming and past bookings
- Responsive design for all devices

### 👨‍💼 For Business Admins
- Comprehensive dashboard overview
- Multi-business type support (massage, dental, beauty)
- Specialist and service management
- Booking creation, updates, and cancellations
- Customer management
- Calendar view with filtering
- Business hours configuration

### 🔐 For Platform Super Admin
- Platform-wide management
- Business access control
- Subscription management
- Payment integration (Stripe)
- Multi-tenant support

## 🚀 Quick Start

### 🌐 Try Online (No Installation Required!)

**Live Demo**: [https://perfectbooking.netlify.app](https://perfectbooking.netlify.app) *(update URL after deployment)*

**Just visit the link and start using!** No installation, no setup, no backend needed.

**How it works:**
- 🔒 All your data is stored **locally in your browser** (localStorage)
- 📱 Works on any device - desktop, tablet, or mobile
- 💾 Your bookings persist across browser sessions
- 🚀 No server, no database - runs 100% in your browser
- 🔐 Your data stays private on your device

**Getting Started with the Live Demo:**
1. **Visit the Netlify URL** above
2. **Login** with test accounts:
   - **Admin**: admin@business.com / admin123
   - **Super Admin**: superadmin@platform.com / superadmin123
3. **Or Register** your own customer account
4. **Start booking** appointments immediately!

> **💡 Pro Tip**: Each browser/device has its own isolated data. Bookings made on Chrome won't appear in Firefox. Perfect for testing different user scenarios!

### Option 1: LocalStorage Mode (No Backend Required!)

Perfect for testing, demos, or static deployment:

```bash
# 1. Clone the repository
git clone https://github.com/Ramil1988/perfectBooking.git
cd perfectBooking

# 2. Install frontend dependencies
cd client
npm install

# 3. Enable localStorage mode
cp .env.example .env.local
# Edit .env.local and set: REACT_APP_USE_LOCAL_STORAGE=true

# 4. Start the app
npm start

# 5. Open http://localhost:3000
```

**Test Accounts (LocalStorage Mode):**
- **Admin**: admin@business.com / admin123
- **Super Admin**: superadmin@platform.com / superadmin123
- Or register a new customer account!

### Option 2: Full Stack Mode (With Backend)

For production deployment with database:

```bash
# 1. Clone the repository
git clone https://github.com/Ramil1988/perfectBooking.git
cd perfectBooking

# 2. Install all dependencies
npm install
cd client && npm install && cd ..

# 3. Start both servers
npm run dev

# 4. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3001
```

**Default Admin Account:**
- **Email**: admin@business.com
- **Password**: admin123

## 📋 Technology Stack

### Frontend
- **React 18** - Modern UI framework
- **React Router** - Client-side routing
- **Axios** - HTTP client (with localStorage fallback)
- **Context API** - State management
- **Responsive CSS** - Mobile-first design

### Backend (API Mode)
- **Node.js** - Runtime environment
- **Express** - Web framework
- **SQLite** - Lightweight database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Stripe** - Payment processing

### LocalStorage Mode
- **Browser localStorage** - Client-side data persistence
- **No backend required** - Perfect for static hosting
- **Pre-loaded demo data** - Ready to test immediately

## 🎨 Business Types Supported

The platform supports multiple business verticals:

### 💆 Massage Therapy
- **Specialists**: Deep Tissue, Swedish & Relaxation, Hot Stone, Sports Massage
- **Services**: Swedish Massage, Deep Tissue, Hot Stone, Sports Massage, Prenatal
- **Pricing**: $80-$100 per session

### 🦷 Dental Clinics
- **Specialists**: General Dentistry, Endodontics, Oral Surgery, Cosmetic Dentistry
- **Services**: Cleaning, Exam, Whitening, Root Canal, Fillings
- **Pricing**: $80-$400 per procedure

### 💇 Beauty Salons
- **Specialists**: Hair Styling, Facial Treatments, Nail Artistry, Makeup & Brows
- **Services**: Haircut, Coloring, Facials, Manicure, Pedicure, Extensions
- **Pricing**: $15-$120 per service

## 📖 Usage Guide

### For Customers

1. **Register/Login**
   - Visit the homepage
   - Click "Register" or "Login"
   - Fill in your details

2. **Book an Appointment**
   - Click "Book Appointment"
   - Select business type (massage, dental, beauty)
   - Choose a service
   - Select a specialist (optional)
   - Pick an available date and time slot
   - Add notes if needed
   - Confirm booking

3. **Manage Bookings**
   - View all appointments in your dashboard
   - Cancel or reschedule as needed
   - View past booking history

### For Admins

1. **Access Admin Dashboard**
   - Login with admin credentials
   - Select your business type
   - View comprehensive booking overview

2. **Manage Bookings**
   - View all customer bookings
   - Create bookings for walk-in customers
   - Update booking status
   - Filter by date, status, or service

3. **Manage Specialists**
   - Add new specialists
   - Set specialist availability
   - Assign specialists to services

4. **Configure Services**
   - Add/edit services
   - Set pricing and duration
   - Enable/disable services

### For Super Admins

1. **Platform Management**
   - Access super admin dashboard
   - View all businesses and users
   - Manage subscriptions
   - Configure platform settings

2. **Business Access Control**
   - Grant/revoke business access
   - Set subscription plans
   - Monitor usage and payments

## 🗄️ Database Schema (API Mode)

### Users
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'customer',
  phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Bookings
```sql
CREATE TABLE bookings (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  service_name TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  duration INTEGER DEFAULT 60,
  status TEXT DEFAULT 'confirmed',
  notes TEXT,
  business_type TEXT DEFAULT 'general',
  staff_id INTEGER,
  payment_status TEXT DEFAULT 'pending',
  payment_amount DECIMAL(10,2) DEFAULT 0.00,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id)
);
```

### Specialists
```sql
CREATE TABLE specialists (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  business_type TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Services
```sql
CREATE TABLE services (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  duration INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Customer registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Bookings
- `GET /api/bookings` - List bookings (role-based)
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Delete booking
- `GET /api/bookings/available-slots?date=YYYY-MM-DD` - Available time slots

### Specialists
- `GET /api/specialists` - List specialists
- `POST /api/specialists` - Create specialist (admin)
- `GET /api/specialists/:id/availability` - Get availability

### Services
- `GET /api/services` - List services
- `POST /api/services` - Create service (admin)
- `PUT /api/services/:id` - Update service (admin)

### Users (Admin)
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user details

### Payments (Stripe)
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/subscriptions/create` - Create subscription
- `POST /api/webhooks/stripe` - Handle Stripe webhooks

## 🌐 LocalStorage Mode

Perfect for testing, demos, or static hosting without a backend!

### How It Works

1. **Data Storage**: All data (users, bookings, services) stored in browser's localStorage
2. **No Backend**: Runs entirely in the browser
3. **Data Persistence**: Survives page refreshes
4. **Pre-loaded Data**: Comes with demo users, specialists, and services

### Enabling LocalStorage Mode

**Method 1: Environment Variable**
```bash
# Create .env.local in client directory
echo "REACT_APP_USE_LOCAL_STORAGE=true" > client/.env.local
npm start
```

**Method 2: Browser Console**
```javascript
localStorage.setItem('USE_LOCAL_STORAGE', 'true');
window.location.reload();
```

### Features Available in LocalStorage Mode

✅ User registration and login
✅ Creating, viewing, updating, and deleting bookings
✅ Specialist selection
✅ Service browsing
✅ Available time slot checking
✅ Role-based access control
✅ Business type filtering

### Limitations

⚠️ Data is device-specific (doesn't sync across browsers)
⚠️ Clearing browser data will delete all information
⚠️ No real payment processing
⚠️ Simplified password validation

### Demo Data Included

**Users:**
- Admin: admin@business.com / admin123
- Super Admin: superadmin@platform.com / superadmin123

**Specialists:**
- Massage: Sarah Johnson, Maria Garcia
- Dental: Dr. Emily Davis
- Beauty: Isabella Martinez

**Services:**
- Massage: Swedish ($80), Deep Tissue ($90)
- Dental: Cleaning ($120)
- Beauty: Haircut ($45)

**Business Hours:**
- Monday-Friday: 9:00 AM - 5:00 PM

### 📦 Understanding Browser localStorage

When you use the **live demo** or **localStorage mode**, here's what happens:

**Where Your Data Lives:**
- All data is stored in your browser's **localStorage** (not on any server)
- Each browser on each device has **completely isolated data**
- Data persists even after closing the browser
- Maximum storage: ~5-10MB (more than enough for booking data)

**Data Privacy & Isolation:**
- ✅ **Your device only**: Data never leaves your computer/phone
- ✅ **Browser isolated**: Chrome data ≠ Firefox data ≠ Safari data
- ✅ **Private browsing**: Using incognito/private mode? Data clears when you close the window
- ✅ **No account sync**: Each browser session is completely independent

**Practical Examples:**

| Scenario | What Happens |
|----------|-------------|
| 📱 **Same browser, same device** | ✅ Data persists - you see your bookings |
| 💻 **Different browser, same device** | ❌ Fresh start - separate data |
| 🏠 **Same browser, different device** | ❌ Fresh start - separate data |
| 🌐 **Shared computer** | ⚠️ Others using same browser will see your data |
| 🧹 **Clear browser data** | ❌ All bookings deleted |
| 🔄 **Close and reopen browser** | ✅ Data persists - bookings still there |

**Managing Your Data:**

```javascript
// Clear all booking data (browser console)
localStorage.clear();
window.location.reload();

// Export your data (for backup)
const allData = {
  users: localStorage.getItem('booking_users'),
  bookings: localStorage.getItem('booking_bookings'),
  // ... other data
};
console.log(JSON.stringify(allData));
```

**Best Practices for Live Demo:**
- 🧪 **For testing**: Perfect! Each tester has isolated data
- 👥 **For demos**: Great! Show different scenarios in different browsers
- 📚 **For learning**: Excellent! Experiment without affecting others
- 🏢 **For production**: Use API mode with real database

For complete documentation, see [LOCAL_STORAGE_MODE.md](LOCAL_STORAGE_MODE.md)

## 🚀 Deployment

### 🌟 Live Demo on Netlify

**Try it now**: The app is deployed and available at: **[Perfect Booking on Netlify](https://perfectbooking.netlify.app)** *(update with your actual Netlify URL after deployment)*

**How to use the live demo:**
1. Visit the Netlify URL
2. All data is stored in your browser's localStorage
3. Your bookings and account persist across sessions (on the same device/browser)
4. No backend server needed - runs 100% in your browser!

**Test Accounts:**
- **Admin**: admin@business.com / admin123
- **Super Admin**: superadmin@platform.com / superadmin123
- Or register your own customer account

> **Note**: Each user has their own isolated data in their browser. Data is not shared between users or devices. Perfect for testing and demonstrations!

**📖 Want to deploy your own?** See the complete **[Netlify Deployment Guide](NETLIFY_DEPLOYMENT.md)** for step-by-step instructions!

### Deploy Your Own (Static - LocalStorage Mode)

Perfect for Netlify, Vercel, GitHub Pages:

#### Deploy to Netlify (Easiest)

**Option 1: Deploy via GitHub (Recommended)**
1. Fork or push this repository to your GitHub
2. Visit [Netlify](https://app.netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect your GitHub repository
5. Configure build settings:
   - **Base directory**: `client`
   - **Build command**: `REACT_APP_USE_LOCAL_STORAGE=true npm run build`
   - **Publish directory**: `client/build`
6. Click "Deploy site"
7. Your app will be live at `https://your-site-name.netlify.app`

**Option 2: Deploy via Netlify CLI**
```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Build with localStorage enabled
cd client
REACT_APP_USE_LOCAL_STORAGE=true npm run build

# 3. Deploy to Netlify
netlify deploy --prod --dir=build

# 4. Your site is live!
```

**Option 3: Drag & Drop Deployment**
```bash
# 1. Build the app
cd client
REACT_APP_USE_LOCAL_STORAGE=true npm run build

# 2. Visit https://app.netlify.com/drop
# 3. Drag and drop the 'build' folder
# 4. Your site is live instantly!
```

#### Deploy to Vercel
```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Navigate to client directory
cd client

# 3. Create vercel.json with build settings
cat > vercel.json << 'EOF'
{
  "buildCommand": "REACT_APP_USE_LOCAL_STORAGE=true npm run build",
  "outputDirectory": "build",
  "framework": "create-react-app"
}
EOF

# 4. Deploy
vercel --prod
```

#### Deploy to GitHub Pages
```bash
# 1. Build with localStorage enabled
cd client
REACT_APP_USE_LOCAL_STORAGE=true npm run build

# 2. Install gh-pages
npm install --save-dev gh-pages

# 3. Add to package.json scripts:
# "predeploy": "REACT_APP_USE_LOCAL_STORAGE=true npm run build",
# "deploy": "gh-pages -d build"

# 4. Deploy
npm run deploy

# 5. Enable GitHub Pages in repository settings
# Your site will be live at https://yourusername.github.io/perfectBooking
```

**Other Platforms:**
- [Firebase Hosting](https://firebase.google.com/docs/hosting) - Google's hosting
- [Surge](https://surge.sh) - Simple static hosting
- [Cloudflare Pages](https://pages.cloudflare.com) - Edge network deployment

### Deploy Full Stack (API Mode)

For production with database:

```bash
# 1. Build frontend
cd client && npm run build && cd ..

# 2. Set environment variables
export NODE_ENV=production
export JWT_SECRET=your-super-secret-key-change-this
export PORT=3001

# 3. Start server
npm start
```

**Recommended Platforms:**
- [Heroku](https://heroku.com) - Easy deployment
- [Railway](https://railway.app) - Modern platform
- [Render](https://render.com) - Free tier available
- [DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform)

### Environment Variables

**Backend (.env):**
```bash
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secret-jwt-key
STRIPE_SECRET_KEY=sk_live_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

**Frontend (.env.local):**
```bash
REACT_APP_USE_LOCAL_STORAGE=false  # true for localStorage mode
PORT=3000
```

## 🎨 Customization

### Change Business Hours

Edit `server/database.js`:
```javascript
db.run(`INSERT INTO business_hours (day_of_week, start_time, end_time) VALUES
  (1, '09:00', '17:00'),  // Monday
  (2, '09:00', '17:00'),  // Tuesday
  // ... add more days
`);
```

### Add New Services

Edit the services array or add to database:
```javascript
// In client/src/components/BookingForm.js
const services = [
  'Your New Service',
  'Another Service',
  // ...
];
```

### Modify Time Slots

Edit time generation in `server/routes/bookings.js`:
```javascript
function generateTimeSlots(startTime, endTime, bookedTimes) {
  // Modify interval (currently 1 hour)
  time.setMinutes(time.getMinutes() + 30); // Change to 30 min slots
}
```

### Add New Business Types

1. Add to business types enum in database
2. Add specialists for that type
3. Add services for that type
4. Update frontend business type selector

## 🔒 Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Role-Based Access**: Customer, Admin, Super Admin roles
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Configured for specific origins
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Input sanitization
- **HTTPS Ready**: Production-ready security headers

## 📱 Browser Support

- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile Safari (iOS)
- ✅ Chrome Mobile (Android)

## 🧪 Testing

### Test User Accounts

**API Mode & LocalStorage Mode:**
- Admin: admin@business.com / admin123
- Super Admin: superadmin@platform.com / superadmin123

**Create Your Own:**
- Register via the UI
- Accounts persist based on mode (localStorage vs database)

### Sample Bookings

LocalStorage mode comes pre-loaded with:
- 4 specialists across 3 business types
- 20+ services
- Available time slots Monday-Friday 9AM-5PM

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For issues, questions, or contributions:
- Create an issue on GitHub
- Check existing documentation
- Review the [LOCAL_STORAGE_MODE.md](LOCAL_STORAGE_MODE.md) guide

## 🎯 Roadmap

- [ ] Calendar sync (Google Calendar, Outlook)
- [ ] Email notifications
- [ ] SMS reminders
- [ ] Multi-language support
- [ ] Advanced reporting and analytics
- [ ] Mobile app (React Native)
- [ ] Video consultation integration
- [ ] Loyalty program

## 🙏 Acknowledgments

- Built with React and Node.js
- Styled with custom CSS
- Icons from various open-source projects
- Inspired by modern booking platforms

---

**Made with ❤️ for small businesses**

🚀 **[Get Started Now](https://github.com/Ramil1988/perfectBooking)** | 📖 **[Documentation](LOCAL_STORAGE_MODE.md)** | 🐛 **[Report Bug](https://github.com/Ramil1988/perfectBooking/issues)**
