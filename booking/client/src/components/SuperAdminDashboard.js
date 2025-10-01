import React, { useState, useEffect } from 'react';
import axios from 'axios';

function SuperAdminDashboard({ user }) {
  const [users, setUsers] = useState([]);
  const [platformConfig, setPlatformConfig] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [createUserForm, setCreateUserForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'customer',
    phone: ''
  });
  const [showManageDropdown, setShowManageDropdown] = useState(null);
  const [editingPrice, setEditingPrice] = useState(null);
  const [newPrice, setNewPrice] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showManageDropdown && !event.target.closest('.manage-dropdown-container')) {
        setShowManageDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showManageDropdown]);

  const fetchData = async () => {
    try {
      const [usersRes, configRes, analyticsRes] = await Promise.all([
        axios.get('/api/super-admin/users'),
        axios.get('/api/super-admin/platform-config'),
        axios.get('/api/super-admin/analytics')
      ]);
      
      setUsers(usersRes.data.users);
      setPlatformConfig(configRes.data.config);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const grantAccess = async (userId, businessType, subscriptionStatus = 'trial', monthlyPrice = 0, duration = 30) => {
    try {
      await axios.post('/api/super-admin/grant-access', {
        userId,
        businessType,
        subscriptionStatus,
        monthlyPrice,
        subscriptionDuration: duration
      });
      
      fetchData();
      setShowGrantModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error granting access:', error);
      alert('Error granting access');
    }
  };

  const createUser = async () => {
    try {
      await axios.post('/api/super-admin/create-user', createUserForm);
      
      fetchData();
      setShowCreateUserModal(false);
      setCreateUserForm({
        fullName: '',
        email: '',
        password: '',
        role: 'customer',
        phone: ''
      });
      alert('User created successfully!');
    } catch (error) {
      console.error('Error creating user:', error);
      alert(error.response?.data?.message || 'Error creating user');
    }
  };

  const deleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"? This will permanently delete the user and all their data.`)) {
      try {
        await axios.delete(`/api/super-admin/delete-user/${userId}`);
        
        fetchData();
        setShowManageDropdown(null);
        alert('User deleted successfully!');
      } catch (error) {
        console.error('Error deleting user:', error);
        alert(error.response?.data?.message || 'Error deleting user');
      }
    }
  };

  const updatePrice = async (businessType, price) => {
    try {
      // Find the current config to preserve other values
      const currentConfig = platformConfig.find(config => config.business_type === businessType);
      
      await axios.post('/api/super-admin/update-pricing', {
        businessType,
        monthlyPrice: parseFloat(price),
        isAvailable: currentConfig?.is_available ?? true,
        features: currentConfig?.features || [],
        description: currentConfig?.description || ''
      });
      
      fetchData();
      setEditingPrice(null);
      setNewPrice('');
      alert('Price updated successfully!');
    } catch (error) {
      console.error('Error updating price:', error);
      alert(error.response?.data?.message || 'Error updating price');
    }
  };

  const startEditPrice = (businessType, currentPrice) => {
    setEditingPrice(businessType);
    setNewPrice(currentPrice.toString());
  };

  const cancelEditPrice = () => {
    setEditingPrice(null);
    setNewPrice('');
  };

  const revokeAccess = async (userId, businessType) => {
    if (window.confirm('Are you sure you want to revoke this access?')) {
      try {
        await axios.post('/api/super-admin/revoke-access', {
          userId,
          businessType
        });
        
        fetchData();
      } catch (error) {
        console.error('Error revoking access:', error);
        alert('Error revoking access');
      }
    }
  };

  const updateSubscription = async (userId, businessType, subscriptionStatus, monthlyPrice = null, duration = null) => {
    try {
      await axios.post('/api/super-admin/update-subscription', {
        userId,
        businessType,
        subscriptionStatus,
        monthlyPrice,
        subscriptionDuration: duration
      });
      
      fetchData();
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('Error updating subscription');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="super-admin-dashboard" style={{ padding: '20px' }}>
      <h1 style={{ 
        fontSize: '32px', 
        marginBottom: '30px',
        color: '#1e293b',
        borderBottom: '3px solid #3b82f6',
        paddingBottom: '10px'
      }}>
        🚀 Super Admin Dashboard
      </h1>

      {/* Analytics Cards */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px',
        marginBottom: '40px'
      }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: 'white' }}>
          <h3>Total Users</h3>
          <p style={{ fontSize: '32px', margin: '0' }}>{analytics.totalUsers?.[0]?.count || 0}</p>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}>
          <h3>Active Subscriptions</h3>
          <p style={{ fontSize: '32px', margin: '0' }}>{analytics.activeSubscriptions?.[0]?.count || 0}</p>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white' }}>
          <h3>Trial Users</h3>
          <p style={{ fontSize: '32px', margin: '0' }}>{analytics.trialUsers?.[0]?.count || 0}</p>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', color: 'white' }}>
          <h3>Total Revenue</h3>
          <p style={{ fontSize: '32px', margin: '0' }}>
            ${analytics.businessTypeStats?.reduce((sum, stat) => sum + (stat.total_revenue || 0), 0)?.toFixed(2) || '0.00'}
          </p>
        </div>
      </div>

      {/* Business Type Statistics */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <h2>Business Type Analytics</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Business Type</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Total Users</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Active</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Trial</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Avg Price</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {analytics.businessTypeStats?.map(stat => (
                <tr key={stat.business_type}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', textTransform: 'capitalize' }}>
                    {stat.business_type}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>{stat.total_users}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>{stat.active_users}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>{stat.trial_users}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>${stat.avg_price?.toFixed(2)}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>${stat.total_revenue?.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Platform Configuration */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <h2>Platform Pricing Configuration</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Business Type</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Monthly Price</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {platformConfig.map(config => (
                <tr key={config.business_type}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', textTransform: 'capitalize' }}>
                    {config.business_type}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>
                    {editingPrice === config.business_type ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          value={newPrice}
                          onChange={(e) => setNewPrice(e.target.value)}
                          style={{
                            width: '80px',
                            padding: '4px 8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '14px'
                          }}
                          step="0.01"
                          min="0"
                        />
                        <button
                          onClick={() => updatePrice(config.business_type, newPrice)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditPrice}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#6b7280',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>${config.monthly_price}</span>
                        <button
                          onClick={() => startEditPrice(config.business_type, config.monthly_price)}
                          style={{
                            padding: '2px 6px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '10px',
                            cursor: 'pointer'
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      fontSize: '12px',
                      background: config.is_available ? '#dcfce7' : '#fee2e2',
                      color: config.is_available ? '#166534' : '#991b1b'
                    }}>
                      {config.is_available ? 'Available' : 'Disabled'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>{config.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users Management */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Users Management</h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => setShowCreateUserModal(true)}
              className="btn"
              style={{ background: '#3b82f6' }}
            >
              Create User
            </button>
            <button 
              onClick={() => setShowGrantModal(true)}
              className="btn"
              style={{ background: '#10b981' }}
            >
              Grant Access
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>User</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Role</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Business Access</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{user.name}</div>
                      <div style={{ fontSize: '14px', color: '#64748b' }}>{user.email}</div>
                    </div>
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', textTransform: 'capitalize' }}>
                    {user.role}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>
                    {user.role === 'admin' ? (
                      user.business_access.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {user.business_access.map((access, index) => (
                            <span
                              key={index}
                              style={{
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                background: access.subscription_status === 'active' ? '#dcfce7' : '#fef3c7',
                                color: access.subscription_status === 'active' ? '#166534' : '#92400e'
                              }}
                            >
                              {access.business_type} ({access.subscription_status})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#64748b', fontStyle: 'italic' }}>No access</span>
                      )
                    ) : (
                      <span style={{ color: '#64748b', fontStyle: 'italic' }}>N/A</span>
                    )}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>
                    <div className="manage-dropdown-container" style={{ position: 'relative', display: 'inline-block' }}>
                      <button 
                        onClick={() => setShowManageDropdown(showManageDropdown === user.id ? null : user.id)}
                        style={{ 
                          padding: '4px 8px', 
                          fontSize: '12px', 
                          background: '#3b82f6', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        Manage ▼
                      </button>
                      
                      {showManageDropdown === user.id && (
                        <div style={{
                          position: 'absolute',
                          bottom: '100%',
                          right: 0,
                          background: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '4px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          zIndex: 9999,
                          minWidth: '140px',
                          marginBottom: '4px'
                        }}>
                          {user.role === 'admin' && (
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowGrantModal(true);
                                setShowManageDropdown(null);
                              }}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                fontSize: '12px',
                                background: 'none',
                                border: 'none',
                                textAlign: 'left',
                                cursor: 'pointer',
                                color: '#374151',
                                borderBottom: '1px solid #e2e8f0'
                              }}
                              onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                              onMouseLeave={(e) => e.target.style.background = 'none'}
                            >
                              Grant Access
                            </button>
                          )}
                          <button
                            onClick={() => deleteUser(user.id, user.name)}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              fontSize: '12px',
                              background: 'none',
                              border: 'none',
                              textAlign: 'left',
                              cursor: 'pointer',
                              color: '#dc2626'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#fef2f2'}
                            onMouseLeave={(e) => e.target.style.background = 'none'}
                          >
                            Delete User
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <h3>Create New User</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Full Name:</label>
              <input
                type="text"
                value={createUserForm.fullName}
                onChange={(e) => setCreateUserForm({...createUserForm, fullName: e.target.value})}
                className="form-input"
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                placeholder="Enter full name"
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email:</label>
              <input
                type="email"
                value={createUserForm.email}
                onChange={(e) => setCreateUserForm({...createUserForm, email: e.target.value})}
                className="form-input"
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                placeholder="Enter email address"
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password:</label>
              <input
                type="password"
                value={createUserForm.password}
                onChange={(e) => setCreateUserForm({...createUserForm, password: e.target.value})}
                className="form-input"
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                placeholder="Enter password"
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Role:</label>
              <select
                value={createUserForm.role}
                onChange={(e) => setCreateUserForm({...createUserForm, role: e.target.value})}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Phone (Optional):</label>
              <input
                type="tel"
                value={createUserForm.phone}
                onChange={(e) => setCreateUserForm({...createUserForm, phone: e.target.value})}
                className="form-input"
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                placeholder="Enter phone number"
              />
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowCreateUserModal(false)}
                className="btn"
                style={{ background: '#6b7280' }}
              >
                Cancel
              </button>
              <button 
                onClick={createUser}
                className="btn"
                style={{ background: '#3b82f6' }}
                disabled={!createUserForm.fullName || !createUserForm.email || !createUserForm.password}
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grant Access Modal */}
      {showGrantModal && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          background: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{ 
            background: 'white', 
            padding: '30px', 
            borderRadius: '12px', 
            maxWidth: '500px', 
            width: '90%' 
          }}>
            <h3>Grant Business Access</h3>
            
            {selectedUser ? (
              <div>
                <p><strong>User:</strong> {selectedUser.name} ({selectedUser.email})</p>
                
                <div style={{ marginTop: '20px' }}>
                  <h4>Current Access:</h4>
                  {selectedUser.business_access.length > 0 ? (
                    selectedUser.business_access.map((access, index) => (
                      <div key={index} style={{ 
                        padding: '10px', 
                        background: '#f8fafc', 
                        borderRadius: '8px', 
                        marginBottom: '10px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <strong>{access.business_type}</strong> - {access.subscription_status} 
                          (${platformConfig.find(config => config.business_type === access.business_type)?.monthly_price || access.monthly_price}/month)
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <select 
                            value={access.subscription_status}
                            onChange={(e) => updateSubscription(
                              selectedUser.id, 
                              access.business_type, 
                              e.target.value,
                              access.monthly_price,
                              30
                            )}
                            style={{ padding: '4px', fontSize: '12px' }}
                          >
                            <option value="trial">Trial</option>
                            <option value="active">Active</option>
                            <option value="suspended">Suspended</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <button 
                            onClick={() => revokeAccess(selectedUser.id, access.business_type)}
                            style={{ 
                              padding: '4px 8px', 
                              fontSize: '12px', 
                              background: '#ef4444', 
                              color: 'white', 
                              border: 'none', 
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Revoke
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: '#64748b', fontStyle: 'italic' }}>No current access</p>
                  )}
                </div>

                <div style={{ marginTop: '20px' }}>
                  <h4>Grant New Access:</h4>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {platformConfig.filter(config => 
                      !selectedUser.business_access.some(access => access.business_type === config.business_type)
                    ).map(config => (
                      <button 
                        key={config.business_type}
                        onClick={() => grantAccess(selectedUser.id, config.business_type, 'trial', config.monthly_price)}
                        style={{ 
                          padding: '8px 16px', 
                          background: '#10b981', 
                          color: 'white', 
                          border: 'none', 
                          borderRadius: '8px',
                          cursor: 'pointer',
                          textTransform: 'capitalize'
                        }}
                      >
                        {config.business_type} (${config.monthly_price}/month)
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <p>Select a user to manage their access or grant new access to available users.</p>
                <select 
                  onChange={(e) => {
                    const userId = parseInt(e.target.value);
                    const user = users.find(u => u.id === userId);
                    setSelectedUser(user);
                  }}
                  style={{ width: '100%', padding: '8px', marginTop: '10px' }}
                >
                  <option value="">Select a user...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => {
                  setShowGrantModal(false);
                  setSelectedUser(null);
                }}
                style={{ 
                  padding: '8px 16px', 
                  background: '#64748b', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SuperAdminDashboard;