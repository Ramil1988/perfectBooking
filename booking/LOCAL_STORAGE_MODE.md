# Local Storage Testing Mode

This booking application now supports **Local Storage Mode** - a feature that allows the app to run entirely in the browser without requiring a backend server. This is perfect for:

- 🧪 **Testing** - Test the full app functionality without setting up a database
- 🎯 **Demonstrations** - Show the app to stakeholders without deployment
- 🚀 **Quick Prototyping** - Develop and iterate on frontend features rapidly
- 📱 **Offline Development** - Work on the app without internet connectivity

## How It Works

When Local Storage Mode is enabled, all data (users, bookings, services, specialists) is stored in the browser's localStorage instead of making API calls to a backend server. The data persists across page refreshes but is specific to the browser and device.

## Enabling Local Storage Mode

### Method 1: Environment Variable (Recommended)

Create or edit the `.env.local` file in the `client` directory:

```bash
REACT_APP_USE_LOCAL_STORAGE=true
```

Then restart your development server:

```bash
cd client
npm start
```

### Method 2: Browser Console

You can toggle Local Storage Mode on/off at runtime using the browser console:

```javascript
// Enable Local Storage Mode
localStorage.setItem('USE_LOCAL_STORAGE', 'true');
window.location.reload();

// Disable Local Storage Mode (use real API)
localStorage.removeItem('USE_LOCAL_STORAGE');
window.location.reload();
```

### Method 3: Helper Function

The app provides a helper function you can use in the browser console:

```javascript
// Toggle mode programmatically
import { setLocalStorageMode } from './utils/api';

// Enable localStorage mode
setLocalStorageMode(true);

// Disable localStorage mode
setLocalStorageMode(false);
```

## Default Test Accounts

When using Local Storage Mode, the following accounts are pre-configured:

### Admin Account
- **Email:** admin@business.com
- **Password:** admin123
- **Role:** Admin
- Can manage bookings for all users
- Can view all appointments

### Super Admin Account
- **Email:** superadmin@platform.com
- **Password:** superadmin123
- **Role:** Super Admin
- Full platform access
- Can manage all business types

### Customer Accounts
You can register new customer accounts through the registration page. All new registrations will be stored in localStorage.

## Pre-loaded Data

Local Storage Mode comes with sample data:

### Specialists
- **Massage**: Sarah Johnson (Deep Tissue), Maria Garcia (Swedish & Relaxation)
- **Dental**: Dr. Emily Davis (General Dentistry)
- **Beauty**: Isabella Martinez (Hair Styling)

### Services
- **Massage**: Swedish Massage ($80), Deep Tissue Massage ($90)
- **Dental**: Dental Cleaning ($120)
- **Beauty**: Haircut & Style ($45)

### Business Hours
- Monday - Friday: 9:00 AM - 5:00 PM
- Weekends: Closed

## Features Available in Local Storage Mode

All core features work in Local Storage Mode:

✅ User registration and login
✅ Creating bookings
✅ Viewing bookings
✅ Updating bookings
✅ Deleting bookings
✅ Checking available time slots
✅ Specialist selection
✅ Service selection
✅ Role-based access control

## Limitations

⚠️ **Data is device-specific** - Data is stored in the browser's localStorage and won't sync across devices or browsers

⚠️ **No real authentication** - Password validation is simplified (doesn't use bcrypt hashing)

⚠️ **Data can be lost** - Clearing browser data will delete all stored information

⚠️ **No payment processing** - Payment features will need the real backend

⚠️ **No real-time updates** - Changes won't be reflected across different browser tabs automatically

## Clearing Local Storage Data

To reset the app and clear all data:

```javascript
// Clear all booking app data
localStorage.removeItem('booking_users');
localStorage.removeItem('booking_bookings');
localStorage.removeItem('booking_business_hours');
localStorage.removeItem('booking_specialists');
localStorage.removeItem('booking_services');
localStorage.removeItem('booking_specialist_availability');
localStorage.removeItem('booking_current_user');
localStorage.removeItem('token');
localStorage.removeItem('booking_next_id');

// Then reload the page
window.location.reload();
```

Or simply clear all localStorage:

```javascript
localStorage.clear();
window.location.reload();
```

## Switching Between Modes

You can switch between Local Storage Mode and API Mode at any time:

1. **Stop the development server** (if running)
2. **Update `.env.local`**:
   - Set `REACT_APP_USE_LOCAL_STORAGE=true` for Local Storage Mode
   - Set `REACT_APP_USE_LOCAL_STORAGE=false` for API Mode
3. **Restart the development server**: `npm start`

## Deployment Considerations

### For Testing Deployments (Static Hosting)

If you want to deploy a test version that uses Local Storage Mode:

1. Build with the environment variable:
   ```bash
   REACT_APP_USE_LOCAL_STORAGE=true npm run build
   ```

2. Deploy the `build` folder to any static hosting service:
   - Netlify
   - Vercel
   - GitHub Pages
   - AWS S3 + CloudFront

### For Production Deployments

For production, you should:

1. Ensure `REACT_APP_USE_LOCAL_STORAGE=false` (or not set)
2. Have a proper backend server running
3. Configure proper API endpoints
4. Use real database (SQLite, PostgreSQL, etc.)
5. Implement proper authentication and security

## Debugging

To check which mode the app is currently using:

```javascript
// In browser console
import { isLocalStorageMode } from './utils/api';
console.log('Using Local Storage Mode:', isLocalStorageMode());
```

Or check the environment variable:

```javascript
console.log('REACT_APP_USE_LOCAL_STORAGE:', process.env.REACT_APP_USE_LOCAL_STORAGE);
```

## Data Structure

Local Storage uses the following keys:

- `booking_users` - User accounts
- `booking_bookings` - All bookings/appointments
- `booking_business_hours` - Business operating hours
- `booking_specialists` - Available specialists/staff
- `booking_services` - Available services
- `booking_specialist_availability` - Specialist availability schedule
- `booking_current_user` - Currently logged-in user
- `token` - Authentication token
- `booking_next_id` - ID counters for auto-increment

You can inspect these in browser DevTools → Application → Local Storage.

## Benefits for Testing

1. **No Setup Required** - No need to install or configure a database
2. **Fast Iteration** - Make changes and test immediately
3. **Easy Sharing** - Share the deployed test site with anyone
4. **Data Isolation** - Each user/tester has their own data
5. **Reset Anytime** - Clear localStorage to start fresh

## Example Testing Workflow

1. Enable Local Storage Mode
2. Register a new test user
3. Login and create several bookings
4. Test different scenarios (cancellations, updates, etc.)
5. Clear localStorage to reset
6. Repeat testing with different data

This feature makes the booking app highly portable and easy to demonstrate or test without infrastructure requirements!
