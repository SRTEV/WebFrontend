import React, { useState, useEffect } from 'react';
import '../App.css';
import backgroundImage from '../assets/background.svg';
import { apiFetch } from '../api';

export default function UsersList() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // UI state: search and filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        User: true,
        Repairman: true,
        Admin: true,
        Banned: true
    });
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

    // Modal state
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        type: null,
        user: null
    });
    const [blockReason, setBlockReason] = useState('Incorrect use of the scooter');
    const [selectedRole, setSelectedRole] = useState('User');

    useEffect(() => {
        fetchUsers();
        const intervalId = setInterval(fetchUsers, 30000);
        return () => clearInterval(intervalId);
    }, []);

    const fetchUsers = () => {
        apiFetch('/User')
            .then((res) => {
                if (!res.ok) throw new Error(`Failed to load users (Status: ${res.status})`);
                return res.json();
            })
            .then((data) => {
                setUsers(data.filter(u => !u.deleted));
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

    const toggleFilter = (key) => {
        setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const openModal = (type, user) => {
        setModalConfig({ isOpen: true, type, user });
        if (type === 'changeStatus') {
            const currentRole = user.role?.roleName || 'User';
            setSelectedRole(currentRole.charAt(0).toUpperCase() + currentRole.slice(1).toLowerCase());
        }
        if (type === 'block') {
            setBlockReason('Incorrect use of the scooter');
        }
    };

    const closeModal = () => {
        setModalConfig({ isOpen: false, type: null, user: null });
    };

    // Block user
    const handleBlock = async () => {
        try {
            const res = await apiFetch(`/User/Block/${modalConfig.user.id}`, {
                method: 'POST',
                body: JSON.stringify({ reason: blockReason })
            });
            
            if (res.ok) {
                setUsers(users.map(u => u.id === modalConfig.user.id ? { ...u, isBlocked: true, blockedReason: blockReason } : u));
                closeModal();
            }
        } catch (err) {
            console.error("Block error:", err);
        }
    };

    // Unblock user
    const handleUnblock = async () => {
        try {
            const res = await apiFetch(`/User/Unblock/${modalConfig.user.id}`, {
                method: 'POST'
            });
            
            if (res.ok) {
                setUsers(users.map(u => u.id === modalConfig.user.id ? { ...u, isBlocked: false, blockedReason: null } : u));
                closeModal();
            }
        } catch (err) {
            console.error("Unblock error:", err);
        }
    };

    // Soft delete
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            const res = await apiFetch(`/User/Delete/${id}`, {
                method: 'POST'
            });
            
            if (res.ok) {
                setUsers(users.filter(u => u.id !== id));
            }
        } catch (err) {
            console.error("Delete error:", err);
        }
    };

    // Change role
    const handleChangeStatus = async () => {
        try {
            const res = await apiFetch(`/User/ChangeRole/${modalConfig.user.id}`, {
                method: 'POST',
                body: JSON.stringify({ roleName: selectedRole })
            });
            
            if (res.ok) {
                setUsers(users.map(u => u.id === modalConfig.user.id ? { 
                    ...u, 
                    role: { ...u.role, roleName: selectedRole } 
                } : u));
                closeModal();
            }
        } catch (err) {
            console.error("Role change error:", err);
        }
    };

    const filteredUsers = users.filter((user) => {
        const rawRole = user.role?.roleName || 'User';
        const roleName = rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase();
        const roleMatch = filters[roleName] === true;
        const bannedMatch = user.isBlocked ? filters.Banned : true;
        const q = searchQuery.trim().toLowerCase();
        const searchMatch = !q || ((user.email || '').toLowerCase().includes(q) || (user.name || '').toLowerCase().includes(q));

        return roleMatch && bannedMatch && searchMatch;
    });

    const totalUsers = users.length;
    const bannedCount = users.filter(u => u.isBlocked).length;
    const activeCount = totalUsers - bannedCount;

    if (loading) return <div className="loading-state">Loading users...</div>;
    if (error) return <div className="error-state">{error}</div>;

    return (
        <div className="operation-center" style={{ backgroundImage: `url(${backgroundImage})` }}>
            <div className="content-wrapper" style={{ position: 'relative' }}>
                
                <div className="search-bar-container">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search by email"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="controls-bar">
                    <div className="filter-dropdown">
                        <button className="filter-btn" onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}>
                            Filter <span className="arrow-icon">⌄</span>
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

                <div className="users-list-container" style={{ position: 'relative' }}>
                    <div className="users-list">
                        {filteredUsers.map((user) => {
                            const rawRole = user.role?.roleName || 'User';
                            const roleName = rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase();

                            return (
                                <div key={user.id} className={`user-card ${user.isBlocked ? 'banned-card' : ''}`}>
                                    <div className="user-card-header">
                                        <div className="user-info">
                                            <span className={`status-dot ${user.isBlocked ? 'red' : 'green'}`}></span>
                                            <div className="user-text-details">
                                                <span className="user-name">{user.name}</span>
                                            </div>
                                        </div>

                                        <div className="user-actions-container">
                                            <span className="user-role">{roleName}</span>
                                            <div className="user-actions">
                                                <button className="action-btn" onClick={() => user.isBlocked ? openModal('unblock', user) : openModal('block', user)}>
                                                    <span className="icon">{user.isBlocked ? '✔️' : '🚫'}</span> 
                                                    {user.isBlocked ? 'Unblock' : 'Block'}
                                                </button>
                                                <button className="action-btn" onClick={() => handleDelete(user.id)}>
                                                    <span className="icon">❌</span> Delete
                                                </button>
                                                <button className="action-btn" onClick={() => openModal('changeStatus', user)}>
                                                    <span className="icon">⏫</span> Change status
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {user.isBlocked && (
                                        <div className="banned-details">
                                            <p>
                                                User was blocked by administration<br />
                                                <strong>for {user.blockedReason || "traffic violations related to electric scooter use"}</strong>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Modal windows */}
                    {modalConfig.isOpen && (
                        <div className="custom-modal-overlay">
                            <div className="custom-modal">
                                {modalConfig.type === 'block' && (
                                    <>
                                        <h3>Confirm user block</h3>
                                        <p>Enter the block reason for {modalConfig.user?.name}</p>
                                        <input 
                                            type="text" 
                                            value={blockReason} 
                                            onChange={(e) => setBlockReason(e.target.value)} 
                                            className="modal-input"
                                        />
                                        <div className="modal-buttons">
                                            <button className="btn-cancel" onClick={closeModal}>Cancel</button>
                                            <button className="btn-confirm block-btn" onClick={handleBlock}>Block</button>
                                        </div>
                                    </>
                                )}

                                {modalConfig.type === 'unblock' && (
                                    <>
                                        <h3>Confirm user unblock</h3>
                                        <p>Are you sure you want to unblock <strong>{modalConfig.user?.name}</strong>?</p>
                                        <div className="modal-buttons">
                                            <button className="btn-cancel" onClick={closeModal}>Cancel</button>
                                            <button className="btn-confirm unblock-btn" onClick={handleUnblock}>Unblock</button>
                                        </div>
                                    </>
                                )}

                                {modalConfig.type === 'changeStatus' && (
                                    <>
                                        <h3>Confirm role change</h3>
                                        <div className="radio-group">
                                            {['User', 'Admin', 'Repairman'].map(role => (
                                                <label key={role} className="radio-label">
                                                    <input 
                                                        type="radio" 
                                                        name="role" 
                                                        value={role} 
                                                        checked={selectedRole === role}
                                                        onChange={(e) => setSelectedRole(e.target.value)} 
                                                    />
                                                    {role}
                                                </label>
                                            ))}
                                        </div>
                                        <div className="modal-buttons">
                                            <button className="btn-cancel" onClick={closeModal}>Cancel</button>
                                            <button className="btn-confirm change-btn" onClick={handleChangeStatus}>Change</button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}