import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLocation, useNavigate } from 'react-router-dom';
import apiService from '../../services/apiService';
import { 
  User, Building2, Mail, Phone, MapPin, Globe, Linkedin, Twitter,
  Briefcase, Users, Calendar, Award, Upload, Save, Edit2, X, Check, AlertCircle
} from 'lucide-react';

const RecruiterProfile = () => {
  const { user, updateUser } = useAuth();
  const { isDarkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('personal'); // 'personal', 'organization', 'documents'
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [missingFields, setMissingFields] = useState([]);
  
  const [formData, setFormData] = useState({
    // Personal
    name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    avatar: '',
    linkedin: '',
    
    // Recruiter Personal
    position: '',
    department: '',
    yearsOfExperience: '',
    
    // Organization
    company: '',
    companyWebsite: '',
    companySize: '',
    industry: '',
    companyType: '',
    foundedYear: '',
    companyDescription: '',
    companyLogo: '',
    headquarters: '',
    officeLocations: [],
    preferredLocations: [],
    
    // Hiring
    hiringBudget: '',
    averageHiresPerMonth: '',
    primaryRecruitmentAreas: [],
    
    // Contact
    workEmail: '',
    workPhone: '',
    companyLinkedin: '',
    companyTwitter: '',
    
    // Additional
    teamSize: '',
    reportingTo: '',
    certifications: [],
    
    // Documents
    gstNumber: '',
    panNumber: ''
  });

  useEffect(() => {
    if (user) {
      calculateProfileCompletion();
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.profile?.phone || '',
        location: user.profile?.location || '',
        bio: user.profile?.bio || '',
        avatar: user.profile?.avatar || '',
        linkedin: user.profile?.linkedin || '',
        
        position: user.recruiterProfile?.position || '',
        department: user.recruiterProfile?.department || '',
        yearsOfExperience: user.recruiterProfile?.yearsOfExperience || '',
        
        company: user.recruiterProfile?.company || '',
        companyWebsite: user.recruiterProfile?.companyWebsite || '',
        companySize: user.recruiterProfile?.companySize || '',
        industry: user.recruiterProfile?.industry || '',
        companyType: user.recruiterProfile?.companyType || '',
        foundedYear: user.recruiterProfile?.foundedYear || '',
        companyDescription: user.recruiterProfile?.companyDescription || '',
        companyLogo: user.recruiterProfile?.companyLogo || '',
        headquarters: user.recruiterProfile?.headquarters || '',
        officeLocations: user.recruiterProfile?.officeLocations || [],
        preferredLocations: user.recruiterProfile?.preferredLocations || [],
        
        hiringBudget: user.recruiterProfile?.hiringBudget || '',
        averageHiresPerMonth: user.recruiterProfile?.averageHiresPerMonth || '',
        primaryRecruitmentAreas: user.recruiterProfile?.primaryRecruitmentAreas || [],
        
        workEmail: user.recruiterProfile?.workEmail || '',
        workPhone: user.recruiterProfile?.workPhone || '',
        companyLinkedin: user.recruiterProfile?.companyLinkedin || '',
        companyTwitter: user.recruiterProfile?.companyTwitter || '',
        
        teamSize: user.recruiterProfile?.teamSize || '',
        reportingTo: user.recruiterProfile?.reportingTo || '',
        certifications: user.recruiterProfile?.certifications || [],
        
        gstNumber: user.recruiterDocuments?.gstNumber || '',
        panNumber: user.recruiterDocuments?.panNumber || ''
      });
    }
  }, [user]);

  const calculateProfileCompletion = () => {
    // Only Essential Required Fields
    const requiredFields = [
      user?.name,
      user?.profile?.phone,
      user?.recruiterProfile?.company,
      user?.recruiterProfile?.position
    ];

    const missing = [];
    if (!user?.name) missing.push('Full Name');
    if (!user?.profile?.phone) missing.push('Phone Number');
    if (!user?.recruiterProfile?.company) missing.push('Company Name');
    if (!user?.recruiterProfile?.position) missing.push('Position/Title');

    const filledFields = requiredFields.filter(field => field && field.trim() !== '').length;
    const completion = Math.round((filledFields / requiredFields.length) * 100);
    
    setProfileCompletion(completion);
    setMissingFields(missing);
  };

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
          linkedin: formData.linkedin
        },
        recruiterProfile: {
          position: formData.position,
          department: formData.department,
          yearsOfExperience: formData.yearsOfExperience,
          company: formData.company,
          companyWebsite: formData.companyWebsite,
          companySize: formData.companySize,
          industry: formData.industry,
          companyType: formData.companyType,
          foundedYear: formData.foundedYear,
          companyDescription: formData.companyDescription,
          companyLogo: formData.companyLogo,
          headquarters: formData.headquarters,
          officeLocations: formData.officeLocations,
          preferredLocations: formData.preferredLocations,
          hiringBudget: formData.hiringBudget,
          averageHiresPerMonth: formData.averageHiresPerMonth,
          primaryRecruitmentAreas: formData.primaryRecruitmentAreas,
          workEmail: formData.workEmail,
          workPhone: formData.workPhone,
          companyLinkedin: formData.companyLinkedin,
          companyTwitter: formData.companyTwitter,
          teamSize: formData.teamSize,
          reportingTo: formData.reportingTo,
          certifications: formData.certifications
        },
        recruiterDocuments: {
          gstNumber: formData.gstNumber,
          panNumber: formData.panNumber
        }
      });

      if (result.success) {
        // Update user context with new data
        const updatedUser = result.data.user || result.data;
        updateUser(updatedUser);
        
        // Reload form data from updated user
        setFormData({
          name: updatedUser.name || '',
          email: updatedUser.email || '',
          phone: updatedUser.profile?.phone || '',
          location: updatedUser.profile?.location || '',
          bio: updatedUser.profile?.bio || '',
          avatar: updatedUser.profile?.avatar || '',
          linkedin: updatedUser.profile?.linkedin || '',
          
          position: updatedUser.recruiterProfile?.position || '',
          department: updatedUser.recruiterProfile?.department || '',
          yearsOfExperience: updatedUser.recruiterProfile?.yearsOfExperience || '',
          
          company: updatedUser.recruiterProfile?.company || '',
          companyWebsite: updatedUser.recruiterProfile?.companyWebsite || '',
          companySize: updatedUser.recruiterProfile?.companySize || '',
          industry: updatedUser.recruiterProfile?.industry || '',
          companyType: updatedUser.recruiterProfile?.companyType || '',
          foundedYear: updatedUser.recruiterProfile?.foundedYear || '',
          companyDescription: updatedUser.recruiterProfile?.companyDescription || '',
          companyLogo: updatedUser.recruiterProfile?.companyLogo || '',
          headquarters: updatedUser.recruiterProfile?.headquarters || '',
          officeLocations: updatedUser.recruiterProfile?.officeLocations || [],
          preferredLocations: updatedUser.recruiterProfile?.preferredLocations || [],
          
          hiringBudget: updatedUser.recruiterProfile?.hiringBudget || '',
          averageHiresPerMonth: updatedUser.recruiterProfile?.averageHiresPerMonth || '',
          primaryRecruitmentAreas: updatedUser.recruiterProfile?.primaryRecruitmentAreas || [],
          
          workEmail: updatedUser.recruiterProfile?.workEmail || '',
          workPhone: updatedUser.recruiterProfile?.workPhone || '',
          companyLinkedin: updatedUser.recruiterProfile?.companyLinkedin || '',
          companyTwitter: updatedUser.recruiterProfile?.companyTwitter || '',
          
          teamSize: updatedUser.recruiterProfile?.teamSize || '',
          reportingTo: updatedUser.recruiterProfile?.reportingTo || '',
          certifications: updatedUser.recruiterProfile?.certifications || [],
          
          gstNumber: updatedUser.recruiterDocuments?.gstNumber || '',
          panNumber: updatedUser.recruiterDocuments?.panNumber || ''
        });
        
        setIsEditing(false);
        calculateProfileCompletion();
        alert('Profile updated successfully! Your information has been saved.');
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
    { id: 'organization', label: 'Organization', icon: Building2 },
    { id: 'documents', label: 'Documents', icon: Award }
  ];

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} pt-24`}>
      <div className="max-w-6xl mx-auto p-6">
        {/* Profile Completion Status */}
        {profileCompletion < 100 ? (
          <div className={`rounded-lg shadow-lg p-4 mb-6 ${isDarkMode ? 'bg-yellow-900/30 border border-yellow-700' : 'bg-yellow-50 border border-yellow-200'}`}>
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-yellow-500" />
              <div className="flex-1">
                <h3 className={`font-semibold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-800'}`}>
                  Profile {profileCompletion}% Complete
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                  Complete required fields to access all recruiter features. Missing: {missingFields.join(', ')}
                </p>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                  {profileCompletion}%
                </div>
              </div>
            </div>
            <div className="mt-3 w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${profileCompletion}%` }}
              ></div>
            </div>
          </div>
        ) : (
          <div className={`rounded-lg shadow-lg p-4 mb-6 ${isDarkMode ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Check className="w-6 h-6 text-green-500" />
                <div>
                  <h3 className={`font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-800'}`}>
                    Profile Complete! 🎉
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                    You can now access all recruiter features
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/recruiter')}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                Continue to Dashboard
              </button>
            </div>
          </div>
        )}

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
                  {formData.name || 'Recruiter Profile'}
                </h1>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {formData.position || 'Position'} at {formData.company || 'Company'}
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
                  <InputField label="Full Name" name="name" value={formData.name} onChange={handleChange} disabled={!isEditing} isDarkMode={isDarkMode} icon={User} required />
                  <InputField label="Email" name="email" value={formData.email} onChange={handleChange} disabled={true} isDarkMode={isDarkMode} icon={Mail} />
                  <InputField label="Phone" name="phone" value={formData.phone} onChange={handleChange} disabled={!isEditing} isDarkMode={isDarkMode} icon={Phone} required />
                  <InputField label="Location" name="location" value={formData.location} onChange={handleChange} disabled={!isEditing} isDarkMode={isDarkMode} icon={MapPin} />
                  <InputField label="LinkedIn" name="linkedin" value={formData.linkedin} onChange={handleChange} disabled={!isEditing} isDarkMode={isDarkMode} icon={Linkedin} />
                  <InputField label="Position/Title" name="position" value={formData.position} onChange={handleChange} disabled={!isEditing} isDarkMode={isDarkMode} icon={Briefcase} required />
                  <InputField label="Department" name="department" value={formData.department} onChange={handleChange} disabled={!isEditing} isDarkMode={isDarkMode} icon={Building2} />
                  <InputField label="Years of Experience" name="yearsOfExperience" value={formData.yearsOfExperience} onChange={handleChange} disabled={!isEditing} isDarkMode={isDarkMode} icon={Calendar} />
                </div>
                
                <TextAreaField label="Bio" name="bio" value={formData.bio} onChange={handleChange} disabled={!isEditing} isDarkMode={isDarkMode} rows={4} />
                <ArrayField label="Certifications (comma-separated)" value={formData.certifications.join(', ')} onChange={(e) => handleArrayChange('certifications', e.target.value)} disabled={!isEditing} isDarkMode={isDarkMode} />
              </div>
            )}

            {/* Organization Tab */}
            {activeTab === 'organization' && (
              <div className="space-y-6">
                <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Organization Details
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField label="Company Name" name="company" value={formData.company} onChange={handleChange} disabled={!isEditing} isDarkMode={isDarkMode} icon={Building2} required />
                  <InputField label="Company Website" name="companyWebsite" value={formData.companyWebsite} onChange={handleChange} disabled={!isEditing} isDarkMode={isDarkMode} icon={Globe} />
                  
                  <SelectField label="Company Size" name="companySize" value={formData.companySize} onChange={handleChange} disabled={!isEditing} isDarkMode={isDarkMode} options={['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']} />
                  <SelectField label="Company Type" name="companyType" value={formData.companyType} onChange={handleChange} disabled={!isEditing} isDarkMode={isDarkMode} options={['Startup', 'SME', 'Enterprise', 'MNC', 'Government', 'Non-Profit']} />
                  
                  <InputField label="Industry" name="industry" value={formData.industry} onChange={handleChange} disabled={!isEditing} isDarkMode={isDarkMode} icon={Briefcase} />
                  <InputField label="Founded Year" name="foundedYear" value={formData.foundedYear} onChange={handleChange} disabled={!isEditing} isDarkMode={isDarkMode} icon={Calendar} />
                  <InputField label="Headquarters" name="headquarters" value={formData.headquarters} onChange={handleChange} disabled={!isEditing} isDarkMode={isDarkMode} icon={MapPin} />
                  <InputField label="Team Size" name="teamSize" value={formData.teamSize} onChange={handleChange} disabled={!isEditing} isDarkMode={isDarkMode} icon={Users} />
                  <InputField label="Work Email" name="workEmail" value={formData.workEmail} onChange={handleChange} disabled={!isEditing} isDarkMode={isDarkMode} icon={Mail} />
                  <InputField label="Work Phone" name="workPhone" value={formData.workPhone} onChange={handleChange} disabled={!isEditing} isDarkMode={isDarkMode} icon={Phone} />
                  <InputField label="Company LinkedIn" name="companyLinkedin" value={formData.companyLinkedin} onChange={handleChange} disabled={!isEditing} isDarkMode={isDarkMode} icon={Linkedin} />
                  <InputField label="Company Twitter" name="companyTwitter" value={formData.companyTwitter} onChange={handleChange} disabled={!isEditing} isDarkMode={isDarkMode} icon={Twitter} />
                </div>
                
                <TextAreaField label="Company Description" name="companyDescription" value={formData.companyDescription} onChange={handleChange} disabled={!isEditing} isDarkMode={isDarkMode} rows={4} />
                <ArrayField label="Office Locations (comma-separated)" value={formData.officeLocations.join(', ')} onChange={(e) => handleArrayChange('officeLocations', e.target.value)} disabled={!isEditing} isDarkMode={isDarkMode} />
                <ArrayField label="Preferred Hiring Locations (comma-separated)" value={formData.preferredLocations.join(', ')} onChange={(e) => handleArrayChange('preferredLocations', e.target.value)} disabled={!isEditing} isDarkMode={isDarkMode} />
                <ArrayField label="Primary Recruitment Areas (comma-separated)" value={formData.primaryRecruitmentAreas.join(', ')} onChange={(e) => handleArrayChange('primaryRecruitmentAreas', e.target.value)} disabled={!isEditing} isDarkMode={isDarkMode} placeholder="e.g., Engineering, Sales, Marketing" />
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-6">
                <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  KYC Documents
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField label="GST Number" name="gstNumber" value={formData.gstNumber} onChange={handleChange} disabled={!isEditing} isDarkMode={isDarkMode} />
                  <InputField label="PAN Number" name="panNumber" value={formData.panNumber} onChange={handleChange} disabled={!isEditing} isDarkMode={isDarkMode} />
                </div>
                
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Upload GST and PAN documents for verification. Supported formats: PDF, JPG, PNG
                  </p>
                </div>
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
const InputField = ({ label, name, value, onChange, disabled, isDarkMode, icon: Icon, type = 'text', placeholder, required }) => (
  <div>
    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
      {label} {required && <span className="text-red-500">*</span>}
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

const TextAreaField = ({ label, name, value, onChange, disabled, isDarkMode, rows = 3 }) => (
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
        <option key={opt} value={opt}>{opt}</option>
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

export default RecruiterProfile;
