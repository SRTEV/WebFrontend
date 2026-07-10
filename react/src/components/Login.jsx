import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import backgroundImage from '../assets/background.svg';
import '../App.css';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Send login request to the backend
    try {
      const response = await fetch(`${BASE_URL}/User/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Login failed');

      localStorage.setItem('token', data.token); 
      localStorage.setItem('userName', data.name);
      
      // Redirect to the dashboard after successful login
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-container" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <h1 className="login-title">Welcome to Admin Panel</h1>

      <div className="login-window-mock">
        <form onSubmit={handleSubmit} className="login-card">
          <label className="login-label">Enter your email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
            placeholder="admin@gmail.com"
            required
          />

          <label className="login-label">Enter your password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            placeholder="***********"
            required
          />

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="login-button">
            Log In
          </button>
        </form>
      </div>
    </div>
  );
}