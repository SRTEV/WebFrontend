import React, { useState } from 'react';
import backgroundImage from '../assets/background.svg';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch('http://localhost:5194/api/User/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      alert(`Welcome, ${data.name}! Login successful.`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Welcome to Admin Panel</h1>

      <div style={styles.windowMock}>
        <div style={styles.dotsRow}>
          <div style={styles.dot}></div>
          <div style={styles.dot}></div>
          <div style={styles.dot}></div>
        </div>

        <form onSubmit={handleSubmit} style={styles.card}>
          <label style={styles.label}>Enter your email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            placeholder="admin@gmail.com"
            required
          />

          <label style={styles.label}>Enter your password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            placeholder="***********"
            required
          />

          {error && <p style={styles.errorText}>{error}</p>}

          <button type="submit" style={styles.button}>
            Log In
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    width: '100%', // ЗМІНЕНО: замість 100vw використовуємо 100%
    fontFamily: 'sans-serif',
    
    backgroundImage: `url(${backgroundImage})`, 
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  },
  title: {
    fontSize: '36px',
    marginBottom: '24px',
    color: '#000',
  },
  windowMock: {
    backgroundColor: 'transparent',
    padding: '0px',
    width: '400px',
    boxShadow: 'none',
    border: 'none',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '20px',
    padding: '30px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0px 4px 10px rgba(0,0,0,0.1)',
  },
  label: {
    fontSize: '14px',
    marginBottom: '8px',
    color: '#333',
  },
  input: {
    width: '80%',
    padding: '10px 15px',
    borderRadius: '20px',
    border: '1px solid #000',
    backgroundColor: '#f3e8e8',
    marginBottom: '20px',
    textAlign: 'center',
    fontSize: '14px',
  },
  button: {
    width: '85%',
    padding: '12px',
    borderRadius: '25px',
    backgroundColor: '#000',
    color: '#fff',
    fontSize: '18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    border: 'none',
    marginTop: '10px',
  },
  errorText: {
    color: 'red',
    fontSize: '12px',
    marginBottom: '10px',
  },
};