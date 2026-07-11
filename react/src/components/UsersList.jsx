import React, { useState, useEffect } from 'react';
import '../App.css';
import backgroundImage from '../assets/background.svg';

// UsersList: displays a searchable, filterable list of users fetched from the API

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function UsersList() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // UI state: search input and filter checkboxes
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        User: true,
        Repairman: true,
        Admin: true,
        Banned: true
    });
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

    // ID of currently-expanded user card (for showing banned details)
    const [expandedUserId, setExpandedUserId] = useState(null);

    // Fetch users from backend and refresh periodically (30s)
    useEffect(() => {
        const fetchUsers = () => {
            fetch(`${BASE_URL}/User`)
                .then((res) => res.json())
                .then((data) => {
                    setUsers(data);
                    setLoading(false);
                })
                .catch((error) => {
                    console.error("Failed to fetch users:", error);
                    setLoading(false);
                });
        };

        fetchUsers();

        const intervalId = setInterval(fetchUsers, 30000);

        return () => clearInterval(intervalId);
    }, []);

    // Toggle a filter on/off
    const toggleFilter = (key) => {
        setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    // Apply filters and search to the full users array
    const filteredUsers = users.filter((user) => {
        const roleName = user.role?.roleName || 'User';

        // Role filter (User / Repairman / Admin)
        const roleMatch = filters[roleName] === true;

        // Banned users filter
        const bannedMatch = user.isBlocked ? filters.Banned : true;

        // Search in name and email (case-insensitive)
        const q = searchQuery.trim().toLowerCase();
        const searchMatch = !q || (
            (user.email || '').toLowerCase().includes(q) ||
            (user.name || '').toLowerCase().includes(q)
        );

        return roleMatch && bannedMatch && searchMatch;
    });

    // Dynamic statistics shown in the UI
    const totalUsers = users.length;
    const bannedCount = users.filter(u => u.isBlocked).length;
    const activeCount = totalUsers - bannedCount;

    if (loading) return <div className="loading-state">Loading users...</div>;

    return (
        // Main users list view
        <div className="operation-center" style={{ backgroundImage: `url(${backgroundImage})` }}>
            <div className="content-wrapper">
                <div className="search-bar-container">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search by name or email"
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
                                        {key === 'Banned' ? 'Banned users' : key}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="stats-board">
                        <span>Total Users : {totalUsers}</span>
                        <span>Active now : {activeCount}</span>
                        <span>Banned : {bannedCount}</span>
                    </div>
                </div>

                <div className="users-list">
                    {filteredUsers.map((user) => (
                        <div
                            key={user.id}
                            className={`user-card ${user.isBlocked ? 'banned-card' : ''}`}
                        >
                            <div className="user-card-header">
                                <div className="user-info">
                                    <span className={`status-dot ${user.isBlocked ? 'red' : 'green'}`}></span>
                                    <span className="user-name">{user.name}</span>
                                    <span className="user-role">{user.role?.roleName || 'User'}</span>
                                </div>

                                <div className="user-actions">
                                    <button className="action-btn">
                                        <span className="icon">🚫</span> {user.isBlocked ? 'Unblock' : 'Block'}
                                    </button>
                                    <button className="action-btn">
                                        <span className="icon">❌</span> Delete
                                    </button>
                                    <button
                                        className="action-btn"
                                        onClick={() => setExpandedUserId(expandedUserId === user.id ? null : user.id)}
                                    >
                                        <span className="icon">⏫</span> Change status
                                    </button>
                                </div>
                            </div>

                            {user.isBlocked && expandedUserId === user.id && (
                                <div className="banned-details">
                                    <p>
                                        <strong>User was blocked</strong>
                                        <br />
                                        {user.blockedReason || "No reason provided by administration."}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}

                    {filteredUsers.length === 0 && (
                        <div className="no-results">No users match your criteria.</div>
                    )}
                </div>
            </div>
        </div>
    );
}