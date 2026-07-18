import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import MapComponent from './MapComponent';
import UsersList from './UsersList';
import VehicleList from './VehicleList';
import OperationCenter from './OperationCenter';
import '../App.css'; 

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userName, setUserName] = useState('');
  
  const location = useLocation();
  const isMapRoute = location.pathname === '/dashboard' || location.pathname === '/dashboard/';

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName) {
      setUserName(storedName);
    } else {
      setUserName('Admin');
    }
  }, []);

  useEffect(() => {
    if (!isMapRoute) {
      setIsSidebarOpen(true);
    }
  }, [isMapRoute]);
    
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    window.location.href = '/';
  };

  return (
    <div className="dashboard-container">
      <nav className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        
        <div className="sidebar-header">
          {isMapRoute && (
            <button 
              className="hamburger-btn" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              title="Toggle Menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          )}
          
          <span className="sidebar-greeting" style={{ marginLeft: isMapRoute ? '0' : '15px' }}>
            Hi, {userName} !
          </span>
        </div>

        <div className="menu-nav">
          <Link to="/dashboard" className="nav-btn">
            <span>🗺️</span> <span className="nav-text">Map</span>
          </Link>
          <Link to="/dashboard/users" className="nav-btn">
            <span>👤</span> <span className="nav-text">Users</span>
          </Link>
          <Link to="/dashboard/vehicle" className="nav-btn">
            <span>🛴</span> <span className="nav-text">Vehicle</span>
          </Link>
          <Link to="/dashboard/operation-center" className="nav-btn">
            <span>🎧</span> <span className="nav-text">Operation Center</span>
          </Link>
          <Link to="/dashboard/challenges" className="nav-btn">
            <span>🏆</span> <span className="nav-text">Challenges</span>
          </Link>
        </div>
        
        <button className="logout-btn" onClick={handleLogout}>
          <span>🔓</span> <span className="nav-text">Log out</span>
        </button>
      </nav>

      <main className="map-area">
        <Routes>
          <Route index element={<MapComponent />} />
          <Route path="users" element={<UsersList />} />
          <Route path="vehicle" element={<VehicleList />} />
          <Route path="operation-center" element={<OperationCenter />} />
          <Route path="challenges" element={<div style={{padding:20}}>Challenges placeholder</div>} />
        </Routes>
      </main>
    </div>
  );
}