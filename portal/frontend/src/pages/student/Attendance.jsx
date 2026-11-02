import React, { useState } from 'react';
import { CalendarCheck, Search, Filter } from 'lucide-react';

const StudentAttendance = () => {
  const [showResults, setShowResults] = useState(false);

  // Mock data for the table after clicking "Show"
  const mockAttendanceData = [
    { id: 1, subject: 'Operating Systems', date: '2026-08-15', status: 'Present', type: 'Mid-Term Assessment' },
    { id: 2, subject: 'Computer Networks', date: '2026-08-16', status: 'Present', type: 'Mid-Term Assessment' },
    { id: 3, subject: 'Database Systems', date: '2026-08-17', status: 'Absent', type: 'Mid-Term Assessment' },
    { id: 4, subject: 'Software Engineering', date: '2026-08-18', status: 'Present', type: 'Mid-Term Assessment' },
  ];

  const handleShow = (e) => {
    e.preventDefault();
    setShowResults(true);
  };

  return (
    <div>
      <header className="header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1>Online Assessment Attendance</h1>
          <p>Filter and view your attendance records for various assessments</p>
        </div>
      </header>

      {/* Filter Panel */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div className="sidebar-icon-wrap" style={{ padding: '0.4rem' }}>
            <Filter size={20} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Filter Details</h2>
        </div>

        <form onSubmit={handleShow}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            
            {/* Radio Buttons for Session */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Even or June / Odd or December *</label>
              <div style={{ display: 'flex', gap: '2rem', padding: '0.875rem 0', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.95rem' }}>
                  <input type="radio" name="session" value="Even" required style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
                  Even or June
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.95rem' }}>
                  <input type="radio" name="session" value="Odd" required style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }} />
                  Odd or December
                </label>
              </div>
            </div>

            {/* Semester Dropdown */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Semester *</label>
              <select className="form-select" required defaultValue="">
                <option value="" disabled>Select Semester</option>
                <option value="1">Semester I</option>
                <option value="2">Semester II</option>
                <option value="3">Semester III</option>
                <option value="4">Semester IV</option>
                <option value="5">Semester V</option>
                <option value="6">Semester VI</option>
                <option value="7">Semester VII</option>
                <option value="8">Semester VIII</option>
              </select>
            </div>

            {/* Assessment Year Dropdown */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Assessment Year *</label>
              <select className="form-select" required defaultValue="">
                <option value="" disabled>Select Year</option>
                <option value="2029-2030">2029-2030</option>
                <option value="2028-2029">2028-2029</option>
                <option value="2027-2028">2027-2028</option>
                <option value="2026-2027">2026-2027</option>
              </select>
            </div>

            {/* Assessment Type Dropdown */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Assessment Type *</label>
              <select className="form-select" required defaultValue="">
                <option value="" disabled>Select Type</option>
                <option value="Mid-Term">Mid-Term Assessment</option>
                <option value="End-Term">End-Term Assessment</option>
                <option value="Practical">Practical Assessment</option>
              </select>
            </div>

          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 3rem' }}>
              <Search size={18} /> Show
            </button>
          </div>
        </form>
      </div>

      {/* Results Table */}
      {showResults && (
        <div className="table-container glass-panel animate-fade-in" style={{ animation: 'fadeIn 0.4s ease-in-out' }}>
          <div className="table-header">
            <h2>Attendance Records</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Subject</th>
                <th>Assessment Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {mockAttendanceData.map((record) => (
                <tr key={record.id}>
                  <td style={{ fontWeight: '500', color: 'var(--text-muted)' }}>{record.date}</td>
                  <td style={{ fontWeight: '600' }}>{record.subject}</td>
                  <td>{record.type}</td>
                  <td>
                    <span className={`badge ${record.status === 'Present' ? 'badge-success' : 'badge-danger'}`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {mockAttendanceData.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No records found for the selected criteria.
            </div>
          )}
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default StudentAttendance;
