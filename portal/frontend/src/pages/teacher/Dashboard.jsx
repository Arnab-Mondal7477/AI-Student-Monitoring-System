import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { ShieldAlert, BookOpen, Clock, PlayCircle } from 'lucide-react';

import { Link, useNavigate } from 'react-router-dom';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const { activeAlerts } = useSocket();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeClass, setActiveClass] = useState(null);

  useEffect(() => {
    // In a real implementation we would fetch the teacher's profile and active class
    // For now we mock it since we haven't built the full teacher API
    setProfile({
      name: user?.username || 'Teacher',
      designation: 'Assistant Professor',
      department: 'Computer Science & Engineering'
    });
    
    setActiveClass({
      section: 'Section A',
      subject: 'Operating Systems (CS301)',
      room: 'Room 304',
      status: 'In Progress'
    });

    setLoading(false);
  }, [user]);

  if (loading) return <div className="loader-container"><div className="loader"></div></div>;

  return (
    <div className="animate-fade-in">
      <header className="header">
        <div>
          <h1>Live Monitoring Dashboard</h1>
          <p>Welcome back, {profile?.name} • {profile?.designation}</p>
        </div>
        {activeClass && (
          <div className="badge badge-success" style={{ padding: '0.75rem 1.25rem', fontSize: '0.9rem' }}>
            <span style={{width: 10, height: 10, borderRadius: '50%', background: 'currentColor', display: 'inline-block', marginRight: 8, animation: 'pulse 2s infinite'}}></span>
            ACTIVE CLASS: {activeClass.section} - {activeClass.subject}
          </div>
        )}
      </header>

      <div className="stats-grid">
        <Link to="/teacher/violations" style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="stat-card glass-panel hover-lift">
            <h3 className="stat-title">Real-time Alerts</h3>
            <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="sidebar-icon-wrap" style={{ background: 'linear-gradient(135deg, var(--danger), #F87171)' }}><ShieldAlert size={32} color="white" /></div> {activeAlerts.length}
            </div>
          </div>
        </Link>
        <div className="stat-card glass-panel">
          <h3 className="stat-title">Current Location</h3>
          <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.75rem' }}>
            <div className="sidebar-icon-wrap" style={{ background: 'linear-gradient(135deg, var(--primary), #818CF8)' }}><BookOpen size={32} color="white" /></div> {activeClass?.room || 'N/A'}
          </div>
        </div>
      </div>

      <div className="table-container glass-panel" style={{ marginTop: '2.5rem' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PlayCircle size={20} color="var(--danger)" /> Live Feed: AI Detections
          </h2>
        </div>
        
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Time</th>
              <th>Student ID</th>
              <th>Confidence</th>
              <th>Evidence</th>
              <th>Evidentiary Status</th>
            </tr>
          </thead>
          <tbody>
            {activeAlerts.map((alert, idx) => (
              <tr 
                key={idx} 
                style={{ background: 'rgba(254, 226, 226, 0.5)', cursor: 'pointer', transition: 'background 0.2s ease' }}
                onClick={() => navigate('/teacher/violations')}
                className="hover-lift-subtle"
              >
                <td style={{ fontWeight: 600, color: 'var(--danger)' }}>
                  <Clock size={14} style={{ marginRight: 4, verticalAlign: 'middle' }}/> 
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </td>
                <td style={{ fontWeight: 'bold' }}>{alert.student_id}</td>
                <td>
                  <div style={{ width: '100%', background: '#e5e7eb', borderRadius: 999, height: 8 }}>
                    <div style={{ background: 'var(--danger)', height: 8, borderRadius: 999, width: `${(alert.confidence || 0) * 100}%` }}></div>
                  </div>
                  <span style={{ fontSize: '0.75rem', marginTop: 4, display: 'block' }}>
                    {((alert.confidence || 0) * 100).toFixed(1)}% Confident
                  </span>
                </td>
                <td>
                  {alert.evidence_path ? (
                    <a 
                      href={`http://localhost:5000/evidence/${alert.evidence_path}`} 
                      target="_blank" 
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <img 
                        src={`http://localhost:5000/evidence/${alert.evidence_path}`} 
                        alt="Evidence" 
                        style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                      />
                    </a>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No image</span>
                  )}
                </td>
                <td><span className="badge badge-danger">Needs Review</span></td>
              </tr>
            ))}
            {activeAlerts.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <ShieldAlert size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
                  Monitoring active. No violations detected in the current class.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeacherDashboard;
