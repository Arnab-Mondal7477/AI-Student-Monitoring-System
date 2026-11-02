import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Remove any existing theme classes
    document.body.classList.remove('theme-admin', 'theme-teacher', 'theme-student');
    
    // Apply the correct theme based on the user's role
    if (user?.role === 'ADMIN') {
      document.body.classList.add('theme-admin');
    } else if (user?.role === 'TEACHER') {
      document.body.classList.add('theme-teacher');
    } else if (user?.role === 'STUDENT') {
      document.body.classList.add('theme-student');
    }

    // Cleanup when component unmounts
    return () => {
      document.body.classList.remove('theme-admin', 'theme-teacher', 'theme-student');
    };
  }, [user]);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
