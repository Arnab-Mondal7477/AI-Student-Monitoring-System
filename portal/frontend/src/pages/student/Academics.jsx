import React, { useState } from 'react';
import { Book, Search, Download } from 'lucide-react';

const StudentAcademics = () => {
  const [showResults, setShowResults] = useState(false);

  // Mock data for the table after clicking "Search"
  const mockResources = [
    { 
      id: 1, 
      resourceType: 'Academic Syllabus', 
      teacher: 'Academic Admin', 
      courseCode: 'CS101', 
      module: 'Module 1', 
      uploadDate: '04-Sep-2024', 
      attachment1: 'B.Tech.(CSE) Semester-1.pdf',
      attachment2: ''
    },
    { 
      id: 2, 
      resourceType: 'Lecture Notes', 
      teacher: 'Prof. Alan Turing', 
      courseCode: 'CS102', 
      module: 'Module 3', 
      uploadDate: '10-Sep-2024', 
      attachment1: 'Intro_to_Algorithms.pdf',
      attachment2: 'Code_Samples.zip'
    }
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    setShowResults(true);
  };

  return (
    <div>
      <header className="header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1>Academic Resources</h1>
          <p>Search and download your course materials, syllabus, and lecture notes</p>
        </div>
      </header>

      {/* Filter Panel */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div className="sidebar-icon-wrap" style={{ padding: '0.4rem' }}>
            <Book size={20} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Search Resources</h2>
        </div>

        <form onSubmit={handleSearch}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem', alignItems: 'end' }}>
            
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

            {/* Resource Type Dropdown */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Resource Type</label>
              <select className="form-select" defaultValue="Academic Syllabus">
                <option value="Academic Syllabus">Academic Syllabus</option>
                <option value="Lecture Notes">Lecture Notes</option>
                <option value="Assignments">Assignments</option>
                <option value="Previous Year Papers">Previous Year Papers</option>
              </select>
            </div>

            {/* Search Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <button type="submit" className="btn btn-primary" style={{ padding: '0.875rem 3rem', height: '100%' }}>
                <Search size={18} /> Search
              </button>
            </div>

          </div>
        </form>
      </div>

      {/* Results Table */}
      {showResults && (
        <div className="table-container glass-panel animate-fade-in" style={{ animation: 'fadeIn 0.4s ease-in-out' }}>
          <div className="table-header">
            <h2>Resource Files</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: '900px' }}>
              <thead>
                <tr>
                  <th>Resource Type</th>
                  <th>Teacher</th>
                  <th>Course Code</th>
                  <th>Module</th>
                  <th>Upload Date</th>
                  <th>Attachment-1</th>
                  <th>Attachment-2</th>
                </tr>
              </thead>
              <tbody>
                {mockResources.map((resource) => (
                  <tr key={resource.id}>
                    <td style={{ fontWeight: '500' }}>{resource.resourceType}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{resource.teacher}</td>
                    <td>{resource.courseCode}</td>
                    <td>{resource.module}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{resource.uploadDate}</td>
                    <td>
                      {resource.attachment1 ? (
                        <a href="#" className="attachment-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--secondary)', fontWeight: '500', transition: 'all 0.2s' }}>
                          <Download size={16} /> {resource.attachment1}
                        </a>
                      ) : '-'}
                    </td>
                    <td>
                      {resource.attachment2 ? (
                        <a href="#" className="attachment-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--secondary)', fontWeight: '500', transition: 'all 0.2s' }}>
                          <Download size={16} /> {resource.attachment2}
                        </a>
                      ) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {mockResources.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No resources found for the selected criteria.
            </div>
          )}
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .attachment-link:hover {
          color: var(--primary) !important;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default StudentAcademics;
