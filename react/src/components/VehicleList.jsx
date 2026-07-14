import React, { useState, useEffect } from 'react';
import '../App.css';
import backgroundImage from '../assets/background.svg';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const VEHICLE_TYPES = [
    { id: 1, name: 'Scooter', icon: '🛴' },
    { id: 2, name: 'Bicycle', icon: '🚲' },
    { id: 3, name: 'Monowheel', icon: '🛞' }
];

const VEHICLE_STATUSES = [
    { id: 1, name: 'Available' },
    { id: 2, name: 'In use' },
    { id: 3, name: 'Needs to be checked' },
    { id: 4, name: 'In service' }
];

export default function VehicleList() {
    // State
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        Scooter: true,
        Bicycle: true,
        Monowheel: true,
        "Need check": true
    });
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState({
        id: null,
        model: '', 
        qrCode: '', 
        vehicleTypeId: 1,
        vehicleStatusId: 1,
        batteryLevel: 100,
        positionX: '51.236',
        positionY: '22.548'
    });

    const [isRepairFormOpen, setIsRepairFormOpen] = useState(false);
    const [repairData, setRepairData] = useState({
        type: 'Monowheel',
        qrCode: '',
        description: ''
    });

    // Load data
    const fetchVehicles = () => {
        fetch(`${BASE_URL}/Vehicle`)
            .then((res) => res.json())
            .then((data) => {
                setVehicles(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Failed to fetch vehicles:", error);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchVehicles();
        const intervalId = setInterval(fetchVehicles, 30000);
        return () => clearInterval(intervalId);
    }, []);

    // Filter updates
    const toggleFilter = (key) => {
        setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    // Filtered list
    const filteredVehicles = vehicles.filter((vehicle) => {
        const rawTypeName = (vehicle.vehicleType?.name || vehicle.VehicleType?.name || vehicle.type || '').toLowerCase();
        const statusText = (vehicle.vehicleStatus?.name || vehicle.VehicleStatus?.name || vehicle.status || '').toLowerCase();
        const isNeedCheck = statusText === 'needs to be checked' || statusText === 'needcheck';

        let typeMatch = false;
        if (filters['Scooter'] && rawTypeName.includes('scooter')) typeMatch = true;
        if (filters['Bicycle'] && (rawTypeName.includes('bike') || rawTypeName.includes('bicycle'))) typeMatch = true;
        if (filters['Monowheel'] && rawTypeName.includes('monowheel')) typeMatch = true;
        
        if (!rawTypeName.includes('scooter') && !rawTypeName.includes('bike') && !rawTypeName.includes('bicycle') && !rawTypeName.includes('monowheel')) {
            typeMatch = true; 
        }

        const checkMatch = isNeedCheck ? filters["Need check"] : true;

        const searchMatch =
            vehicle.id?.toString().includes(searchQuery.toLowerCase()) ||
            rawTypeName.includes(searchQuery.toLowerCase()) ||
            (vehicle.qrCode || vehicle.QrCode || '').toLowerCase().includes(searchQuery.toLowerCase());

        return typeMatch && checkMatch && searchMatch;
    });

    const totalVehicles = vehicles.length;
    const needCheckCount = vehicles.filter(v => {
        const status = (v.vehicleStatus?.name || v.VehicleStatus?.name || v.status || '').toLowerCase();
        return status === 'needs to be checked' || status === 'needcheck';
    }).length;

    const AvailableCount = vehicles.filter(v => {
        const status = (v.vehicleStatus?.name || v.VehicleStatus?.name || v.status || '').toLowerCase();
        return status === 'active' || status === 'in parking' || status === 'available';
    }).length;

    const getStatusColorClass = (statusName) => {
        const status = (statusName || '').toLowerCase();
        if (status === 'rented') return 'status-green';
        if (status === 'needcheck') return 'status-yellow';
        if (status === 'inservice') return 'status-red';
        return 'status-grey';
    };

    const getVehicleIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'scooter': return '🛴';
            case 'bicycle':
            case 'bike': return '🚲';
            case 'monowheel': return '🛞';
            default: return '🛴';
        }
    };

    // Open add form
    const handleAddClick = () => {
        setIsEditMode(false);
        setFormData({
            id: null,
            model: '',
            qrCode: '',
            vehicleTypeId: 1,
            vehicleStatusId: 1,
            batteryLevel: 100,
            positionX: '51.236',
            positionY: '22.548'
        });
        setIsFormOpen(true);
    };

    // Open edit form
    const handleEditClick = (vehicle) => {
        setIsEditMode(true);
        setFormData({
            id: vehicle.id || vehicle.Id,
            model: vehicle.model || vehicle.Model || '', 
            qrCode: vehicle.qrCode || vehicle.QrCode || '',
            vehicleTypeId: vehicle.vehicleType?.id || vehicle.VehicleType?.id || vehicle.vehicleTypeId || vehicle.VehicleTypeId || 1,
            vehicleStatusId: vehicle.vehicleStatus?.id || vehicle.VehicleStatus?.id || vehicle.vehicleStatusId || vehicle.VehicleStatusId || 1,
            batteryLevel: vehicle.batteryLevel ?? vehicle.BatteryLevel ?? 100,
            positionX: vehicle.positionX || vehicle.PositionX || '51.236',
            positionY: vehicle.positionY || vehicle.PositionY || '22.548'
        });
        setIsFormOpen(true);
    };

    // Delete vehicle
    const handleDeleteClick = (id) => {
        if (window.confirm("Are you sure you want to delete this vehicle?")) {
            fetch(`${BASE_URL}/Vehicle/${id}`, { method: 'DELETE' })
            .then((res) => {
                if (res.ok) {
                    setVehicles(prev => prev.filter(v => v.id !== id));
                } else {
                    alert("Failed to delete vehicle.");
                }
            })
            .catch((err) => console.error("Delete error:", err));
        }
    };

    const handleSave = (e) => {
        e.preventDefault();

        const payload = {
            Id: isEditMode ? parseInt(formData.id, 10) : 0,
            Model: formData.model, 
            QrCode: formData.qrCode, 
            VehicleTypeId: parseInt(formData.vehicleTypeId, 10),
            VehicleStatusId: parseInt(formData.vehicleStatusId, 10),
            BatteryLevel: parseInt(formData.batteryLevel, 10),
            PositionX: parseFloat(formData.positionX) || 51.236,
            PositionY: parseFloat(formData.positionY) || 22.548
        };

        const url = isEditMode ? `${BASE_URL}/Vehicle/${formData.id}` : `${BASE_URL}/Vehicle`;
        const method = isEditMode ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then((res) => {
            if (res.ok) {
                setIsFormOpen(false);
                fetchVehicles();
            } else {
                alert("Something went wrong while saving.");
            }
        })
        .catch((err) => alert("Network error. Failed to save."));
    };

    const handleCallRepairmanClick = (vehicle) => {
        const rawType = (vehicle.vehicleType?.name || vehicle.VehicleType?.name || vehicle.type || 'Scooter').toLowerCase();
        let vType = 'Scooter';
        if (rawType.includes('bike') || rawType.includes('bicycle')) vType = 'Bicycle';
        if (rawType.includes('monowheel')) vType = 'Monowheel';

        setRepairData({
            type: vType,
            qrCode: vehicle.qrCode || vehicle.QrCode || '',
            description: ''
        });
        setIsRepairFormOpen(true);
    };

    const handleRepairSubmit = (e) => {
        e.preventDefault();
        alert(`Repairman called for ${repairData.type} with QR: ${repairData.qrCode}`);
        setIsRepairFormOpen(false);
    };

    if (loading) return <div className="loading-state">Loading vehicles...</div>;

    // Edit form
    if (isFormOpen) {
        const currentType = VEHICLE_TYPES.find(t => t.id === parseInt(formData.vehicleTypeId));
        const currentIcon = currentType ? currentType.icon : '🚲';

        return (
            <div className="form-container-overlay" style={{ backgroundImage: `url(${backgroundImage})` }}>
                
                <div className="form-header-overlay">
                    <button 
                        onClick={() => setIsFormOpen(false)}
                        className="form-back-btn"
                    >
                        <span>←</span> Back
                    </button>
                    <h1 className="form-title-overlay">
                        {isEditMode ? 'Edit transport' : 'Add transport'}
                    </h1>
                    <div className="form-header-spacer"></div> 
                </div>

                <div className="form-stats-wrapper">
                    <div className="form-stats-board">
                        <span>Total Vehicles : {totalVehicles}</span>
                        <span>Active now : {AvailableCount}</span>
                        <span>Need check : {needCheckCount}</span>
                    </div>
                </div>

                <div className="form-body-wrapper">
                    <form 
                        onSubmit={handleSave}
                        className="add-edit-form"
                    >
                        <div className="form-group-block">
                            <label className="form-group-label">Type:</label>
                            <div className="form-type-row">
                                <div className="form-type-icon-box">
                                    {currentIcon}
                                </div>
                                <select 
                                    value={formData.vehicleTypeId}
                                    onChange={(e) => setFormData({ ...formData, vehicleTypeId: e.target.value })}
                                    className="form-select-field"
                                >
                                    {VEHICLE_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="form-group-block">
                            <label className="form-group-label">Model :</label>
                            <input 
                                type="text" 
                                value={formData.model}
                                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                className="form-input-field"
                            />
                        </div>

                        <div className="form-group-block">
                            <label className="form-group-label">Status :</label>
                            <select 
                                value={formData.vehicleStatusId}
                                onChange={(e) => setFormData({ ...formData, vehicleStatusId: e.target.value })}
                                className="form-select-field"
                            >
                                {VEHICLE_STATUSES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        <div className="form-group-block">
                            <label className="form-group-label">Rent code (QR):</label>
                            <input 
                                type="text" 
                                value={formData.qrCode}
                                onChange={(e) => setFormData({ ...formData, qrCode: e.target.value })}
                                className="form-input-field"
                                required
                            />
                        </div>

                        <button 
                            type="submit"
                            className="form-submit-btn"
                        >
                            Save
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Main view
    return (
        <div className="operation-center" style={{ backgroundImage: `url(${backgroundImage})` }}>
            <div className="content-container-box">
                <div className="search-bar-container">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search by number or QR"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="controls-bar">
                    <div className="filter-dropdown">
                        <button className="filter-btn" onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}>
                            Filter <span>⌄</span>
                        </button>

                        {isFilterMenuOpen && (
                            <div className="filter-menu">
                                {Object.keys(filters).map((key) => (
                                    <label key={key} className="filter-option">
                                        <input type="checkbox" checked={filters[key]} onChange={() => toggleFilter(key)} />
                                        {key}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="stats-board">
                        <span>Total Vehicles : {totalVehicles}</span>
                        <span>Available now : {AvailableCount}</span>
                        <span>Need check : {needCheckCount}</span>
                    </div>
                </div>

                <div className="vehicles-list-wrapper">
                    <div className="users-list">
                        {filteredVehicles.map((vehicle) => {
                            const rawTypeName = vehicle.vehicleType?.name || vehicle.VehicleType?.name || vehicle.type || 'Vehicle';
                            const displayTypeName = (rawTypeName.toLowerCase().includes('bike') || rawTypeName.toLowerCase().includes('bicycle')) ? 'Bicycle' : rawTypeName;
                            const statusText = (vehicle.vehicleStatus?.name || vehicle.VehicleStatus?.name || vehicle.status || 'Available');
                            const isNeedCheck = statusText.toLowerCase() === 'needs to be checked' || statusText.toLowerCase() === 'needcheck';
                            const lng = parseFloat(vehicle.positionX || vehicle.PositionX);
                            const lat = parseFloat(vehicle.positionY || vehicle.PositionY);
                            const locationDisplay = (!isNaN(lat) && !isNaN(lng)) ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : 'Unknown coordinates';

                            return (
                                <div key={vehicle.id} className="user-card vehicle-card">
                                    <div className="vehicle-card-content">
                                        <div className="vehicle-icon-section">
                                            <span className="vehicle-render-icon">{getVehicleIcon(rawTypeName)}</span>
                                        </div>
                                        <div className="vehicle-details-section">
                                            <div className="vehicle-title-row">
                                                <span className="vehicle-name">{displayTypeName} ({vehicle.qrCode || vehicle.QrCode || 'No QR'})</span>
                                                <span className={`status-dot ${getStatusColorClass(statusText)}`}></span>
                                            </div>
                                            <div className="vehicle-info-text">
                                                <p>Model : {vehicle.model || vehicle.Model || 'N/A'}</p>
                                                <p>Status : {statusText}</p>
                                                <p>Location: {locationDisplay}</p>
                                            </div>
                                        </div>
                                        <div className="vehicle-actions-row">
                                            {isNeedCheck && (
                                                <button className="action-btn" onClick={() => handleCallRepairmanClick(vehicle)}>
                                                    <span className="icon">🔨</span> Call repairman
                                                </button>
                                            )}
                                            <button className="action-btn" onClick={() => handleEditClick(vehicle)}>
                                                <span className="icon">📝</span> Edit
                                            </button>
                                            <button className="action-btn" onClick={() => handleDeleteClick(vehicle.id)}>
                                                <span className="icon">❌</span> Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {filteredVehicles.length === 0 && <div className="no-results">No vehicles match your criteria.</div>}
                    </div>
                </div>
            </div>
            
            <button className="fab-add-btn" onClick={handleAddClick}>+</button>

            {isRepairFormOpen && (
                <div 
                    className="repair-modal-overlay"
                    onClick={() => setIsRepairFormOpen(false)} 
                >
                    <form
                        onSubmit={handleRepairSubmit}
                        onClick={(e) => e.stopPropagation()}
                        className="repair-modal-form"
                    >
                        <button
                            type="button"
                            onClick={() => setIsRepairFormOpen(false)}
                            className="repair-modal-close-btn"
                        >
                            ✕
                        </button>

                        <div className="repair-form-group">
                            <label className="repair-form-label">Select type of vehicle:</label>
                            <select
                                value={repairData.type}
                                onChange={(e) => setRepairData({ ...repairData, type: e.target.value, qrCode: '' })}
                                className="repair-form-select"
                            >
                                <option value="Scooter">Scooter</option>
                                <option value="Bicycle">Bicycle</option>
                                <option value="Monowheel">Monowheel</option>
                            </select>
                        </div>

                        <div className="repair-form-group">
                            <label className="repair-form-label">Select QR Code:</label>
                            <select
                                value={repairData.qrCode}
                                onChange={(e) => setRepairData({ ...repairData, qrCode: e.target.value })}
                                className="repair-form-select"
                                required
                            >
                                <option value="" disabled>-- Select QR --</option>
                                {vehicles
                                    .filter(v => {
                                        const rawType = (v.vehicleType?.name || v.VehicleType?.name || v.type || '').toLowerCase();
                                        if (repairData.type === 'Bicycle') return rawType.includes('bike') || rawType.includes('bicycle');
                                        return rawType.includes(repairData.type.toLowerCase());
                                    })
                                    .filter(v => v.qrCode || v.QrCode) 
                                    .map((v) => (
                                        <option key={v.id} value={v.qrCode || v.QrCode}>
                                            {v.qrCode || v.QrCode}
                                        </option>
                                    ))
                                }
                            </select>
                        </div>

                        <div className="repair-form-group">
                            <label className="repair-form-label">Describe problem with vehicle:</label>
                            <textarea
                                value={repairData.description}
                                onChange={(e) => setRepairData({ ...repairData, description: e.target.value })}
                                className="repair-form-textarea"
                                placeholder="The customer is complaining about squeaky brakes; they need to be checked"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="repair-form-submit-btn"
                        >
                            Send
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}