import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Layers, Building } from 'lucide-react';

import axios from 'axios';

const TeacherClasses = () => {
  const [routine, setRoutine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/teacher/classes', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRoutine(response.data);
      } catch (err) {
        console.error('Error fetching classes:', err);
        setError('Failed to load schedule');
      } finally {
        setLoading(false);
      }
    };
    
    fetchClasses();
  }, []);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (loading) return <div className="loader-container"><div className="loader"></div></div>;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <div className="header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '2rem', background: 'linear-gradient(135deg, var(--text-main), var(--primary))', WebkitBackgroundClip: 'text', color: 'transparent' }}>
          <Calendar color="var(--primary)" size={36} /> Weekly Routine
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '0.5rem' }}>View your scheduled classes and assigned locations</p>
      </div>

      <div style={{ display: 'grid', gap: '2rem' }}>
        {daysOfWeek.map(day => {
          const classesForDay = routine.filter(r => r.day_of_week === day).sort((a, b) => a.start_time.localeCompare(b.start_time));
          
          if (classesForDay.length === 0) return null; // Don't show days without classes

          return (
            <div key={day} className="glass-panel" style={{ padding: '1.5rem', borderRadius: '1rem' }}>
              <h2 style={{ fontSize: '1.4rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: 'var(--text-main)' }}>
                {day}
              </h2>
              <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                {classesForDay.map(cls => (
                  <div key={cls.id} className="hover-lift-sm" style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '0.75rem', borderLeft: cls.type === 'LAB' ? '4px solid var(--warning)' : '4px solid var(--primary)', transition: 'transform 0.2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 600 }}>{cls.subject}</h3>
                      <span className={`badge ${cls.type === 'LAB' ? 'badge-warning' : 'badge-primary'}`} style={{ fontSize: '0.75rem' }}>{cls.type}</span>
                    </div>
                    
                    <p style={{ color: 'var(--text-muted)', fontWeight: 500, marginBottom: '1rem' }}>Section: {cls.section}</p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={16} color="var(--text-muted)" />
                        <span>{cls.start_time} - {cls.end_time}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Building size={16} color="var(--text-muted)" />
                        <span>{cls.building}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Layers size={16} color="var(--text-muted)" />
                        <span>{cls.floor}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MapPin size={16} color="var(--text-muted)" />
                        <span style={{ fontWeight: 600 }}>Room {cls.room_number}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TeacherClasses;
