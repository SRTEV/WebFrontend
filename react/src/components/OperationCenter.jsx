import React, { useState, useEffect } from 'react';
import '../App.css';
import backgroundImage from '../assets/background.svg';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function OperationCenter() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('Users'); 
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

    const [filters, setFilters] = useState({
        'Problem with vehicles': true,
        'Payment issue': true,
        'Problem with account': true,
        'Other': true
    });

    useEffect(() => {
        fetchReports();
        const intervalId = setInterval(fetchReports, 30000);
        return () => clearInterval(intervalId);
    }, []);

    const fetchReports = () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError("Authorization required. Please sign in first.");
            setLoading(false);
            return;
        }

        fetch(`${BASE_URL}/Report`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
        .then((res) => {
            if (res.status === 401) throw new Error("Unauthorized access (401).");
            if (!res.ok) throw new Error(`Failed to load reports (Status: ${res.status})`);
            return res.json();
        })
        .then((data) => {
            setReports(data);
            setError('');
            setLoading(false);
        })
        .catch((err) => {
            setError(err.message);
            setLoading(false);
        });
    };

    const toggleFilter = (key) => {
        setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const filteredReports = reports.filter((report) => {
        const rType = report.type || report.Type;
        
        const isRepairmanReport = rType === 'Repairman problem' || (report.user && report.user.roleID === 3);
        const matchesTab = activeTab === 'Repairman' ? isRepairmanReport : !isRepairmanReport;

        const q = searchQuery.trim().toLowerCase();
        const matchesSearch = !q || 
            (report.vehicleID && report.vehicleID.toString().includes(q)) || 
            (report.id && report.id.toString().includes(q)) ||
            (report.ID && report.ID.toString().includes(q));

        const matchesType = activeTab === 'Repairman' ? true : filters[rType] === true;

        return matchesTab && matchesSearch && matchesType;
    });

    if (loading) return <div className="loading-state">Loading reports...</div>;
    if (error) return <div className="error-state">{error}</div>;

    return (
        <div className="operation-center" style={{ backgroundImage: `url(${backgroundImage})`, minHeight: '100vh', backgroundSize: 'cover' }}>
            <div className="content-container-box">
                
                <div className="search-bar-container">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search by number"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="controls-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                    
                    <div className="filter-dropdown" style={{ position: 'relative' }}>
                        <button className="filter-btn" onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}>
                            Filter <span className="arrow-icon">{isFilterMenuOpen ? '⌃' : '⌄'}</span>
                        </button>
                        
                        {isFilterMenuOpen && (
                            <div className="custom-checkbox-dropdown">
                                {Object.keys(filters).map((key) => (
                                    <label key={key} className="checkbox-filter-label">
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

                    {/* Вкладки */}
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button 
                            className="filter-btn" 
                            style={{ 
                                backgroundColor: activeTab === 'Users' ? '#d6e6f2' : 'var(--color-surface-gray)',
                                borderColor: activeTab === 'Users' ? '#7fa9c7' : 'var(--color-border)'
                            }}
                            onClick={() => setActiveTab('Users')}
                        >
                            Users
                        </button>
                        <button 
                            className="filter-btn" 
                            style={{ 
                                position: 'relative',
                                backgroundColor: activeTab === 'Repairman' ? '#d6e6f2' : 'var(--color-surface-gray)',
                                borderColor: activeTab === 'Repairman' ? '#7fa9c7' : 'var(--color-border)'
                            }}
                            onClick={() => setActiveTab('Repairman')}
                        >
                            Repairman
                            <span className="status-dot status-red" style={{ position: 'absolute', top: '-3px', right: '-3px', width: '9px', height: '9px', borderRadius: '50%' }}></span>
                        </button>
                    </div>
                </div>

                <div className="vehicles-list-wrapper">
                    {filteredReports.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#555', padding: '20px', fontWeight: 'bold' }}>
                            No reports found.
                        </div>
                    ) : (
                        filteredReports.map((report) => (
                            <div key={report.id || report.ID} className="vehicle-card" style={{ padding: '15px 20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#000' }}>
                                        {report.name || report.email || report.Email}
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: 'auto' }}>
                                        <span style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '4px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold' }}>
                                            {report.type || report.Type}
                                        </span>
                                        <span style={{ fontSize: '18px', cursor: 'pointer' }} title="Respond">📋</span>
                                    </div>
                                </div>

                                <div style={{ paddingLeft: '20px', marginBottom: '15px' }}>
                                    <p style={{ margin: 0, fontSize: '14px', color: '#000', lineHeight: '1.4' }}>
                                        {report.text || report.Text}
                                    </p>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#555', fontWeight: '500' }}>
                                    <div>
                                        {(report.vehicleID || report.VehicleID) && (
                                            <span>Vehicle ID: {report.vehicleID || report.VehicleID}</span>
                                        )}
                                    </div>
                                    <div style={{ marginLeft: 'auto' }}>
                                        {report.created_At || report.Created_At}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

            </div>
        </div>
    );
}