import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { ShieldAlert, CheckCircle, Search, Filter } from 'lucide-react';

const AdminViolations = () => {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const { activeAlerts } = useSocket();

  useEffect(() => {
    fetchViolations();
  }, []);

  useEffect(() => {
    if (activeAlerts && activeAlerts.length > 0) {
      fetchViolations();
    }
  }, [activeAlerts]);

  const fetchViolations = async () => {
    try {
      const token = localStorage.getItem('token');
      // Re-using the teacher violations endpoint for now if admin doesn't have one, 
      // but ideally we should have /api/admin/violations
      // For now we'll fetch all violations.
      const response = await axios.get('http://localhost:5000/api/admin/violations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setViolations(response.data);
    } catch (error) {
      console.error('Error fetching violations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredViolations = violations.filter(v => {
    const matchesSearch = v.student?.name?.toLowerCase().includes(search.toLowerCase()) || 
                          v.student?.student_id?.toLowerCase().includes(search.toLowerCase()) ||
                          (!v.student && search.toLowerCase().includes('unknown'));
    const matchesStatus = filterStatus === 'ALL' || v.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const registeredViolations = filteredViolations.filter(v => v.student_id !== null);
  const unknownViolations = filteredViolations.filter(v => v.student_id === null);

  if (loading) return <div className="loader-container"><div className="loader"></div></div>;

  return (
    <div>
      <header className="header">
        <div>
          <h1>Violation Center</h1>
          <p>Global oversight of disciplinary incidents</p>
        </div>
      </header>

      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search by student name or ID..." 
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={18} color="var(--text-muted)" />
          <select 
            className="form-select" 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ width: '150px' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="PENDING">Pending</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="APPEALED">Appealed</option>
            <option value="DISMISSED">Dismissed</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        {registeredViolations.length > 0 && (
          <div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '2px solid var(--primary)', display: 'inline-block' }}>Registered Students</h2>
            <div className="table-container glass-panel">
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Student</th>
                    <th>Violation Type</th>
                    <th>Confidence</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {registeredViolations.map((v) => (
                    <tr key={v.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{new Date(v.timestamp).toLocaleString()}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{v.student?.name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{v.student?.student_id}</div>
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>
                        {v.detection_type ? v.detection_type.replace('_', ' ') : 'Unknown'}
                      </td>
                      <td>
                        <div style={{ width: '100px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ flex: 1, background: '#e5e7eb', borderRadius: 999, height: 6 }}>
                            <div style={{ background: 'var(--danger)', height: 6, borderRadius: 999, width: `${(v.confidence || 0) * 100}%` }}></div>
                          </div>
                          <span style={{ fontSize: '0.85rem' }}>{((v.confidence || 0) * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${
                          v.status === 'NEW' ? 'badge-danger' : 
                          v.status === 'PENDING' ? 'badge-warning' : 
                          v.status === 'ACKNOWLEDGED' ? 'badge-primary' : 
                          v.status === 'APPEALED' ? 'badge-warning' : 'badge-success'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                      <td>
                        {v.evidence_path ? (
                          <a 
                            href={`http://localhost:5000/evidence/${v.evidence_path}`} 
                            target="_blank" 
                            rel="noreferrer"
                            style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem' }}
                          >
                            View Evidence
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {unknownViolations.length > 0 && (
          <div>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '2px solid var(--danger)', display: 'inline-block', color: 'var(--danger)' }}>Unknown Candidates / Intruders</h2>
            <div className="table-container glass-panel">
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Person</th>
                    <th>Violation Type</th>
                    <th>Confidence</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {unknownViolations.map((v) => (
                    <tr key={v.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{new Date(v.timestamp).toLocaleString()}</td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--danger)' }}>Unknown Person</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No ID Matched</div>
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>
                        {v.detection_type ? v.detection_type.replace('_', ' ') : 'Unknown'}
                      </td>
                      <td>
                        <div style={{ width: '100px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ flex: 1, background: '#e5e7eb', borderRadius: 999, height: 6 }}>
                            <div style={{ background: 'var(--danger)', height: 6, borderRadius: 999, width: `${(v.confidence || 0) * 100}%` }}></div>
                          </div>
                          <span style={{ fontSize: '0.85rem' }}>{((v.confidence || 0) * 100).toFixed(0)}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${
                          v.status === 'NEW' ? 'badge-danger' : 
                          v.status === 'PENDING' ? 'badge-warning' : 
                          v.status === 'ACKNOWLEDGED' ? 'badge-primary' : 
                          v.status === 'APPEALED' ? 'badge-warning' : 'badge-success'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                      <td>
                        {v.evidence_path ? (
                          <a 
                            href={`http://localhost:5000/evidence/${v.evidence_path}`} 
                            target="_blank" 
                            rel="noreferrer"
                            style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem' }}
                          >
                            View Evidence
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredViolations.length === 0 && (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <CheckCircle size={48} style={{ opacity: 0.2, margin: '0 auto 1rem', color: 'var(--success)' }} />
            No violations matching the criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminViolations;
