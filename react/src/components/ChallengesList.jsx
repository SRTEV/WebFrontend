import React, { useState, useEffect } from 'react';
import '../App.css';
import backgroundImage from '../assets/background.svg';
import { apiFetch } from '../api';

export default function ChallengesList() {
  const [competitions, setCompetitions] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState('Scooter');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getFutureDateStr = (days = 7) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    id: 0,
    vehicleTypeId: 1,
    goalTypeName: 'Distance',
    goalValue: '',
    award1stType: 'Free ride',
    award1stValue: '',
    award2nd4thType: 'Free ride',
    award2nd4thValue: '',
    award5thType: 'Day plan',
    award5thValue: '',
    startDate: getTodayStr(),
    endDate: getFutureDateStr(7),
    description: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // 1. Завантажуємо типи транспорту
      const vRes = await apiFetch('/VehicleType');
      let vData = [];
      if (vRes.ok) {
        const rawVData = await vRes.json();
        // Прибираємо дублікати за назвою, щоб не було повторів типу Bike та Bicycle одночасно
        const seenNames = new Set();
        vData = rawVData.filter(v => {
          const name = v.name || v.Name;
          if (!name || seenNames.has(name.toLowerCase())) return false;
          seenNames.add(name.toLowerCase());
          return true;
        });

        setVehicleTypes(vData);
        if (vData.length > 0) {
          setActiveTab(vData[0].name || vData[0].Name);
        }
      }

      // 2. Завантажуємо челенджі
      const cRes = await apiFetch('/Competition');
      if (cRes.ok) {
        const cData = await cRes.json();
        setCompetitions(Array.isArray(cData) ? cData : []);
      }

      setLoading(false);
    } catch (err) {
      if (err.message !== 'Unauthorized') setError(err.message);
      setLoading(false);
    }
  };

  const fetchCompetitions = () => {
    apiFetch('/Competition')
      .then((res) => res.json())
      .then((data) => setCompetitions(Array.isArray(data) ? data : []))
      .catch((err) => console.error(err));
  };

  const getCurrentVehicleTypeId = () => {
    const found = vehicleTypes.find(
      (v) => (v.name || v.Name || '').toLowerCase() === activeTab.toLowerCase()
    );
    return found ? (found.id || found.Id) : 1;
  };

  const filteredCompetitions = competitions.filter((comp) => {
    const targetId = getCurrentVehicleTypeId();
    return (comp.vehicleTypeId || comp.VehicleTypeId) === targetId;
  });

  const formatChallengeTitle = (goalTypeName, goalValue) => {
    const val = goalValue || '';
    switch (goalTypeName) {
      case 'Distance':
        return `Ridden ${val}`;
      case 'Time':
        return `Riding time ${val}`;
      case 'Riding':
      default:
        return `Rides count ${val}`;
    }
  };

  const handleAddClick = () => {
    setIsEditMode(false);
    setFormData({
      id: 0,
      vehicleTypeId: getCurrentVehicleTypeId(),
      goalTypeName: 'Distance',
      goalValue: '',
      award1stType: 'Free ride',
      award1stValue: '',
      award2nd4thType: 'Free ride',
      award2nd4thValue: '',
      award5thType: 'Day plan',
      award5thValue: '',
      startDate: getTodayStr(),
      endDate: getFutureDateStr(7),
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (comp) => {
    setIsEditMode(true);
    const rawGoalName = comp.goalTypes?.[0]?.name || comp.GoalTypes?.[0]?.Name || 'Distance';
    const cleanGoalName = rawGoalName.split(' #')[0];

    setFormData({
      id: comp.id || comp.Id,
      vehicleTypeId: comp.vehicleTypeId || comp.VehicleTypeId || getCurrentVehicleTypeId(),
      goalTypeName: cleanGoalName,
      goalValue: comp.goalValue !== null && comp.goalValue !== undefined ? String(comp.goalValue) : '',
      award1stType: 'Free ride',
      award1stValue: '',
      award2nd4thType: 'Free ride',
      award2nd4thValue: '',
      award5thType: 'Day plan',
      award5thValue: '',
      startDate: comp.startDate || getTodayStr(),
      endDate: comp.endDate || getFutureDateStr(7),
      description: comp.description || ''
    });
    setIsModalOpen(true);
  };

  const getAwardUnit = (type) => {
    if (type === 'Free ride') return 'min';
    if (type === 'Day plan') return '%';
    return '';
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    const numericGoalValue = parseInt(String(formData.goalValue).replace(/\D/g, ''), 10);
    const uniqueTime = Date.now();
    const computedDescription = formatChallengeTitle(formData.goalTypeName, formData.goalValue);

    const payload = {
      Id: formData.id,
      StartDate: formData.startDate || getTodayStr(),
      EndDate: formData.endDate || getFutureDateStr(7),
      Description: computedDescription,
      GoalValue: isNaN(numericGoalValue) ? null : numericGoalValue,
      VehicleTypeId: formData.vehicleTypeId,
      GoalTypes: [
        {
          Name: `${formData.goalTypeName} #${uniqueTime}`
        }
      ],
      RewardTypes: [
        formData.award1stValue ? {
          Name: `1st Place: ${formData.award1stType} ${formData.award1stValue}`,
          Unit: `u1_${uniqueTime}`
        } : null,
        formData.award2nd4thValue ? {
          Name: `2nd-4th Place: ${formData.award2nd4thType} ${formData.award2nd4thValue}`,
          Unit: `u2_${uniqueTime}`
        } : null,
        formData.award5thValue ? {
          Name: `5th Place: ${formData.award5thType} ${formData.award5thValue}`,
          Unit: `u5_${uniqueTime}`
        } : null
      ].filter(Boolean)
    };

    try {
      const isEdit = isEditMode && formData.id > 0;
      const endpoint = isEdit ? `/Competition/${formData.id}` : '/Competition';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await apiFetch(endpoint, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchCompetitions();
      } else {
        const errText = await res.text().catch(() => '');
        alert(`Failed to save challenge (${res.status}): ${errText}`);
      }
    } catch (err) {
      if (err.message !== 'Unauthorized') alert("Network error while saving.");
    }
  };

  if (loading) return <div className="loading-state">Loading challenges...</div>;
  if (error) return <div className="error-state">{error}</div>;

  const displayVehicleTabs = vehicleTypes.length > 0 
    ? vehicleTypes.map(v => v.name || v.Name) 
    : ['Scooter', 'Bicycle', 'Monowheel'];

  return (
    <div className="operation-center" style={{ backgroundImage: `url(${backgroundImage})`, minHeight: '100vh', backgroundSize: 'cover' }}>
      <div className="content-container-box">
        
        {/* Унікальні вкладки транспорту */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '25px' }}>
          {displayVehicleTabs.map((tab) => (
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

        {/* Список челенджів */}
        <div className="vehicles-list-wrapper" style={{ backgroundColor: '#d9d9d9', minHeight: '500px', borderRadius: '16px', padding: '25px' }}>
          {filteredCompetitions.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#555', padding: '40px', fontWeight: 'bold', fontSize: '18px' }}>
              No challenges available for {activeTab}.
            </div>
          ) : (
            filteredCompetitions.map((comp) => (
              <div
                key={comp.id || comp.Id}
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

                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                  <h2 style={{ fontSize: '22px', fontWeight: 'bold', fontStyle: 'italic', margin: '0 0 5px 0', color: '#000' }}>
                    {comp.description}
                  </h2>
                </div>

                {comp.rewardTypes && comp.rewardTypes.length > 0 && (
                  <div style={{ textAlign: 'center', fontSize: '14px', color: '#222', lineHeight: '1.6', marginBottom: '15px' }}>
                    {comp.rewardTypes.map((rt) => (
                      <p key={rt.id} style={{ margin: 0 }}>{rt.name}</p>
                    ))}
                  </div>
                )}

                <div style={{ fontSize: '15px', fontStyle: 'italic', color: '#444', marginTop: '10px' }}>
                  {comp.startDate} – {comp.endDate}
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      <button className="fab-add-btn" onClick={handleAddClick}>+</button>

      {/* Модальне вікно */}
      {isModalOpen && (
        <div 
          className="modal-overlay" 
          onClick={() => setIsModalOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            paddingLeft: '240px',
            boxSizing: 'border-box',
            zIndex: 1000
          }}
        >
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#e6e6e6',
              borderRadius: '26px',
              padding: '32px 38px',
              width: '95%',
              maxWidth: '780px',
              boxShadow: '0 12px 35px rgba(0, 0, 0, 0.25)',
              position: 'relative'
            }}
          >
            
            {/* Header: Arrow + Title */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '22px', position: 'relative', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  position: 'absolute',
                  left: '0px',
                  background: 'none',
                  border: '1.5px solid #000',
                  borderRadius: '50%',
                  width: '38px',
                  height: '38px',
                  fontSize: '20px',
                  color: '#000',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ←
              </button>
              <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold', fontStyle: 'italic', color: '#000' }}>
                {isEditMode ? 'Edit Challenge' : 'Add new challenge'}
              </h2>
            </div>

            {/* Vehicle Tabs всередині модалки */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '22px' }}>
              {vehicleTypes.map((vt) => {
                const vId = vt.id || vt.Id;
                const vName = vt.name || vt.Name;
                return (
                  <button
                    key={vId}
                    type="button"
                    className="filter-btn"
                    style={{
                      padding: '8px 38px',
                      fontSize: '16px',
                      borderRadius: '12px',
                      backgroundColor: formData.vehicleTypeId === vId ? '#cce3f0' : '#c4c4c4',
                      border: '1px solid #000',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontWeight: 600
                    }}
                    onClick={() => setFormData({ ...formData, vehicleTypeId: vId })}
                  >
                    {vName}
                  </button>
                );
              })}
            </div>

            {/* Внутрішній сірий контейнер */}
            <div style={{ backgroundColor: '#c4c4c4', borderRadius: '22px', padding: '24px 28px', marginBottom: '24px', border: '1px solid #999' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '18px', color: '#000', textAlign: 'left' }}>
                Enter the essence of the challenge
              </h3>
              
              {/* Type of Goal & Goal Value Row */}
              <div style={{ display: 'flex', gap: '30px', marginBottom: '22px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontWeight: 'bold', color: '#000', fontSize: '14px' }}>Select type of goal</label>
                  <select
                    value={formData.goalTypeName}
                    onChange={(e) => setFormData({ ...formData, goalTypeName: e.target.value })}
                    style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #777', backgroundColor: '#fff', fontSize: '15px', minWidth: '200px' }}
                    required
                  >
                    <option value="Distance">Distance</option>
                    <option value="Time">Time</option>
                    <option value="Riding">Riding</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontWeight: 'bold', color: '#000', fontSize: '14px' }}>Write goal value</label>
                  <input
                    type="text"
                    required
                    placeholder="260 KM"
                    value={formData.goalValue}
                    onChange={(e) => setFormData({ ...formData, goalValue: e.target.value })}
                    style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #777', fontSize: '15px', width: '180px' }}
                  />
                </div>
              </div>

              {/* Award Header */}
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#000', textAlign: 'center' }}>
                Award
              </h3>

              {/* Award Rows + Date Picker Container */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                
                {/* Нагороди */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  {[
                    { label: '1st', typeKey: 'award1stType', valueKey: 'award1stValue' },
                    { label: '2nd - 4th', typeKey: 'award2nd4thType', valueKey: 'award2nd4thValue' },
                    { label: '5th', typeKey: 'award5thType', valueKey: 'award5thValue' }
                  ].map((award, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '85px', textAlign: 'right', fontWeight: 'bold', fontSize: '15px', color: '#000' }}>
                        {award.label}
                      </div>
                      <select
                        value={formData[award.typeKey]}
                        onChange={(e) => setFormData({ ...formData, [award.typeKey]: e.target.value })}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #777', backgroundColor: '#fff', fontSize: '14px', width: '130px' }}
                      >
                        <option value="Free ride">Free ride</option>
                        <option value="Day plan">Day plan</option>
                      </select>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#000' }}>:</div>
                      <input
                        type="text"
                        required
                        value={formData[award.valueKey]}
                        onChange={(e) => setFormData({ ...formData, [award.valueKey]: e.target.value })}
                        style={{ width: '55px', padding: '8px 10px', borderRadius: '8px', border: '1px solid #777', fontSize: '14px', textAlign: 'center' }}
                      />
                      <div style={{ fontSize: '14px', color: '#000', width: '35px' }}>
                        {getAwardUnit(formData[award.typeKey])}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Календар дат */}
                <div style={{ border: '1px solid #888', borderRadius: '12px', padding: '16px 20px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '210px' }}>
                  <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '6px 10px', fontSize: '13px', width: '100%' }}
                    />
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '6px 10px', fontSize: '13px', width: '100%' }}
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Кнопка Save */}
            <div style={{ textAlign: 'center' }}>
              <button
                type="submit"
                onClick={handleFormSubmit}
                style={{
                  padding: '12px 75px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#000',
                  color: '#fff',
                  fontWeight: 'bold',
                  fontSize: '18px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                }}
              >
                Save
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}