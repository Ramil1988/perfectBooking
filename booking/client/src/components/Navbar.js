import React from 'react';
import { Link } from 'react-router-dom';
import { useBusinessContext } from '../contexts/BusinessContext';

function Navbar({ user, onLogout }) {
  const { businessConfig, clearBusinessType } = useBusinessContext();
  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          {businessConfig && user?.role === 'admin' && (
            <span style={{ fontSize: '1.5em' }}>{businessConfig.icon}</span>
          )}
          {user?.role === 'superadmin' && (
            <span style={{ fontSize: '1.5em' }}>🚀</span>
          )}
          {user?.role === 'customer' && (
            <span style={{ fontSize: '1.5em' }}>📅</span>
          )}
          <h1>
            {user?.role === 'superadmin' ? 'PerfectBooking - Super Admin' :
             user?.role === 'customer' ? 'PerfectBooking' :
             (businessConfig ? businessConfig.name : 'PerfectBooking')}
          </h1>
        </Link>
        
        <div className="nav-links">
          {user ? (
            <>
              {user.role !== 'superadmin' && (
                <span style={{ color: '#64748b' }}>Welcome, {user.name}</span>
              )}
              {user.role === 'customer' ? (
                <>
                  <Link to="/dashboard">My Appointments</Link>
                  <Link to="/payments">💳 Payments</Link>
                  <Link to="/book" className="btn">Book Now</Link>
                </>
              ) : user.role === 'admin' ? (
                <>
                  <Link to="/admin">Dashboard</Link>
                  <Link to="/payments">💳 Billing</Link>
                </>
              ) : user.role === 'superadmin' ? (
                <>
                  <Link to="/payments">💳 Payments</Link>
                </>
              ) : (
                <>
                  <Link to="/">Dashboard</Link>
                </>
              )}
              {user.role === 'admin' && (
                <button
                  onClick={clearBusinessType}
                  className="btn btn-secondary"
                  style={{ marginRight: '10px' }}
                >
                  ⚙️ Change Business Type
                </button>
              )}
              <button onClick={onLogout} className="btn btn-secondary">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;