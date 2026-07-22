import React, { useState, useEffect } from 'react';
import Map, { Marker } from 'react-map-gl';
import mapboxgl from 'mapbox-gl'; 
import 'mapbox-gl/dist/mapbox-gl.css';
import { apiFetch } from '../api';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

mapboxgl.config.TRACK_RESIZE_EVENTS = false;

export default function MapComponent() {
    // State
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVehicleId, setSelectedVehicleId] = useState(null);

    const [isRepairFormOpen, setIsRepairFormOpen] = useState(false);
    const [repairData, setRepairData] = useState({
        type: 'Monowheel',
        qrCode: '',
        description: ''
    });

    useEffect(() => {
        const fetchVehicles = () => {
            apiFetch('/Vehicle') 
                .then((response) => {
                    if (!response.ok) throw new Error(`Failed to load vehicles (${response.status})`);
                    return response.json();
                })
                .then((data) => {
                    setVehicles(data);
                    setLoading(false);
                })
                .catch((error) => {
                    if (error.message !== 'Unauthorized') {
                        console.error("Error fetching vehicles:", error);
                    }
                    setLoading(false);
                });
        };

        fetchVehicles();
        const intervalId = setInterval(fetchVehicles, 30000);
        return () => clearInterval(intervalId);
    }, []); 

    // Selected vehicle
    const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

    // Choose marker icon
    const getVehicleIcon = (typeName, statusName) => {
        const type = (typeName || '').toLowerCase();
        const status = (statusName || '').toLowerCase();
        let num = 1;
        if (status.includes('available')) num = 1;
        else if (status.includes('rented')) num = 2;
        else if (status.includes('needcheck')) num = 3;
        else if (status.includes('inservice')) num = 4;

        let base = 'scooter';
        if (type.includes('bike')) base = 'bike';
        else if (type.includes('monowheel')) base = 'monowheel';

        return `/${base}${num}.png`;
    };

    const getVehicleEmoji = (typeName) => {
        if (!typeName) return '🛴';
        const name = typeName.toLowerCase();
        if (name.includes('bike')) return '🚲';
        if (name.includes('monowheel')) return '🛞';
        return '🛴';
    };

    const handleMapClick = () => {
        setSelectedVehicleId(null);
    };

    const handleOpenRepairForm = () => {
        if (selectedVehicle) {
            const rawType = (selectedVehicle.vehicleType?.name || 'Scooter').toLowerCase();
            let vType = 'Scooter';
            if (rawType.includes('bike') || rawType.includes('bicycle')) vType = 'Bicycle';
            if (rawType.includes('monowheel')) vType = 'Monowheel';

            setRepairData({
                type: vType,
                qrCode: selectedVehicle.qrCode || selectedVehicle.QrCode || '',
                description: ''
            });
        }
        setIsRepairFormOpen(true);
    };

    const handleRepairSubmit = (e) => {
        e.preventDefault();
        console.log("Repair call sent:", repairData);
        alert(`Repairman called successfully for ${repairData.type} (${repairData.qrCode})`);
        setIsRepairFormOpen(false);
    };

    if (loading) {
        return <div style={{ padding: '20px', color: '#fff' }}>Loading vehicles...</div>;
    }

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          {/* Map container */}
            <Map
                initialViewState={{
                    longitude: 22.548, 
                    latitude: 51.236,  
                    zoom: 14,
                    pitch: 45
                }}
                style={{ width: '100%', height: '100%' }}
                mapStyle={import.meta.env.VITE_MAPBOX_STYLE}
                mapboxAccessToken={MAPBOX_TOKEN}
                onClick={handleMapClick}
            >
                {vehicles.map((vehicle) => {
                    const lng = parseFloat(vehicle.positionX);
                    const lat = parseFloat(vehicle.positionY);
                    if (isNaN(lng) || isNaN(lat)) return null;

                    const typeName = vehicle.vehicleType?.name || '';
                    const statusName = vehicle.vehicleStatus?.name || '';
                    const isSelected = vehicle.id === selectedVehicleId;

                    return (
                        <Marker key={vehicle.id} longitude={lng} latitude={lat} anchor="bottom">
                            <div 
                                className={`custom-map-marker ${isSelected ? 'selected' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (e.nativeEvent) e.nativeEvent.stopPropagation();
                                    setSelectedVehicleId(vehicle.id);
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                <img src={getVehicleIcon(typeName, statusName)} alt={typeName} />
                            </div>
                        </Marker>
                    );
                })}
            </Map>

            {selectedVehicle && !isRepairFormOpen && (
                <div className="vehicle-info-panel">
                    <div className="panel-header">
                        <span className="panel-header-icon">
                            {getVehicleEmoji(selectedVehicle.vehicleType?.name)}
                        </span>
                        <span className="panel-header-title">
                            {selectedVehicle.vehicleType?.name === 'Bike' ? 'Bicycle' : (selectedVehicle.vehicleType?.name || 'Vehicle')} #{selectedVehicle.id}
                        </span>
                    </div>
                    
                    <div className="panel-body">
                        <h3 className="vehicle-panel-name">
                            {selectedVehicle.qrCode || 'No QR'}
                        </h3>
                        <p>Battery level: {selectedVehicle.batteryLevel !== undefined ? selectedVehicle.batteryLevel : 0}%</p>
                        <p>Status : {selectedVehicle.vehicleStatus?.name || 'Unknown'}</p>
                        <p>Used by: {selectedVehicle.currentUser || 'None'}</p>
                    </div>

                    <div className="panel-actions">
                        <button className="panel-repair-btn" onClick={handleOpenRepairForm}>
                            Send Repairman
                        </button>
                    </div>
                </div>
            )}

            {isRepairFormOpen && (
                <div 
                    className="modal-backdrop-overlay" 
                    style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        width: '100%', 
                        height: '100%', 
                        zIndex: 100, 
                        background: 'rgba(0, 0, 0, 0.4)',
                        backdropFilter: 'blur(5px)',
                        WebkitBackdropFilter: 'blur(5px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    onClick={() => setIsRepairFormOpen(false)}
                >
                    <div 
                        className="modal-container-box" 
                        style={{ 
                            position: 'relative',
                            background: '#e0e0e0',
                            borderRadius: '28px',
                            padding: '35px 30px',
                            width: '90%',
                            maxWidth: '480px',
                            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
                            color: '#000',
                            fontFamily: 'sans-serif'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button 
                            type="button"
                            onClick={() => setIsRepairFormOpen(false)}
                            style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                background: 'none',
                                border: 'none',
                                fontSize: '24px',
                                cursor: 'pointer',
                                color: '#000',
                                fontWeight: 'bold',
                                padding: '5px',
                                lineHeight: '1'
                            }}
                        >
                            ✕
                        </button>

                        <form onSubmit={handleRepairSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '18px', fontWeight: 'bold', color: '#000' }}>
                                    Select type of vehicle:
                                </label>
                                <select 
                                    value={repairData.type}
                                    onChange={(e) => setRepairData({ ...repairData, type: e.target.value, qrCode: '' })}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        borderRadius: '10px',
                                        border: '1px solid #ccc',
                                        background: '#fff',
                                        fontSize: '16px',
                                        color: '#000',
                                        outline: 'none'
                                    }}
                                >
                                    <option value="Scooter">Scooter</option>
                                    <option value="Bicycle">Bicycle</option>
                                    <option value="Monowheel">Monowheel</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '18px', fontWeight: 'bold', color: '#000' }}>
                                    Select QR Code:
                                </label>
                                <select
                                    value={repairData.qrCode}
                                    onChange={(e) => setRepairData({ ...repairData, qrCode: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        borderRadius: '10px',
                                        border: '1px solid #ccc',
                                        background: '#fff',
                                        fontSize: '16px',
                                        color: '#000',
                                        outline: 'none'
                                    }}
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

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '18px', fontWeight: 'bold', color: '#000' }}>
                                    Describe problem with vehicle:
                                </label>
                                <textarea
                                    value={repairData.description}
                                    onChange={(e) => setRepairData({ ...repairData, description: e.target.value })}
                                    placeholder="The customer is complaining about squeaky brakes; they need to be checked"
                                    required
                                    style={{ 
                                        width: '100%',
                                        minHeight: '120px', 
                                        padding: '12px 16px',
                                        borderRadius: '10px',
                                        border: '1px solid #ccc',
                                        background: '#fff',
                                        fontSize: '16px',
                                        color: '#000',
                                        outline: 'none',
                                        resize: 'vertical', 
                                        fontFamily: 'inherit',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <button 
                                type="submit"
                                style={{
                                    background: '#1a1a1a',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '12px',
                                    padding: '12px 40px',
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    alignSelf: 'center',
                                    marginTop: '10px',
                                    transition: 'background 0.2s ease-in-out'
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#333'}
                                onMouseLeave={(e) => e.target.style.background = '#1a1a1a'}
                            >
                                Send
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}