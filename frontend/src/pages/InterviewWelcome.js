import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import apiService from '../services/apiService';
import { 
  Building2, User, MapPin, Briefcase, Calendar, Users, 
  Globe, Linkedin, Mail, Phone, ArrowRight, Video, CheckCircle, Info
} from 'lucide-react';

const InterviewWelcome = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [interviewData, setInterviewData] = useState(null);
  const [recruiterData, setRecruiterData] = useState(null);
  const [error, setError] = useState(null);

  // Extract interview ID from URL or location state
  const searchParams = new URLSearchParams(location.search);
  const interviewId = location.state?.interviewId || searchParams.get('id');

  useEffect(() => {
    console.log('🔍 [WELCOME] Current URL:', window.location.href);
    console.log('🔍 [WELCOME] Search params:', location.search);
    console.log('🔍 [WELCOME] Extracted interview ID:', interviewId);
    
    if (interviewId) {
      loadInterviewDetails();
    } else {
      setError('No interview ID provided in URL');
      setLoading(false);
    }
  }, [interviewId]);

  const loadInterviewDetails = async () => {
    try {
      setLoading(true);
      
      console.log('📡 [WELCOME] Fetching interview details for ID:', interviewId);
      
      // Fetch interview details
      const interviewResult = await apiService.getInterviewById(interviewId);
      
      if (interviewResult.success) {
        console.log('✅ [WELCOME] Interview loaded:', interviewResult.data);
        console.log('🔍 [WELCOME] createdBy type:', typeof interviewResult.data.createdBy);
        console.log('🔍 [WELCOME] createdBy value:', interviewResult.data.createdBy);
        setInterviewData(interviewResult.data);
        
        // Check if createdBy is already populated (object) or just an ID (string)
        if (interviewResult.data.createdBy) {
          if (typeof interviewResult.data.createdBy === 'object' && interviewResult.data.createdBy !== null) {
            // Already populated
            console.log('✅ [WELCOME] Recruiter data already populated:', interviewResult.data.createdBy);
            setRecruiterData(interviewResult.data.createdBy);
          } else {
            // Need to fetch separately
            try {
              console.log('👤 [WELCOME] Fetching recruiter details for:', interviewResult.data.createdBy);
              const recruiterResult = await apiService.getUserById(interviewResult.data.createdBy);
              if (recruiterResult.success) {
                console.log('✅ [WELCOME] Recruiter loaded:', recruiterResult.data);
                setRecruiterData(recruiterResult.data);
              } else {
                console.warn('⚠️ [WELCOME] Could not load recruiter details:', recruiterResult.error);
              }
            } catch (recruiterErr) {
              console.warn('⚠️ [WELCOME] Error fetching recruiter:', recruiterErr);
            }
          }
        }
      } else {
        const errorMsg = interviewResult.error || 'Failed to load interview details';
        console.error('❌ [WELCOME] Failed to load interview:', errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('❌ [WELCOME] Error loading interview details:', err);
      setError(err.response?.data?.message || err.message || 'An error occurred while loading interview details');
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = () => {
    // Navigate to the actual interview page with camera access
    navigate(`/interview/${interviewId}`, { 
      state: { 
        fromWelcome: true,
        interviewData,
        recruiterData 
      } 
    });
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Loading interview details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`max-w-md w-full mx-4 p-8 rounded-lg shadow-lg text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Error</h2>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'} py-12 px-4`}>
      <div className="max-w-5xl mx-auto">
        {/* Header with gradient */}
        <div className={`rounded-xl shadow-2xl p-8 mb-6 bg-gradient-to-br ${isDarkMode ? 'from-gray-800 via-gray-800 to-gray-900' : 'from-white via-blue-50 to-purple-50'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-4 shadow-lg animate-pulse">
              <Video className="w-10 h-10 text-white" />
            </div>
            <h1 className={`text-4xl font-bold mb-3 bg-gradient-to-r ${isDarkMode ? 'from-blue-400 to-purple-400' : 'from-blue-600 to-purple-600'} bg-clip-text text-transparent`}>
              Welcome to Your Interview
            </h1>
            <p className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
              {interviewData?.title || 'Interview Session'}
            </p>
            {interviewData?.jobTitle && (
              <div className="flex items-center justify-center gap-2 mt-3">
                <Briefcase className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <span className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {interviewData.jobTitle}
                </span>
              </div>
            )}
          </div>

          {/* Interview Info */}
          <div className={`p-4 rounded-lg mb-6 ${isDarkMode ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200'}`}>
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h3 className={`font-semibold mb-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-800'}`}>
                  Before You Begin
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                  {recruiterData ? 
                    'Please review the organization details below. When you\'re ready, click "Start Interview" to begin.' :
                    'When you\'re ready, click "Start Interview" to begin your interview.'
                  } You'll be asked to grant camera and microphone access.
                </p>
              </div>
            </div>
          </div>

          {/* Interview Overview Stats */}
          {interviewData && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {interviewData.rounds && (
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Calendar className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Rounds</p>
                      <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {interviewData.rounds.length}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {interviewData.totalDuration && (
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <Video className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Duration</p>
                      <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {interviewData.totalDuration} min
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {interviewData.jobLevel && (
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <Briefcase className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Level</p>
                      <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {interviewData.jobLevel}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Interview Rounds Overview */}
        {interviewData?.rounds && interviewData.rounds.length > 0 && (
          <div className={`rounded-xl shadow-lg p-8 mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h2 className={`text-2xl font-bold mb-6 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <Calendar className="w-6 h-6 text-purple-500" />
              Interview Structure
            </h2>
            
            <div className="space-y-4">
              {interviewData.rounds.map((round, index) => (
                <div key={index} className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                      {index + 1}
                    </div>
                    <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {round.title || `Round ${index + 1}`}
                    </h3>
                    {round.duration && (
                      <span className={`ml-auto px-3 py-1 rounded-full text-sm ${isDarkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                        {round.duration} min
                      </span>
                    )}
                  </div>
                  {round.description && (
                    <p className={`text-sm ml-11 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {round.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Basic Recruiter Info (always show if recruiter data exists) */}
        {recruiterData && (
          <div className={`rounded-xl shadow-lg p-8 mb-6 ${isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-white to-gray-50'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h2 className={`text-2xl font-bold mb-6 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <User className="w-6 h-6 text-green-500" />
              Your Interview Coordinator
            </h2>

            <div className="flex items-center gap-4 mb-6 p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-blue-500/10">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center ring-4 ${isDarkMode ? 'ring-green-500/20 bg-gray-700' : 'ring-green-500/30 bg-gray-200'}`}>
                {recruiterData.profile?.avatar ? (
                  <img src={recruiterData.profile.avatar} alt="Recruiter" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-green-500" />
                )}
              </div>
              <div className="flex-1">
                <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {recruiterData.name || 'Recruiter'}
                </h3>
                <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {recruiterData.recruiterProfile?.position || 'Recruiter'} 
                  {recruiterData.recruiterProfile?.company && ` at ${recruiterData.recruiterProfile.company}`}
                </p>
                {recruiterData.recruiterProfile?.department && (
                  <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {recruiterData.recruiterProfile.department} Department
                  </p>
                )}
              </div>
            </div>

            {(recruiterData.recruiterProfile?.workEmail || recruiterData.email || recruiterData.recruiterProfile?.workPhone || recruiterData.profile?.phone) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(recruiterData.recruiterProfile?.workEmail || recruiterData.email) && (
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <Mail className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Email</p>
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {recruiterData.recruiterProfile?.workEmail || recruiterData.email}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {(recruiterData.recruiterProfile?.workPhone || recruiterData.profile?.phone) && (
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-white'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/20">
                        <Phone className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Phone</p>
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {recruiterData.recruiterProfile?.workPhone || recruiterData.profile?.phone}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Organization Details (only if full profile exists) */}
        {recruiterData?.recruiterProfile?.company && (
          <div className={`rounded-lg shadow-lg p-8 mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              About the Organization
            </h2>

            {/* Company Header */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-700">
              <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                {recruiterData.recruiterProfile.companyLogo ? (
                  <img src={recruiterData.recruiterProfile.companyLogo} alt="Company" className="w-full h-full rounded-lg object-cover" />
                ) : (
                  <Building2 className="w-8 h-8" />
                )}
              </div>
              <div>
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {recruiterData.recruiterProfile.company || 'Company Name'}
                </h3>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {recruiterData.recruiterProfile.industry || 'Industry'}
                </p>
              </div>
            </div>

            {/* Company Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {recruiterData.recruiterProfile.companyType && (
                <InfoItem 
                  icon={Briefcase} 
                  label="Company Type" 
                  value={recruiterData.recruiterProfile.companyType} 
                  isDarkMode={isDarkMode} 
                />
              )}
              {recruiterData.recruiterProfile.companySize && (
                <InfoItem 
                  icon={Users} 
                  label="Company Size" 
                  value={`${recruiterData.recruiterProfile.companySize} employees`} 
                  isDarkMode={isDarkMode} 
                />
              )}
              {recruiterData.recruiterProfile.headquarters && (
                <InfoItem 
                  icon={MapPin} 
                  label="Headquarters" 
                  value={recruiterData.recruiterProfile.headquarters} 
                  isDarkMode={isDarkMode} 
                />
              )}
              {recruiterData.recruiterProfile.foundedYear && (
                <InfoItem 
                  icon={Calendar} 
                  label="Founded" 
                  value={recruiterData.recruiterProfile.foundedYear} 
                  isDarkMode={isDarkMode} 
                />
              )}
            </div>

            {/* Company Description */}
            {recruiterData.recruiterProfile.companyDescription && (
              <div className="mb-6">
                <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  About the Company
                </h4>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {recruiterData.recruiterProfile.companyDescription}
                </p>
              </div>
            )}

            {/* Company Links */}
            <div className="flex flex-wrap gap-3">
              {recruiterData.recruiterProfile.companyWebsite && (
                <a 
                  href={recruiterData.recruiterProfile.companyWebsite} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                >
                  <Globe className="w-4 h-4" />
                  <span className="text-sm">Website</span>
                </a>
              )}
              {recruiterData.recruiterProfile.companyLinkedin && (
                <a 
                  href={recruiterData.recruiterProfile.companyLinkedin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                >
                  <Linkedin className="w-4 h-4" />
                  <span className="text-sm">LinkedIn</span>
                </a>
              )}
            </div>
          </div>
        )}


        {/* Interview Checklist */}
        <div className={`rounded-lg shadow-lg p-8 mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Before You Start
          </h2>

          <div className="space-y-4">
            <ChecklistItem 
              text="Ensure you're in a quiet, well-lit environment" 
              isDarkMode={isDarkMode} 
            />
            <ChecklistItem 
              text="Check your internet connection is stable" 
              isDarkMode={isDarkMode} 
            />
            <ChecklistItem 
              text="Have your camera and microphone ready" 
              isDarkMode={isDarkMode} 
            />
            <ChecklistItem 
              text="Keep your resume and relevant documents handy" 
              isDarkMode={isDarkMode} 
            />
            <ChecklistItem 
              text="Be prepared to answer questions honestly and confidently" 
              isDarkMode={isDarkMode} 
            />
          </div>
        </div>

        {/* Start Interview Button */}
        <div className="text-center">
          <button
            onClick={handleStartInterview}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold text-lg flex items-center gap-3 mx-auto transition-all transform hover:scale-105 shadow-lg"
          >
            <Video className="w-6 h-6" />
            Start Interview
            <ArrowRight className="w-6 h-6" />
          </button>
          <p className={`mt-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            You'll be asked to grant camera and microphone permissions
          </p>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const InfoItem = ({ icon: Icon, label, value, isDarkMode }) => (
  <div className="flex items-start gap-3">
    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
      <Icon className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
    </div>
    <div>
      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{label}</p>
      <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{value}</p>
    </div>
  </div>
);

const ChecklistItem = ({ text, isDarkMode }) => (
  <div className="flex items-center gap-3">
    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
    <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{text}</p>
  </div>
);

export default InterviewWelcome;
