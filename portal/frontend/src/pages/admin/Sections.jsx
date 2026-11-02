import React, { useState, useEffect } from 'react';
import { 
    Building2, Users, GraduationCap, Plus, Trash2, Edit3, X, CheckCircle
} from 'lucide-react';
import axios from 'axios';
import '../../subjects-premium.css';

export default function Sections() {
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '' });

    const fetchSections = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/admin/sections', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSections(res.data);
        } catch (err) {
            console.error("Failed to fetch sections", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSections();
    }, []);

    const handleOpenModal = () => {
        setFormData({ name: '' });
        setIsModalOpen(true);
    };

    const handleSaveSection = async () => {
        if (!formData.name) return;
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/admin/sections', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsModalOpen(false);
            fetchSections();
        } catch (err) {
            console.error("Failed to save section", err);
            alert(err.response?.data?.error || 'Failed to add section');
        }
    };

    const handleDeleteSection = async (id) => {
        if (!window.confirm("Are you sure you want to delete this section?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/admin/sections/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchSections();
        } catch (err) {
            console.error("Failed to delete section", err);
            alert('Failed to delete section');
        }
    };

    const totalStudents = sections.reduce((acc, sec) => acc + (sec._count?.students || 0), 0);
    const totalTeachers = sections.reduce((acc, sec) => acc + (sec.teachers?.length || 0), 0);

    return (
        <div className="subjects-container premium-theme">
            {/* Header */}
            <div className="subjects-header">
                <div className="subjects-title">
                    <h1>Sections & Classes</h1>
                    <p>Manage student sections and class allocations</p>
                </div>
                
                <div className="subjects-controls">
                    <button className="premium-btn" onClick={handleOpenModal}>
                        <Plus size={18} />
                        <span>Add Section</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading sections data...</p>
                </div>
            ) : (
                <>
                    {/* Summary */}
                    <div className="curriculum-summary">
                        <div className="summary-card">
                            <div className="summary-icon"><Building2 /></div>
                            <div className="summary-info">
                                <h3>Total Sections</h3>
                                <p>{sections.length}</p>
                            </div>
                        </div>
                        <div className="summary-card">
                            <div className="summary-icon"><Users /></div>
                            <div className="summary-info">
                                <h3>Total Students</h3>
                                <p>{totalStudents}</p>
                            </div>
                        </div>
                        <div className="summary-card">
                            <div className="summary-icon"><GraduationCap /></div>
                            <div className="summary-info">
                                <h3>Assigned Teachers</h3>
                                <p>{totalTeachers}</p>
                            </div>
                        </div>
                    </div>

                    {sections.length > 0 ? (
                        <div className="table-container">
                            <table className="subjects-table">
                                <thead>
                                    <tr>
                                        <th>Section Name</th>
                                        <th>Total Students</th>
                                        <th>Assigned Teachers</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sections.map(section => (
                                        <tr key={section.id}>
                                            <td data-label="Section Name">
                                                <span className="subject-code">{section.name}</span>
                                            </td>
                                            <td data-label="Total Students">
                                                <span className="metric-pill">
                                                    <Users size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle', position: 'relative', top: '-1px' }} />
                                                    {section._count?.students || 0}
                                                </span>
                                            </td>
                                            <td data-label="Assigned Teachers">
                                                <strong>{section.teachers?.length || 0}</strong> Teacher(s)
                                            </td>
                                            <td data-label="Actions" style={{ textAlign: 'right' }}>
                                                <div className="action-buttons" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <button className="icon-btn danger" title="Delete Section" onClick={() => handleDeleteSection(section.id)}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="loading-state" style={{ marginTop: '2rem' }}>
                            <Building2 size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
                            <p>No sections created yet. Click + to add a section.</p>
                        </div>
                    )}
                </>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h2>Add New Section</h2>
                            <button className="icon-btn" onClick={() => setIsModalOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body form-grid">
                            <div className="form-group full-width">
                                <label>Section Name</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    value={formData.name} 
                                    onChange={(e) => setFormData({ name: e.target.value })} 
                                    placeholder="e.g. B.Tech CSE Section A" 
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="tab-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
                            <button className="premium-btn" onClick={handleSaveSection}>Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
