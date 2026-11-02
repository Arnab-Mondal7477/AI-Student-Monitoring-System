import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import StudentDashboard from './pages/student/Dashboard';
import TeacherDashboard from './pages/teacher/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import AdminStudentManagement from './pages/admin/Students';
import AdminTimetable from './pages/admin/Timetable';
import AdminViolations from './pages/admin/Violations';
import AdminReports from './pages/admin/Reports';
import AdminTeachers from './pages/admin/Teachers';
import AdminSubjects from './pages/admin/Subjects';
import AdminSections from './pages/admin/Sections';
import StudentViolations from './pages/student/Violations';
import TeacherViolations from './pages/teacher/Violations';
import TeacherProfile from './pages/teacher/Profile';
import TeacherAttendance from './pages/teacher/Attendance';
import TeacherClasses from './pages/teacher/Classes';

import Placeholder from './pages/Placeholder';
import StudentProfile from './pages/student/Profile';
import StudentAttendance from './pages/student/Attendance';
import StudentAcademics from './pages/student/Academics';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="loader-container"><div className="loader"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== allowedRole) {
    // Redirect to their respective dashboard if they try to access the wrong role route
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'TEACHER') return <Navigate to="/teacher/dashboard" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }

  return children;
};

function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="loader-container"><div className="loader"></div></div>;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          user ? (
            <Navigate to={
              user.role === 'ADMIN' ? '/admin/dashboard' :
              user.role === 'TEACHER' ? '/teacher/dashboard' : 
              '/student/dashboard'
            } replace />
          ) : <Login />
        } />
        
        {/* All Protected Routes sharing the same Sidebar Layout */}
        <Route element={<Layout />}>
          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRole="ADMIN"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/students" element={<ProtectedRoute allowedRole="ADMIN"><AdminStudentManagement /></ProtectedRoute>} />
          <Route path="/admin/timetable" element={<ProtectedRoute allowedRole="ADMIN"><AdminTimetable /></ProtectedRoute>} />
          <Route path="/admin/violations" element={<ProtectedRoute allowedRole="ADMIN"><AdminViolations /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute allowedRole="ADMIN"><AdminReports /></ProtectedRoute>} />
          <Route path="/admin/teachers" element={<ProtectedRoute allowedRole="ADMIN"><AdminTeachers /></ProtectedRoute>} />
          {/* Admin Placeholders */}
          <Route path="/admin/sections" element={<ProtectedRoute allowedRole="ADMIN"><AdminSections /></ProtectedRoute>} />
          <Route path="/admin/subjects" element={<ProtectedRoute allowedRole="ADMIN"><AdminSubjects /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute allowedRole="ADMIN"><Placeholder title="System Settings" /></ProtectedRoute>} />

          {/* Teacher Routes */}
          <Route path="/teacher/dashboard" element={<ProtectedRoute allowedRole="TEACHER"><TeacherDashboard /></ProtectedRoute>} />
          <Route path="/teacher/violations" element={<ProtectedRoute allowedRole="TEACHER"><TeacherViolations /></ProtectedRoute>} />
          {/* Teacher Placeholders */}
          <Route path="/teacher/profile" element={<ProtectedRoute allowedRole="TEACHER"><TeacherProfile /></ProtectedRoute>} />
          <Route path="/teacher/students" element={<ProtectedRoute allowedRole="TEACHER"><Placeholder title="My Students" /></ProtectedRoute>} />
          <Route path="/teacher/classes" element={<ProtectedRoute allowedRole="TEACHER"><TeacherClasses /></ProtectedRoute>} />
          <Route path="/teacher/attendance" element={<ProtectedRoute allowedRole="TEACHER"><TeacherAttendance /></ProtectedRoute>} />
          <Route path="/teacher/notifications" element={<ProtectedRoute allowedRole="TEACHER"><Placeholder title="Notifications" /></ProtectedRoute>} />

          {/* Student Routes */}
          <Route path="/student/dashboard" element={<ProtectedRoute allowedRole="STUDENT"><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/violations" element={<ProtectedRoute allowedRole="STUDENT"><StudentViolations /></ProtectedRoute>} />
          {/* Student Placeholders */}
          <Route path="/student/profile" element={<ProtectedRoute allowedRole="STUDENT"><StudentProfile /></ProtectedRoute>} />
          <Route path="/student/attendance" element={<ProtectedRoute allowedRole="STUDENT"><StudentAttendance /></ProtectedRoute>} />
          <Route path="/student/academics" element={<ProtectedRoute allowedRole="STUDENT"><StudentAcademics /></ProtectedRoute>} />
          <Route path="/student/notifications" element={<ProtectedRoute allowedRole="STUDENT"><Placeholder title="Notifications" /></ProtectedRoute>} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
