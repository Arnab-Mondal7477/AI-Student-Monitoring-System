import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Mail, Phone, Book, Briefcase, Award } from 'lucide-react';

const TeacherProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/teacher/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(response.data.profile);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) return <div className="loader-container"><div className="loader"></div></div>;

  if (!profile) return <div style={{ padding: '2rem' }}>Failed to load profile.</div>;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem' }}>
      <div className="header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '2rem', background: 'linear-gradient(135deg, var(--text-main), var(--primary))', WebkitBackgroundClip: 'text', color: 'transparent' }}>
          <User color="var(--primary)" size={36} /> My Profile
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '0.5rem' }}>View and manage your personal details</p>
      </div>

      <div className="glass-panel" style={{ padding: '2rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 'bold', overflow: 'hidden' }}>
            {profile.profile_photo ? (
              <img src={`http://localhost:5000${profile.profile_photo}`} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              profile.name ? profile.name.charAt(0) : 'T'
            )}
          </div>
          <div>
            <h2 style={{ fontSize: '1.8rem', margin: 0 }}>{profile.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '0.5rem' }}>{profile.designation}</p>
            <span className="badge badge-primary" style={{ marginTop: '0.5rem', display: 'inline-block' }}>{profile.teacher_id || 'T-XXX'}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '0.75rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.5rem', color: 'var(--primary)' }}>
              <Mail size={24} />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Email</p>
              <p style={{ fontWeight: 600, fontSize: '1.1rem', wordBreak: 'break-all' }}>{profile.email}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '0.75rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '0.5rem', color: 'var(--success)' }}>
              <Phone size={24} />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Phone</p>
              <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{profile.phone_number || 'N/A'}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '0.75rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '0.5rem', color: 'var(--warning)' }}>
              <Briefcase size={24} />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Department</p>
              <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{profile.department}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '0.75rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '0.5rem', color: '#8b5cf6' }}>
              <Award size={24} />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Experience</p>
              <p style={{ fontWeight: 600, fontSize: '1.1rem' }}>{profile.experience} years</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherProfile;
