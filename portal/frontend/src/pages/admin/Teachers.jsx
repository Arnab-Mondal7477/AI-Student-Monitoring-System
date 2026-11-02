import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Users, UserPlus, Image as ImageIcon, Briefcase, Mail, Calendar, Plus, Trash2, Clock, MapPin, Layers, Building, X } from 'lucide-react';

const AdminTeachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    teacher_id: '',
    name: '',
    email: '',
    department: 'CSE',
    designation: 'Assistant Professor',
    experience: '0',
    password: ''
  });
  const [profilePhoto, setProfilePhoto] = useState(null);
  const fileInputRef = useRef(null);

  // Routine Modal State
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [timetable, setTimetable] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [routineLoading, setRoutineLoading] = useState(false);
  const [newSlot, setNewSlot] = useState({
    section_id: '',
    subject_id: '',
    classroom_id: '',
    day_of_week: '1',
    start_time: '09:00',
    end_time: '10:00'
  });

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/teachers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTeachers(response.data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        profile_photo_base64: profilePhoto
      };

      await axios.post('http://localhost:5000/api/admin/teachers', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const generatedPassword = formData.password || `${formData.name.split(' ')[0]}@2609`;
      alert(`Teacher employed successfully!\n\nTheir Login Credentials:\nUsername: ${formData.teacher_id}\nPassword: ${generatedPassword}\n\nPlease share these securely with the new teacher.`);
      setShowForm(false);
      setFormData({
        teacher_id: '', name: '', email: '', department: 'CSE', designation: 'Assistant Professor', experience: '0', password: ''
      });
      setProfilePhoto(null);
      fetchTeachers();
    } catch (error) {
      console.error('Error creating teacher:', error);
      alert(error.response?.data?.error || 'Failed to employ teacher');
    }
  };

  const openRoutineModal = async (teacher) => {
    setSelectedTeacher(teacher);
    setRoutineLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const [ttRes, secRes, subRes, cRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/timetable', { headers }),
        axios.get('http://localhost:5000/api/admin/sections', { headers }),
        axios.get('http://localhost:5000/api/admin/subjects', { headers }),
        axios.get('http://localhost:5000/api/admin/classrooms', { headers })
      ]);

      setTimetable(ttRes.data.filter(slot => slot.teacher_id === teacher.id));
      setSections(secRes.data);
      setSubjects(subRes.data);
      setClassrooms(cRes.data);
    } catch (err) {
      console.error('Failed to load routine data', err);
      alert('Failed to load routine data');
    } finally {
      setRoutineLoading(false);
    }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...newSlot,
        teacher_id: selectedTeacher.id
      };
      await axios.post('http://localhost:5000/api/admin/timetable', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh Timetable for this teacher
      const ttRes = await axios.get('http://localhost:5000/api/admin/timetable', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTimetable(ttRes.data.filter(slot => slot.teacher_id === selectedTeacher.id));
      setNewSlot({ ...newSlot, section_id: '', subject_id: '', classroom_id: '' });
      
    } catch (err) {
      console.error('Failed to create slot', err);
      alert(err.response?.data?.error || 'Failed to create slot');
    }
  };

  const handleDeleteSlot = async (id) => {
    if (!window.confirm('Delete this class from routine?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/timetable/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTimetable(timetable.filter(slot => slot.id !== id));
    } catch (err) {
      console.error('Failed to delete slot', err);
    }
  };

  const handleDeleteTeacher = async (teacher_id) => {
    if (!window.confirm('Are you sure you want to completely remove this teacher? This action cannot be undone.')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/admin/teachers/${teacher_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update the local state to remove the teacher
      setTeachers(teachers.filter(t => t.teacher_id !== teacher_id));
      alert('Teacher removed successfully');
    } catch (err) {
      console.error('Failed to remove teacher', err);
      alert(err.response?.data?.error || 'Failed to remove teacher');
    }
  };

  if (loading) return <div className="loader-container"><div className="loader"></div></div>;

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '3rem', position: 'relative' }}>
      
      {/* Routine Modal overlay */}
      {selectedTeacher && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel animate-fade-in" style={{ width: '90%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', borderRadius: '1rem', position: 'relative', background: 'white' }}>
            <button onClick={() => setSelectedTeacher(null)} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={24} />
            </button>
            
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-main)' }}>
              <Calendar size={24} color="var(--primary)" /> 
              Routine for {selectedTeacher.name}
            </h2>

            {routineLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem' }}>Loading routine...</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                {/* Form to add new slot */}
                <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '0.75rem', height: 'fit-content' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 600 }}>Assign Class</h3>
                  <form onSubmit={handleCreateSlot} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.85rem' }}>Day of Week</label>
                      <select className="form-select" required value={newSlot.day_of_week} onChange={(e) => setNewSlot({...newSlot, day_of_week: e.target.value})}>
                        {daysOfWeek.map((day, idx) => (idx > 0 ? <option key={idx} value={idx}>{day}</option> : null))}
                      </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.85rem' }}>Start Time</label>
                        <input type="time" className="form-input" required value={newSlot.start_time} onChange={(e) => setNewSlot({...newSlot, start_time: e.target.value})} />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.85rem' }}>End Time</label>
                        <input type="time" className="form-input" required value={newSlot.end_time} onChange={(e) => setNewSlot({...newSlot, end_time: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.85rem' }}>Section</label>
                      <select className="form-select" required value={newSlot.section_id} onChange={(e) => setNewSlot({...newSlot, section_id: e.target.value})}>
                        <option value="" disabled>Select Section</option>
                        {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.85rem' }}>Subject</label>
                      <select className="form-select" required value={newSlot.subject_id} onChange={(e) => setNewSlot({...newSlot, subject_id: e.target.value})}>
                        <option value="" disabled>Select Subject</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.85rem' }}>Classroom</label>
                      <select className="form-select" required value={newSlot.classroom_id} onChange={(e) => setNewSlot({...newSlot, classroom_id: e.target.value})}>
                        <option value="" disabled>Select Room</option>
                        {classrooms.map(c => <option key={c.id} value={c.id}>{c.room_number}</option>)}
                      </select>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Add to Routine</button>
                  </form>
                </div>

                {/* Display Current Routine */}
                <div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 600 }}>Weekly Schedule</h3>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {daysOfWeek.map((day, idx) => {
                      if (idx === 0) return null; // Skip Sunday usually
                      const daySlots = timetable.filter(s => s.day_of_week === idx).sort((a,b) => a.start_time.localeCompare(b.start_time));
                      if (daySlots.length === 0) return null;

                      return (
                        <div key={day} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem' }}>
                          <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)' }}>{day}</h4>
                          <div style={{ display: 'grid', gap: '0.75rem' }}>
                            {daySlots.map(slot => (
                              <div key={slot.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--primary)' }}>
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-main)' }}>{slot.subject.name}</div>
                                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Section: {slot.section.name}</div>
                                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={14}/> {slot.start_time} - {slot.end_time}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={14}/> {slot.classroom.room_number}</span>
                                  </div>
                                </div>
                                <button onClick={() => handleDeleteSlot(slot.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '0.5rem' }} title="Remove Class">
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                    {timetable.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No classes assigned yet.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}


      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '2rem', background: 'linear-gradient(135deg, var(--text-main), var(--primary))', WebkitBackgroundClip: 'text', color: 'transparent' }}>
            <Users color="var(--primary)" size={36} /> Teacher Directory
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginTop: '0.5rem' }}>Manage and employ teaching staff</p>
        </div>
        
        <button 
          onClick={() => setShowForm(!showForm)} 
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          {showForm ? 'Cancel' : <><UserPlus size={18} /> Employ New Teacher</>}
        </button>
      </div>

      {showForm && (
        <div className="glass-panel" style={{ padding: '2rem', borderRadius: '1rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-main)' }}>Employ New Teacher</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600 }}>Teacher ID (Username)</label>
              <input required type="text" name="teacher_id" value={formData.teacher_id} onChange={handleInputChange} className="input-field" placeholder="e.g. T-101" style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600 }}>Full Name</label>
              <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="input-field" placeholder="John Doe" style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600 }}>Email Address</label>
              <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="input-field" placeholder="john@example.com" style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600 }}>Password <span style={{color: 'var(--text-muted)', fontSize: '0.85rem'}}>(Default: FirstName@2609)</span></label>
              <input type="text" name="password" value={formData.password} onChange={handleInputChange} className="input-field" placeholder="Leave empty for default" style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600 }}>Department</label>
              <select name="department" value={formData.department} onChange={handleInputChange} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                <option value="CSE">Computer Science</option>
                <option value="IT">Information Technology</option>
                <option value="ECE">Electronics</option>
                <option value="MECH">Mechanical</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600 }}>Designation</label>
              <select name="designation" value={formData.designation} onChange={handleInputChange} style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Professor">Professor</option>
                <option value="HOD">Head of Department</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600 }}>Years of Experience</label>
              <input type="number" min="0" name="experience" value={formData.experience} onChange={handleInputChange} className="input-field" style={{ padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontWeight: 600 }}>Profile Picture</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button type="button" className="btn" onClick={() => fileInputRef.current?.click()} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '0.5rem 1rem' }}>
                  <ImageIcon size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> 
                  Upload Image
                </button>
                {profilePhoto && <span style={{ color: 'var(--success)', fontSize: '0.9rem' }}>Image Selected</span>}
              </div>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoChange} style={{ display: 'none' }} />
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>Employ Teacher</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {teachers.map(teacher => (
          <div key={teacher.id} className="glass-panel hover-lift" style={{ padding: '1.5rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {teacher.profile_photo ? (
                  <img src={`http://localhost:5000${teacher.profile_photo}`} alt={teacher.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#94a3b8' }}>{teacher.name.charAt(0)}</span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{teacher.name}</h3>
                <span className="badge badge-primary" style={{ fontSize: '0.75rem', marginTop: '0.25rem', display: 'inline-block' }}>{teacher.teacher_id}</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={() => openRoutineModal(teacher)} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>
                  <Calendar size={16} /> Routine
                </button>
                <button onClick={() => handleDeleteTeacher(teacher.teacher_id)} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.85rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                  <Trash2 size={16} /> Remove
                </button>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={16} /> {teacher.email}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Briefcase size={16} /> {teacher.designation} - {teacher.department}
              </div>
            </div>
          </div>
        ))}
        {teachers.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>No teachers found. Employ a new teacher to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTeachers;
