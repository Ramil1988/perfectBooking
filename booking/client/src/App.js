import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

import { BusinessProvider, useBusinessContext } from './contexts/BusinessContext';
import BusinessConfigSelector from './components/BusinessConfigSelector';
import BusinessAccessSelector from './components/BusinessAccessSelector';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import LandingPage from './components/LandingPage';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import CustomerDashboard from './components/CustomerDashboard';
import AdminDashboard from './components/AdminDashboard';
import BusinessBookingMain from './components/BusinessBookingMain';
import PaymentDashboard from './components/PaymentDashboard';
import SubscriptionPayment from './components/SubscriptionPayment';
import BookingPayment from './components/BookingPayment';
import { authAPI } from './utils/api';

axios.defaults.baseURL = '';

function AppContent() {
  const { selectedBusinessType, selectBusinessType } = useBusinessContext();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const data = await authAPI.getMe();
      setUser(data.user);
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  // If no user is logged in, show landing page with login/register routes
  if (!user) {
    return (
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    );
  }

  // Super admin gets enhanced access with both super admin and regular admin features
  if (user.role === 'superadmin') {
    return (
      <Router>
        <div className="App">
          <Navbar user={user} onLogout={handleLogout} />
          <div className="container">
            <Routes>
              <Route 
                path="/" 
                element={<SuperAdminDashboard user={user} />} 
              />
              <Route 
                path="/admin" 
                element={
                  selectedBusinessType ? (
                    <AdminDashboard user={user} />
                  ) : (
                    <BusinessConfigSelector onBusinessSelect={selectBusinessType} user={user} />
                  )
                } 
              />
              <Route 
                path="/business-booking" 
                element={
                  selectedBusinessType ? (
                    <BusinessBookingMain user={user} />
                  ) : (
                    <BusinessConfigSelector onBusinessSelect={selectBusinessType} user={user} />
                  )
                } 
              />
              <Route 
                path="/payments" 
                element={<PaymentDashboard user={user} />} 
              />
              <Route 
                path="/subscription-payment" 
                element={<SubscriptionPayment user={user} />} 
              />
              <Route 
                path="/booking-payment/:bookingId" 
                element={<BookingPayment user={user} />} 
              />
              <Route 
                path="*" 
                element={<Navigate to="/" replace />} 
              />
            </Routes>
          </div>
        </div>
      </Router>
    );
  }

  // If user is logged in but no business type is selected
  // Only admins need to select business type - customers can book from any available type
  if (!selectedBusinessType && user.role === 'admin') {
    return <BusinessAccessSelector onBusinessSelect={selectBusinessType} user={user} onLogout={handleLogout} />;
  }

  return (
    <Router>
      <div className="App">
        <Navbar user={user} onLogout={handleLogout} />
        <div className="container">
          <Routes>
            <Route 
              path="/" 
              element={
                user.role === 'admin' ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              } 
            />
            <Route 
              path="/login" 
              element={<Navigate to="/" replace />} 
            />
            <Route 
              path="/register" 
              element={<Navigate to="/" replace />} 
            />
            <Route 
              path="/dashboard" 
              element={
                user && user.role === 'customer' ? (
                  <CustomerDashboard user={user} />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route 
              path="/book" 
              element={
                user && user.role === 'customer' ? (
                  <BusinessBookingMain user={user} />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route 
              path="/admin" 
              element={
                user && user.role === 'admin' ? (
                  <AdminDashboard user={user} />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route 
              path="/payments" 
              element={
                user ? (
                  <PaymentDashboard user={user} />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route 
              path="/subscribe/:businessType" 
              element={
                user && user.role === 'admin' ? (
                  <SubscriptionPayment />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route 
              path="/pay/:bookingId" 
              element={
                user && user.role === 'customer' ? (
                  <BookingPayment />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

function App() {
  return (
    <BusinessProvider>
      <AppContent />
    </BusinessProvider>
  );
}

export default App;