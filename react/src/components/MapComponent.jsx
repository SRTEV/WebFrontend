import React, { useState, useEffect } from 'react';
import Map, { Marker } from 'react-map-gl';
import mapboxgl from 'mapbox-gl'; 
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

mapboxgl.config.TRACK_RESIZE_EVENTS = false;

export default function MapComponent() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  const getVehicleIcon = (typeName) => {
    if (!typeName) return '/scooter.png';
    
    const name = typeName.toLowerCase();
    
    if (name.includes('bike')) return '/bike.png';
    if (name.includes('monowheel')) return '/monowheel.png';
    
    return '/scooter.png';
  };

  if (loading) {
    return <div style={{ padding: '20px', color: '#fff' }}>Loading vehicles...</div>;
  }

  return (
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
    >
      {vehicles.map((vehicle) => {
        const lng = parseFloat(vehicle.position_X || vehicle.positionX || vehicle.Position_X);
        const lat = parseFloat(vehicle.position_Y || vehicle.positionY || vehicle.Position_Y);

        if (isNaN(lng) || isNaN(lat)) {
          console.warn(`Skipping vehicle ID ${vehicle.id || 'unknown'} due to missing coordinates:`, vehicle);
          return null;
        }

        const typeName = vehicle.vehicleType?.name || vehicle.vehicle_Type?.name || '';

        return (
          <Marker
            key={vehicle.id}
            longitude={lng}
            latitude={lat}
            anchor="bottom"
          >
            <div className="custom-map-marker">
              <img 
                src={getVehicleIcon(typeName)} 
                alt={typeName || 'vehicle'} 
              />
            </div>
          </Marker>
        );
      })}
    </Map>
  );
}