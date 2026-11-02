import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Plus, Trash2, Search, UploadCloud, X, Save, Edit, ChevronLeft, CheckCircle, Award, Navigation, Shield, Users, User, MapPin, GraduationCap, Eye } from 'lucide-react';

const PremiumSection = ({ title, icon: Icon, children }) => (
  <div style={{
    background: '#ffffff',
    borderRadius: '24px',
    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.02)',
    marginBottom: '3rem',
    overflow: 'hidden',
    position: 'relative'
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '1.25rem',
      padding: '2.5rem 3rem',
      borderBottom: '1px solid #f1f5f9',
      background: 'linear-gradient(to right, #ffffff, #f8fafc)'
    }}>
      {Icon && (
        <div style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          padding: '0.75rem',
          borderRadius: '14px',
          color: 'white',
          boxShadow: '0 8px 16px rgba(99, 102, 241, 0.25)'
        }}>
          <Icon size={24} strokeWidth={2} />
        </div>
      )}
      <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>{title}</h2>
    </div>
    <div style={{ padding: '3rem' }}>
      {children}
    </div>
  </div>
);

const FormGroup = ({ label, value, type = 'text', onChange, disabled = false, options = [], required = false, as = 'input' }) => (
  <div style={{ marginBottom: '2rem' }}>
    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
      {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
    </label>
    {as === 'textarea' ? (
      <textarea
        style={{ width: '100%', padding: '1rem 1.25rem', borderRadius: '12px', fontSize: '1rem', color: '#0f172a', fontWeight: '600', border: '1px solid #e2e8f0', background: disabled ? 'rgba(248, 250, 252, 0.5)' : '#f8fafc', minHeight: '80px', resize: 'vertical', outline: 'none', transition: 'all 0.2s', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)', cursor: disabled ? 'not-allowed' : 'text' }}
        value={value || ''} onChange={e => onChange(e.target.value)} disabled={disabled} required={required}
        onFocus={e => { if (!disabled) { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'; e.target.style.background = '#ffffff'; } }}
        onBlur={e => { if (!disabled) { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.background = '#f8fafc'; } }}
      />
    ) : type === 'select' ? (
      <select
        style={{ width: '100%', padding: '0.85rem 1.25rem', borderRadius: '12px', fontSize: '1rem', color: '#0f172a', fontWeight: '600', border: '1px solid #e2e8f0', background: disabled ? 'rgba(248, 250, 252, 0.5)' : '#f8fafc', outline: 'none', transition: 'all 0.2s', cursor: disabled ? 'not-allowed' : 'pointer', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
        value={value || ''} onChange={e => onChange(e.target.value)} disabled={disabled} required={required}
        onFocus={e => { if (!disabled) { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'; e.target.style.background = '#ffffff'; } }}
        onBlur={e => { if (!disabled) { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.background = '#f8fafc'; } }}
      >
        <option value="" disabled style={{ color: '#94a3b8' }}>Select...</option>
        {options.map((opt, i) => (
          <option key={i} value={typeof opt === 'object' ? opt.value : opt}>{typeof opt === 'object' ? opt.label : opt}</option>
        ))}
      </select>
    ) : (
      <input
        type={type}
        style={{ width: '100%', padding: '0.85rem 1.25rem', borderRadius: '12px', fontSize: '1rem', color: '#0f172a', fontWeight: '600', border: '1px solid #e2e8f0', background: disabled ? 'rgba(248, 250, 252, 0.5)' : '#f8fafc', outline: 'none', transition: 'all 0.2s', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)', cursor: disabled ? 'not-allowed' : 'text' }}
        value={value || ''} onChange={e => onChange(e.target.value)} disabled={disabled} required={required}
        onFocus={e => { if (!disabled) { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'; e.target.style.background = '#ffffff'; } }}
        onBlur={e => { if (!disabled) { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.02)'; e.target.style.background = '#f8fafc'; } }}
      />
    )}
  </div>
);

const ReadOnlyField = ({ label, value }) => (
  <div style={{ marginBottom: '2rem' }}>
    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
      {label}
    </label>
    <div style={{ padding: '1rem 1.25rem', borderRadius: '12px', fontSize: '1.1rem', color: '#0f172a', fontWeight: '600', background: 'rgba(248, 250, 252, 0.8)', border: '1px solid #e2e8f0', minHeight: '3.5rem', display: 'flex', alignItems: 'center', whiteSpace: 'pre-wrap' }}>
      {value || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Not provided</span>}
    </div>
  </div>
);

const RadioGroup = ({ label, name, value, options, onChange, required, disabled }) => (
  <div style={{ marginBottom: '2rem' }}>
    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
      {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
    </label>
    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
      {options.map((opt, idx) => {
        const isSelected = value === opt.value;
        return (
          <label key={idx} style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.75rem 1.5rem',
            borderRadius: '99px',
            background: isSelected ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' : '#ffffff',
            color: isSelected ? 'white' : '#475569',
            fontWeight: 700,
            border: isSelected ? '1px solid transparent' : '1px solid #e2e8f0',
            boxShadow: isSelected ? '0 4px 10px rgba(99, 102, 241, 0.25)' : 'inset 0 2px 4px rgba(0,0,0,0.02)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled && !isSelected ? 0.5 : 1,
            transition: 'all 0.2s'
          }}>
            <input type="radio" name={name} value={opt.value} checked={isSelected} onChange={() => onChange(opt.value)} disabled={disabled} style={{ display: 'none' }} />
            {opt.label}
          </label>
        );
      })}
    </div>
  </div>
);

const CheckboxGroup = ({ label, options, values = [], onChange, disabled }) => (
  <div style={{ marginBottom: '2rem' }}>
    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
      {label}
    </label>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
      {options.map((opt, idx) => {
        const isChecked = values.includes(opt);
        return (
          <label key={idx} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.6rem 1.25rem',
            borderRadius: '99px',
            background: isChecked ? '#e0e7ff' : '#ffffff',
            color: isChecked ? '#4338ca' : '#64748b',
            fontWeight: 700,
            border: isChecked ? '1px solid #c7d2fe' : '1px solid #e2e8f0',
            boxShadow: isChecked ? '0 2px 4px rgba(67, 56, 202, 0.05)' : 'inset 0 2px 4px rgba(0,0,0,0.02)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled && !isChecked ? 0.5 : 1,
            transition: 'all 0.2s'
          }}>
            <input
            />
            {opt}
          </label>
        );
      })}
    </div>
  </div>
);

const ChipGroup = ({ label, values = [] }) => (
  <div style={{ marginBottom: '2rem' }}>
    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
      {label}
    </label>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
      {values.length > 0 ? values.map((val, idx) => (
        <span key={idx} style={{ padding: '0.5rem 1.25rem', background: '#e0e7ff', color: '#4338ca', borderRadius: '99px', fontSize: '0.9rem', fontWeight: 700, border: '1px solid #c7d2fe', boxShadow: '0 2px 4px rgba(67, 56, 202, 0.05)' }}>
          {val}
        </span>
      )) : <span style={{ padding: '0.5rem 1.25rem', background: '#f8fafc', color: '#94a3b8', borderRadius: '99px', fontSize: '0.9rem', fontWeight: 600, border: '1px solid #e2e8f0' }}>Not provided</span>}
    </div>
  </div>
);

const AdminStudentManagement = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('list');
  const [viewStudent, setViewStudent] = useState(null);  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({ hobbies: [] });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const [studentsRes, sectionsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/students', { headers }),
        axios.get('http://localhost:5000/api/admin/sections', { headers })
      ]);
      setStudents(studentsRes.data);
      setSections(sectionsRes.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load data.');
      setLoading(false);
    }
  };

  const handleImageUpload = (angle) => (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          face_images: {
            ...(prev.face_images || {}),
            [angle]: reader.result
          }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (angle) => {
    setFormData(prev => {
      const updated = { ...prev.face_images };
      delete updated[angle];
      return { ...prev, face_images: updated };
    });
  };

  const openNewForm = () => {
    setIsEditing(false);
    setFormData({ student_id: '', name: '', section_id: '', face_images: {}, hobbies: [] });
    setError(null); setSuccess(null); setActiveTab('form');
  };

  const openViewDetails = (student) => {
    let extendedData = { hobbies: [] };
    try { extendedData = student.profile_data ? JSON.parse(student.profile_data) : { hobbies: [] }; } catch (e) { }
    if (!extendedData.hobbies) extendedData.hobbies = [];
    setViewStudent({ ...student, ...extendedData });
    setActiveTab('view');
  };

  const openEditForm = (student) => {
    setIsEditing(true);
    let extendedData = { hobbies: [] };
    try { extendedData = student.profile_data ? JSON.parse(student.profile_data) : { hobbies: [] }; } catch (e) { }
    if (!extendedData.hobbies) extendedData.hobbies = [];
    setFormData({ student_id: student.student_id, name: student.name, section_id: student.section_id, profile_photo: student.profile_photo, face_images: {}, ...extendedData });
    setError(null); setSuccess(null); setActiveTab('form');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null); setSuccess(null); setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const studentId = formData.student_id;
      const computedName = [formData.first_name, formData.middle_name, formData.surname].filter(Boolean).join(' ');
      
      const corePayload = { 
        student_id: formData.student_id, 
        name: computedName, 
        section_id: formData.section_id, 
        profile_photo_base64: formData.face_images?.front || formData.profile_photo_base64,
        face_images: formData.face_images
      };
      
      const { student_id: _sid, name: _n, profile_photo: _pp, face_images: _fi, ...putPayload } = formData;
      putPayload.name = computedName;
      if (formData.face_images && Object.keys(formData.face_images).length > 0) {
        putPayload.face_images = formData.face_images;
      }
      
      if (!isEditing) {
        await axios.post('http://localhost:5000/api/admin/students', corePayload, { headers: { Authorization: `Bearer ${token}` } });
      }
      await axios.put(`http://localhost:5000/api/admin/students/${studentId}/profile`, putPayload, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess(`Student ${studentId} successfully ${isEditing ? 'updated' : 'registered'}.`);
      await fetchData();
      setActiveTab('list');
      window.scrollTo(0, 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save student');
      window.scrollTo(0, 0);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (student_id) => {
    if (!window.confirm(`Delete ${student_id}?`)) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/students/${student_id}`, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess(`Student ${student_id} deleted.`);
      fetchData();
    } catch (err) { setError('Failed to delete student'); }
  };

  const updateField = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  if (loading) return <div className="loader-container"><div className="loader"></div></div>;

  const grid2Col = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 3rem' };
  const grid3Col = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 2.5rem' };
  const grid4Col = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 2rem' };

  const filteredStudents = students.filter(student => {
    const search = searchTerm.toLowerCase();
    return (student.name?.toLowerCase().includes(search)) ||
      (student.student_id?.toLowerCase().includes(search));
  });

  return (
    <div style={{
      minHeight: '100vh',
      padding: '4rem 2rem',
      color: 'var(--text-main)',
      fontFamily: "'Inter', -apple-system, sans-serif"
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Premium Glassmorphic Header for List */}
        {activeTab === 'list' && (
          <div style={{
            marginBottom: '4rem',
            borderRadius: '32px',
            background: 'var(--card-bg, rgba(255, 255, 255, 0.7))',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--card-border, rgba(255, 255, 255, 0.5))',
            padding: '4rem 5rem',
            boxShadow: 'var(--glass-shadow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Subtle glow effect */}
            <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, opacity: 0.1, backgroundImage: 'radial-gradient(circle at right center, var(--primary) 0%, transparent 50%)', pointerEvents: 'none' }}></div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, width: '100%' }}>
              <div>
                <h1 style={{ fontSize: '3.5rem', fontWeight: '800', margin: '0 0 0.5rem 0', fontFamily: "'Outfit', sans-serif", letterSpacing: '-0.03em', color: 'var(--text-main)' }}>
                  Student Management
                </h1>
                <p style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-muted)', fontWeight: 500 }}>Register and manage students comprehensively</p>
              </div>
              {activeTab === 'list' ? (
                <button onClick={openNewForm} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--primary)', color: 'white', padding: '1rem 2.5rem', borderRadius: '99px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '1.1rem', boxShadow: 'var(--shadow-md)', transition: 'all 0.2s' }}>
                  <Plus size={22} strokeWidth={2.5} /> Register New Student
                </button>
              ) : (
                <button onClick={() => setActiveTab('list')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'white', color: 'var(--text-main)', padding: '1rem 2.5rem', borderRadius: '99px', border: '1px solid var(--border-color)', cursor: 'pointer', fontWeight: 600, fontSize: '1.1rem', boxShadow: 'var(--shadow-sm)', transition: 'all 0.2s' }}>
                  <ChevronLeft size={22} strokeWidth={2.5} /> Back to List
                </button>
              )}
            </div>
          </div>
        )}

        {error && <div style={{ background: '#fef2f2', borderLeft: '4px solid #ef4444', color: '#991b1b', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem' }}>{error}</div>}
        {success && <div style={{ background: '#f0fdf4', borderLeft: '4px solid #22c55e', color: '#166534', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem' }}>{success}</div>}

        {activeTab === 'list' && (
          <div style={{ background: 'var(--card-bg, rgba(255, 255, 255, 0.7))', backdropFilter: 'blur(20px)', borderRadius: '24px', border: '1px solid var(--card-border)', boxShadow: 'var(--glass-shadow)', padding: '3.5rem', marginBottom: '2rem' }}>
            <div style={{ paddingBottom: '2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: '2rem', margin: 0, color: 'var(--text-main)', fontFamily: "'Outfit', sans-serif", fontWeight: 700, letterSpacing: '-0.02em' }}>Registered Students ({students.length})</h2>
              <div style={{ position: 'relative' }}>
                <Search size={20} style={{ position: 'absolute', left: 20, top: 14, color: 'var(--text-muted)' }} />
                <input type="text" placeholder="Search by name or ID..." style={{ padding: '0.85rem 1.25rem 0.85rem 3.5rem', width: '400px', border: '1px solid var(--border-color)', borderRadius: '99px', outline: 'none', background: 'rgba(255, 255, 255, 0.5)', fontSize: '1.05rem', fontWeight: 500, transition: 'all 0.2s' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onFocus={e => e.target.style.borderColor = 'var(--primary)'} onBlur={e => e.target.style.borderColor = 'var(--border-color)'} />
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '1.5rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem' }}>Student ID</th>
                  <th style={{ padding: '1.5rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem' }}>Name</th>
                  <th style={{ padding: '1.5rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem' }}>Section</th>
                  <th style={{ padding: '1.5rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem' }}>Face Registered</th>
                  <th style={{ padding: '1.5rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.student_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1.5rem', fontWeight: 700, color: '#475569' }}>{student.student_id}</td>
                    <td style={{ padding: '1.5rem', color: '#0f172a', fontWeight: '700', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {student.profile_photo ? (
                        <img src={`http://localhost:5000${student.profile_photo}`} alt="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0' }} />
                      ) : (
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontWeight: 'bold' }}>
                          {student.name ? student.name[0] : 'S'}
                        </div>
                      )}
                      {student.name}
                    </td>
                    <td style={{ padding: '1.5rem', fontWeight: 600, color: '#64748b' }}>{student.section?.name || 'N/A'}</td>
                    <td style={{ padding: '1.5rem' }}>
                      {student.face_registered ? <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '0.4rem 1.25rem', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 700, display: 'inline-block' }}>YES</span> : <span style={{ background: '#fef2f2', color: '#ef4444', padding: '0.4rem 1.25rem', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 700, display: 'inline-block' }}>NO</span>}
                    </td>
                    <td style={{ padding: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                      <button onClick={() => openViewDetails(student)} style={{ background: 'transparent', border: 'none', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem' }}>
                        <Eye size={18} /> View
                      </button>
                      <button onClick={() => openEditForm(student)} style={{ background: 'transparent', border: 'none', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem' }}>
                        <Edit size={18} /> Edit
                      </button>
                      <button onClick={() => handleDelete(student.student_id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem' }}>
                        <Trash2 size={18} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>No students found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'form' && (
          <form onSubmit={handleSave} style={{ maxWidth: '1400px', margin: '0 auto' }}>

            <div style={{ position: 'sticky', top: '2rem', zIndex: 10, display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
              <button type="button" onClick={() => setActiveTab('list')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.1rem 2rem', fontSize: '1.1rem', fontWeight: 700, background: 'white', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '99px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'all 0.2s' }}>
                <ChevronLeft size={20} strokeWidth={2.5} /> Back to List
              </button>
              <button type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.1rem 3rem', fontSize: '1.1rem', fontWeight: 700, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: 'white', border: 'none', borderRadius: '99px', boxShadow: '0 10px 25px rgba(99, 102, 241, 0.4)', cursor: 'pointer', transition: 'transform 0.2s' }}>
                <Save size={22} strokeWidth={2.5} /> {saving ? 'Saving...' : (isEditing ? 'Update Student Profile' : 'Register New Student')}
              </button>
            </div>

            {/* Editorial Luxury Header for Admin Form */}
            <div style={{
              marginBottom: '4rem',
              borderRadius: '32px',
              background: '#020617',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.15)'
            }}>
              {/* Animated/Complex Gradient Mesh Background */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.8 }}>
                <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '60%', height: '140%', background: 'radial-gradient(ellipse at center, rgba(79, 70, 229, 0.4) 0%, transparent 60%)', filter: 'blur(60px)' }}></div>
                <div style={{ position: 'absolute', bottom: '-30%', right: '-10%', width: '70%', height: '120%', background: 'radial-gradient(ellipse at center, rgba(147, 51, 234, 0.3) 0%, transparent 60%)', filter: 'blur(60px)' }}></div>
                <div style={{ position: 'absolute', top: '10%', right: '20%', width: '30%', height: '40%', background: 'radial-gradient(circle at center, rgba(14, 165, 233, 0.3) 0%, transparent 50%)', filter: 'blur(40px)' }}></div>
                {/* Subtle Grain Overlay for texture */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.04%22/%3E%3C/svg%3E")', mixBlendMode: 'overlay' }}></div>
              </div>

              <div style={{ position: 'relative', zIndex: 1, padding: '5rem', display: 'flex', gap: '4rem', alignItems: 'center' }}>
                {/* Left: Avatar with glowing rings */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  {/* Glow Behind */}
                  <div style={{ position: 'absolute', inset: '-20px', background: 'linear-gradient(135deg, #4f46e5, #9333ea)', borderRadius: '50%', opacity: 0.4, filter: 'blur(25px)' }}></div>
                  <div style={{
                    width: '180px',
                    height: '180px',
                    borderRadius: '50%',
                    padding: '6px',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.05) 100%)',
                    position: 'relative',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                    backdropFilter: 'blur(10px)',
                    cursor: 'pointer'
                  }}>
                    <input type="file" accept="image/*" id="profile-upload" style={{ display: 'none' }} onChange={handleImageUpload('front')} />
                    <label htmlFor="profile-upload" style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', group: 'avatar' }}>
                      {(formData.face_images && formData.face_images.front) || formData.profile_photo ? (
                        <img src={(formData.face_images && formData.face_images.front) || `http://localhost:5000${formData.profile_photo}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <User size={64} style={{ color: '#334155' }} />
                      )}
                      
                      {/* Hover Overlay */}
                      <div style={{
                        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s', ':hover': { opacity: 1 }
                      }}>
                        <UploadCloud size={32} color="white" style={{ marginBottom: '0.5rem' }} />
                        <span style={{ color: 'white', fontSize: '0.875rem', fontWeight: 600 }}>Change Photo</span>
                      </div>
                    </label>
                  </div>

                  {/* Floating Verified Badge */}
                  <div style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '-10px',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    padding: '12px',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CheckCircle size={22} color="#34d399" />
                  </div>
                </div>

                {/* Right: Info */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <span style={{ padding: '0.4rem 1.2rem', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700, color: '#e2e8f0', letterSpacing: '0.15em', textTransform: 'uppercase', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      Admin Portal
                    </span>
                    <span style={{ width: '40px', height: '1px', background: 'rgba(255,255,255,0.2)' }}></span>
                    <span style={{ color: '#94a3b8', fontSize: '0.85rem', letterSpacing: '0.05em', fontWeight: 500 }}>Access Level: Administrator</span>
                  </div>

                  <h1 style={{
                    fontSize: '4.5rem',
                    fontWeight: '800',
                    margin: '0 0 1.5rem 0',
                    fontFamily: "'Playfair Display', serif",
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                    background: 'linear-gradient(to right, #ffffff, #94a3b8)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.3))'
                  }}>
                    {formData.first_name ? `${formData.first_name} ${formData.middle_name ? formData.middle_name + ' ' : ''}${formData.surname}` : (formData.name || 'New Student')}
                  </h1>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '3rem', background: 'rgba(255,255,255,0.03)', padding: '1.5rem 2rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', width: 'fit-content' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#94a3b8', fontWeight: 700 }}>Student ID</span>
                      <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '1.25rem', fontFamily: "'Inter', sans-serif", letterSpacing: '0.02em' }}>
                        {formData.student_id || 'TBD'}
                      </span>
                    </div>
                    <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)' }}></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: '#94a3b8', fontWeight: 700 }}>Enrollment Status</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: isEditing ? '#34d399' : '#f59e0b', boxShadow: isEditing ? '0 0 12px #34d399' : '0 0 12px #f59e0b' }}></div>
                        <span style={{ color: isEditing ? '#34d399' : '#f59e0b', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.02em' }}>{isEditing ? 'Active' : 'Draft'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <PremiumSection title="Student Profile" icon={User}>
              <div style={{ marginBottom: '4rem', padding: '3rem', border: '1px solid #e2e8f0', borderRadius: '24px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                <h3 style={{ fontSize: '0.9rem', color: '#64748b', margin: '0', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Profile Photo (Face Registration)</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  <div style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: '1.6', fontWeight: 500 }}>
                    <p>Required for robust 3D-like attendance tracking. Please upload clear photos of the student's face from multiple angles.</p>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '2rem' }}>
                    {['front', 'left', 'right', 'up', 'down'].map((angle) => (
                      <div key={angle} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                        <h4 style={{ textTransform: 'capitalize', fontSize: '0.85rem', color: '#475569', fontWeight: 700, margin: 0 }}>{angle}</h4>
                        {!(formData.face_images && formData.face_images[angle]) ? (
                          <label htmlFor={`upload-${angle}`} style={{ width: '100%', aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #cbd5e1', borderRadius: '20px', cursor: 'pointer', color: '#64748b', background: '#ffffff', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                            <UploadCloud size={24} style={{ marginBottom: '0.5rem', color: '#94a3b8' }} />
                            <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>Upload</span>
                            <input type="file" accept="image/*" id={`upload-${angle}`} style={{ display: 'none' }} onChange={handleImageUpload(angle)} />
                          </label>
                        ) : (
                          <div style={{ position: 'relative', width: '100%', aspectRatio: '1' }}>
                            <img src={formData.face_images[angle]} alt={`${angle} Preview`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '20px', border: '3px solid #ffffff', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                            <button type="button" onClick={() => removeImage(angle)} style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.2)', fontSize: '1.2rem', lineHeight: 1 }}>
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={grid2Col}>
                <FormGroup label="Campus" value={formData.campus} onChange={v => updateField('campus', v)} />
                <FormGroup label="Student ID" value={formData.student_id} onChange={v => updateField('student_id', v)} disabled={isEditing} required />

                <FormGroup label="University Mail-ID" value={formData.email} onChange={v => updateField('email', v)} />
                <FormGroup label="Batch Name" value={formData.batch_name} onChange={v => updateField('batch_name', v)} />

                <FormGroup label="Section" value={formData.section_id} onChange={v => updateField('section_id', v)} type="select" options={sections.map(s => ({ value: s.id, label: s.name }))} required />
                <FormGroup label="First Name" value={formData.first_name} onChange={v => updateField('first_name', v)} required />
                <FormGroup label="Middle Name" value={formData.middle_name} onChange={v => updateField('middle_name', v)} />

                <FormGroup label="Surname" value={formData.surname} onChange={v => updateField('surname', v)} required />
                <FormGroup label="Landline" value={formData.landline} onChange={v => updateField('landline', v)} />

                <FormGroup label="Mobile 1" value={formData.mobile_1} onChange={v => updateField('mobile_1', v)} />
                <FormGroup label="Mobile 2" value={formData.mobile_2} onChange={v => updateField('mobile_2', v)} />

                <FormGroup label="Blood group" value={formData.blood_group} type="select" options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} onChange={v => updateField('blood_group', v)} required />
                <FormGroup label="Landline" value={formData.landline} onChange={v => updateField('landline', v)} />
                <FormGroup label="Date of birth" value={formData.dob} onChange={v => updateField('dob', v)} type="date" required />
                <FormGroup label="Place Of Birth" value={formData.place_of_birth} onChange={v => updateField('place_of_birth', v)} />

                <FormGroup label="Blood group" value={formData.blood_group} onChange={v => updateField('blood_group', v)} type="select" options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} />
                <FormGroup label="Height" value={formData.height} onChange={v => updateField('height', v)} />
                <FormGroup label="Weight" value={formData.weight} onChange={v => updateField('weight', v)} />

                <FormGroup label="Religion" value={formData.religion} onChange={v => updateField('religion', v)} type="select" options={['Hinduism', 'Islam', 'Christianity', 'Sikhism', 'Buddhism', 'Jainism', 'Other']} />
                <FormGroup label="Nationality" value={formData.nationality} onChange={v => updateField('nationality', v)} />
                <FormGroup label="Caste" value={formData.caste} onChange={v => updateField('caste', v)} type="select" options={['General', 'SC', 'ST', 'OBC']} />

                <FormGroup label="Student ABC ID" value={formData.abc_id} onChange={v => updateField('abc_id', v)} />
                <FormGroup label="Major Disease" value={formData.disease} onChange={v => updateField('disease', v)} />
                <FormGroup label="Career Goal" value={formData.career_goal} onChange={v => updateField('career_goal', v)} />
              </div>

              <div style={{ marginTop: '2rem', paddingTop: '3rem', borderTop: '1px solid #f1f5f9' }}>
                <FormGroup label="Why Choose This Course" value={formData.why_choose} onChange={v => updateField('why_choose', v)} as="textarea" />
                <CheckboxGroup
                  label="Hobbies & Interests"
                  options={['Acting', 'Cooking', 'Dance', 'Drama', 'Embroidery', 'Indoor Game', 'Movie', 'Music', 'Painting', 'Photography', 'Poem', 'Tubbing']}
                  values={formData.hobbies || []}
                  onChange={v => updateField('hobbies', v)}
                />
                <FormGroup label="Other Hobbies" value={formData.other_hobby} onChange={v => updateField('other_hobby', v)} />
              </div>
            </PremiumSection>

            <PremiumSection title="Present Address Details" icon={MapPin}>
              <FormGroup label="Present address" value={formData.present_address} onChange={v => updateField('present_address', v)} as="textarea" required />
              <div style={grid4Col}>
                <FormGroup label="City / Town" value={formData.present_city} onChange={v => updateField('present_city', v)} required />
                <FormGroup label="P.O" value={formData.present_po} onChange={v => updateField('present_po', v)} />
                <FormGroup label="P.S" value={formData.present_ps} onChange={v => updateField('present_ps', v)} />
                <FormGroup label="Area" value={formData.present_area} onChange={v => updateField('present_area', v)} />

                <FormGroup label="District" value={formData.present_district} onChange={v => updateField('present_district', v)} />
                <FormGroup label="State" value={formData.present_state} onChange={v => updateField('present_state', v)} required />
                <FormGroup label="Pin" value={formData.present_pin} onChange={v => updateField('present_pin', v)} required />
                <FormGroup label="Aadhar Card No." value={formData.present_aadhar} onChange={v => updateField('present_aadhar', v)} />
              </div>
            </PremiumSection>

            <PremiumSection title="Permanent Address Details" icon={Navigation}>
              <FormGroup label="Permanent address" value={formData.permanent_address} onChange={v => updateField('permanent_address', v)} as="textarea" required />
              <div style={grid4Col}>
                <FormGroup label="City / Town" value={formData.permanent_city} onChange={v => updateField('permanent_city', v)} required />
                <FormGroup label="P.O" value={formData.permanent_po} onChange={v => updateField('permanent_po', v)} />
                <FormGroup label="P.S" value={formData.permanent_ps} onChange={v => updateField('permanent_ps', v)} />
                <FormGroup label="District" value={formData.permanent_district} onChange={v => updateField('permanent_district', v)} />

                <FormGroup label="State" value={formData.permanent_state} onChange={v => updateField('permanent_state', v)} required />
                <FormGroup label="Pin" value={formData.permanent_pin} onChange={v => updateField('permanent_pin', v)} required />
                <FormGroup label="Aadhar Card No." value={formData.permanent_aadhar} onChange={v => updateField('permanent_aadhar', v)} />
                <FormGroup label="Email" value={formData.permanent_email} onChange={v => updateField('permanent_email', v)} type="email" />

                <FormGroup label="Whatsapp No" value={formData.whatsapp} onChange={v => updateField('whatsapp', v)} />
                <FormGroup label="FB Account No" value={formData.fb_account} onChange={v => updateField('fb_account', v)} />
              </div>
            </PremiumSection>

            <PremiumSection title="Qualification Details" icon={GraduationCap}>
              <div style={grid3Col}>
                <div style={{ background: '#f8fafc', padding: '2.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'inline-block', padding: '0.5rem 1.5rem', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white', borderRadius: '99px', fontSize: '0.9rem', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '2.5rem' }}>CLASS X</div>
                  <FormGroup label="Institution" value={formData.x_institution} onChange={v => updateField('x_institution', v)} required />
                  <FormGroup label="Board" value={formData.x_board} onChange={v => updateField('x_board', v)} required />
                  <FormGroup label="If Other" value={formData.x_other_board} onChange={v => updateField('x_other_board', v)} />
                  <FormGroup label="Medium" value={formData.x_medium} onChange={v => updateField('x_medium', v)} />
                  <FormGroup label="Percentage" value={formData.x_percentage} onChange={v => updateField('x_percentage', v)} required />
                  <FormGroup label="Year" value={formData.x_year} onChange={v => updateField('x_year', v)} required />
                </div>
                <div style={{ background: '#f8fafc', padding: '2.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'inline-block', padding: '0.5rem 1.5rem', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white', borderRadius: '99px', fontSize: '0.9rem', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '2.5rem' }}>CLASS XII</div>
                  <FormGroup label="Institution" value={formData.xii_institution} onChange={v => updateField('xii_institution', v)} />
                  <FormGroup label="Board" value={formData.xii_board} onChange={v => updateField('xii_board', v)} />
                  <FormGroup label="If Other" value={formData.xii_other_board} onChange={v => updateField('xii_other_board', v)} />
                  <FormGroup label="Medium" value={formData.xii_medium} onChange={v => updateField('xii_medium', v)} />
                  <FormGroup label="Percentage" value={formData.xii_percentage} onChange={v => updateField('xii_percentage', v)} />
                  <FormGroup label="Year" value={formData.xii_year} onChange={v => updateField('xii_year', v)} />
                </div>
                <div style={{ background: '#f8fafc', padding: '2.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'inline-block', padding: '0.5rem 1.5rem', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white', borderRadius: '99px', fontSize: '0.9rem', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '2.5rem' }}>GRADUATION</div>
                  <FormGroup label="Institution" value={formData.grad_institution} onChange={v => updateField('grad_institution', v)} />
                  <FormGroup label="Board" value={formData.grad_board} onChange={v => updateField('grad_board', v)} />
                  <FormGroup label="If Other" value={formData.grad_other_board} onChange={v => updateField('grad_other_board', v)} />
                  <FormGroup label="Medium" value={formData.grad_medium} onChange={v => updateField('grad_medium', v)} />
                  <FormGroup label="Percentage" value={formData.grad_percentage} onChange={v => updateField('grad_percentage', v)} />
                  <FormGroup label="Year" value={formData.grad_year} onChange={v => updateField('grad_year', v)} />
                </div>
              </div>
            </PremiumSection>

            <PremiumSection title="Guardian Details" icon={Users}>
              <div style={{ marginBottom: '3rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', gap: '3rem', alignItems: 'center' }}>
                <RadioGroup label="Primary Guardian" name="primary_guardian" value={formData.primary_guardian} options={[{ label: 'Father', value: 'Father' }, { label: 'Mother', value: 'Mother' }]} onChange={v => updateField('primary_guardian', v)} />
                <div style={{ width: '1px', height: '60px', background: '#cbd5e1' }}></div>
                <RadioGroup label="Hostel boarder" name="hostel_boarder" value={formData.hostel_boarder} options={[{ label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }]} onChange={v => updateField('hostel_boarder', v)} />
              </div>

              <div style={grid2Col}>
                <div style={{ background: '#f8fafc', padding: '2.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'inline-block', padding: '0.5rem 1.5rem', background: '#0f172a', color: 'white', borderRadius: '99px', fontSize: '0.9rem', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '2.5rem' }}>FATHER'S DETAILS</div>
                  <FormGroup label="Father's Name" value={formData.father_name} onChange={v => updateField('father_name', v)} required />
                  <FormGroup label="Father's Mobile" value={formData.father_mobile} onChange={v => updateField('father_mobile', v)} required />
                  <FormGroup label="Father's Landline" value={formData.father_landline} onChange={v => updateField('father_landline', v)} />
                  <FormGroup label="Father's profession" value={formData.father_profession} onChange={v => updateField('father_profession', v)} />
                  <FormGroup label="Father's E-Mail" value={formData.father_email} onChange={v => updateField('father_email', v)} type="email" />
                  <FormGroup label="Mention if Other" value={formData.father_other_prof} onChange={v => updateField('father_other_prof', v)} />
                </div>
                <div style={{ background: '#f8fafc', padding: '2.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'inline-block', padding: '0.5rem 1.5rem', background: '#0f172a', color: 'white', borderRadius: '99px', fontSize: '0.9rem', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '2.5rem' }}>MOTHER'S DETAILS</div>
                  <FormGroup label="Mother's Name" value={formData.mother_name} onChange={v => updateField('mother_name', v)} required />
                  <FormGroup label="Mother's Contact No" value={formData.mother_mobile} onChange={v => updateField('mother_mobile', v)} required />
                  <FormGroup label="Mother's profession" value={formData.mother_profession} onChange={v => updateField('mother_profession', v)} />
                  <FormGroup label="Mother's E-Mail" value={formData.mother_email} onChange={v => updateField('mother_email', v)} type="email" />
                  <FormGroup label="Mention if Other" value={formData.mother_other_prof} onChange={v => updateField('mother_other_prof', v)} />
                </div>
              </div>

              <div style={{ marginTop: '3rem', paddingTop: '3rem', borderTop: '1px solid #f1f5f9' }}>
                <div style={grid2Col}>
                  <FormGroup label="No Of Brother(s)" value={formData.brothers_count} onChange={v => updateField('brothers_count', v)} type="number" />
                  <FormGroup label="No Of Sister(s)" value={formData.sisters_count} onChange={v => updateField('sisters_count', v)} type="number" />
                </div>
              </div>
            </PremiumSection>

            <PremiumSection title="Local Guardian Details" icon={Shield}>
              <div style={grid3Col}>
                <FormGroup label="Local Guardian Name" value={formData.local_guardian_name} onChange={v => updateField('local_guardian_name', v)} />
                <FormGroup label="Local Guardian Mobile" value={formData.local_guardian_mobile} onChange={v => updateField('local_guardian_mobile', v)} />
                <FormGroup label="Local Guardian Contact" value={formData.local_guardian_contact} onChange={v => updateField('local_guardian_contact', v)} />
              </div>
            </PremiumSection>

            <PremiumSection title="Awards/Achievement/Honored" icon={Award}>
              <div style={grid2Col}>
                <div style={{ background: '#f8fafc', padding: '2.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'inline-block', padding: '0.5rem 1.5rem', background: '#0f172a', color: 'white', borderRadius: '99px', fontSize: '0.9rem', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '2.5rem' }}>ACADEMIC AWARDS</div>
                  <FormGroup label="Award 1" value={formData.acad_award_1} onChange={v => updateField('acad_award_1', v)} />
                  <FormGroup label="Award 2" value={formData.acad_award_2} onChange={v => updateField('acad_award_2', v)} />
                  <FormGroup label="Award 3" value={formData.acad_award_3} onChange={v => updateField('acad_award_3', v)} />
                  <FormGroup label="Award 4" value={formData.acad_award_4} onChange={v => updateField('acad_award_4', v)} />
                </div>
                <div style={{ background: '#f8fafc', padding: '2.5rem', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'inline-block', padding: '0.5rem 1.5rem', background: '#0f172a', color: 'white', borderRadius: '99px', fontSize: '0.9rem', fontWeight: 800, letterSpacing: '0.1em', marginBottom: '2.5rem' }}>NON-ACADEMIC AWARDS</div>
                  <FormGroup label="Award 1" value={formData.non_acad_award_1} onChange={v => updateField('non_acad_award_1', v)} />
                  <FormGroup label="Award 2" value={formData.non_acad_award_2} onChange={v => updateField('non_acad_award_2', v)} />
                  <FormGroup label="Award 3" value={formData.non_acad_award_3} onChange={v => updateField('non_acad_award_3', v)} />
                  <FormGroup label="Award 4" value={formData.non_acad_award_4} onChange={v => updateField('non_acad_award_4', v)} />
                </div>
              </div>
            </PremiumSection>

            {/* Bottom Save Action */}
            <div style={{ marginTop: '3rem', padding: '2.5rem', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', borderRadius: '24px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
              <button type="submit" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: 'white', padding: '1.25rem 3rem', borderRadius: '99px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '1.15rem', boxShadow: '0 10px 25px rgba(99, 102, 241, 0.4)', transition: 'all 0.2s', opacity: saving ? 0.7 : 1 }}>
                <Save size={24} strokeWidth={2.5} />
                {saving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Register New Student')}
              </button>
            </div>

          </form>
        )}

        {/* View mode */}
        {activeTab === 'view' && viewStudent && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
              <button onClick={() => setActiveTab('list')} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.1rem 2rem', fontSize: '1.1rem', fontWeight: 700, background: 'white', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '99px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'all 0.2s' }}>
                <ChevronLeft size={20} /> Back to List
              </button>
            </div>

            {/* Luxury Hero Banner for Student Profile (Light Theme) */}
            <div style={{
              position: 'relative',
              borderRadius: '32px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0.3) 100%)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              overflow: 'hidden',
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.05), inset 0 1px 0 rgba(255,255,255,1)',
              padding: '4rem',
              display: 'flex',
              gap: '4rem',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              marginBottom: '3rem'
            }}>
              {/* Background effects */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 1, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '60%', height: '140%', background: 'radial-gradient(ellipse at center, rgba(30, 58, 138, 0.25) 0%, transparent 70%)', filter: 'blur(50px)' }}></div>
                <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '70%', height: '120%', background: 'radial-gradient(ellipse at center, rgba(251, 191, 36, 0.25) 0%, transparent 70%)', filter: 'blur(50px)' }}></div>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.02%22/%3E%3C/svg%3E")', mixBlendMode: 'overlay' }}></div>
              </div>

              <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
                <div style={{ position: 'relative' }}>
                  {/* Glow behind */}
                  <div style={{ position: 'absolute', inset: '-20px', background: 'linear-gradient(135deg, rgba(30,58,138,0.2), rgba(251,191,36,0.2))', borderRadius: '50%', opacity: 0.8, filter: 'blur(30px)' }}></div>
                  <div style={{
                    width: '220px',
                    height: '220px',
                    borderRadius: '50%',
                    padding: '8px',
                    background: 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.6) 100%)',
                    position: 'relative',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    backdropFilter: 'blur(10px)',
                  }}>
                    {viewStudent.profile_photo ? (
                      <img src={`http://localhost:5000${viewStudent.profile_photo}`} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '5rem', fontWeight: 800, border: '1px solid rgba(0,0,0,0.05)' }}>
                        {viewStudent.name ? viewStudent.name.charAt(0) : 'S'}
                      </div>
                    )}
                  </div>
                  {/* Verified badge */}
                  <div style={{ position: 'absolute', bottom: '15px', right: '5px', background: '#ffffff', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '50%', padding: '12px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle size={28} color="#1E3A8A" />
                  </div>
                </div>

                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span style={{ padding: '0.4rem 1.2rem', background: 'rgba(255,255,255,0.8)', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700, color: '#475569', letterSpacing: '0.15em', textTransform: 'uppercase', backdropFilter: 'blur(10px)', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      Student Profile
                    </span>
                  </div>
                  <h3 style={{
                    fontSize: '3.5rem',
                    fontWeight: 800,
                    margin: 0,
                    fontFamily: "'Playfair Display', serif",
                    letterSpacing: '-0.02em',
                    background: 'linear-gradient(to right, #1E3A8A, #B45309)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.05))'
                  }}>
                    {viewStudent.name}
                  </h3>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 2rem', background: 'rgba(255,255,255,0.8)', color: '#1E3A8A', borderRadius: '99px', fontWeight: 700, fontSize: '1.1rem', border: '1px solid rgba(0,0,0,0.05)', backdropFilter: 'blur(10px)', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                    <GraduationCap size={20} color="#F59E0B" />
                    ID: <span style={{ color: '#0F172A', fontFamily: "'Inter', sans-serif" }}>{viewStudent.student_id}</span>
                  </div>
                </div>
              </div>
            </div>

            <PremiumSection title="Personal Information" icon={User}>
              <div style={grid3Col}>
                <ReadOnlyField label="First Name" value={viewStudent.first_name || (viewStudent.name ? viewStudent.name.split(' ')[0] : '')} />
                <ReadOnlyField label="Middle Name" value={viewStudent.middle_name} />
                <ReadOnlyField label="Surname" value={viewStudent.surname || (viewStudent.name ? viewStudent.name.split(' ').slice(1).join(' ') : '')} />
                
                <ReadOnlyField label="Campus" value={viewStudent.campus} />
                <ReadOnlyField label="Section" value={sections.find(s => s.id === viewStudent.section_id)?.name || "Not provided"} />
                <ReadOnlyField label="Student ID" value={viewStudent.student_id} />
                <ReadOnlyField label="Batch Name" value={viewStudent.batch_name} />
                
                <ReadOnlyField label="University Mail-ID" value={viewStudent.email} />
                <ReadOnlyField label="Mobile 1" value={viewStudent.mobile_1} />
                <ReadOnlyField label="Mobile 2" value={viewStudent.mobile_2} />
                
                <ReadOnlyField label="Landline" value={viewStudent.landline} />
                <ReadOnlyField label="Date of birth" value={viewStudent.dob} />
                <ReadOnlyField label="Place Of Birth" value={viewStudent.place_of_birth} />
                
                <ReadOnlyField label="Blood group" value={viewStudent.blood_group} />
                <ReadOnlyField label="Height" value={viewStudent.height} />
                <ReadOnlyField label="Weight" value={viewStudent.weight} />
                
                <ReadOnlyField label="Religion" value={viewStudent.religion} />
                <ReadOnlyField label="Nationality" value={viewStudent.nationality} />
                <ReadOnlyField label="Caste" value={viewStudent.caste} />
                
                <ReadOnlyField label="Student ABC ID" value={viewStudent.abc_id} />
                <ReadOnlyField label="Major Disease" value={viewStudent.disease} />
                <ReadOnlyField label="Career Goal" value={viewStudent.career_goal} />
              </div>
              
              <div style={{ marginTop: '2rem', paddingTop: '2.5rem', borderTop: '1px solid #f1f5f9' }}>
                <ReadOnlyField label="Why Choose This Course" value={viewStudent.why_choose} />
                <ChipGroup label="Hobbies & Interests" values={viewStudent.hobbies} />
                <ReadOnlyField label="Other Hobbies" value={viewStudent.other_hobby} />
              </div>
            </PremiumSection>

            <PremiumSection title="Present Address Details" icon={MapPin}>
              <ReadOnlyField label="Present address" value={viewStudent.present_address} />
              <div style={grid4Col}>
                <ReadOnlyField label="City / Town" value={viewStudent.present_city} />
                <ReadOnlyField label="P.O" value={viewStudent.present_po} />
                <ReadOnlyField label="P.S" value={viewStudent.present_ps} />
                <ReadOnlyField label="Area" value={viewStudent.present_area} />
                
                <ReadOnlyField label="District" value={viewStudent.present_district} />
                <ReadOnlyField label="State" value={viewStudent.present_state} />
                <ReadOnlyField label="Pin" value={viewStudent.present_pin} />
                <ReadOnlyField label="Aadhar Card No." value={viewStudent.present_aadhar} />
              </div>
            </PremiumSection>

            <PremiumSection title="Permanent Address Details" icon={Navigation}>
              <ReadOnlyField label="Permanent address" value={viewStudent.permanent_address} />
              <div style={grid4Col}>
                <ReadOnlyField label="City / Town" value={viewStudent.permanent_city} />
                <ReadOnlyField label="P.O" value={viewStudent.permanent_po} />
                <ReadOnlyField label="P.S" value={viewStudent.permanent_ps} />
                <ReadOnlyField label="District" value={viewStudent.permanent_district} />
                
                <ReadOnlyField label="State" value={viewStudent.permanent_state} />
                <ReadOnlyField label="Pin" value={viewStudent.permanent_pin} />
                <ReadOnlyField label="Aadhar Card No." value={viewStudent.permanent_aadhar} />
                <ReadOnlyField label="Email" value={viewStudent.permanent_email} />
                
                <ReadOnlyField label="Whatsapp No" value={viewStudent.whatsapp} />
                <ReadOnlyField label="FB Account No" value={viewStudent.fb_account} />
              </div>
            </PremiumSection>

            <PremiumSection title="Qualification Details" icon={GraduationCap}>
              <div style={grid3Col}>
                <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'inline-block', padding: '0.5rem 1.25rem', background: '#0f172a', color: 'white', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '2rem' }}>CLASS X</div>
                  <ReadOnlyField label="Institution" value={viewStudent.x_institution} />
                  <ReadOnlyField label="Board" value={viewStudent.x_board} />
                  <ReadOnlyField label="If Other" value={viewStudent.x_other_board} />
                  <ReadOnlyField label="Medium" value={viewStudent.x_medium} />
                  <ReadOnlyField label="Percentage" value={viewStudent.x_percentage} />
                  <ReadOnlyField label="Year" value={viewStudent.x_year} />
                </div>
                <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'inline-block', padding: '0.5rem 1.25rem', background: '#0f172a', color: 'white', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '2rem' }}>CLASS XII</div>
                  <ReadOnlyField label="Institution" value={viewStudent.xii_institution} />
                  <ReadOnlyField label="Board" value={viewStudent.xii_board} />
                  <ReadOnlyField label="If Other" value={viewStudent.xii_other_board} />
                  <ReadOnlyField label="Medium" value={viewStudent.xii_medium} />
                  <ReadOnlyField label="Percentage" value={viewStudent.xii_percentage} />
                  <ReadOnlyField label="Year" value={viewStudent.xii_year} />
                </div>
                <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'inline-block', padding: '0.5rem 1.25rem', background: '#0f172a', color: 'white', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '2rem' }}>GRADUATION</div>
                  <ReadOnlyField label="Institution" value={viewStudent.grad_institution} />
                  <ReadOnlyField label="Board" value={viewStudent.grad_board} />
                  <ReadOnlyField label="If Other" value={viewStudent.grad_other_board} />
                  <ReadOnlyField label="Medium" value={viewStudent.grad_medium} />
                  <ReadOnlyField label="Percentage" value={viewStudent.grad_percentage} />
                  <ReadOnlyField label="Year" value={viewStudent.grad_year} />
                </div>
              </div>
            </PremiumSection>

            <PremiumSection title="Guardian Details" icon={Users}>
              <div style={{ marginBottom: '3rem', display: 'flex', gap: '2rem', alignItems: 'center', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                   <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Primary Guardian</span>
                   <span style={{ padding: '0.5rem 1.5rem', background: '#0f172a', color: 'white', borderRadius: '99px', fontSize: '0.9rem', fontWeight: 700 }}>{viewStudent.primary_guardian || 'Not specified'}</span>
                </div>
                <div style={{ width: '1px', height: '30px', background: '#cbd5e1' }}></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                   <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Hostel Boarder</span>
                   <span style={{ padding: '0.5rem 1.5rem', background: 'white', border: '1px solid #cbd5e1', color: '#0f172a', borderRadius: '99px', fontSize: '0.9rem', fontWeight: 700, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>{viewStudent.hostel_boarder || 'Not specified'}</span>
                </div>
              </div>
              
              <div style={grid2Col}>
                <div style={{ background: '#f8fafc', padding: '2.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'inline-block', padding: '0.5rem 1.25rem', background: '#0f172a', color: 'white', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '2rem' }}>FATHER'S DETAILS</div>
                  <ReadOnlyField label="Father's Name" value={viewStudent.father_name} />
                  <ReadOnlyField label="Father's Mobile" value={viewStudent.father_mobile} />
                  <ReadOnlyField label="Father's Landline" value={viewStudent.father_landline} />
                  <ReadOnlyField label="Father's E-Mail" value={viewStudent.father_email} />
                  <ReadOnlyField label="Father's profession" value={viewStudent.father_profession} />
                  <ReadOnlyField label="Mention if Other" value={viewStudent.father_other_prof} />
                </div>
                <div style={{ background: '#f8fafc', padding: '2.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'inline-block', padding: '0.5rem 1.25rem', background: '#0f172a', color: 'white', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '2rem' }}>MOTHER'S DETAILS</div>
                  <ReadOnlyField label="Mother's Name" value={viewStudent.mother_name} />
                  <ReadOnlyField label="Mother's Contact No" value={viewStudent.mother_mobile} />
                  <ReadOnlyField label="Mother's E-Mail" value={viewStudent.mother_email} />
                  <ReadOnlyField label="Mother's profession" value={viewStudent.mother_profession} />
                  <ReadOnlyField label="Mention if Other" value={viewStudent.mother_other_prof} />
                </div>
              </div>
              <div style={{ marginTop: '1rem', paddingTop: '2.5rem', borderTop: '1px solid #f1f5f9' }}>
                <div style={grid2Col}>
                  <ReadOnlyField label="No Of Brother(s)" value={viewStudent.brothers_count} />
                  <ReadOnlyField label="No Of Sister(s)" value={viewStudent.sisters_count} />
                </div>
              </div>
            </PremiumSection>
            
            <PremiumSection title="Local Guardian Details" icon={Shield}>
               <div style={grid3Col}>
                  <ReadOnlyField label="Local Guardian Name" value={viewStudent.local_guardian_name} />
                  <ReadOnlyField label="Local Guardian Mobile" value={viewStudent.local_guardian_mobile} />
                  <ReadOnlyField label="Local Guardian Contact" value={viewStudent.local_guardian_contact} />
               </div>
            </PremiumSection>

            <PremiumSection title="Awards & Achievements" icon={Award}>
              <div style={grid2Col}>
                <div style={{ background: '#f8fafc', padding: '2.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'inline-block', padding: '0.5rem 1.25rem', background: '#0f172a', color: 'white', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '2rem' }}>ACADEMIC AWARDS</div>
                  <ReadOnlyField label="Award 1" value={viewStudent.acad_award_1} />
                  <ReadOnlyField label="Award 2" value={viewStudent.acad_award_2} />
                  <ReadOnlyField label="Award 3" value={viewStudent.acad_award_3} />
                  <ReadOnlyField label="Award 4" value={viewStudent.acad_award_4} />
                </div>
                <div style={{ background: '#f8fafc', padding: '2.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'inline-block', padding: '0.5rem 1.25rem', background: '#0f172a', color: 'white', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '2rem' }}>NON-ACADEMIC AWARDS</div>
                  <ReadOnlyField label="Award 1" value={viewStudent.non_acad_award_1} />
                  <ReadOnlyField label="Award 2" value={viewStudent.non_acad_award_2} />
                  <ReadOnlyField label="Award 3" value={viewStudent.non_acad_award_3} />
                  <ReadOnlyField label="Award 4" value={viewStudent.non_acad_award_4} />
                </div>
              </div>
            </PremiumSection>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStudentManagement;
