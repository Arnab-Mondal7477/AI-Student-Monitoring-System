import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { AlertTriangle, Clock, ShieldAlert, CheckCircle, Search, ShieldX } from 'lucide-react';

const TeacherViolations = () => {
  const [violations, setViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
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
      const response = await axios.get('http://localhost:5000/api/teacher/violations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setViolations(response.data);
    } catch (error) {
      console.error('Error fetching violations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/teacher/violations/${id}/acknowledge`, 
        { status }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchViolations();
    } catch (error) {
      console.error('Error acknowledging violation:', error);
      alert('Failed to update violation status');
    }
  };

  const filteredViolations = violations.filter(v => filter === 'ALL' ? true : v.status === filter);
  const registeredViolations = filteredViolations.filter(v => v.student_id !== null);
  const unknownViolations = filteredViolations.filter(v => v.student_id === null);

  if (loading) return <div className="loader-container"><div className="loader"></div></div>;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '2rem', background: 'linear-gradient(135deg, var(--text-main), var(--primary))', WebkitBackgroundClip: 'text', color: 'transparent' }}>
            <ShieldAlert color="var(--primary)" size={36} /> Evidence & Violations
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '0.5rem' }}>Review and take action on AI-detected disciplinary incidents</p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.5)', padding: '0.5rem', borderRadius: '1rem', backdropFilter: 'blur(10px)' }}>
          {['ALL', 'NEW', 'ACKNOWLEDGED', 'DISMISSED'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '0.5rem 1rem', border: 'none', borderRadius: '0.5rem', cursor: 'pointer',
                fontWeight: 600, transition: 'all 0.3s ease',
                background: filter === f ? 'var(--primary)' : 'transparent',
                color: filter === f ? 'white' : 'var(--text-muted)'
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
  
      {filteredViolations.length === 0 ? (
        <div className="glass-panel" style={{ padding: '5rem', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', borderRadius: '1.5rem', border: '1px dashed #cbd5e1' }}>
          <CheckCircle size={64} style={{ opacity: 0.3, marginBottom: '1rem', color: 'var(--success)' }} />
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)' }}>All Clear!</h2>
          <p style={{ marginTop: '0.5rem' }}>No historical violations assigned to you in this category.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {registeredViolations.length > 0 && (
            <div>
              <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '1.5rem', borderBottom: '2px solid var(--primary)', paddingBottom: '0.5rem', display: 'inline-block' }}>Registered Students</h2>
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {registeredViolations.map(v => (
                  <ViolationCard key={v.id} v={v} handleAcknowledge={handleAcknowledge} />
                ))}
              </div>
            </div>
          )}

          {unknownViolations.length > 0 && (
            <div>
              <h2 style={{ fontSize: '1.5rem', color: 'var(--danger)', marginBottom: '1.5rem', borderBottom: '2px solid var(--danger)', paddingBottom: '0.5rem', display: 'inline-block' }}>Unknown Candidates / Intruders</h2>
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                {unknownViolations.map(v => (
                  <ViolationCard key={v.id} v={v} handleAcknowledge={handleAcknowledge} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Extracted Component for cleaner code
const ViolationCard = ({ v, handleAcknowledge }) => (
  <div className="glass-panel hover-lift" style={{ padding: '1.5rem', display: 'flex', gap: '2rem', borderRadius: '1rem', borderLeft: (v.status === 'PENDING' || v.status === 'NEW') ? '4px solid var(--danger)' : v.status === 'ACKNOWLEDGED' ? '4px solid var(--success)' : '4px solid var(--text-muted)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}>
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ padding: '0.5rem', background: (v.status === 'PENDING' || v.status === 'NEW') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(100, 116, 139, 0.1)', borderRadius: '0.5rem' }}>
          {(v.status === 'PENDING' || v.status === 'NEW') ? <AlertTriangle color="var(--danger)" size={24} /> : <ShieldX color="var(--text-muted)" size={24} />}
        </div>
        <h3 style={{ fontSize: '1.4rem', textTransform: 'capitalize', margin: 0, fontWeight: 700 }}>
          {v.detection_type ? v.detection_type.replace('_', ' ') : 'Unknown Violation'}
        </h3>
        <span className={`badge ${
          (v.status === 'PENDING' || v.status === 'NEW') ? 'badge-danger' : 
          v.status === 'ACKNOWLEDGED' ? 'badge-success' : 'badge-warning'
        }`} style={{ marginLeft: 'auto', padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
          {v.status}
        </span>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student</p>
          <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>
            {v.student ? (
              <>{v.student.name} <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.9rem' }}>({v.student.student_id})</span></>
            ) : (
              <span style={{ color: 'var(--danger)' }}>Unknown Person</span>
            )}
          </p>
        </div>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Confidence</p>
          <p style={{ fontWeight: 600, fontSize: '1.1rem', color: v.confidence > 0.85 ? 'var(--success)' : 'var(--warning)' }}>{(v.confidence * 100).toFixed(1)}%</p>
        </div>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Clock size={16} /> Incident recorded at: <strong>{new Date(v.timestamp).toLocaleString()}</strong>
      </p>

      {(v.status === 'PENDING' || v.status === 'NEW') && (
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => handleAcknowledge(v.id, 'ACKNOWLEDGED')}
            className="btn btn-primary"
            style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.3)' }}
          >
            <CheckCircle size={18} /> Confirm Violation
          </button>
          <button 
            onClick={() => handleAcknowledge(v.id, 'DISMISSED')}
            className="btn"
            style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <ShieldX size={18} /> Dismiss (False Positive)
          </button>
        </div>
      )}
    </div>
    
    {v.evidence_path ? (
      <div style={{ width: '320px', height: '220px', background: '#0f172a', borderRadius: '1rem', overflow: 'hidden', position: 'relative', boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)' }}>
        <a href={`http://localhost:5000/evidence/${v.evidence_path}`} target="_blank" rel="noreferrer" style={{ display: 'block', width: '100%', height: '100%' }}>
          <img 
            src={`http://localhost:5000/evidence/${v.evidence_path}`} 
            alt="AI Evidence Capture" 
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9, transition: 'opacity 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.opacity = 1}
            onMouseOut={(e) => e.currentTarget.style.opacity = 0.9}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/320x220/1e293b/64748b?text=Evidence+Not+Found';
            }}
          />
          <div style={{ position: 'absolute', bottom: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Search size={12} /> View Full
          </div>
        </a>
      </div>
    ) : (
      <div style={{ width: '320px', height: '220px', background: '#f1f5f9', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', border: '1px dashed #cbd5e1' }}>
        No evidence provided
      </div>
    )}
  </div>
);

export default TeacherViolations;

