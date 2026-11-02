import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, LayoutDashboard, User, CalendarCheck, Book, Bell, Settings, LogOut, Users, AlertTriangle, GraduationCap, Building2, Calendar, FileText
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const studentLinks = [
    { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'My Profile', path: '/student/profile', icon: User },
    { name: 'Attendance', path: '/student/attendance', icon: CalendarCheck },
    { name: 'Academics', path: '/student/academics', icon: Book },
    { name: 'Violations', path: '/student/violations', icon: AlertTriangle },
    { name: 'Notifications', path: '/student/notifications', icon: Bell },
  ];

  const teacherLinks = [
    { name: 'Live Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
    { name: 'My Profile', path: '/teacher/profile', icon: User },
    { name: 'Classes', path: '/teacher/classes', icon: Calendar },
    { name: 'Students', path: '/teacher/students', icon: Users },
    { name: 'Attendance', path: '/teacher/attendance', icon: CalendarCheck },
    { name: 'Evidence', path: '/teacher/violations', icon: AlertTriangle },
    { name: 'Notifications', path: '/teacher/notifications', icon: Bell },
  ];

  const adminLinks = [
    { name: 'Command Center', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Students', path: '/admin/students', icon: Users },
    { name: 'Teachers', path: '/admin/teachers', icon: GraduationCap },
    { name: 'Sections', path: '/admin/sections', icon: Building2 },
    { name: 'Subjects', path: '/admin/subjects', icon: BookOpen },
    { name: 'Timetable', path: '/admin/timetable', icon: Calendar },
    { name: 'AI Violations', path: '/admin/violations', icon: AlertTriangle },
    { name: 'Reports', path: '/admin/reports', icon: FileText },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  let links = [];
  if (user?.role === 'STUDENT') links = studentLinks;
  else if (user?.role === 'TEACHER') links = teacherLinks;
  else if (user?.role === 'ADMIN') links = adminLinks;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-icon-wrap">
          <GraduationCap size={24} />
        </div>
        AI Academy
      </div>

      <nav className="sidebar-nav">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname.startsWith(link.path);
          return (
            <div 
              key={link.name}
              className={`sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => navigate(link.path)}
            >
              <Icon size={20} />
              {link.name}
            </div>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ padding: '0.5rem 1rem', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Logged in as <strong style={{color: 'var(--text-main)'}}>{user?.username}</strong>
        </div>
        <div className="sidebar-link" onClick={handleLogout} style={{ color: 'var(--danger)' }}>
          <LogOut size={20} />
          Logout
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
