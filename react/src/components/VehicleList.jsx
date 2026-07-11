import React, { useState, useEffect } from 'react';
import '../App.css';
import backgroundImage from '../assets/background.svg';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function VehicleList() {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);

    // State for search and UI filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        Scooter: true,
        Bicycle: true,
        Monowheel: true,
        "Need check": true
    });
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

    // Fetch vehicle data from the .NET backend API with polling interval
    useEffect(() => {
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

        // Initial fetch
        fetchVehicles();

        const intervalId = setInterval(fetchVehicles, 30000);

        // Cleanup interval on unmount
        return () => clearInterval(intervalId);
    }, []);

    // Toggle individual filter options
    const toggleFilter = (key) => {
        setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    // Filtering logic
    const filteredVehicles = vehicles.filter((vehicle) => {
        const rawTypeName = vehicle.vehicleType?.name || '';
        const statusText = (vehicle.vechicleStatus?.name || vehicle.status || '').toLowerCase();
        const isNeedCheck = statusText === 'needs to be checked';

        let filterKey = null;
        if (rawTypeName.toLowerCase().includes('bike')) {
            filterKey = 'Bicycle';
        } else if (rawTypeName.toLowerCase().includes('monowheel')) {
            filterKey = 'Monowheel';
        } else if (rawTypeName.toLowerCase().includes('scooter')) {
            filterKey = 'Scooter';
        }

        const typeMatch = filterKey ? filters[filterKey] === true : false;
        const checkMatch = isNeedCheck ? filters["Need check"] : true;

        const searchMatch =
            vehicle.id?.toString().includes(searchQuery.toLowerCase()) ||
            rawTypeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            vehicle.qrCode?.toLowerCase().includes(searchQuery.toLowerCase());

        return typeMatch && checkMatch && searchMatch;
    });

    // Dynamic statistics
    const totalVehicles = vehicles.length;

    const needCheckCount = vehicles.filter(v => {
        const status = (v.vechicleStatus?.name || v.status || '').toLowerCase();
        return status === 'needs to be checked';
    }).length;

    const AvaiblableCount = vehicles.filter(v => {
        const status = (v.vechicleStatus?.name || v.status || '').toLowerCase();
        return status === 'active' || status === 'in parking' || status === 'available';
    }).length;

    // Determine fallback text emoji icon based on database type name
    const getVehicleIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'scooter': return '🛴';
            case 'bicycle':
            case 'bike': return '🚲';
            case 'monowheel': return '🛞';
            default: return '🛴';
        }
    };

    if (loading) return <div className="loading-state">Loading vehicles...</div>;

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
                        <button
                            className="filter-btn"
                            onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                        >
                            Filter <span>⌄</span>
                        </button>

                        {isFilterMenuOpen && (
                            <div className="filter-menu">
                                {Object.keys(filters).map((key) => (
                                    <label key={key} className="filter-option">
                                        <input
                                            type="checkbox"
                                            checked={filters[key]}
                                            onChange={() => toggleFilter(key)}
                                        />
                                        {key}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="stats-board">
                        <span>Total Vehicles : {totalVehicles}</span>
                        <span>Available now : {AvaiblableCount}</span>
                        <span>Need check : {needCheckCount}</span>
                    </div>
                </div>

                <div className="vehicles-list-wrapper">
                    <div className="users-list">
                        {filteredVehicles.map((vehicle) => {
                            const rawTypeName = vehicle.vehicleType?.name || 'Vehicle';
                            const displayTypeName = (rawTypeName.toLowerCase() === 'bike') ? 'Bicycle' : rawTypeName;
                            
                            const statusText = (vehicle.vechicleStatus?.name || vehicle.status || 'in parking');
                            const isNeedCheck = statusText.toLowerCase() === 'needs to be checked';

                            const lng = parseFloat(vehicle.positionX);
                            const lat = parseFloat(vehicle.positionY);
                            
                            const locationDisplay = (!isNaN(lat) && !isNaN(lng)) 
                                ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` 
                                : 'Unknown coordinates';

                            return (
                                <div key={vehicle.id} className="user-card vehicle-card">
                                    <div className="vehicle-card-content">
                                        
                                        <div className="vehicle-icon-section">
                                            <span className="vehicle-render-icon">
                                                {getVehicleIcon(rawTypeName)}
                                            </span>
                                        </div>

                                        <div className="vehicle-details-section">
                                            <div className="vehicle-title-row">
                                                <span className="vehicle-name">
                                                    {displayTypeName} ({vehicle.qrCode || 'No QR'})
                                                </span>
                                                <span className={`status-dot ${isNeedCheck ? 'red' : 'green'}`}></span>
                                            </div>
                                            
                                            <div className="vehicle-info-text">
                                                <p>Status : {statusText}</p>
                                                <p>Location: {locationDisplay}</p>
                                                {vehicle.batteryLevel !== undefined && (
                                                    <p>Battery level: {vehicle.batteryLevel}%</p>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="vehicle-actions-row">
                                            {isNeedCheck && (
                                                <button className="action-btn">
                                                    <span className="icon">🔨</span> Call repairman
                                                </button>
                                            )}
                                            <button className="action-btn">
                                                <span className="icon">📝</span> Edit
                                            </button>
                                            <button className="action-btn">
                                                <span className="icon">❌</span> Delete
                                            </button>
                                        </div>

                                    </div>
                                </div>
                            );
                        })}

                        {filteredVehicles.length === 0 && (
                            <div className="no-results">No vehicles match your criteria.</div>
                        )}
                    </div>
                    <button className="fab-add-btn">+</button>
                </div>

            </div>
        </div>
    );
}