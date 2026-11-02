import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, BookOpen, AlertTriangle, Building2, Server } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    sections: 0,
    activeClasses: 0,
    activeViolations: 0
  });

  useEffect(() => {
    // Mock fetching stats for now since we haven't built the admin backend endpoints yet
    setStats({
      students: 50,
      teachers: 5,
      sections: 2,
      activeClasses: 1,
      activeViolations: 3
    });
  }, []);

  return (
    <div className="animate-fade-in">
      <div className="header">
        <div>
          <h1>Command Center</h1>
          <p>Real-time overview of AI Smart CSE Academy</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-title">Total Students</div>
          <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="sidebar-icon-wrap"><Users size={32} color="white" /></div> {stats.students}
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-title">Teachers</div>
          <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="sidebar-icon-wrap" style={{ background: 'linear-gradient(135deg, var(--secondary), #D946EF)' }}><BookOpen size={32} color="white" /></div> {stats.teachers}
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-title">Active Classes</div>
          <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="sidebar-icon-wrap" style={{ background: 'linear-gradient(135deg, var(--success), #34D399)' }}><Server size={32} color="white" /></div> {stats.activeClasses}
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-title">Unresolved AI Violations</div>
          <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="sidebar-icon-wrap" style={{ background: 'linear-gradient(135deg, var(--danger), #F87171)' }}><AlertTriangle size={32} color="white" /></div> {stats.activeViolations}
          </div>
        </div>
      </div>

      <div className="table-container glass-panel" style={{ marginTop: '2rem' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Live AI Detections</h2>
          <span className="badge badge-success"><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor', display: 'inline-block', marginRight: 4, animation: 'pulse 2s infinite' }}></span>SYSTEM ACTIVE</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Student</th>
              <th>Location</th>
              <th>Incident Type</th>
              <th>Confidence</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                Monitoring active. No recent violations detected.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
