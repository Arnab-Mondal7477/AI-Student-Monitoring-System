import React, { useState, useEffect } from 'react';
import { 
    BookOpen, Layers, Target, Edit3, Trash2, 
    MoreHorizontal, ChevronDown, CheckCircle, 
    Search, Plus, BookMarked, X
} from 'lucide-react';
import '../../subjects-premium.css';

export default function Subjects() {
    const [departments, setDepartments] = useState([]);
    const [selectedDeptId, setSelectedDeptId] = useState(null);
    const [curriculums, setCurriculums] = useState([]);
    const [selectedCurriculumId, setSelectedCurriculumId] = useState(null);
    const [semesters, setSemesters] = useState([]);
    const [activeTab, setActiveTab] = useState(1);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
    const [isCurrModalOpen, setIsCurrModalOpen] = useState(false);
    const [isSemModalOpen, setIsSemModalOpen] = useState(false);
    
    const [editingSubject, setEditingSubject] = useState(null);
    const [formData, setFormData] = useState({
        course_code: '',
        course_name: '',
        course_type: 'CORE',
        l: 0,
        t: 0,
        p: 0,
        cia_marks: 0,
        tee_marks: 0,
        total_marks: 0,
        credits: 0,
        is_elective_group: false
    });
    
    const [deptFormData, setDeptFormData] = useState({ name: '', code: '', plan: 'free' });
    const [currFormData, setCurrFormData] = useState({ batch_year: new Date().getFullYear(), program_name: '', total_semesters: 8 });
    const [semFormData, setSemFormData] = useState({ number: 1 });

    const activeSemester = semesters.find(s => s.number === activeTab);

    const fetchDepartments = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8000/api/departments');
            if (res.ok) {
                const data = await res.json();
                setDepartments(data.departments);
                if (data.departments.length > 0 && !selectedDeptId) {
                    setSelectedDeptId(data.departments[0].id);
                }
            }
        } catch (err) {
            console.error("Failed to fetch departments", err);
        }
    };

    const fetchCurriculum = async () => {
        if (!selectedDeptId) return;
        setLoading(true);
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/departments/${selectedDeptId}/curriculum`);
            if (res.ok) {
                const data = await res.json();
                setCurriculums(data.curriculums);
                if (data.curriculums.length > 0) {
                    setSelectedCurriculumId(data.curriculums[0].id);
                } else {
                    setSelectedCurriculumId(null);
                    setSemesters([]);
                    setLoading(false);
                }
            }
        } catch (err) {
            console.error("Failed to fetch curriculum", err);
        }
    };

    // Fetch initial departments
    useEffect(() => {
        fetchDepartments();
    }, []);

    // Fetch curriculum when department changes
    useEffect(() => {
        fetchCurriculum();
    }, [selectedDeptId]);

    // Fetch subjects when curriculum changes
    const fetchSubjects = async () => {
        if (!selectedCurriculumId) return;
        setLoading(true);
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/curriculum/${selectedCurriculumId}/subjects`);
            if (res.ok) {
                const data = await res.json();
                setSemesters(data.semesters);
                if (data.semesters.length > 0 && !activeSemester) {
                    setActiveTab(data.semesters[0].number);
                }
            }
        } catch (err) {
            console.error("Failed to fetch subjects", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubjects();
    }, [selectedCurriculumId]);

    const activeDept = departments.find(d => d.id === parseInt(selectedDeptId));

    const handleDeleteDepartment = async () => {
        if (!selectedDeptId) return;
        if (!window.confirm("Are you sure you want to delete this department? This will also delete its curriculum and subjects.")) return;
        
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/departments/${selectedDeptId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setSelectedDeptId(null);
                setCurriculums([]);
                setSemesters([]);
                fetchDepartments();
            } else {
                alert("Failed to delete department");
            }
        } catch (err) {
            console.error("Error deleting department", err);
            alert("Error deleting department");
        }
    };

    // CRUD Handlers
    const handleOpenModal = (subject = null) => {
        if (subject) {
            setEditingSubject(subject);
            setFormData({
                course_code: subject.code,
                course_name: subject.name,
                course_type: subject.type,
                l: subject.l,
                t: subject.t,
                p: subject.p,
                cia_marks: subject.cia,
                tee_marks: subject.tee,
                total_marks: subject.total,
                credits: subject.credits,
                is_elective_group: subject.is_elective_group
            });
        } else {
            setEditingSubject(null);
            setFormData({
                course_code: '', course_name: '', course_type: 'CORE',
                l: 0, t: 0, p: 0, cia_marks: 40, tee_marks: 60, total_marks: 100, credits: 3,
                is_elective_group: false
            });
        }
        setIsModalOpen(true);
    };

    const handleSaveSubject = async () => {
        if (!activeSemester) return;
        const payload = {
            ...formData,
            semester_id: activeSemester.id
        };

        const url = editingSubject 
            ? `http://127.0.0.1:8000/api/subjects/${editingSubject.id}`
            : `http://127.0.0.1:8000/api/subjects`;
            
        const method = editingSubject ? 'PATCH' : 'POST';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setIsModalOpen(false);
                fetchSubjects(); // Refresh
            }
        } catch (err) {
            console.error("Failed to save subject", err);
        }
    };

    const handleDeleteSubject = async (subjectId) => {
        if (!confirm("Are you sure you want to delete this subject?")) return;
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/subjects/${subjectId}`, { method: 'DELETE' });
            if (res.ok) {
                fetchSubjects(); // Refresh
            }
        } catch (err) {
            console.error("Failed to delete subject", err);
        }
    };

    const handleDeptFormChange = (e) => {
        const { name, value } = e.target;
        setDeptFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCurrFormChange = (e) => {
        const { name, value, type } = e.target;
        setCurrFormData(prev => ({ ...prev, [name]: type === 'number' ? Number(value) : value }));
    };

    const handleSemFormChange = (e) => {
        const { name, value } = e.target;
        setSemFormData(prev => ({ ...prev, [name]: Number(value) }));
    };

    const handleSaveDepartment = async () => {
        try {
            const res = await fetch('http://127.0.0.1:8000/api/departments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(deptFormData)
            });
            if (res.ok) {
                const data = await res.json();
                setIsDeptModalOpen(false);
                setDeptFormData({ name: '', code: '', plan: 'free' });
                await fetchDepartments();
                setSelectedDeptId(data.id);
            }
        } catch (err) {
            console.error("Failed to save department", err);
        }
    };

    const handleSaveCurriculum = async () => {
        if (!selectedDeptId) return;
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/departments/${selectedDeptId}/curriculum`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currFormData)
            });
            if (res.ok) {
                const data = await res.json();
                setIsCurrModalOpen(false);
                setCurrFormData({ batch_year: new Date().getFullYear(), program_name: '', total_semesters: 8 });
                await fetchCurriculum();
                setSelectedCurriculumId(data.id);
            }
        } catch (err) {
            console.error("Failed to save curriculum", err);
        }
    };

    const handleSaveSemester = async () => {
        if (!selectedCurriculumId) return;
        try {
            const res = await fetch(`http://127.0.0.1:8000/api/curriculum/${selectedCurriculumId}/semesters`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(semFormData)
            });
            if (res.ok) {
                const data = await res.json();
                setIsSemModalOpen(false);
                setSemFormData({ number: semesters.length + 2 });
                await fetchSubjects();
                setActiveTab(data.number);
            }
        } catch (err) {
            console.error("Failed to save semester", err);
        }
    };

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
        }));
    };

    return (
        <div className="subjects-container premium-theme">
            {/* Header */}
            <div className="subjects-header">
                <div className="subjects-title">
                    <h1>Subjects & Curriculum</h1>
                    <p>Manage program structures, courses, and elective groups</p>
                </div>
                
                <div className="subjects-controls">
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <select 
                            className="premium-select"
                            value={selectedDeptId || ''}
                            onChange={(e) => setSelectedDeptId(e.target.value)}
                        >
                            {departments.map(dept => (
                                <option key={dept.id} value={dept.id}>
                                    {dept.name} ({dept.code})
                                </option>
                            ))}
                        </select>
                        <button className="icon-btn" title="Add Department" onClick={() => setIsDeptModalOpen(true)}>
                            <Plus size={18} />
                        </button>
                        <button className="icon-btn delete" title="Delete Department" onClick={handleDeleteDepartment} disabled={!selectedDeptId}>
                            <Trash2 size={18} />
                        </button>
                    </div>

                    <button className="premium-btn" onClick={() => setIsCurrModalOpen(true)} disabled={!selectedDeptId}>
                        <Plus size={18} />
                        <span>Add Curriculum</span>
                    </button>

                    <button className="premium-btn" onClick={() => handleOpenModal()} disabled={!selectedCurriculumId}>
                        <Plus size={18} />
                        <span>Add Subject</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading curriculum data...</p>
                </div>
            ) : !selectedCurriculumId ? (
                <div className="loading-state">
                    <BookOpen size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
                    <p>No curriculum data found for this department. Please add a curriculum first.</p>
                </div>
            ) : (
                <>
                    {/* Curriculum Summary */}
                    <div className="curriculum-summary">
                        <div className="summary-card">
                            <div className="summary-icon"><Target /></div>
                            <div className="summary-info">
                                <h3>Total Credits</h3>
                                <p>
                                    {semesters.reduce((acc, sem) => acc + (sem.total_credits || 0), 0)}
                                </p>
                            </div>
                        </div>
                        <div className="summary-card">
                            <div className="summary-icon"><Layers /></div>
                            <div className="summary-info">
                                <h3>Total Marks</h3>
                                <p>
                                    {semesters.reduce((acc, sem) => acc + (sem.total_marks || 0), 0)}
                                </p>
                            </div>
                        </div>
                        <div className="summary-card">
                            <div className="summary-icon"><BookMarked /></div>
                            <div className="summary-info">
                                <h3>Total Subjects</h3>
                                <p>
                                    {semesters.reduce((acc, sem) => acc + (sem.subjects?.length || 0), 0)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Semester Tabs */}
                    <div className="semester-tabs" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {semesters.map(sem => (
                            <button 
                                key={sem.id}
                                className={`tab-btn ${activeTab === sem.number ? 'active' : ''}`}
                                onClick={() => setActiveTab(sem.number)}
                            >
                                Semester {sem.number}
                            </button>
                        ))}
                        <button className="icon-btn" onClick={() => setIsSemModalOpen(true)} title="Add Semester">
                <Plus size={16} />
                        </button>
                    </div>

                    {/* Subjects Table */}
                    {activeSemester ? (
                        <div className="table-container">
                            <table className="subjects-table">
                                <thead>
                                    <tr>
                                        <th>Code & Name</th>
                                        <th>Type</th>
                                        <th>L-T-P</th>
                                        <th>Marks (CIA/TEE)</th>
                                        <th>Credits</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(activeSemester.subjects || []).filter(s => !s.is_elective_group).map(subject => (
                                        <tr key={subject.id}>
                                            <td data-label="Code & Name">
                                                <span className="subject-code">{subject.code}</span>
                                                <span className="subject-name">{subject.name}</span>
                                            </td>
                                            <td data-label="Type">
                                                <span className="subject-type">{subject.type}</span>
                                            </td>
                                            <td data-label="L-T-P">
                                                {subject.l}-{subject.t}-{subject.p}
                                            </td>
                                            <td data-label="Marks (CIA/TEE)">
                                                <span className="metric-pill">
                                                    {subject.cia} / {subject.tee} = {subject.total}
                                                </span>
                                            </td>
                                            <td data-label="Credits">
                                                <strong>{subject.credits}</strong>
                                            </td>
                                            <td data-label="Actions" style={{ textAlign: 'right' }}>
                                                <div className="action-buttons">
                                                    <button className="icon-btn" onClick={() => handleOpenModal(subject)}>
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button className="icon-btn danger" onClick={() => handleDeleteSubject(subject.id)}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Elective Groups */}
                                    {activeSemester.elective_groups && activeSemester.elective_groups.map(group => {
                                        const groupSubject = (activeSemester.subjects || []).find(s => s.code === group.code);
                                        return (
                                            <React.Fragment key={group.id}>
                                                <tr className="elective-group-row">
                                                    <td colSpan="6" style={{ padding: '24px' }}>
                                                        <div className="elective-badge">
                                                            <Layers size={14} /> {groupSubject?.type || 'ELECTIVE'}
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div>
                                                                <span className="subject-code">{group.code}</span>
                                                                <span className="subject-name" style={{ fontSize: '1.1rem', marginTop: '8px' }}>
                                                                    {group.title}
                                                                </span>
                                                            </div>
                                                            {groupSubject && (
                                                                <div style={{ display: 'flex', gap: '24px', alignItems: 'center', textAlign: 'center' }}>
                                                                    <div>
                                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>L-T-P</div>
                                                                        <strong>{groupSubject.l}-{groupSubject.t}-{groupSubject.p}</strong>
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Credits</div>
                                                                        <strong>{groupSubject.credits}</strong>
                                                                    </div>
                                                                    <div className="action-btns">
                                                                        <button className="icon-btn" title="Edit" onClick={() => handleOpenModal(groupSubject)}>
                                                                            <Edit3 size={16} />
                                                                        </button>
                                                                        <button className="icon-btn delete" title="Delete" onClick={() => handleDeleteSubject(groupSubject.id)}>
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="elective-options">
                                                            {group.options.map(opt => (
                                                                <div key={opt.id} className="elective-option">
                                                                    <div className="option-label">{opt.label}</div>
                                                                    <div className="option-name">{opt.name}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="loading-state" style={{ marginTop: '2rem' }}>
                            <BookOpen size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
                            <p>No semesters added yet. Click + to add a semester.</p>
                        </div>
                    )}
                </>
            )}

            {/* Form Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</h2>
                            <button className="icon-btn" onClick={() => setIsModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body form-grid">
                            <div className="form-group">
                                <label>Course Code</label>
                                <input type="text" className="form-input" name="course_code" value={formData.course_code} onChange={handleFormChange} />
                            </div>
                            <div className="form-group">
                                <label>Course Type</label>
                                <input type="text" className="form-input" name="course_type" value={formData.course_type} onChange={handleFormChange} />
                            </div>
                            <div className="form-group full-width">
                                <label>Course Name</label>
                                <input type="text" className="form-input" name="course_name" value={formData.course_name} onChange={handleFormChange} />
                            </div>
                            
                            <div className="form-group">
                                <label>Lecture (L)</label>
                                <input type="number" className="form-input" name="l" value={formData.l} onChange={handleFormChange} />
                            </div>
                            <div className="form-group">
                                <label>Credits</label>
                                <input type="number" step="0.5" className="form-input" name="credits" value={formData.credits} onChange={handleFormChange} />
                            </div>

                            <div className="form-group">
                                <label>Tutorial (T)</label>
                                <input type="number" className="form-input" name="t" value={formData.t} onChange={handleFormChange} />
                            </div>
                            <div className="form-group">
                                <label>Practical (P)</label>
                                <input type="number" className="form-input" name="p" value={formData.p} onChange={handleFormChange} />
                            </div>

                            <div className="form-group">
                                <label>CIA Marks</label>
                                <input type="number" className="form-input" name="cia_marks" value={formData.cia_marks} onChange={handleFormChange} />
                            </div>
                            <div className="form-group">
                                <label>TEE Marks</label>
                                <input type="number" className="form-input" name="tee_marks" value={formData.tee_marks} onChange={handleFormChange} />
                            </div>
                            <div className="form-group">
                                <label>Total Marks</label>
                                <input type="number" className="form-input" name="total_marks" value={formData.total_marks} onChange={handleFormChange} />
                            </div>
                            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <input type="checkbox" name="is_elective_group" checked={formData.is_elective_group} onChange={handleFormChange} />
                                <label style={{ margin: 0 }}>Is Elective Group?</label>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="tab-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                            <button className="premium-btn" onClick={handleSaveSubject}>Save Subject</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Department Modal */}
            {isDeptModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2>Add New Department</h2>
                            <button className="icon-btn" onClick={() => setIsDeptModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body form-grid">
                            <div className="form-group full-width">
                                <label>Department Name</label>
                                <input type="text" className="form-input" name="name" value={deptFormData.name} onChange={handleDeptFormChange} placeholder="e.g. Computer Science" />
                            </div>
                            <div className="form-group full-width">
                                <label>Department Code</label>
                                <input type="text" className="form-input" name="code" value={deptFormData.code} onChange={handleDeptFormChange} placeholder="e.g. CSE" />
                            </div>
                            <div className="form-group full-width">
                                <label>Plan</label>
                                <select className="form-input" name="plan" value={deptFormData.plan} onChange={handleDeptFormChange}>
                                    <option value="free">Free</option>
                                    <option value="premium">Premium</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="tab-btn" onClick={() => setIsDeptModalOpen(false)}>Cancel</button>
                            <button className="premium-btn" onClick={handleSaveDepartment}>Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Curriculum Modal */}
            {isCurrModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2>Add Curriculum</h2>
                            <button className="icon-btn" onClick={() => setIsCurrModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body form-grid">
                            <div className="form-group full-width">
                                <label>Batch Year</label>
                                <input type="number" className="form-input" name="batch_year" value={currFormData.batch_year} onChange={handleCurrFormChange} />
                            </div>
                            <div className="form-group">
                                <label>Program Name</label>
                                <input type="text" className="form-input" name="program_name" value={currFormData.program_name} onChange={handleCurrFormChange} placeholder="e.g. B.Tech" />
                            </div>
                            <div className="form-group">
                                <label>Total Semesters to Generate</label>
                                <input type="number" className="form-input" name="total_semesters" value={currFormData.total_semesters} onChange={handleCurrFormChange} min="1" max="10" />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="tab-btn" onClick={() => setIsCurrModalOpen(false)}>Cancel</button>
                            <button className="premium-btn" onClick={handleSaveCurriculum}>Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Semester Modal */}
            {isSemModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '300px' }}>
                        <div className="modal-header">
                            <h2>Add Semester</h2>
                            <button className="icon-btn" onClick={() => setIsSemModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body form-grid">
                            <div className="form-group full-width">
                                <label>Semester Number</label>
                                <input type="number" className="form-input" name="number" value={semFormData.number} onChange={handleSemFormChange} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="tab-btn" onClick={() => setIsSemModalOpen(false)}>Cancel</button>
                            <button className="premium-btn" onClick={handleSaveSemester}>Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
