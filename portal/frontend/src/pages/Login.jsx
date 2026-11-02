import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, ArrowRight, Eye, EyeOff, User, Lock } from 'lucide-react';


const Login = () => {
  const [role, setRole] = useState('STUDENT');
  const [username, setUsername] = useState('STU001');
  const [password, setPassword] = useState('Arnab@2609');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    if (newRole === 'STUDENT') {
      setUsername('STU001');
      setPassword('Arnab@2609');
    } else if (newRole === 'TEACHER') {
      setUsername('Dr. XYZ');
      setPassword('Dr.XYZ@2609');
    } else {
      setUsername('System Administrator');
      setPassword('SystemAdministrator@2609');
    }
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: password.trim(), role })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        login(data.user, data.token);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Server error. Please try again later.');
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '2rem',
      backgroundColor: '#f8fafc',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: "'Inter', -apple-system, sans-serif"
    }}>
      {/* Animated/Complex Gradient Mesh Background */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.8 }}>
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '60%', height: '140%', background: 'radial-gradient(ellipse at center, rgba(79, 70, 229, 0.4) 0%, transparent 60%)', filter: 'blur(60px)' }}></div>
        <div style={{ position: 'absolute', bottom: '-30%', right: '-10%', width: '70%', height: '120%', background: 'radial-gradient(ellipse at center, rgba(147, 51, 234, 0.3) 0%, transparent 60%)', filter: 'blur(60px)' }}></div>
        <div style={{ position: 'absolute', top: '10%', right: '20%', width: '30%', height: '40%', background: 'radial-gradient(circle at center, rgba(14, 165, 233, 0.3) 0%, transparent 50%)', filter: 'blur(40px)' }}></div>
        {/* Subtle Grain Overlay for texture */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22 opacity=%220.04%22/%3E%3C/svg%3E")', mixBlendMode: 'overlay' }}></div>
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '1100px', display: 'flex', flexWrap: 'wrap', borderRadius: '32px', background: 'rgba(255, 255, 255, 0.7)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.5)', boxShadow: '0 20px 40px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
        
        {/* LEFT SIDE - BRANDING */}
        <div 
          style={{ 
            flex: '1', 
            minWidth: '400px',
            color: '#0F172A', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            padding: '4rem',
            position: 'relative',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.2) 100%)'
          }}
          className="login-brand-panel"
        >
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '4rem' }}>
              <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', padding: '0.75rem', borderRadius: '0.75rem', boxShadow: '0 8px 16px rgba(79, 70, 229, 0.25)' }}>
                <GraduationCap size={28} color="white" />
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.025em', fontFamily: "'Outfit', sans-serif" }}>AI Smart CSE</span>
            </div>
            
            <h1 style={{ fontSize: '3.5rem', fontWeight: '800', lineHeight: '1.1', letterSpacing: '-0.03em', marginBottom: '1.5rem', fontFamily: "'Outfit', sans-serif", filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.05))' }}>
              Empowering the next generation of innovators.
            </h1>
            <p style={{ fontSize: '1.125rem', color: '#475569', maxWidth: '480px', lineHeight: '1.6' }}>
              Access our state-of-the-art learning management system, powered by AI to monitor, assist, and elevate your academic journey.
            </p>
          </div>

          <div style={{ position: 'relative', zIndex: 1, color: '#64748B', fontSize: '0.875rem' }}>
            &copy; {new Date().getFullYear()} AI Smart CSE Academy.
          </div>
        </div>

        {/* RIGHT SIDE - LOGIN FORM */}
        <div 
          style={{ 
            flex: '1', 
            minWidth: '350px',
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '4rem 2rem',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            position: 'relative'
          }}
        >
          <div className="animate-fade-in" style={{ width: '100%', maxWidth: '380px' }}>
            
            <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
              <h2 style={{ 
                fontSize: '2.25rem', 
                fontWeight: '800', 
                marginBottom: '0.5rem', 
                letterSpacing: '-0.03em', 
                fontFamily: "'Outfit', sans-serif",
                background: 'linear-gradient(135deg, #0F172A 0%, var(--primary) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block'
              }}>
                Welcome back
              </h2>
              <p style={{ color: '#64748B', fontSize: '1rem' }}>
                Please enter your details to sign in.
              </p>
            </div>

            {/* Premium Role Segmented Control */}
            <div style={{ display: 'flex', background: '#f8fafc', borderRadius: '99px', padding: '0.35rem', marginBottom: '2.5rem', border: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
              {[
                { id: 'STUDENT', label: 'Student' },
                { id: 'TEACHER', label: 'Teacher' },
                { id: 'ADMIN', label: 'Admin' }
              ].map((r) => (
                <button 
                  key={r.id}
                  type="button"
                  onClick={() => handleRoleChange(r.id)}
                  style={{ 
                    flex: 1, 
                    padding: '0.65rem 0', 
                    border: 'none', 
                    background: role === r.id ? '#ffffff' : 'transparent', 
                    color: role === r.id ? 'var(--primary)' : '#64748B', 
                    fontWeight: role === r.id ? '700' : '500', 
                    cursor: 'pointer', 
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    fontSize: '0.9rem',
                    borderRadius: '99px',
                    boxShadow: role === r.id ? '0 4px 10px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {error && (
              <div style={{ padding: '0.75rem 1rem', borderRadius: '0.5rem', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Username
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
                    <User size={18} />
                  </div>
                  <input 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)}
                    required 
                    style={{
                      width: '100%',
                      padding: '0.85rem 1rem 0.85rem 3rem',
                      borderRadius: '1rem',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#f8fafc',
                      color: '#0F172A',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.backgroundColor = '#ffffff'; e.target.style.boxShadow = '0 0 0 4px var(--primary-light)'; e.target.previousSibling.style.color = 'var(--primary)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.backgroundColor = '#f8fafc'; e.target.style.boxShadow = 'none'; e.target.previousSibling.style.color = '#94a3b8'; }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '2.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', color: '#475569', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>
                    <Lock size={18} />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                    style={{
                      width: '100%',
                      padding: '0.85rem 3rem 0.85rem 3rem',
                      borderRadius: '1rem',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#f8fafc',
                      color: '#0F172A',
                      fontSize: '0.95rem',
                      outline: 'none',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--primary)'; e.target.style.backgroundColor = '#ffffff'; e.target.style.boxShadow = '0 0 0 4px var(--primary-light)'; e.target.previousSibling.style.color = 'var(--primary)'; }}
                    onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.backgroundColor = '#f8fafc'; e.target.style.boxShadow = 'none'; e.target.previousSibling.style.color = '#94a3b8'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94A3B8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0.25rem',
                      borderRadius: '0.5rem',
                      transition: 'color 0.2s, background-color 0.2s'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.color = '#0F172A'; e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
                    onMouseOut={(e) => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                style={{ 
                  width: '100%', 
                  padding: '1rem', 
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '1rem', 
                  fontSize: '1rem', 
                  fontWeight: '700', 
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 10px 25px -5px var(--primary-light)'
                }}
                onMouseOver={(e) => { 
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 20px 25px -5px var(--primary-light)';
                  e.currentTarget.querySelector('svg').style.transform = 'translateX(4px)';
                }}
                onMouseOut={(e) => { 
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 25px -5px var(--primary-light)';
                  e.currentTarget.querySelector('svg').style.transform = 'translateX(0)';
                }}
              >
                Sign in to account <ArrowRight size={18} style={{ transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
              </button>
            </form>
          </div>
        </div>
      </div>
      
      {/* Basic responsive style directly injected */}
      <style>{`
        @media (max-width: 768px) {
          .login-brand-panel {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
