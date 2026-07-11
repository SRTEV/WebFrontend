import React, { useState, useEffect } from 'react';
import Map, { Marker } from 'react-map-gl';
import mapboxgl from 'mapbox-gl'; 
import 'mapbox-gl/dist/mapbox-gl.css';

// Local transport icons for map markers (served from the app's assets)
import scooterIcon from '/scooter.png';
import bikeIcon from '/bike.png';
import monowheelIcon from '/monowheel.png';

// Environment configuration values (injected at build/runtime)
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Disable tracking resize events in mapbox-gl to avoid excessive internal listeners
mapboxgl.config.TRACK_RESIZE_EVENTS = false;

export default function MapComponent() {
  // Component state
  const [vehicles, setVehicles] = useState([]); // array of vehicle objects from API
  const [loading, setLoading] = useState(true); // loading indicator for initial fetch
  
  // ID of the vehicle currently selected on the map (used to show info panel)
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);

  // Fetch vehicle list from backend and poll every 30s to refresh positions
  useEffect(() => {
    const fetchVehicles = () => {
      fetch(`${BASE_URL}/Vehicle`) 
        .then((response) => response.json())
        .then((data) => {
          setVehicles(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Vehicle load error:", error);
          setLoading(false);
        });
    };

    fetchVehicles();
    const intervalId = setInterval(fetchVehicles, 30000); // poll every 30s

    // Clean up polling on unmount
    return () => clearInterval(intervalId);
  }, []); 

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

  // Select a marker image based on the vehicle type name
  const getVehicleIcon = (typeName) => {
    if (!typeName) return scooterIcon;
    const name = typeName.toLowerCase();
    if (name.includes('bike')) return bikeIcon;
    if (name.includes('monowheel')) return monowheelIcon;
    return scooterIcon;
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

  if (loading) {
    return <div style={{ padding: '20px', color: '#fff' }}>Loading vehicles...</div>;
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Map container: Mapbox GL via react-map-gl */}
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
          // coordinate fields from API
          const lng = parseFloat(vehicle.positionX);
          const lat = parseFloat(vehicle.positionY);

          // Skip entries without valid coordinates
          if (isNaN(lng) || isNaN(lat)) return null;

          // Determine a human-readable type name from API fields
          const typeName = vehicle.vehicleType?.name || '';

          // marker selected state
          const isSelected = vehicle.id === selectedVehicleId;

          return (
            <Marker
              key={vehicle.id}
              longitude={lng}
              latitude={lat}
              anchor="bottom"
            >
              <div 
                className={`custom-map-marker ${isSelected ? 'selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (e.nativeEvent) {
                    e.nativeEvent.stopPropagation();
                  }
                  setSelectedVehicleId(vehicle.id);
                }}
                style={{ cursor: 'pointer' }}
              >
                <img 
                  src={getVehicleIcon(typeName)} 
                  alt={typeName || 'vehicle'} 
                />
              </div>
            </Marker>
          );
        })}
      </Map>

      {selectedVehicle && (
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
            <p>Status : {selectedVehicle.vechicleStatus?.name || 'Unknown'}</p>
            <p>Used by: {selectedVehicle.currentUser || 'None'}</p>
          </div>

          <div className="panel-actions">
            <button className="panel-repair-btn">
              Send Repairman
            </button>
          </div>
        </div>
      )}
    </div>
  );
}