import React from 'react';
import { FileText, Download, TrendingUp, Users, AlertTriangle } from 'lucide-react';

const AdminReports = () => {
  return (
    <div>
      <header className="header">
        <div>
          <h1>Analytics & Reports</h1>
          <p>Generate institutional reports and export data</p>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ background: 'var(--primary)', padding: '0.75rem', borderRadius: '0.5rem', color: 'white' }}>
              <TrendingUp size={24} />
            </div>
            <button className="btn" style={{ background: '#f1f5f9', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}>
              Download PDF
            </button>
          </div>
          <div>
            <h3 className="stat-title" style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>Academic Performance</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Comprehensive semester-end report for all sections.
            </p>
          </div>
        </div>

        <div className="stat-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ background: 'var(--success)', padding: '0.75rem', borderRadius: '0.5rem', color: 'white' }}>
              <Users size={24} />
            </div>
            <button className="btn" style={{ background: '#f1f5f9', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}>
              Export CSV
            </button>
          </div>
          <div>
            <h3 className="stat-title" style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>Attendance Register</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Monthly aggregated attendance for all students.
            </p>
          </div>
        </div>

        <div className="stat-card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ background: 'var(--danger)', padding: '0.75rem', borderRadius: '0.5rem', color: 'white' }}>
              <AlertTriangle size={24} />
            </div>
            <button className="btn" style={{ background: '#f1f5f9', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '0.8rem', padding: '0.25rem 0.75rem' }}>
              Download PDF
            </button>
          </div>
          <div>
            <h3 className="stat-title" style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>Disciplinary Logs</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              AI monitoring incident reports and resolutions.
            </p>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ marginTop: '2.5rem', padding: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={20} color="var(--primary)" />
          Custom Report Generator
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <label className="form-label">Report Type</label>
            <select className="form-select">
              <option>Student Performance</option>
              <option>Teacher Allocation</option>
              <option>Classroom Utilization</option>
              <option>Monitoring Efficacy</option>
            </select>
          </div>
          <div>
            <label className="form-label">Date Range (Start)</label>
            <input type="date" className="form-input" />
          </div>
          <div>
            <label className="form-label">Date Range (End)</label>
            <input type="date" className="form-input" />
          </div>
        </div>

        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Download size={18} /> Generate Custom Report
        </button>
      </div>
    </div>
  );
};

export default AdminReports;
