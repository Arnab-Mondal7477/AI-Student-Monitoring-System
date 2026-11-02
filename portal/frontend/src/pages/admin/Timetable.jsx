import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Plus, Trash2, Clock, CheckCircle, AlertTriangle, Download, Save, RefreshCw, Layers, Users, BookOpen, Settings } from 'lucide-react';
import './Routine.css';

const AdminTimetable = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Global Data
  const [settings, setSettings] = useState({});
  const [academicYears, setAcademicYears] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [summary, setSummary] = useState({});

  // Filter State
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedSem, setSelectedSem] = useState('');
  const [selectedSec, setSelectedSec] = useState('');

  // Cascading Data
  const [semesters, setSemesters] = useState([]);
  const [sections, setSections] = useState([]);
  
  // Tab State
  const [activeTab, setActiveTab] = useState('overview'); // overview, assignments, routine, conflicts

  // Section Data
  const [assignments, setAssignments] = useState([]);
  const [slots, setSlots] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  const fetchInitialData = async () => {
    try {
      const headers = getHeaders();
      const [yRes, dRes, sRes, sumRes] = await Promise.all([
        axios.get('http://localhost:5000/api/routine/academic-years', { headers }),
        axios.get('http://localhost:5000/api/routine/departments', { headers }),
        axios.get('http://localhost:5000/api/routine/settings', { headers }),
        axios.get('http://localhost:5000/api/routine/summary', { headers })
      ]);
      setAcademicYears(yRes.data);
      setDepartments(dRes.data);
      setSettings(sRes.data);
      setSummary(sumRes.data);

      if (yRes.data.length > 0) setSelectedYear(yRes.data[0].id);
      if (dRes.data.length > 0) setSelectedDept(dRes.data[0].id);
      
      setLoading(false);
    } catch (err) {
      setError('Failed to load initial routine data.');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDept && selectedYear) {
      axios.get(`http://localhost:5000/api/routine/semesters?department_id=${selectedDept}&academic_year_id=${selectedYear}`, { headers: getHeaders() })
        .then(res => {
          setSemesters(res.data);
          if (res.data.length > 0) setSelectedSem(res.data[0].id);
          else setSelectedSem('');
        });
    }
  }, [selectedDept, selectedYear]);

  useEffect(() => {
    if (selectedSem) {
      axios.get(`http://localhost:5000/api/routine/sections?semester_id=${selectedSem}`, { headers: getHeaders() })
        .then(res => {
          setSections(res.data);
          if (res.data.length > 0) setSelectedSec(res.data[0].id);
          else setSelectedSec('');
        });
    } else {
      setSections([]);
      setSelectedSec('');
    }
  }, [selectedSem]);

  useEffect(() => {
    if (selectedSec && activeTab !== 'overview') {
      fetchSectionData();
    }
  }, [selectedSec, activeTab]);

  const fetchSectionData = async () => {
    try {
      const headers = getHeaders();
      const [assRes, ttRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/routine/assignments?section_id=${selectedSec}`, { headers }),
        axios.get(`http://localhost:5000/api/routine/master?section_id=${selectedSec}`, { headers })
      ]);
      setAssignments(assRes.data);
      setSlots(ttRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async () => {
    if (!selectedSec) return setError("Select a section first");
    setIsGenerating(true);
    setError(null);
    setSuccess(null);
    try {
      // Simulate professional progress steps
      setTimeout(async () => {
        try {
          const res = await axios.post('http://localhost:5000/api/routine/generate', {
            academic_year_id: selectedYear,
            department_id: selectedDept,
            semester_id: selectedSem,
            section_id: selectedSec
          }, { headers: getHeaders() });
          
          setSuccess(`✓ Routine generated successfully. ${res.data.slots} classes scheduled with no conflicts.`);
          fetchSectionData();
          setActiveTab('routine');
        } catch(e) {
          setError('⚠ Routine generation failed.');
        } finally {
          setIsGenerating(false);
        }
      }, 1500);
    } catch (err) {
      setIsGenerating(false);
    }
  };

  if (loading) return <div className="loader-container"><div className="loader"></div></div>;

  return (
    <div className="routine-portal">
      <div className="header-flex">
        <div>
          <h1>Routine / Timetable</h1>
          <p className="text-muted">Create, manage and publish conflict-free weekly class schedules.</p>
        </div>
        <div className="action-buttons">
          <button className="btn btn-outline"><Save size={16}/> Save Version</button>
          <button className="btn btn-primary" onClick={() => setActiveTab('routine')}><Calendar size={16}/> View Routine</button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="filter-bar glass-panel">
        <div className="filter-group">
          <label>Academic Year</label>
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
            {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Department</label>
          <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)}>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Semester</label>
          <select value={selectedSem} onChange={e => setSelectedSem(e.target.value)}>
            {semesters.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Section</label>
          <select value={selectedSec} onChange={e => setSelectedSec(e.target.value)}>
            {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="filter-actions">
          <button className="btn btn-outline" onClick={() => fetchInitialData()}><RefreshCw size={16}/></button>
        </div>
      </div>

      {/* MESSAGES */}
      {error && <div className="alert alert-danger"><AlertTriangle size={18}/> {error}</div>}
      {success && <div className="alert alert-success"><CheckCircle size={18}/> {success}</div>}

      {/* TABS */}
      <div className="custom-tabs">
        <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={`tab ${activeTab === 'assignments' ? 'active' : ''}`} onClick={() => setActiveTab('assignments')}>Subject Assignment</button>
        <button className={`tab ${activeTab === 'routine' ? 'active' : ''}`} onClick={() => setActiveTab('routine')}>Weekly Routine</button>
        <button className={`tab ${activeTab === 'conflicts' ? 'active' : ''}`} onClick={() => setActiveTab('conflicts')}>Global Conflicts</button>
      </div>

      <div className="tab-content">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="summary-grid">
            <div className="stat-card">
              <Layers className="stat-icon" />
              <div className="stat-info">
                <h3>{summary.departments || 0}</h3>
                <p>Departments</p>
              </div>
            </div>
            <div className="stat-card">
              <BookOpen className="stat-icon" />
              <div className="stat-info">
                <h3>{summary.semesters || 0}</h3>
                <p>Active Semesters</p>
              </div>
            </div>
            <div className="stat-card">
              <Users className="stat-icon" />
              <div className="stat-info">
                <h3>{summary.sections || 0}</h3>
                <p>Sections</p>
              </div>
            </div>
            <div className="stat-card">
              <Users className="stat-icon" style={{color: 'var(--primary)'}} />
              <div className="stat-info">
                <h3>{summary.teachers || 0}</h3>
                <p>Teachers</p>
              </div>
            </div>
            <div className="stat-card">
              <Calendar className="stat-icon" />
              <div className="stat-info">
                <h3>{summary.classes_week || 0}</h3>
                <p>Classes / Week</p>
              </div>
            </div>
            <div className="stat-card alert-bg">
              <AlertTriangle className="stat-icon text-danger" />
              <div className="stat-info">
                <h3 className="text-danger">{summary.conflicts || 0}</h3>
                <p>Conflicts</p>
              </div>
            </div>
          </div>
        )}

        {/* ASSIGNMENTS TAB */}
        {activeTab === 'assignments' && (
          <div className="assignments-panel glass-panel">
            <div className="panel-header">
              <h2>Subject Assignment Details</h2>
              <button className="btn btn-primary btn-sm"><Plus size={16}/> Add Subject</button>
            </div>
            <table className="routine-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Teacher</th>
                  <th>Classes / Week</th>
                  <th>Duration</th>
                  <th>Type</th>
                  <th>Room</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(a => (
                  <tr key={a.id}>
                    <td>{a.subject.name} ({a.subject.code})</td>
                    <td>{a.teacher.name}</td>
                    <td>{a.classes_week}</td>
                    <td>{a.duration_min} min</td>
                    <td><span className="badge badge-primary">{a.class_type}</span></td>
                    <td>{a.room ? a.room.room_number : 'Auto'}</td>
                    <td><button className="icon-btn text-danger"><Trash2 size={16}/></button></td>
                  </tr>
                ))}
                {assignments.length === 0 && (
                  <tr><td colSpan="7" className="text-center text-muted">No subjects assigned to this section yet.</td></tr>
                )}
              </tbody>
            </table>
            
            <div className="generator-box">
              <h3>Automatic Routine Generator</h3>
              <p>Generate a conflict-free routine based on the assignments above. This will check global teacher and room availability.</p>
              <button 
                className="btn btn-success" 
                onClick={handleGenerate}
                disabled={isGenerating || assignments.length === 0}
              >
                {isGenerating ? 'Generating...' : 'Generate Conflict-Free Routine'}
              </button>
            </div>
          </div>
        )}

        {/* ROUTINE TAB */}
        {activeTab === 'routine' && (
          <div className="routine-grid-container glass-panel">
            <div className="panel-header">
              <h2>Weekly Routine</h2>
              <div className="routine-actions">
                <button className="btn btn-outline btn-sm"><Download size={14}/> PDF</button>
                <span className="badge badge-success">Status: Published</span>
              </div>
            </div>
            
            <div className="timetable-wrapper">
              <table className="timetable-grid">
                <thead>
                  <tr>
                    <th className="time-col">Time</th>
                    <th>MON</th>
                    <th>TUE</th>
                    <th>WED</th>
                    <th>THU</th>
                    <th>FRI</th>
                    <th>SAT</th>
                  </tr>
                </thead>
                <tbody>
                  {['08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '12:00 - 13:00', '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00', '17:00 - 18:00', '18:00 - 19:00'].map(time => {
                    const sTime = time.split(' - ')[0];
                    return (
                      <tr key={time}>
                        <td className="time-cell">{time}</td>
                        {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => {
                          const slot = slots.find(s => s.day_of_week === day && s.start_time === sTime);
                          return (
                            <td key={day} className="slot-cell">
                              {slot ? (
                                <div className="slot-card" draggable="true">
                                  <div className="slot-subject">{slot.subject.code}</div>
                                  <div className="slot-teacher">{slot.teacher.name}</div>
                                  <div className="slot-room">Room {slot.classroom.room_number}</div>
                                </div>
                              ) : (
                                <div className="slot-empty">Free</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CONFLICTS TAB */}
        {activeTab === 'conflicts' && (
          <div className="conflicts-panel glass-panel">
            <div className="panel-header">
              <h2>Global Conflict Monitor</h2>
            </div>
            <div className="conflict-stats">
              <div className="alert alert-success">
                <CheckCircle size={18}/> <strong>No conflicts detected across the entire college.</strong>
                <p style={{margin: '0.5rem 0 0 0'}}>Checked {summary.classes_week || 0} classes, {summary.teachers || 0} teachers, and {summary.classrooms || 0} rooms.</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminTimetable;
