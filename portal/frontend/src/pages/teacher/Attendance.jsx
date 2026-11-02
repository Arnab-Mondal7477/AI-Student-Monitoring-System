import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CalendarCheck, Search, Users, CheckCircle, XCircle } from 'lucide-react';

const TeacherAttendance = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/teacher/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (studentId, status) => {
    try {
      const token = localStorage.getItem('token');
      // Assume subject_id is 1 for now, in a real app this would be selected
      await axios.post('http://localhost:5000/api/teacher/attendance', 
        { student_id: studentId, subject_id: 1, date, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Show temporary success feedback or refetch
      alert(`Marked ${status} successfully`);
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Failed to mark attendance. You might not be authorized for this subject.');
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.roll_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="loader-container"><div className="loader"></div></div>;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '2rem', background: 'linear-gradient(135deg, var(--text-main), var(--primary))', WebkitBackgroundClip: 'text', color: 'transparent' }}>
            <CalendarCheck color="var(--primary)" size={36} /> Attendance Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '0.5rem' }}>Track and manage student attendance</p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search students by name or roll number..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', outline: 'none' }}
          />
        </div>
        <div style={{ minWidth: '200px' }}>
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', outline: 'none' }}
          />
        </div>
      </div>

      <div className="glass-panel" style={{ borderRadius: '1rem', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border-color)' }}>
              <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Student Name</th>
              <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Roll Number</th>
              <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Overall Attendance</th>
              <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'center' }}>Mark Today's Attendance</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} className="hover-lift-sm">
                <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}>
                      {student.name.charAt(0)}
                    </div>
                    {student.name}
                  </div>
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>{student.roll_number || student.id}</td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <span className={`badge ${parseFloat(student.overallAttendance) > 75 ? 'badge-success' : 'badge-danger'}`}>
                    {student.overallAttendance}%
                  </span>
                </td>
                <td style={{ padding: '1rem 1.5rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                  <button 
                    onClick={() => markAttendance(student.id, 'PRESENT')}
                    className="btn btn-success" 
                    style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}
                  >
                    <CheckCircle size={16} /> Present
                  </button>
                  <button 
                    onClick={() => markAttendance(student.id, 'ABSENT')}
                    className="btn btn-danger" 
                    style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}
                  >
                    <XCircle size={16} /> Absent
                  </button>
                </td>
              </tr>
            ))}
            {filteredStudents.length === 0 && (
              <tr>
                <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Users size={48} style={{ opacity: 0.2, margin: '0 auto 1rem auto' }} />
                  <p>No students found for this department.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeacherAttendance;
