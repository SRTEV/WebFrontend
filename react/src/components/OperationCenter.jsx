import React, { useState, useEffect } from 'react';
import '../App.css';
import backgroundImage from '../assets/background.svg';
import { apiFetch } from '../api';

export default function OperationCenter() {
  // State
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('Users');
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const [selectedReport, setSelectedReport] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

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
    apiFetch('/Report')
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load reports (Status: ${res.status})`);
        return res.json();
      })
      .then((data) => {
        setReports(data);
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

  // Filter updates
  const toggleFilter = (key) => {
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Filtered reports
  const filteredReports = reports.filter((report) => {
    const rType = report.type || report.Type;
    const isRepairmanReport = rType === 'Repairman problem' || (report.user && report.user.roleID === 3);
    const matchesTab = activeTab === 'Repairman' ? isRepairmanReport : !isRepairmanReport;

    const q = searchQuery.trim().toLowerCase();

    const email = (report.email || report.Email || '').toLowerCase();
    const name = (report.name || report.Name || '').toLowerCase();
    const vehicleId = (report.vehicleID || report.VehicleID || '').toString().toLowerCase();
    const id = (report.id || report.ID || '').toString().toLowerCase();

    const matchesSearch = !q ||
      vehicleId.includes(q) ||
      id.includes(q) ||
      email.includes(q) ||
      name.includes(q);

    const matchesType = activeTab === 'Repairman' ? true : filters[rType] === true;

    return matchesTab && matchesSearch && matchesType;
  });

  // Open reply modal
  const handleOpenReplyModal = (report) => {
    setSelectedReport(report);
    setReplyMessage('');
  };

  const handleCloseReplyModal = () => {
    setSelectedReport(null);
    setReplyMessage('');
  };

  // Send reply
  const handleSendReply = async () => {
    if (!selectedReport) return;

    const reportId = selectedReport.id || selectedReport.ID;
    const recipientEmail = selectedReport.email || selectedReport.Email;

    if (!recipientEmail) {
      alert("Error: User email is missing for this report.");
      return;
    }

    if (!replyMessage.trim()) {
      alert("Please enter a message before sending.");
      return;
    }

    setIsSending(true);

    try {
      const response = await apiFetch(`/Report/${reportId}/reply`, {
        method: 'POST',
        body: JSON.stringify({
          email: recipientEmail,
          message: replyMessage
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Failed to send reply');
      }

      alert('Reply sent successfully!');
      handleCloseReplyModal();
      fetchReports();
    } catch (err) {
      if (err.message !== 'Unauthorized') {
        alert(`Error sending reply: ${err.message}`);
      }
    } finally {
      setIsSending(false);
    }
  };

  if (loading) return <div className="loading-state">Loading reports...</div>;
  if (error) return <div className="error-state">{error}</div>;

  const recipientName = selectedReport 
    ? (selectedReport.name || selectedReport.Name || selectedReport.email || selectedReport.Email) 
    : '';

  return (
    <div className="operation-center" style={{ backgroundImage: `url(${backgroundImage})`, minHeight: '100vh', backgroundSize: 'cover' }}>
      <div className="content-container-box">
        <div className="search-bar-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search by number or email"
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
                backgroundColor: activeTab === 'Repairman' ? '#d6e6f2' : 'var(--color-surface-gray)',
                borderColor: activeTab === 'Repairman' ? '#7fa9c7' : 'var(--color-border)'
              }}
              onClick={() => setActiveTab('Repairman')}
            >
              Repairman
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
                    <button
                      onClick={() => handleOpenReplyModal(report)}
                      style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}
                      title="Respond"
                    >
                      📋
                    </button>
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
                    {report.created_At || report.Created_At || report.createdAt}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {selectedReport && (
        <div className="modal-overlay" onClick={handleCloseReplyModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={handleCloseReplyModal} aria-label="Close">
              ✕
            </button>

            <div className="modal-field">
              <label className="modal-label">Answer to {recipientName}:</label>
            </div>

            <div className="modal-field">
              <label className="modal-label">Write your reply message:</label>
              <textarea
                className="modal-textarea"
                placeholder="Type your answer here..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                disabled={isSending}
              />
            </div>

            <button 
              className="modal-send-btn" 
              onClick={handleSendReply}
              disabled={isSending}
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}