import React, { useState, useEffect } from 'react';
import MapComponent from './MapComponent';
import '../App.css'; 


export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userName, setUserName] = useState('');

    // Fetch the userName from localStorage when the component mounts
  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName) {
      setUserName(storedName);
    } else {
      setUserName('Admin');
    }
  }, []);
    
  //remove token and userName from localStorage and redirect to login page
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    window.location.href = '/';
  };

  return (
    <div className="dashboard-container">
      <nav className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        
        <div className="sidebar-header">
          <button 
            className="hamburger-btn" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            ☰
          </button>
          
          <span className="sidebar-greeting">Hi, {userName} !</span>
        </div>

        <div className="menu-nav">
          <button className="nav-btn">
            <span>👤</span> <span className="nav-text">Users</span>
          </button>
          <button className="nav-btn">
            <span>🛴</span> <span className="nav-text">Vehicle</span>
          </button>
          <button className="nav-btn">
            <span>🎧</span> <span className="nav-text">Operation Center</span>
          </button>
          <button className="nav-btn">
            <span>🏆</span> <span className="nav-text">Challenges</span>
          </button>
        </div>
        
        <button className="logout-btn" onClick={handleLogout}>
          <span>🔓</span> <span className="nav-text">Log out</span>
        </button>
      </nav>

      <main className="map-area">
        <MapComponent /> 
      </main>
    </div>
  );
}