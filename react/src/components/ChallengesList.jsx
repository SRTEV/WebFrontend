import React, { useState, useEffect } from 'react';
import '../App.css';
import backgroundImage from '../assets/background.svg';
import { apiFetch } from '../api';

export default function ChallengesList() {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Active vehicle tab: 'Scooter' | 'Bicycle' | 'Monowheel'
  const [activeTab, setActiveTab] = useState('Scooter');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    id: 0,
    title: '',
    description: '',
    rewardsText: '',
    vehicleType: 'Scooter',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = () => {
    apiFetch('/Competition')
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load competitions (${res.status})`);
        return res.json();
      })
      .then((data) => {
        setCompetitions(data);
        setError('');
        setLoading(false);
      })
      .catch((err) => {
        if (err.message !== 'Unauthorized') {
          setError(err.message);
        }
        setLoading(false);
      });
  };

  // Filter competitions by selected vehicle tab
  const filteredCompetitions = competitions.filter((comp) => {
    const rawType = (comp.vehicleType || comp.VehicleType || comp.type || '').toLowerCase();
    const currentTab = activeTab.toLowerCase();

    if (currentTab === 'scooter') return rawType.includes('scooter') || !rawType;
    if (currentTab === 'bicycle') return rawType.includes('bike') || rawType.includes('bicycle');
    if (currentTab === 'monowheel') return rawType.includes('monowheel');
    return true;
  });

  // Open modal for new challenge
  const handleAddClick = () => {
    setIsEditMode(false);
    setFormData({
      id: 0,
      title: '',
      description: '',
      rewardsText: '',
      vehicleType: activeTab,
      startDate: new Date().toISOString().split('T')[0],
      endDate: ''
    });
    setIsModalOpen(true);
  };

  // Open modal for edit challenge
  const handleEditClick = (comp) => {
    setIsEditMode(true);
    setFormData({
      id: comp.id || comp.Id || 0,
      title: comp.title || comp.Title || comp.name || comp.Name || '',
      description: comp.description || comp.Description || '',
      rewardsText: comp.rewardsText || comp.RewardsText || comp.reward || comp.Reward || '',
      vehicleType: comp.vehicleType || comp.VehicleType || activeTab,
      startDate: comp.startDate || comp.StartDate ? (comp.startDate || comp.StartDate).split('T')[0] : '',
      endDate: comp.endDate || comp.EndDate ? (comp.endDate || comp.EndDate).split('T')[0] : ''
    });
    setIsModalOpen(true);
  };

  // Save (Post/Put)
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      Id: formData.id,
      Title: formData.title,
      Description: formData.description,
      RewardsText: formData.rewardsText,
      VehicleType: formData.vehicleType,
      StartDate: formData.startDate,
      EndDate: formData.endDate
    };

    try {
      const endpoint = isEditMode && formData.id ? `/Competition/${formData.id}` : '/Competition';
      const method = isEditMode && formData.id ? 'PUT' : 'POST';

      const res = await apiFetch(endpoint, {
        method,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchCompetitions();
      } else {
        alert("Failed to save challenge.");
      }
    } catch (err) {
      if (err.message !== 'Unauthorized') {
        alert("Network error while saving.");
      }
    }
  };

  if (loading) return <div className="loading-state">Loading challenges...</div>;
  if (error) return <div className="error-state">{error}</div>;

  return (
    <div className="operation-center" style={{ backgroundImage: `url(${backgroundImage})`, minHeight: '100vh', backgroundSize: 'cover' }}>
      <div className="content-container-box">
        
        {/* Top Vehicle Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '25px' }}>
          {['Scooter', 'Bicycle', 'Monowheel'].map((tab) => (
            <button
              key={tab}
              className="filter-btn"
              style={{
                padding: '10px 40px',
                fontSize: '18px',
                borderRadius: '12px',
                backgroundColor: activeTab === tab ? '#d6e6f2' : '#e0dede',
                borderColor: activeTab === tab ? '#7fa9c7' : '#000000',
                boxShadow: activeTab === tab ? '0 2px 5px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Main List Box */}
        <div className="vehicles-list-wrapper" style={{ backgroundColor: '#d9d9d9', minHeight: '500px', borderRadius: '16px', padding: '25px' }}>
          {filteredCompetitions.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#555', padding: '40px', fontWeight: 'bold', fontSize: '18px' }}>
              No challenges available for {activeTab}.
            </div>
          ) : (
            filteredCompetitions.map((comp) => {
              const id = comp.id || comp.Id;
              const title = comp.title || comp.Title || comp.name || comp.Name || `Challenge ${id}`;
              const description = comp.description || comp.Description || 'Ride and get discounts!';
              const rewards = comp.rewardsText || comp.RewardsText || comp.reward || comp.Reward;
              const startDate = comp.startDate || comp.StartDate || 'May 1, 2026';
              const endDate = comp.endDate || comp.EndDate || 'May 8, 2026';

              return (
                <div
                  key={id}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '2px solid #2196f3',
                    borderRadius: '12px',
                    padding: '20px 25px',
                    marginBottom: '20px',
                    position: 'relative',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                  }}
                >
                  {/* Edit Button top right */}
                  <button
                    onClick={() => handleEditClick(comp)}
                    style={{
                      position: 'absolute',
                      top: '15px',
                      right: '15px',
                      background: 'none',
                      border: 'none',
                      fontSize: '18px',
                      cursor: 'pointer'
                    }}
                    title="Edit Challenge"
                  >
                    ✏️
                  </button>

                  {/* Header Title & Description */}
                  <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: 'bold', fontStyle: 'italic', margin: '0 0 5px 0', color: '#000' }}>
                      {title}
                    </h2>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', fontStyle: 'italic', margin: 0, color: '#111' }}>
                      {description}
                    </h3>
                  </div>

                  {/* Rewards Breakdown */}
                  {rewards && (
                    <div style={{ textAlign: 'center', fontSize: '14px', color: '#222', lineHeight: '1.6', marginBottom: '20px' }}>
                      {rewards.split('\n').map((line, idx) => (
                        <p key={idx} style={{ margin: 0 }}>{line}</p>
                      ))}
                    </div>
                  )}

                  {/* Dates */}
                  <div style={{ fontSize: '15px', fontStyle: 'italic', color: '#444', marginTop: '10px' }}>
                    {startDate} – {endDate}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Floating Add Button (+) */}
      <button className="fab-add-btn" onClick={handleAddClick}>+</button>

      {/* Modal Window for Add / Edit */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#e0e0e0', borderRadius: '24px', width: '480px' }}>
            <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>✕</button>

            <h2 style={{ margin: '0 0 15px 0', fontSize: '24px', textAlign: 'center', color: '#000' }}>
              {isEditMode ? 'Edit Challenge' : 'Create New Challenge'}
            </h2>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontWeight: 'bold', color: '#000' }}>Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Challenge 1"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontWeight: 'bold', color: '#000' }}>Vehicle Type:</label>
                <select
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc', backgroundColor: '#fff' }}
                >
                  <option value="Scooter">Scooter</option>
                  <option value="Bicycle">Bicycle</option>
                  <option value="Monowheel">Monowheel</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontWeight: 'bold', color: '#000' }}>Goal / Description:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ride 10 km on a Scooter in a single trip"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontWeight: 'bold', color: '#000' }}>Rewards Info:</label>
                <textarea
                  rows="3"
                  placeholder="1st place: 5 minutes' free ride&#10;2nd–4th places: 50% discount..."
                  value={formData.rewardsText}
                  onChange={(e) => setFormData({ ...formData, rewardsText: e.target.value })}
                  style={{ padding: '10px', borderRadius: '8px', border: '1px solid #ccc', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontWeight: 'bold', color: '#000' }}>Start Date:</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={{ fontWeight: 'bold', color: '#000' }}>End Date:</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    style={{ padding: '8px', borderRadius: '8px', border: '1px solid #ccc' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                style={{
                  marginTop: '10px',
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#1a1a1a',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                Save
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}