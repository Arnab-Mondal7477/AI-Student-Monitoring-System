import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Book, Award, Clock } from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for student dashboard
    setData({
      profile: {
        name: user?.username || 'Student',
        semester: 6,
        course: 'B.Tech CSE',
        cgpa: 8.4
      },
      stats: {
        overallAttendance: 85,
        attendedClasses: 170,
        totalClasses: 200
      },
      subjectWiseAttendance: {
        'Operating Systems': { total: 40, attended: 35 },
        'Computer Networks': { total: 40, attended: 32 },
        'Database Systems': { total: 40, attended: 38 },
        'Software Engineering': { total: 40, attended: 36 },
        'AI & Machine Learning': { total: 40, attended: 29 },
      }
    });
    setLoading(false);
  }, [user]);

  if (loading) return <div className="loader-container"><div className="loader"></div></div>;

  const { profile, stats, subjectWiseAttendance } = data;

  return (
    <div>
      <header className="header">
        <div>
          <h1>Student Portal</h1>
          <p>Welcome back, {profile?.name}</p>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <h3 className="stat-title">Overall Attendance</h3>
          <div className="stat-value" style={{ color: stats.overallAttendance >= 75 ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={28} /> {stats.overallAttendance}%
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Attended {stats.attendedClasses} out of {stats.totalClasses} classes
          </div>
        </div>
        <div className="stat-card glass-panel">
          <h3 className="stat-title">Current CGPA</h3>
          <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={28} color="var(--primary)" /> {profile?.cgpa.toFixed(2)}
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {profile?.course}
          </div>
        </div>
        <div className="stat-card glass-panel">
          <h3 className="stat-title">Current Semester</h3>
          <div className="stat-value" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Book size={28} color="var(--secondary)" /> Sem {profile?.semester}
          </div>
          <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            In Progress
          </div>
        </div>
      </div>

      <div className="table-container glass-panel" style={{ marginTop: '2.5rem' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem' }}>Subject-wise Attendance</h2>
        </div>
        
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Subject Name</th>
              <th>Total Classes</th>
              <th>Attended</th>
              <th>Percentage</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(subjectWiseAttendance || {}).map((subject) => {
              const subStats = subjectWiseAttendance[subject];
              const percentage = ((subStats.attended / subStats.total) * 100).toFixed(1);
              return (
                <tr key={subject}>
                  <td style={{ fontWeight: '500' }}>{subject}</td>
                  <td>{subStats.total}</td>
                  <td>{subStats.attended}</td>
                  <td>
                    <div style={{ width: '100%', maxWidth: '200px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ flex: 1, background: '#e5e7eb', borderRadius: 999, height: 6 }}>
                        <div style={{ background: percentage >= 75 ? 'var(--success)' : 'var(--danger)', height: 6, borderRadius: 999, width: `${percentage}%` }}></div>
                      </div>
                      <span style={{ fontSize: '0.85rem' }}>{percentage}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${percentage >= 75 ? 'badge-success' : 'badge-danger'}`}>
                      {percentage >= 75 ? 'Optimal' : 'Needs Attention'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentDashboard;
