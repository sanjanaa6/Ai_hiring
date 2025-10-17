import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import apiService from '../services/apiService';
import { 
  User, Mail, Phone, MapPin, Globe, Linkedin, Github,
  Briefcase, GraduationCap, Award, Upload, Save, Edit2, X, DollarSign, Calendar
} from 'lucide-react';

const CandidateProfileNew = () => {
  const { user, updateUser } = useAuth();
  const { isDarkMode } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('personal'); // 'personal', 'professional', 'preferences'
  
  const [formData, setFormData] = useState({
    // Personal
    name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    avatar: '',
    linkedin: '',
    github: '',
    website: '',
    
    // Professional
    skills: [],
    experience: '',
    education: '',
    resume: '',
    certifications: [],
    
    // Candidate Preferences
    expectedSalary: '',
    availability: '',
    workPreference: '',
    jobPreferences: [],
    languages: []
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.profile?.phone || '',
        location: user.profile?.location || '',
        bio: user.profile?.bio || '',
        avatar: user.profile?.avatar || '',
        linkedin: user.profile?.linkedin || '',
        github: user.profile?.github || '',
        website: user.profile?.website || '',
        
        skills: user.profile?.skills || [],
        experience: user.profile?.experience || '',
        education: user.profile?.education || '',
        resume: user.profile?.resume || '',
        certifications: user.candidateProfile?.certifications || [],
        
        expectedSalary: user.candidateProfile?.expectedSalary || '',
        availability: user.candidateProfile?.availability || '',
        workPreference: user.candidateProfile?.workPreference || '',
        jobPreferences: user.candidateProfile?.jobPreferences || [],
        languages: user.candidateProfile?.languages || []
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (field, value) => {
    const array = value.split(',').map(item => item.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, [field]: array }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await apiService.updateProfile({
        name: formData.name,
        profile: {
          phone: formData.phone,
          location: formData.location,
          bio: formData.bio,
          avatar: formData.avatar,
          linkedin: formData.linkedin,
          github: formData.github,
          website: formData.website,
          skills: formData.skills,
          experience: formData.experience,
          education: formData.education,
          resume: formData.resume
        },
        candidateProfile: {
          expectedSalary: formData.expectedSalary,
          availability: formData.availability,
          workPreference: formData.workPreference,
          jobPreferences: formData.jobPreferences,
          languages: formData.languages,
          certifications: formData.certifications
        }
      });

      if (result.success) {
        updateUser(result.data);
        setIsEditing(false);
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'professional', label: 'Professional', icon: Briefcase },
    { id: 'preferences', label: 'Job Preferences', icon: Award }
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} pt-24`}>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className={`rounded-lg shadow-lg p-6 mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-10 h-10" />
                )}
              </div>
              <div>
                <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formData.name || 'Your Profile'}
                </h1>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {formData.location || 'Location not set'}
                </p>
              </div>
            </div>
            <button
              onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                isEditing 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white transition-colors`}
            >
              {isEditing ? <><X className="w-4 h-4" /> Cancel</> : <><Edit2 className="w-4 h-4" /> Edit Profile</>}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className={`rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex border-b border-gray-700">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 px-6 py-4 flex items-center justify-center gap-2 font-medium transition-colors ${
                    activeTab === tab.id
                      ? isDarkMode 
                        ? 'bg-gray-700 text-blue-400 border-b-2 border-blue-400'
                        : 'bg-gray-100 text-blue-600 border-b-2 border-blue-600'
                      : isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {/* Personal Info Tab */}
            {activeTab === 'personal' && (
              <div className="space-y-6">
                <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Personal Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField label="Full Name" name="name" value={formData.name} onChange={handleChange} disabled={!isEditing} isDarkMode={isDarkMode} icon={User} />
                  <InputField label="Email" name="email" value={formData.email} onChange={handleChange} disabled={true} isDarkMode={isDarkMode} icon={Mail} />
                  <InputField label="Phone" name="phone" value={formData.phone} onChange={handleChange} disabled={!isEditing} isDarkMode={isDarkMode} icon={Phone} />
                  <InputField label="Location" name="location" value={formData.location} onChange={handleChange} disabled={!isEditing} isDarkMode={isDarkMode} icon={MapPin} />
                  <InputField label="LinkedIn" name="linkedin" value={formData.linkedin} onChange={handleChange} disabled={!isEditing} isDarkMode={isDarkMode} icon={Linkedin} />
                  <InputField label="GitHub" name="github" value={formData.github} onChange={handleChange} disabled={!isEditing} isDarkMode={isDarkMode} icon={Github} />
                  <InputField label="Website" name="website" value={formData.website} onChange={handleChange} disabled={!isEditing} isDarkMode={isDarkMode} icon={Globe} />
                </div>
                
                <TextAreaField label="Bio" name="bio" value={formData.bio} onChange={handleChange} disabled={!isEditing} isDarkMode={isDarkMode} rows={4} placeholder="Tell us about yourself..." />
              </div>
            )}

            {/* Professional Tab */}
            {activeTab === 'professional' && (
              <div className="space-y-6">
                <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Professional Details
                </h2>
                
                <div className="grid grid-cols-1 gap-6">
                  <ArrayField label="Skills (comma-separated)" value={formData.skills.join(', ')} onChange={(e) => handleArrayChange('skills', e.target.value)} disabled={!isEditing} isDarkMode={isDarkMode} placeholder="e.g., JavaScript, React, Node.js" />
                  <TextAreaField label="Experience" name="experience" value={formData.experience} onChange={handleChange} disabled={!isEditing} isDarkMode={isDarkMode} rows={4} placeholder="Describe your work experience..." />
                  <TextAreaField label="Education" name="education" value={formData.education} onChange={handleChange} disabled={!isEditing} isDarkMode={isDarkMode} rows={3} placeholder="Your educational background..." />
                  <ArrayField label="Certifications (comma-separated)" value={formData.certifications.join(', ')} onChange={(e) => handleArrayChange('certifications', e.target.value)} disabled={!isEditing} isDarkMode={isDarkMode} placeholder="e.g., AWS Certified, Google Cloud" />
                  <InputField label="Resume URL" name="resume" value={formData.resume} onChange={handleChange} disabled={!isEditing} isDarkMode={isDarkMode} icon={Upload} placeholder="Link to your resume" />
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Job Preferences
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField label="Expected Salary" name="expectedSalary" value={formData.expectedSalary} onChange={handleChange} disabled={!isEditing} isDarkMode={isDarkMode} icon={DollarSign} placeholder="e.g., $80,000 - $100,000" />
                  <InputField label="Availability" name="availability" value={formData.availability} onChange={handleChange} disabled={!isEditing} isDarkMode={isDarkMode} icon={Calendar} placeholder="e.g., Immediate, 2 weeks notice" />
                  <SelectField label="Work Preference" name="workPreference" value={formData.workPreference} onChange={handleChange} disabled={!isEditing} isDarkMode={isDarkMode} options={['remote', 'onsite', 'hybrid']} />
                </div>
                
                <ArrayField label="Job Preferences (comma-separated)" value={formData.jobPreferences.join(', ')} onChange={(e) => handleArrayChange('jobPreferences', e.target.value)} disabled={!isEditing} isDarkMode={isDarkMode} placeholder="e.g., Full-time, Remote, Startup" />
                <ArrayField label="Languages (comma-separated)" value={formData.languages.join(', ')} onChange={(e) => handleArrayChange('languages', e.target.value)} disabled={!isEditing} isDarkMode={isDarkMode} placeholder="e.g., English, Spanish, French" />
              </div>
            )}

            {/* Save Button */}
            {isEditing && (
              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>Saving...</>
                  ) : (
                    <><Save className="w-5 h-5" /> Save Changes</>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

// Reusable Components
const InputField = ({ label, name, value, onChange, disabled, isDarkMode, icon: Icon, type = 'text', placeholder }) => (
  <div>
    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <Icon className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
        </div>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-2 rounded-lg border ${
          isDarkMode 
            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
        } focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
      />
    </div>
  </div>
);

const TextAreaField = ({ label, name, value, onChange, disabled, isDarkMode, rows = 3, placeholder }) => (
  <div>
    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
      {label}
    </label>
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      rows={rows}
      placeholder={placeholder}
      className={`w-full px-4 py-2 rounded-lg border ${
        isDarkMode 
          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
      } focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none`}
    />
  </div>
);

const SelectField = ({ label, name, value, onChange, disabled, isDarkMode, options }) => (
  <div>
    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
      {label}
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full px-4 py-2 rounded-lg border ${
        isDarkMode 
          ? 'bg-gray-700 border-gray-600 text-white' 
          : 'bg-white border-gray-300 text-gray-900'
      } focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <option value="">Select...</option>
      {options.map(opt => (
        <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
      ))}
    </select>
  </div>
);

const ArrayField = ({ label, value, onChange, disabled, isDarkMode, placeholder }) => (
  <div>
    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
      {label}
    </label>
    <input
      type="text"
      value={value}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder || 'Enter items separated by commas'}
      className={`w-full px-4 py-2 rounded-lg border ${
        isDarkMode 
          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
      } focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
    />
  </div>
);

export default CandidateProfileNew;
