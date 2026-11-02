import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { User, MapPin, Navigation, GraduationCap, Users, Shield, Award, CheckCircle } from 'lucide-react';

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

const FormGroup = ({ label, value, as = 'input' }) => (
  <div style={{ marginBottom: '2rem' }}>
    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>
      {label}
    </label>
    <div style={{ 
      background: '#f8fafc', 
      borderRadius: '12px', 
      padding: as === 'textarea' ? '1rem 1.25rem' : '0.85rem 1.25rem', 
      border: '1px solid #e2e8f0',
      minHeight: as === 'textarea' ? '80px' : 'auto',
      display: 'flex',
      alignItems: as === 'textarea' ? 'flex-start' : 'center',
      transition: 'all 0.2s ease',
      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
    }}>
      <span style={{ fontSize: '1.05rem', color: '#0f172a', fontWeight: '600', lineHeight: '1.5' }}>
        {value || <span style={{color: '#94a3b8', fontStyle: 'italic', fontWeight: 500}}>Not provided</span>}
      </span>
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

const StudentProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/student/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfile(res.data.profile || {});
      } catch (error) {
        console.error('Failed to fetch profile', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <div className="loader-container"><div className="loader"></div></div>;

  const data = profile.profile_data || {};
  if (!data.hobbies) data.hobbies = [];

  const grid2Col = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 3rem' };
  const grid3Col = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 2.5rem' };
  const grid4Col = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 2rem' };

  const displayFirstName = data.first_name || (profile?.name ? profile.name.split(' ')[0] : '');
  const displaySurname = data.surname || (profile?.name ? profile.name.split(' ').slice(1).join(' ') : '');

  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '4rem 2rem', 
      color: 'var(--text-main)', 
      fontFamily: "'Inter', -apple-system, sans-serif" 
    }}>
      
      <div style={{ maxWidth: '1300px', margin: '0 auto' }}>
        
        {/* Premium Glassmorphic Header */}
        <div style={{ 
          marginBottom: '4rem', 
          borderRadius: '32px', 
          background: 'var(--card-bg, rgba(255, 255, 255, 0.7))',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--card-border, rgba(255, 255, 255, 0.5))',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'var(--glass-shadow)'
        }}>
          {/* Subtle glow effect */}
          <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, opacity: 0.1, backgroundImage: 'radial-gradient(circle at right center, var(--primary) 0%, transparent 50%)', pointerEvents: 'none' }}></div>
          
          <div style={{ position: 'relative', zIndex: 1, padding: '5rem', display: 'flex', gap: '4rem', alignItems: 'center' }}>
            {/* Left: Avatar with glowing rings */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {/* Glow Behind */}
              <div style={{ position: 'absolute', inset: '-20px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', borderRadius: '50%', opacity: 0.4, filter: 'blur(25px)' }}></div>
              <div style={{ 
                width: '180px', 
                height: '180px', 
                borderRadius: '50%', 
                padding: '6px',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.05) 100%)',
                position: 'relative',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {data.profile_photo_base64 || profile.profile_photo ? (
                    <img src={data.profile_photo_base64 || `http://localhost:5000${profile.profile_photo}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={72} color="var(--text-muted)" />
                  )}
                </div>
              </div>
              
              {/* Floating Verified Badge */}
              <div style={{ 
                position: 'absolute', 
                bottom: '10px', 
                right: '-10px', 
                background: 'var(--card-bg)', 
                border: '1px solid var(--card-border)',
                borderRadius: '50%', 
                padding: '12px',
                backdropFilter: 'blur(10px)',
                boxShadow: 'var(--shadow-md)',
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
                  Student Portal
                </span>
                <span style={{ width: '40px', height: '1px', background: 'rgba(255,255,255,0.2)' }}></span>
                <span style={{ width: '40px', height: '1px', background: 'var(--border-color)' }}></span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '0.05em', fontWeight: 500 }}>Access Level: Standard</span>
              </div>
              
              <h1 style={{ 
                fontSize: '4.5rem', 
                fontWeight: '800', 
                margin: '0 0 1.5rem 0',
                fontFamily: "'Outfit', sans-serif",
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                color: 'var(--text-main)',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.05))'
              }}>
                {displayFirstName} <span style={{ color: 'var(--primary)' }}>{displaySurname}</span>
              </h1>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '3rem', background: 'rgba(255,255,255,0.4)', padding: '1.5rem 2rem', borderRadius: '20px', border: '1px solid var(--card-border)', backdropFilter: 'blur(10px)', width: 'fit-content' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', fontWeight: 700 }}>Student ID</span>
                  <span style={{ color: 'var(--text-main)', fontWeight: 700, fontSize: '1.25rem', fontFamily: "'Inter', sans-serif", letterSpacing: '0.02em' }}>
                    {profile.student_id || 'TBD'}
                  </span>
                </div>
                <div style={{ width: '1px', height: '40px', background: 'var(--border-color)' }}></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-muted)', fontWeight: 700 }}>Status</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 12px var(--success)' }}></div>
                    <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.02em' }}>Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <PremiumSection title="Personal Information" icon={User}>
          <div style={grid3Col}>
            <FormGroup label="First Name" value={displayFirstName} />
            <FormGroup label="Middle Name" value={data.middle_name} />
            <FormGroup label="Surname" value={displaySurname} />
            
            <FormGroup label="Campus" value={data.campus} />
            <FormGroup label="Section" value={profile.section || "Not provided"} />
            <FormGroup label="Student ID" value={profile.student_id || user?.username} />
            <FormGroup label="Batch Name" value={data.batch_name} />
            
            <FormGroup label="University Mail-ID" value={profile.email || data.email} />
            <FormGroup label="Mobile 1" value={data.mobile_1} />
            <FormGroup label="Mobile 2" value={data.mobile_2} />
            
            <FormGroup label="Landline" value={data.landline} />
            <FormGroup label="Date of birth" value={data.dob} />
            <FormGroup label="Place Of Birth" value={data.place_of_birth} />
            
            <FormGroup label="Blood group" value={data.blood_group} />
            <FormGroup label="Height" value={data.height} />
            <FormGroup label="Weight" value={data.weight} />
            
            <FormGroup label="Religion" value={data.religion} />
            <FormGroup label="Nationality" value={data.nationality} />
            <FormGroup label="Caste" value={data.caste} />
            
            <FormGroup label="Student ABC ID" value={data.abc_id} />
            <FormGroup label="Major Disease" value={data.disease} />
            <FormGroup label="Career Goal" value={data.career_goal} />
          </div>
          
          <div style={{ marginTop: '2rem', paddingTop: '2.5rem', borderTop: '1px solid #f1f5f9' }}>
            <FormGroup label="Why Choose This Course" value={data.why_choose} as="textarea" />
            <ChipGroup label="Hobbies & Interests" values={data.hobbies} />
            <FormGroup label="Other Hobbies" value={data.other_hobby} />
          </div>
        </PremiumSection>

        <PremiumSection title="Present Address Details" icon={MapPin}>
          <FormGroup label="Present address" value={data.present_address} as="textarea" />
          <div style={grid4Col}>
            <FormGroup label="City / Town" value={data.present_city} />
            <FormGroup label="P.O" value={data.present_po} />
            <FormGroup label="P.S" value={data.present_ps} />
            <FormGroup label="Area" value={data.present_area} />
            
            <FormGroup label="District" value={data.present_district} />
            <FormGroup label="State" value={data.present_state} />
            <FormGroup label="Pin" value={data.present_pin} />
            <FormGroup label="Aadhar Card No." value={data.present_aadhar} />
          </div>
        </PremiumSection>

        <PremiumSection title="Permanent Address Details" icon={Navigation}>
          <FormGroup label="Permanent address" value={data.permanent_address} as="textarea" />
          <div style={grid4Col}>
            <FormGroup label="City / Town" value={data.permanent_city} />
            <FormGroup label="P.O" value={data.permanent_po} />
            <FormGroup label="P.S" value={data.permanent_ps} />
            <FormGroup label="District" value={data.permanent_district} />
            
            <FormGroup label="State" value={data.permanent_state} />
            <FormGroup label="Pin" value={data.permanent_pin} />
            <FormGroup label="Aadhar Card No." value={data.permanent_aadhar} />
            <FormGroup label="Email" value={data.permanent_email} />
            
            <FormGroup label="Whatsapp No" value={data.whatsapp} />
            <FormGroup label="FB Account No" value={data.fb_account} />
          </div>
        </PremiumSection>

        <PremiumSection title="Qualification Details" icon={GraduationCap}>
          <div style={grid3Col}>
            <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'inline-block', padding: '0.5rem 1.25rem', background: '#0f172a', color: 'white', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '2rem' }}>CLASS X</div>
              <FormGroup label="Institution" value={data.x_institution} />
              <FormGroup label="Board" value={data.x_board} />
              <FormGroup label="If Other" value={data.x_other_board} />
              <FormGroup label="Medium" value={data.x_medium} />
              <FormGroup label="Percentage" value={data.x_percentage} />
              <FormGroup label="Year" value={data.x_year} />
            </div>
            <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'inline-block', padding: '0.5rem 1.25rem', background: '#0f172a', color: 'white', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '2rem' }}>CLASS XII</div>
              <FormGroup label="Institution" value={data.xii_institution} />
              <FormGroup label="Board" value={data.xii_board} />
              <FormGroup label="If Other" value={data.xii_other_board} />
              <FormGroup label="Medium" value={data.xii_medium} />
              <FormGroup label="Percentage" value={data.xii_percentage} />
              <FormGroup label="Year" value={data.xii_year} />
            </div>
            <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'inline-block', padding: '0.5rem 1.25rem', background: '#0f172a', color: 'white', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '2rem' }}>GRADUATION</div>
              <FormGroup label="Institution" value={data.grad_institution} />
              <FormGroup label="Board" value={data.grad_board} />
              <FormGroup label="If Other" value={data.grad_other_board} />
              <FormGroup label="Medium" value={data.grad_medium} />
              <FormGroup label="Percentage" value={data.grad_percentage} />
              <FormGroup label="Year" value={data.grad_year} />
            </div>
          </div>
        </PremiumSection>

        <PremiumSection title="Guardian Details" icon={Users}>
          <div style={{ marginBottom: '3rem', display: 'flex', gap: '2rem', alignItems: 'center', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
               <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Primary Guardian</span>
               <span style={{ padding: '0.5rem 1.5rem', background: '#0f172a', color: 'white', borderRadius: '99px', fontSize: '0.9rem', fontWeight: 700 }}>{data.primary_guardian || 'Not specified'}</span>
            </div>
            <div style={{ width: '1px', height: '30px', background: '#cbd5e1' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
               <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Hostel Boarder</span>
               <span style={{ padding: '0.5rem 1.5rem', background: 'white', border: '1px solid #cbd5e1', color: '#0f172a', borderRadius: '99px', fontSize: '0.9rem', fontWeight: 700, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>{data.hostel_boarder || 'Not specified'}</span>
            </div>
          </div>
          
          <div style={grid2Col}>
            <div style={{ background: '#f8fafc', padding: '2.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'inline-block', padding: '0.5rem 1.25rem', background: '#0f172a', color: 'white', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '2rem' }}>FATHER'S DETAILS</div>
              <FormGroup label="Father's Name" value={data.father_name} />
              <FormGroup label="Father's Mobile" value={data.father_mobile} />
              <FormGroup label="Father's Landline" value={data.father_landline} />
              <FormGroup label="Father's E-Mail" value={data.father_email} />
              <FormGroup label="Father's profession" value={data.father_profession} />
              <FormGroup label="Mention if Other" value={data.father_other_prof} />
            </div>
            <div style={{ background: '#f8fafc', padding: '2.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'inline-block', padding: '0.5rem 1.25rem', background: '#0f172a', color: 'white', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '2rem' }}>MOTHER'S DETAILS</div>
              <FormGroup label="Mother's Name" value={data.mother_name} />
              <FormGroup label="Mother's Contact No" value={data.mother_mobile} />
              <FormGroup label="Mother's E-Mail" value={data.mother_email} />
              <FormGroup label="Mother's profession" value={data.mother_profession} />
              <FormGroup label="Mention if Other" value={data.mother_other_prof} />
            </div>
          </div>
          <div style={{ marginTop: '1rem', paddingTop: '2.5rem', borderTop: '1px solid #f1f5f9' }}>
            <div style={grid2Col}>
              <FormGroup label="No Of Brother(s)" value={data.brothers_count} />
              <FormGroup label="No Of Sister(s)" value={data.sisters_count} />
            </div>
          </div>
        </PremiumSection>
        
        <PremiumSection title="Local Guardian Details" icon={Shield}>
           <div style={grid3Col}>
              <FormGroup label="Local Guardian Name" value={data.local_guardian_name} />
              <FormGroup label="Local Guardian Mobile" value={data.local_guardian_mobile} />
              <FormGroup label="Local Guardian Contact" value={data.local_guardian_contact} />
           </div>
        </PremiumSection>

        <PremiumSection title="Awards & Achievements" icon={Award}>
          <div style={grid2Col}>
            <div style={{ background: '#f8fafc', padding: '2.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'inline-block', padding: '0.5rem 1.25rem', background: '#0f172a', color: 'white', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '2rem' }}>ACADEMIC AWARDS</div>
              <FormGroup label="Award 1" value={data.acad_award_1} />
              <FormGroup label="Award 2" value={data.acad_award_2} />
              <FormGroup label="Award 3" value={data.acad_award_3} />
              <FormGroup label="Award 4" value={data.acad_award_4} />
            </div>
            <div style={{ background: '#f8fafc', padding: '2.5rem', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'inline-block', padding: '0.5rem 1.25rem', background: '#0f172a', color: 'white', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '2rem' }}>NON-ACADEMIC AWARDS</div>
              <FormGroup label="Award 1" value={data.non_acad_award_1} />
              <FormGroup label="Award 2" value={data.non_acad_award_2} />
              <FormGroup label="Award 3" value={data.non_acad_award_3} />
              <FormGroup label="Award 4" value={data.non_acad_award_4} />
            </div>
          </div>
        </PremiumSection>
      </div>
    </div>
  );
};

export default StudentProfile;
