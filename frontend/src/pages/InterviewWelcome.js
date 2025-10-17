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

        {/* Company Details - Enhanced Grid Layout - MOVED TO TOP */}
        {recruiterData?.recruiterProfile?.company && (
          <div className={`rounded-2xl shadow-2xl p-8 mb-6 relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900' : 'bg-gradient-to-br from-white via-blue-50 to-purple-50'} border-2 ${isDarkMode ? 'border-blue-500/20' : 'border-blue-200'}`}>
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-green-500/10 to-blue-500/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <h2 className={`text-4xl font-bold mb-8 flex items-center gap-3 ${isDarkMode ? 'bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent' : 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'}`}>
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                Company Details
              </h2>

              {/* Company Header Card */}
              <div className={`p-8 rounded-2xl mb-6 relative overflow-hidden ${isDarkMode ? 'bg-gradient-to-r from-blue-900/40 to-purple-900/40 backdrop-blur-sm' : 'bg-gradient-to-r from-blue-100 to-purple-100'} border-2 ${isDarkMode ? 'border-blue-500/30' : 'border-blue-300'} shadow-xl hover:shadow-2xl transition-all duration-300`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl"></div>
                
                <div className="flex items-center gap-6 relative z-10">
                  <div className={`w-28 h-28 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-300 ${isDarkMode ? 'bg-gradient-to-br from-gray-700 to-gray-800' : 'bg-gradient-to-br from-white to-gray-50'} ring-4 ${isDarkMode ? 'ring-blue-500/20' : 'ring-blue-200'}`}>
                    {recruiterData.recruiterProfile.companyLogo ? (
                      <img src={recruiterData.recruiterProfile.companyLogo} alt="Company" className="w-full h-full rounded-2xl object-cover" />
                    ) : (
                      <Building2 className="w-14 h-14 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-4xl font-bold mb-2 ${isDarkMode ? 'text-white drop-shadow-lg' : 'text-gray-900'}`}>
                      {recruiterData.recruiterProfile.company}
                    </h3>
                    {recruiterData.recruiterProfile.industry && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${isDarkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-600 text-white'} shadow-lg`}>
                          {recruiterData.recruiterProfile.industry}
                        </span>
                      </div>
                    )}
                    {recruiterData.recruiterProfile.companyDescription && (
                      <p className={`mt-3 text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                        {recruiterData.recruiterProfile.companyDescription}
                      </p>
                    )}
                  </div>
                </div>
              </div>

            {/* Company Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
              <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gradient-to-br from-gray-700/60 to-gray-800/60 backdrop-blur-sm' : 'bg-white'} border-2 ${isDarkMode ? 'border-blue-500/20' : 'border-gray-200'} hover:shadow-2xl hover:scale-105 transition-all duration-300 transform`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                    <Briefcase className="w-5 h-5 text-white" />
                  </div>
                  <p className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Company Type</p>
                </div>
                <p className={`text-xl font-bold ml-14 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {recruiterData.recruiterProfile.companyType || 'Professional Organization'}
                </p>
              </div>

              <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gradient-to-br from-gray-700/60 to-gray-800/60 backdrop-blur-sm' : 'bg-white'} border-2 ${isDarkMode ? 'border-green-500/20' : 'border-gray-200'} hover:shadow-2xl hover:scale-105 transition-all duration-300 transform`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <p className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Company Size</p>
                </div>
                <p className={`text-xl font-bold ml-14 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {recruiterData.recruiterProfile.companySize ? `${recruiterData.recruiterProfile.companySize} employees` : 'Growing Team'}
                </p>
              </div>

              <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gradient-to-br from-gray-700/60 to-gray-800/60 backdrop-blur-sm' : 'bg-white'} border-2 ${isDarkMode ? 'border-purple-500/20' : 'border-gray-200'} hover:shadow-2xl hover:scale-105 transition-all duration-300 transform`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <p className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Headquarters</p>
                </div>
                <p className={`text-xl font-bold ml-14 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {recruiterData.recruiterProfile.headquarters || 'Multiple Locations'}
                </p>
              </div>

              <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gradient-to-br from-gray-700/60 to-gray-800/60 backdrop-blur-sm' : 'bg-white'} border-2 ${isDarkMode ? 'border-orange-500/20' : 'border-gray-200'} hover:shadow-2xl hover:scale-105 transition-all duration-300 transform`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <p className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Founded</p>
                </div>
                <p className={`text-xl font-bold ml-14 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {recruiterData.recruiterProfile.foundedYear || 'Established Company'}
                </p>
              </div>

              <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gradient-to-br from-gray-700/60 to-gray-800/60 backdrop-blur-sm' : 'bg-white'} border-2 ${isDarkMode ? 'border-teal-500/20' : 'border-gray-200'} hover:shadow-2xl hover:scale-105 transition-all duration-300 transform`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <p className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Hiring Team</p>
                </div>
                <p className={`text-xl font-bold ml-14 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {recruiterData.recruiterProfile.teamSize || 'Dedicated HR Team'}
                </p>
              </div>

              <div className={`p-6 rounded-xl ${isDarkMode ? 'bg-gradient-to-br from-gray-700/60 to-gray-800/60 backdrop-blur-sm' : 'bg-white'} border-2 ${isDarkMode ? 'border-pink-500/20' : 'border-gray-200'} hover:shadow-2xl hover:scale-105 transition-all duration-300 transform`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 shadow-lg">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <p className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Department</p>
                </div>
                <p className={`text-xl font-bold ml-14 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {recruiterData.recruiterProfile.department || 'Human Resources'}
                </p>
              </div>
            </div>

            {/* Additional Company Information */}
            {(recruiterData.recruiterProfile.officeLocations?.length > 0 || 
              recruiterData.recruiterProfile.preferredLocations?.length > 0 || 
              recruiterData.recruiterProfile.primaryRecruitmentAreas?.length > 0) && (
              <div className={`p-6 rounded-lg mb-6 ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-50'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Additional Information
                </h3>
                <div className="space-y-4">
                  {recruiterData.recruiterProfile.officeLocations?.length > 0 && (
                    <div>
                      <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Office Locations
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {recruiterData.recruiterProfile.officeLocations.map((location, idx) => (
                          <span key={idx} className={`px-3 py-1 rounded-full text-sm ${isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {location}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {recruiterData.recruiterProfile.preferredLocations?.length > 0 && (
                    <div>
                      <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Hiring Locations
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {recruiterData.recruiterProfile.preferredLocations.map((location, idx) => (
                          <span key={idx} className={`px-3 py-1 rounded-full text-sm ${isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'}`}>
                            {location}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {recruiterData.recruiterProfile.primaryRecruitmentAreas?.length > 0 && (
                    <div>
                      <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Recruitment Focus Areas
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {recruiterData.recruiterProfile.primaryRecruitmentAreas.map((area, idx) => (
                          <span key={idx} className={`px-3 py-1 rounded-full text-sm ${isDarkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contact Information */}
            <div className={`p-5 rounded-lg mb-6 ${isDarkMode ? 'bg-gray-700/30' : 'bg-gray-50'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
              <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(recruiterData.recruiterProfile?.workEmail || recruiterData.email) && (
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
                )}
                {(recruiterData.recruiterProfile?.workPhone || recruiterData.profile?.phone) && (
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
                )}
              </div>
            </div>

            {/* Recruiter Info */}
            <div className={`p-5 rounded-lg ${isDarkMode ? 'bg-gradient-to-r from-green-900/20 to-blue-900/20' : 'bg-gradient-to-r from-green-50 to-blue-50'} border ${isDarkMode ? 'border-green-700/50' : 'border-green-200'}`}>
              <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <User className="w-5 h-5 text-green-500" />
                Your Interview Coordinator
              </h3>
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ring-4 ${isDarkMode ? 'ring-green-500/20 bg-gray-700' : 'ring-green-500/30 bg-white'}`}>
                  {recruiterData.profile?.avatar ? (
                    <img src={recruiterData.profile.avatar} alt="Recruiter" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-green-500" />
                  )}
                </div>
                <div>
                  <p className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {recruiterData.name || 'Recruiter'}
                  </p>
                  <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {recruiterData.recruiterProfile?.position || 'Recruiter'}
                  </p>
                </div>
              </div>
            </div>

            {/* Company Links */}
            {(recruiterData.recruiterProfile.companyWebsite || recruiterData.recruiterProfile.companyLinkedin) && (
              <div className="flex flex-wrap gap-3 mt-6">
                {recruiterData.recruiterProfile.companyWebsite && (
                  <a 
                    href={recruiterData.recruiterProfile.companyWebsite} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 px-5 py-3 rounded-lg ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} transition-all hover:shadow-lg`}
                  >
                    <Globe className="w-5 h-5 text-blue-500" />
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Visit Website</span>
                  </a>
                )}
                {recruiterData.recruiterProfile.companyLinkedin && (
                  <a 
                    href={recruiterData.recruiterProfile.companyLinkedin} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 px-5 py-3 rounded-lg ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'} border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'} transition-all hover:shadow-lg`}
                  >
                    <Linkedin className="w-5 h-5 text-blue-600" />
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>LinkedIn</span>
                  </a>
                )}
              </div>
            )}
            </div>
          </div>
        )}

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
