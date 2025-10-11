import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import apiService from '../../services/apiService';
import InterviewPerformanceDashboard from '../../components/InterviewPerformanceDashboard';
import InterviewResults from '../../components/InterviewResults';
import InterviewAnalyticsDashboard from '../../components/InterviewAnalyticsDashboard';
import InterviewScheduler from '../components/InterviewScheduler';
import CandidateManager from '../components/CandidateManager';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Bot, 
  Link, 
  Copy, 
  CheckCircle, 
  Clock, 
  Users, 
  Briefcase,
  Sparkles,
  FileText,
  MapPin,
  DollarSign,
  BarChart3,
  Settings,
  Menu,
  X,
  MessageSquare,
  Award,
  ThumbsUp,
  ThumbsDown,
  Edit3,
  Target,
  Calendar
} from 'lucide-react';

const RecruiterDashboard = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatedInterview, setGeneratedInterview] = useState(null);
  const [interviewLink, setInterviewLink] = useState('');
  const [copiedInterviewId, setCopiedInterviewId] = useState(null);
  const [modalLinkCopied, setModalLinkCopied] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs', 'candidates', 'analytics', 'answers', 'manage-jobs'
  const [interviewStats, setInterviewStats] = useState(null);
  const [selectedInterviewId, setSelectedInterviewId] = useState(null);
  const [showPerformanceDashboard, setShowPerformanceDashboard] = useState(false);
  const [performanceInterviewId, setPerformanceInterviewId] = useState(null);
  const [showInterviewResults, setShowInterviewResults] = useState(false);
  const [resultsInterviewId, setResultsInterviewId] = useState(null);
  const [showAnalyticsDashboard, setShowAnalyticsDashboard] = useState(false);
  const [analyticsInterviewId, setAnalyticsInterviewId] = useState(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [schedulerInterviewId, setSchedulerInterviewId] = useState(null);
  const [showCandidateManager, setShowCandidateManager] = useState(false);
  const [candidateManagerInterviewId, setCandidateManagerInterviewId] = useState(null);

  // Answers state
  const [answersLoading, setAnswersLoading] = useState(false);
  const [answers, setAnswers] = useState([]); // flat list from API
  const [answersByCandidate, setAnswersByCandidate] = useState({}); // grouped by candidate from API
  const [answersSummary, setAnswersSummary] = useState(null); // summary statistics from API
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [expandedCandidates, setExpandedCandidates] = useState({});

  // Candidates state
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  
  // Interview answer candidates state (separate from job application candidates)
  const [, setInterviewCandidates] = useState([]);
  // Remove unused state
  const [candidateFilters, setCandidateFilters] = useState({
    status: '',
    experience: '',
    skills: '',
    jobId: ''
  });
  const [recruiterJobs, setRecruiterJobs] = useState([]);
  const [candidateViewType, setCandidateViewType] = useState('interview'); // 'interview' or 'applied'
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Load interviews and candidates on component mount
  useEffect(() => {
    loadInterviews();
    loadCandidates();
  }, []);

  // Auto-select the single interview when switching to Answers
  useEffect(() => {
    if (activeTab === 'answers' && !selectedInterviewId && jobs.length === 1) {
      setSelectedInterviewId(jobs[0].interviewId);
    }
  }, [activeTab, jobs, selectedInterviewId]);

  // Load interview stats when interview is selected
  useEffect(() => {
    if (selectedInterviewId) {
      loadInterviewStats(selectedInterviewId);
    }
  }, [selectedInterviewId]);

  // Load answers when switching to Answers tab or changing filters/selected interview
  useEffect(() => {
    if (activeTab === 'answers' && selectedInterviewId) {
      loadAnswers(selectedInterviewId, selectedCandidateId);
    }
  }, [activeTab, selectedInterviewId, selectedCandidateId]);

  // Auto-refresh answers every 7s while on Answers tab
  useEffect(() => {
    if (activeTab !== 'answers' || !selectedInterviewId) return;
    const id = setInterval(() => {
      loadAnswers(selectedInterviewId, selectedCandidateId);
    }, 7000);
    return () => clearInterval(id);
  }, [activeTab, selectedInterviewId, selectedCandidateId]);

  const loadInterviews = async () => {
    try {
      const result = await apiService.getAllInterviews();
      if (result.success) {
        setJobs(result.data);
      }
    } catch (error) {
      console.error('Error loading interviews:', error);
    }
  };

  const loadInterviewStats = async (interviewId) => {
    try {
      const result = await apiService.getInterviewStats(interviewId);
      if (result.success) {
        setInterviewStats(result.data);
      }
    } catch (error) {
      console.error('Error loading interview stats:', error);
    }
  };

  const loadAnswers = async (interviewId, candidateId) => {
    try {
      setAnswersLoading(true);
      const result = await apiService.getInterviewAnswers(interviewId, candidateId || undefined);
      if (result.success) {
        // The API now returns { success: true, data: { answers: [...], answersByCandidate: {...}, summary: {...} } }
        const data = result.data;
        setAnswers(data?.answers || []);
        setAnswersByCandidate(data?.answersByCandidate || {});
        setAnswersSummary(data?.summary || null);
        
        // Update candidates list with answer data
        if (data?.answersByCandidate) {
          const candidatesWithAnswers = Object.values(data.answersByCandidate).map(candidate => ({
            _id: candidate.candidateId,
            name: candidate.candidateName,
            email: candidate.candidateEmail,
            answerCount: candidate.answers.length,
            averageScore: candidate.answers.length > 0 ? 
              candidate.answers.reduce((sum, answer) => sum + (answer.aiEvaluation?.score || 0), 0) / candidate.answers.length : 0,
            lastAnswerAt: candidate.answers.length > 0 ? 
              new Date(Math.max(...candidate.answers.map(a => new Date(a.timestamp)))) : null
          }));
          
          // Set interview candidates (these are different from job application candidates)
          setInterviewCandidates(candidatesWithAnswers);
        }
        
        console.log('✅ [LOAD ANSWERS] Loaded answers successfully:', {
          totalAnswers: data?.answers?.length || 0,
          totalCandidates: Object.keys(data?.answersByCandidate || {}).length,
          summary: data?.summary
        });
      } else {
        console.error('Failed to load answers:', result.error);
        setAnswers([]);
      }
    } catch (error) {
      console.error('Error loading answers:', error);
      setAnswers([]);
    } finally {
      setAnswersLoading(false);
    }
  };

  const loadCandidates = async () => {
    try {
      setCandidatesLoading(true);
      
      // Fetch both applications and jobs in parallel using apiService
      const [applicationsResult, jobsResult] = await Promise.all([
        apiService.getRecruiterApplications(),
        apiService.getMyJobs()
      ]);

      console.log('Applications result:', applicationsResult);
      console.log('Jobs result:', jobsResult);

      if (!applicationsResult.success) {
        console.error('Applications error details:', applicationsResult);
        throw new Error(applicationsResult.error || 'Failed to fetch applications');
      }
      if (!jobsResult.success) {
        throw new Error(jobsResult.error || 'Failed to fetch jobs');
      }

      const applications = applicationsResult.data || applicationsResult;
      const jobs = jobsResult.data || jobsResult;
      
      // Set recruiter jobs for filtering
      setRecruiterJobs(jobs);
      
      // Transform API data to match UI expectations
      const transformedApplications = applications.map(app => ({
        _id: app._id,
        name: app.candidate?.name || 'Unknown Candidate',
        email: app.candidate?.email || '',
        phone: app.candidate?.profile?.phone || '',
        experience: app.candidate?.profile?.experience || 'Not specified',
        skills: app.candidate?.profile?.skills || [],
        status: app.status,
        appliedDate: app.createdAt,
        jobTitle: app.job?.title || 'Unknown Job',
        jobCompany: app.job?.company || 'Unknown Company',
        jobLocation: app.job?.location || 'Unknown Location',
        coverLetter: app.coverLetter,
        resume: app.resume,
        notes: app.notes || '',
        // Add interview-related fields if they exist
        interviewDate: app.interviewDate,
        interviewScore: app.interviewScore,
        technicalScore: app.technicalScore,
        communicationScore: app.communicationScore,
        problemSolvingScore: app.problemSolvingScore,
        culturalFitScore: app.culturalFitScore,
        overallScore: app.overallScore,
        interviewNotes: app.interviewNotes,
        strengths: app.strengths || [],
        weaknesses: app.weaknesses || [],
        recommendation: app.recommendation
      }));
      
      // Separate applications into different categories
      const candidatesData = {
        interview: transformedApplications.filter(app => 
          app.status === 'shortlisted' || app.status === 'hired' || app.interviewDate
        ),
        applied: transformedApplications.filter(app => 
          app.status === 'pending' || app.status === 'reviewing'
        )
      };

      setCandidates(candidatesData);
    } catch (error) {
      console.error('Error loading candidates:', error);
      // Fallback to empty arrays if API fails
      setCandidates({
        interview: [],
        applied: []
      });
    } finally {
      setCandidatesLoading(false);
    }
  };


  const groupAnswersByCandidate = () => {
    // Ensure answers is an array
    if (!Array.isArray(answers)) {
      console.warn('Answers is not an array:', answers);
      return [];
    }
    
    const map = new Map();
    for (const a of answers) {
      if (!map.has(a.candidateId)) {
        map.set(a.candidateId, {
          candidateId: a.candidateId,
          candidateName: a.candidateName,
          candidateEmail: a.candidateEmail,
          items: []
        });
      }
      map.get(a.candidateId).items.push(a);
    }
    // compute summaries
    const list = Array.from(map.values()).map(c => {
      const scores = c.items.map(i => i.aiEvaluation?.score).filter(s => typeof s === 'number');
      const avg = scores.length ? (scores.reduce((p, v) => p + v, 0) / scores.length) : 0;
      const lastAnswered = c.items.reduce((p, v) => {
        const t = new Date(v.timestamp).getTime();
        return t > p ? t : p;
      }, 0);
      return { ...c, averageScore: avg, lastAnswered };
    });
    // sort by averageScore desc
    const sortedList = list.sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0));
    
    // Final safety check to ensure we return an array
    return Array.isArray(sortedList) ? sortedList : [];
  };

  const toggleExpand = (candidateId) => {
    setExpandedCandidates(prev => ({ ...prev, [candidateId]: !prev[candidateId] }));
  };

  // Candidate management handlers
  const handleCandidateStatusChange = async (candidateId, newStatus) => {
    try {
      const result = await apiService.updateApplicationStatus(candidateId, newStatus);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update application status');
      }

      // Update local state
      setCandidates(prev => ({
        ...prev,
        applied: prev.applied.map(candidate => 
          candidate._id === candidateId 
            ? { ...candidate, status: newStatus }
            : candidate
        ),
        interview: prev.interview.map(candidate => 
          candidate._id === candidateId 
            ? { ...candidate, status: newStatus }
            : candidate
        )
      }));

      // Show success message
      console.log('Application status updated successfully');
    } catch (error) {
      console.error('Error updating application status:', error);
      // You could add a toast notification here
    }
  };

  const handleCandidateFilterChange = (key, value) => {
    setCandidateFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Job management functions
  const handleJobStatusChange = async (jobId, newStatus) => {
    try {
      const result = await apiService.updateJobStatus(jobId, newStatus);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update job status');
      }

      // Update local state
      setRecruiterJobs(prev => prev.map(job => 
        job._id === jobId 
          ? { ...job, status: newStatus }
          : job
      ));

      console.log('Job status updated successfully');
    } catch (error) {
      console.error('Error updating job status:', error);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await apiService.deleteJob(jobId);

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete job');
      }

      // Remove from local state
      setRecruiterJobs(prev => prev.filter(job => job._id !== jobId));

      console.log('Job deleted successfully');
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  const filteredCandidates = candidates[candidateViewType]?.filter(candidate => {
    // Filter by job if selected
    if (candidateFilters.jobId) {
      const selectedJob = recruiterJobs.find(job => job._id === candidateFilters.jobId);
      if (selectedJob && candidate.jobTitle !== selectedJob.title) return false;
    }
    
    // Filter by status
    if (candidateFilters.status && candidate.status !== candidateFilters.status) return false;
    
    // Filter by experience
    if (candidateFilters.experience && !candidate.experience.includes(candidateFilters.experience)) return false;
    
    // Filter by skills
    if (candidateFilters.skills && !candidate.skills.some(skill => 
      skill.toLowerCase().includes(candidateFilters.skills.toLowerCase())
    )) return false;
    
    return true;
  }) || [];

  const [jobPrompt, setJobPrompt] = useState('');
  const [jobType, setJobType] = useState('developer'); // 'developer', 'sales', or 'generic'

  const createRoleSpecificPrompt = (jobDescription, roleType) => {
    const basePrompt = `Create a comprehensive interview for this job: ${jobDescription}`;
    
    if (roleType === 'developer') {
      return `${basePrompt}

Please structure the interview with these specific rounds:

1. **Introduction & Self Intro** – Ask about themselves, background, past projects, career goals, and what they're looking for in their next role. NO CODING QUESTIONS - only conversational questions about experience and motivation.

2. **Basic Technical Questions** – Role-specific technical fundamentals based on the job requirements. For Python developers: Python syntax, data structures, OOP concepts, libraries. For React developers: JSX, props, state, hooks. For Java developers: Java syntax, collections, OOP, Spring. For other roles: relevant technical concepts. NO CODING - only theoretical/conceptual questions about how these technologies work.

3. **Coding Round** – ONLY ROUND WITH CODING. Role-specific hands-on task: For Python developers: data processing, algorithm implementation, or API development. For React developers: building a todo app, component creation, or API integration. For Java developers: class design, algorithm implementation, or Spring application. For other roles: relevant practical coding challenges. This is the ONLY round where actual coding should be involved.

4. **Advanced Technical Questions** – Role-specific advanced concepts. For Python: frameworks (Django/Flask), data science libraries, async programming. For React: state management, performance optimization, testing. For Java: Spring framework, microservices, design patterns. For other roles: relevant advanced concepts, best practices, and system design basics. NO CODING - only discussion about concepts, best practices, and theoretical knowledge.

5. **Behavioral/Soft Skills** – Communication skills, teamwork, problem-solving approach, handling pressure, learning new technologies, and confidence in technical discussions. NO CODING - only behavioral and soft skills questions.

6. **Final Feedback & Decision** – Discuss strengths, areas for improvement, technical fit, cultural fit, and next steps (offer or decline). NO CODING - only feedback and decision discussion.

IMPORTANT: Only Round 3 (Coding Round) should involve actual coding. All other rounds must be strictly non-coding - use theoretical questions, discussions, and behavioral assessments only.`;
    } else if (roleType === 'sales') {
      return `${basePrompt}

Please structure the interview with these specific rounds:

1. **Self Introduction** – Ask about their background, sales experience, achievements, motivation for sales, and career aspirations.

2. **Basic Sales Questions** – Understanding of sales process, lead generation, customer relationship management, sales tools, and industry knowledge.

3. **Sales Pitch/Role-play** – Present a product or service scenario and ask them to pitch it, demonstrate their sales approach, and show their persuasive skills.

4. **Objection Handling** – Present common sales objections and assess how they handle rejection, overcome customer concerns, and maintain persistence.

5. **Communication & Confidence Check** – Evaluate their communication style, listening skills, confidence level, negotiation abilities, and how they build rapport with clients.

6. **Final Feedback & Decision** – Discuss their sales potential, areas for development, cultural fit, and next steps (offer or decline).

Each round should have 3-5 relevant questions that progressively assess the candidate's sales skills, communication abilities, and cultural fit.`;
    } else if (roleType === 'pcb') {
      return `${basePrompt}

Please structure the interview with these specific rounds for an Electronics/PCB Design Engineer:

1. **Electronics Fundamentals** – Test theoretical knowledge of:
   - Analog and digital circuit design principles
   - Component selection and specifications
   - Signal integrity and power management
   - PCB manufacturing processes and constraints
   - Testing and validation methodologies

2. **Advanced Electronics Concepts** – Assess knowledge of:
   - High-speed digital design
   - RF and microwave circuit design
   - Power electronics and motor control
   - Embedded systems integration
   - Design for manufacturability (DFM) and testability (DFT)

3. **PCB Design Round** – This is Round 3 and should be completely hands-on PCB design. Create multiple PCB design challenges where the candidate must:
   - Design circuit schematics for specific electronics applications
   - Select appropriate components (resistors, capacitors, microcontrollers, etc.)
   - Create PCB layouts with proper component placement
   - Consider EMI/EMC, thermal management, and manufacturability
   - Use PCB design tools (Altium Designer, KiCad, Eagle, etc.)
   - This round should be entirely practical and hands-on, allowing the candidate to demonstrate real PCB design skills
   - ALL questions in this round should be PCB design challenges

4. **Circuit Analysis** – Test practical circuit analysis skills:
   - Analyze given circuit schematics
   - Calculate component values and circuit parameters
   - Troubleshoot circuit problems
   - Explain circuit behavior and performance
   - This round should focus on theoretical analysis and problem-solving

5. **Project Experience & Problem Solving** – Discuss:
   - Previous PCB design projects and challenges
   - Troubleshooting and debugging techniques
   - Collaboration with firmware and mechanical engineers
   - Quality assurance and testing procedures

6. **Behavioral & Soft Skills** – Evaluate:
   - Communication skills for technical discussions
   - Project management and timeline adherence
   - Learning new technologies and tools
   - Working in cross-functional teams

7. **Final Feedback & Decision** – Discuss technical fit, project experience, and next steps.

IMPORTANT: Round 3 (PCB Design Round) should be completely hands-on with ALL questions being PCB design challenges. Round 4 (Circuit Analysis) should be theoretical analysis questions. The other rounds should complement these with knowledge assessment and experience evaluation.`;
    } else if (roleType === 'generic') {
      return `${basePrompt}

Please analyze the job description and create a comprehensive interview structure tailored specifically to this role. 

IMPORTANT INSTRUCTIONS:
1. **Analyze the job requirements** - Identify the key skills, experience, and qualifications needed
2. **Determine the job category** - Is this technical, sales, marketing, HR, finance, operations, management, creative, etc.?
3. **Create appropriate interview rounds** - Design 4-6 rounds that make sense for this specific role
4. **Include relevant assessment types** - Use appropriate evaluation methods (technical questions, role-plays, case studies, behavioral questions, etc.)
5. **Adapt question difficulty** - Match the level of questions to the seniority level mentioned in the job description
6. **Generate ALL questions dynamically** - Every single question should be custom-generated based on the specific job requirements, not generic templates

For each round, provide:
- Clear round title and description
- 3-5 relevant questions that assess the specific skills needed for this role
- Expected answers that show what a good candidate should know
- Appropriate time limits based on the complexity

CRITICAL: Generate completely custom questions for this specific role. Do not use generic questions like "Tell me about yourself" or "What are your strengths". Instead, create questions that are:
- Specific to the industry and role
- Relevant to the actual job responsibilities
- Appropriate for the seniority level
- Designed to assess the exact skills mentioned in the job description

Make sure the interview structure is logical, progressive, and directly relevant to the job requirements. If the role involves technical skills, include appropriate technical assessments. If it's a leadership role, include management scenarios. If it's creative, include portfolio reviews or creative challenges.

The interview should feel natural and relevant to someone applying for this specific position.`;
    }
    
    return basePrompt;
  };

  const generateAIInterview = async () => {
    if (!jobPrompt || jobPrompt.trim().length < 10) {
      alert('Please provide a detailed job description (minimum 10 characters)');
      return;
    }

    setLoading(true);
    try {
      let result;
      
      // Use Electronics service for PCB interviews
      if (jobType === 'pcb') {
        const { default: electronicsInterviewService } = await import('../../services/electronicsInterviewService');
        result = await electronicsInterviewService.generateElectronicsInterview(jobPrompt);
        result = { success: true, data: result };
      } else {
        // Create role-specific interview structure for other types
        const roleSpecificPrompt = createRoleSpecificPrompt(jobPrompt, jobType);
        result = await apiService.generateInterview({ prompt: roleSpecificPrompt });
      }
      
      if (result.success) {
        setGeneratedInterview(result.data);
        setInterviewLink(result.data.link);
        const reviewPath = `/recruiter/review/${result.data.interviewId}`;
        // Navigate to review page
        window.location.href = reviewPath;
        
        // Add to jobs list
        const newJob = {
          id: 'job_' + Date.now(),
          title: result.data.title || 'AI Generated Job',
          company: 'Company',
          location: 'Remote',
          salary: 'Competitive',
          description: jobPrompt,
          interviewId: result.data.interviewId,
          interviewLink: result.data.link,
          status: 'active',
          createdAt: new Date()
        };
        setJobs(prev => [newJob, ...prev]);
        
        // Reset form
        setJobPrompt('');
        setShowCreateJob(false);
      } else {
        // Check if it's a rate limit error and show helpful message
        if (result.error?.includes('429') || result.error?.includes('rate') || result.error?.includes('Provider returned error')) {
          alert('AI service temporarily at capacity. Your interview was generated using our fallback system with high-quality questions tailored to your job description.');
        } else {
          alert('Failed to generate interview: ' + result.error);
        }
      }
    } catch (error) {
      // Check if it's a rate limit error 
      if (error.message?.includes('429') || error.message?.includes('rate')) {
        alert('AI service temporarily at capacity. Your interview was generated using our fallback system with high-quality questions tailored to your job description.');
      } else {
        alert('Error generating interview: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(interviewLink);
      setModalLinkCopied(true);
      setTimeout(() => setModalLinkCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  // Approve interview function
  const approveInterview = async (interviewId) => {
    try {
      const result = await apiService.approveInterview(interviewId);
      
      if (result.success) {
        // Update the job status in the local state
        setJobs(prev => prev.map(job => 
          job.interviewId === interviewId 
            ? { ...job, approvalStatus: 'approved' }
            : job
        ));
        alert('Interview approved successfully!');
      } else {
        alert('Failed to approve interview: ' + result.error);
      }
    } catch (error) {
      console.error('Error approving interview:', error);
      alert('Error approving interview: ' + error.message);
    }
  };

  // Reject interview function
  const rejectInterview = async (interviewId) => {
    const reason = prompt('Please provide a reason for rejection (optional):');
    if (reason === null) return; // User cancelled

    try {
      const result = await apiService.rejectInterview(interviewId, reason);
      
      if (result.success) {
        // Update the job status in the local state
        setJobs(prev => prev.map(job => 
          job.interviewId === interviewId 
            ? { ...job, approvalStatus: 'rejected' }
            : job
        ));
        alert('Interview rejected successfully!');
      } else {
        alert('Failed to reject interview: ' + result.error);
      }
    } catch (error) {
      console.error('Error rejecting interview:', error);
      alert('Error rejecting interview: ' + error.message);
    }
  };

  // Sidebar navigation items
  const sidebarItems = [
    { id: 'jobs', label: 'Jobs', icon: Briefcase, description: 'Manage job postings' },
    { id: 'manage-jobs', label: 'Job Management', icon: Settings, description: 'View, edit, activate jobs' },
    { id: 'scheduler', label: 'Interview Scheduler', icon: Calendar, description: 'Schedule interview rounds' },
    { id: 'candidate-manager', label: 'Candidate Manager', icon: Users, description: 'Manage candidate progression' },
    { id: 'candidates', label: 'Candidates', icon: Users, description: 'Review applications' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Performance insights' },
    { id: 'answers', label: 'Interview Results', icon: Award, description: 'AI interview analysis' },
    { id: 'messages', label: 'Messages', icon: MessageSquare, description: 'Communicate with candidates' },
    { id: 'settings', label: 'Settings', icon: Settings, description: 'Account preferences' }
  ];

  return (
    <div className="h-screen flex overflow-hidden pt-16" style={{
        background: isDarkMode
          ? 'radial-gradient(1200px 700px at -10% 0%, rgba(59,130,246,.08), transparent), radial-gradient(1000px 600px at 110% -10%, rgba(6,182,212,.08), transparent)'
          : undefined
      }}>
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'w-64' : 'w-16'} 
        ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
        transition-all duration-300 ease-in-out
        ${isDarkMode ? 'bg-gray-900 border-r border-gray-700' : 'bg-white border-r border-gray-200'}
        flex flex-col
      `}>
        {/* Sidebar Header */}
        <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
              <div>
                  <h1 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    AI Hiring
                  </h1>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Recruiter Portal
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} lg:block hidden`}
            >
              <Menu className={`h-5 w-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </button>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'} lg:hidden`}
            >
              <X className={`h-5 w-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </button>
        </div>
            </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
                return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200
                  ${activeTab === item.id 
                    ? isDarkMode 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'bg-blue-600 text-white shadow-lg'
                    : isDarkMode 
                      ? 'text-gray-300 hover:bg-gray-800 hover:text-white' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
                title={!sidebarOpen ? item.label : ''}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {sidebarOpen && (
                  <div className="flex-1 text-left">
                    <div className="font-medium">{item.label}</div>
                    <div className={`text-xs ${activeTab === item.id ? 'text-blue-100' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {item.description}
                </div>
                  </div>
                )}
              </button>
                );
              })}
            </nav>

        {/* Sidebar Footer */}
        <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          
          {/* User Profile */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {user?.name?.charAt(0) || 'R'}
              </span>
          </div>
            {sidebarOpen && (
              <div className="flex-1">
                <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {user?.name || 'Recruiter'}
                </div>
                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {user?.email || 'recruiter@example.com'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className={`lg:hidden p-4 border-b ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
            >
              <Menu className={`h-5 w-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            </button>
            <h1 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              AI Hiring Portal
            </h1>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {user?.name?.charAt(0) || 'R'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className={`flex-1 overflow-y-auto ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
        {activeTab === 'jobs' && (
          <>
            {/* Enhanced Stats Cards with Animations */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
              {[
                { 
                  icon: Briefcase, 
                  label: 'Active Jobs', 
                  value: jobs.length, 
                  color: 'blue',
                  bgColor: isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100',
                  iconColor: 'text-blue-600',
                  gradient: 'from-blue-500 to-blue-600'
                },
                { 
                  icon: Bot, 
                  label: 'AI Interviews', 
                  value: jobs.length, 
                  color: 'green',
                  bgColor: isDarkMode ? 'bg-green-500/20' : 'bg-green-100',
                  iconColor: 'text-green-600',
                  gradient: 'from-green-500 to-green-600'
                },
                { 
                  icon: Users, 
                  label: 'Candidates', 
                  value: 0, 
                  color: 'purple',
                  bgColor: isDarkMode ? 'bg-purple-500/20' : 'bg-purple-100',
                  iconColor: 'text-purple-600',
                  gradient: 'from-purple-500 to-purple-600'
                },
                { 
                  icon: Clock, 
                  label: 'Completed', 
                  value: 0, 
                  color: 'yellow',
                  bgColor: isDarkMode ? 'bg-yellow-500/20' : 'bg-yellow-100',
                  iconColor: 'text-yellow-600',
                  gradient: 'from-yellow-500 to-yellow-600'
                }
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                      delay: 0.8 + index * 0.1, 
                      duration: 0.5,
                      type: "spring",
                      stiffness: 100
                    }}
                    whileHover={{ 
                      y: -8, 
                      scale: 1.02,
                      transition: { duration: 0.2 }
                    }}
                    className={`group relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl border transition-all duration-300 ${
                      isDarkMode 
                        ? 'bg-black/30 border-blue-500/30 shadow-2xl shadow-blue-500/10' 
                        : 'bg-white/80 border-gray-200/50 shadow-xl shadow-gray-500/5'
                    }`}
                  >
                    {/* Animated background gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <motion.div
                          whileHover={{ rotate: 360 }}
                          transition={{ duration: 0.6 }}
                          className={`p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}
                        >
                          <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                        </motion.div>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 1 + index * 0.1, type: "spring", stiffness: 200 }}
                          className={`w-3 h-3 rounded-full bg-gradient-to-r ${stat.gradient} animate-pulse`}
                        ></motion.div>
              </div>

                      <div>
                        <motion.p 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.1 + index * 0.1 }}
                          className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                        >
                          {stat.label}
                        </motion.p>
                        <motion.p 
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 1.2 + index * 0.1, type: "spring", stiffness: 200 }}
                          className={`text-2xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}
                        >
                          {stat.value}
                        </motion.p>
                  </div>
                  </div>
                  </motion.div>
                );
              })}
            </motion.div>

          {/* Enhanced Create Job Button */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.6 }}
            className="mb-8 text-center"
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <motion.button
              onClick={() => setShowCreateJob(true)}
              whileHover={{ 
                scale: 1.05,
                y: -5,
                transition: { duration: 0.2 }
              }}
              whileTap={{ scale: 0.95 }}
              className="group relative inline-flex items-center space-x-3 px-10 py-5 bg-gradient-to-r from-blue-600 via-blue-700 to-slate-800 hover:from-blue-700 hover:via-blue-800 hover:to-slate-900 text-white rounded-2xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 font-semibold text-lg overflow-hidden"
            >
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              
              {/* Floating particles effect */}
              <div className="absolute inset-0 overflow-hidden">
                <motion.div
                  animate={{ 
                    x: [0, 100, 0],
                    opacity: [0, 1, 0]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute top-0 left-0 w-2 h-2 bg-white rounded-full"
                ></motion.div>
                <motion.div
                  animate={{ 
                    x: [0, -100, 0],
                    opacity: [0, 1, 0]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                  }}
                  className="absolute bottom-0 right-0 w-1 h-1 bg-white rounded-full"
                ></motion.div>
            </div>

              <motion.div
                whileHover={{ rotate: 90 }}
                transition={{ duration: 0.3 }}
                className="relative z-10"
            >
              <Plus className="h-6 w-6" />
              </motion.div>
                <span className="relative z-10">Create AI Interview</span>
              
              {/* Shine effect */}
              <motion.div
                animate={{ x: ['-100%', '100%'] }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
              ></motion.div>
            </motion.button>

              <motion.button
                onClick={() => window.location.href = '/recruiter/create-job'}
                whileHover={{ 
                  scale: 1.05,
                  y: -5,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.95 }}
                className="group relative inline-flex items-center space-x-3 px-10 py-5 bg-gradient-to-r from-blue-600 via-blue-700 to-slate-800 hover:from-blue-700 hover:via-blue-800 hover:to-slate-900 text-white rounded-2xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 font-semibold text-lg overflow-hidden"
              >
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                
                {/* Floating particles effect */}
                <div className="absolute inset-0 overflow-hidden">
                  <motion.div
                    animate={{ 
                      x: [0, 100, 0],
                      opacity: [0, 1, 0]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute top-0 left-0 w-2 h-2 bg-white rounded-full"
                  ></motion.div>
                  <motion.div
                    animate={{ 
                      x: [0, -100, 0],
                      opacity: [0, 1, 0]
                    }}
                    transition={{ 
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1
                    }}
                    className="absolute bottom-0 right-0 w-1 h-1 bg-white rounded-full"
                  ></motion.div>
                </div>

                <motion.div
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.3 }}
                  className="relative z-10"
                >
                  <Briefcase className="h-6 w-6" />
                </motion.div>
                <span className="relative z-10">Post Regular Job</span>
                
                {/* Shine effect */}
                <motion.div
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                ></motion.div>
              </motion.button>

              {/* PCB Round Links button removed as requested */}

            </div>
          </motion.div>

          {/* Enhanced Create Job Modal - Fixed Width */}
          {showCreateJob && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50 overflow-hidden"
            >
              {/* Enhanced Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`absolute inset-0 ${isDarkMode ? 'bg-black/90 backdrop-blur-xl' : 'bg-white/95 backdrop-blur-xl'}`} 
              />
              
              {/* Animated Background Elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.2, 0.1]
                  }}
                  transition={{ 
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full ${isDarkMode ? 'bg-blue-500' : 'bg-blue-300'}`}
                ></motion.div>
                <motion.div
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.05, 0.15, 0.05]
                  }}
                  transition={{ 
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                  }}
                  className={`absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full ${isDarkMode ? 'bg-purple-500' : 'bg-purple-300'}`}
                ></motion.div>
              </div>
              
              {/* Main Content Container */}
              <div className="relative h-full flex items-center justify-center p-4">
                <div className="w-full max-w-7xl h-full max-h-[90vh] flex flex-col">
                  {/* Enhanced Header - Always Visible */}
                  <motion.div 
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className={`${isDarkMode ? 'bg-black/40 border-blue-500/30' : 'bg-white/80 border-gray-200/50'} border-b backdrop-blur-2xl shadow-2xl rounded-t-3xl`}
                  >
                    <div className="px-8 py-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                          <motion.div 
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                            className={`p-3 rounded-xl ${isDarkMode ? 'bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-blue-500/40' : 'bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg'}`}
                          >
                            <motion.div
                              animate={{ rotate: [0, 360] }}
                              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            >
                              <Sparkles className={`h-8 w-8 ${isDarkMode ? 'text-blue-400' : 'text-white'}`} />
                            </motion.div>
                          </motion.div>
                        <div>
                            <motion.h1 
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.5, duration: 0.6 }}
                              className={`text-3xl font-bold bg-gradient-to-r ${isDarkMode 
                                ? 'from-white via-blue-200 to-purple-200 bg-clip-text text-transparent' 
                                : 'from-gray-900 via-blue-600 to-purple-600 bg-clip-text text-transparent'
                              }`}
                            >
                            Create AI-Powered Interview
                            </motion.h1>
                            <motion.p 
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.6, duration: 0.6 }}
                              className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mt-1 text-base`}
                            >
                            Describe your ideal candidate and let AI generate everything
                            </motion.p>
                        </div>
                      </div>
                        <motion.button
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
                          whileHover={{ scale: 1.1, rotate: 90 }}
                          whileTap={{ scale: 0.9 }}
                        onClick={() => setShowCreateJob(false)}
                          className={`p-3 rounded-xl transition-all duration-300 ${isDarkMode 
                            ? 'text-gray-400 hover:text-white hover:bg-gray-700/50 border border-gray-600/50' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-gray-200'
                          }`}
                      >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        </motion.button>
                    </div>
                  </div>
                  </motion.div>

                  {/* Enhanced Content Area */}
                <div className="flex-1 overflow-y-auto">
                    <div className="px-8 py-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Enhanced Main Form */}
                      <div className="lg:col-span-2">
                        <motion.div
                          initial={{ y: 30, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.8, duration: 0.6 }}
                          className={`${isDarkMode ? 'bg-black/40 border-blue-500/30' : 'bg-white/90 border-gray-200/50'} rounded-2xl border backdrop-blur-2xl shadow-2xl p-6`}
                        >
                          <div className="mb-6">
                            <motion.div
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.9, duration: 0.6 }}
                              className="flex items-center space-x-3 mb-3"
                            >
                              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                                <FileText className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                              </div>
                              <label className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              Job Description Prompt *
                            </label>
                            </motion.div>
                            
                            <motion.p 
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 1.0, duration: 0.6 }}
                              className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-4 leading-relaxed text-sm`}
                            >
                              Describe the job you want to hire for. Be as detailed as possible - include job title, level, requirements, responsibilities, company info, etc. AI will extract all details and create tailored interview questions.
                            </motion.p>

                            {/* Job Type Selector */}
                            <motion.div 
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 1.05, duration: 0.6 }}
                              className="mb-4"
                            >
                              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                                Interview Type
                              </label>
                              <div className="flex space-x-4">
                                <button
                                  onClick={() => setJobType('developer')}
                                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                    jobType === 'developer'
                                      ? isDarkMode
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'bg-blue-600 text-white shadow-lg'
                                      : isDarkMode
                                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  💻 Developer Interview
                                </button>
                                <button
                                  onClick={() => setJobType('sales')}
                                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                    jobType === 'sales'
                                      ? isDarkMode
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'bg-blue-600 text-white shadow-lg'
                                      : isDarkMode
                                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  💼 Sales Interview
                                </button>
                                <button
                                  onClick={() => setJobType('pcb')}
                                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                    jobType === 'pcb'
                                      ? isDarkMode
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'bg-blue-600 text-white shadow-lg'
                                      : isDarkMode
                                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  🔌 Electronics (PCB)
                                </button>
                                <button
                                  onClick={() => setJobType('generic')}
                                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                    jobType === 'generic'
                                      ? isDarkMode
                                        ? 'bg-green-600 text-white shadow-lg'
                                        : 'bg-green-600 text-white shadow-lg'
                                      : isDarkMode
                                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  🎯 Any Job Type
                                </button>
                              </div>
                              <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {jobType === 'developer' 
                                  ? 'Technical rounds: Intro (no coding), Basic Tech (theory only), Coding (hands-on), Advanced Tech (concepts), Behavioral, Final Feedback'
                                  : jobType === 'sales'
                                    ? 'Sales rounds: Self Intro, Basic Sales, Sales Pitch, Objection Handling, Communication, Final Feedback'
                                    : jobType === 'pcb'
                                      ? 'Electronics interview: Round 3 - PCB Design (hands-on), Round 4 - Circuit Analysis, plus technical and behavioral rounds'
                                    : 'AI analyzes your job description and creates custom interview rounds tailored to the specific role, skills, and requirements'
                                }
                              </p>
                            </motion.div>
                            
                            <motion.div 
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 1.1, duration: 0.6 }}
                              className="relative group"
                            >
                              <textarea
                                value={jobPrompt}
                                onChange={(e) => setJobPrompt(e.target.value)}
                                rows={12}
                                className={`w-full px-6 py-4 rounded-xl border-2 transition-all duration-300 resize-none focus:outline-none text-base ${
                                  isDarkMode 
                                    ? 'bg-black/30 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 hover:border-blue-400' 
                                    : 'bg-white/80 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 hover:border-blue-400'
                                }`}
                                placeholder={jobType === 'developer' 
                                  ? "Example: I need to hire a Senior React Developer for our fintech startup. The role involves building modern web applications using React, TypeScript, and Node.js. Requirements include 5+ years of React experience, strong knowledge of JavaScript/TypeScript, experience with Redux, REST APIs, and Git. The person will work remotely, salary range $100k-$140k. They'll be responsible for developing new features, maintaining existing code, and mentoring junior developers..."
                                  : jobType === 'sales'
                                    ? "Example: I need to hire a Sales Manager for our SaaS company. The role involves managing a team of 5 sales representatives, developing sales strategies, meeting quarterly targets, and building relationships with enterprise clients. Requirements include 3+ years of sales management experience, proven track record of meeting/exceeding targets, experience with CRM systems, and strong leadership skills. The person will work in our downtown office, salary range $80k-$120k plus commission. They'll be responsible for team performance, client acquisition, and revenue growth..."
                                    : jobType === 'pcb'
                                      ? "Example: I need to hire an Electronics Engineer for our IoT company. The role involves designing PCB layouts, selecting components, creating schematics, and testing electronic circuits. Requirements include 3+ years of electronics design experience, proficiency in Altium Designer or KiCad, knowledge of analog/digital circuits, experience with microcontrollers, and understanding of EMI/EMC principles. The person will work in our lab, salary range $70k-$90k. They'll be responsible for designing PCBs for IoT devices, collaborating with firmware engineers, and ensuring designs meet manufacturing requirements..."
                                    : "Example: I need to hire a Marketing Manager for our e-commerce company. The role involves developing digital marketing strategies, managing social media campaigns, analyzing customer data, and driving brand awareness. Requirements include 4+ years of marketing experience, expertise in Google Analytics, Facebook Ads, email marketing, and content creation. The person will work in our office, salary range $60k-$80k. They'll be responsible for increasing online sales, managing marketing budgets, and collaborating with the design team..."
                                }
                              />
                              
                              {/* Animated character counter */}
                              <motion.div 
                                animate={{ scale: jobPrompt.length > 0 ? [1, 1.1, 1] : 1 }}
                                transition={{ duration: 0.3 }}
                                className={`absolute bottom-6 right-6 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                  jobPrompt.length >= 10 
                                    ? isDarkMode 
                                      ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                                      : 'bg-green-100 text-green-700 border border-green-200'
                                    : isDarkMode 
                                      ? 'bg-gray-700/50 text-gray-400' 
                                      : 'bg-gray-100 text-gray-500'
                                }`}
                              >
                                {jobPrompt.length} characters (minimum 10 required)
                              </motion.div>
                              
                              {/* Floating label effect */}
                              {jobPrompt.length > 0 && (
                                <motion.div
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className={`absolute -top-2 left-6 px-2 text-xs font-medium ${isDarkMode ? 'bg-black text-blue-400' : 'bg-white text-blue-600'}`}
                                >
                                  Job Description
                                </motion.div>
                              )}
                            </motion.div>
                          </div>

                          {/* Enhanced Action Buttons */}
                          <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.2, duration: 0.6 }}
                            className="flex justify-end space-x-4 mt-4"
                          >
                            <motion.button
                              whileHover={{ scale: 1.05, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setShowCreateJob(false)}
                              className={`px-8 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                                isDarkMode 
                                  ? 'text-gray-300 hover:text-white hover:bg-gray-700/50 border border-gray-600/50' 
                                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100 border border-gray-200'
                              }`}
                            >
                              Cancel
                            </motion.button>
                            
                            <motion.button
                              whileHover={{ 
                                scale: loading || jobPrompt.trim().length < 10 ? 1 : 1.05,
                                y: loading || jobPrompt.trim().length < 10 ? 0 : -3
                              }}
                              whileTap={{ scale: 0.95 }}
                              onClick={generateAIInterview}
                              disabled={loading || jobPrompt.trim().length < 10}
                              className="group relative flex items-center space-x-3 px-10 py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 hover:from-blue-700 hover:via-blue-800 hover:to-purple-800 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-2xl transition-all duration-300 font-semibold shadow-2xl hover:shadow-blue-500/25 disabled:shadow-none overflow-hidden"
                            >
                              {/* Animated background */}
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                              
                              {/* Floating particles */}
                              {!loading && jobPrompt.trim().length >= 10 && (
                                <div className="absolute inset-0 overflow-hidden">
                                  <motion.div
                                    animate={{ 
                                      x: [0, 100, 0],
                                      opacity: [0, 1, 0]
                                    }}
                                    transition={{ 
                                      duration: 3,
                                      repeat: Infinity,
                                      ease: "easeInOut"
                                    }}
                                    className="absolute top-0 left-0 w-2 h-2 bg-white rounded-full"
                                  ></motion.div>
                                  <motion.div
                                    animate={{ 
                                      x: [0, -100, 0],
                                      opacity: [0, 1, 0]
                                    }}
                                    transition={{ 
                                      duration: 3,
                                      repeat: Infinity,
                                      ease: "easeInOut",
                                      delay: 1
                                    }}
                                    className="absolute bottom-0 right-0 w-1 h-1 bg-white rounded-full"
                                  ></motion.div>
                                </div>
                              )}
                              
                              <div className="relative z-10 flex items-center space-x-3">
                              {loading ? (
                                <>
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                    ></motion.div>
                                  <span>Creating AI Interview...</span>
                                </>
                              ) : (
                                <>
                                    <motion.div
                                      whileHover={{ rotate: 180 }}
                                      transition={{ duration: 0.5 }}
                                    >
                                  <Sparkles className="h-5 w-5" />
                                    </motion.div>
                                  <span>Generate AI Interview</span>
                                </>
                              )}
                          </div>
                              
                              {/* Shine effect */}
                              {!loading && jobPrompt.trim().length >= 10 && (
                                <motion.div
                                  animate={{ x: ['-100%', '100%'] }}
                                  transition={{ 
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                  }}
                                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                                ></motion.div>
                              )}
                            </motion.button>
                          </motion.div>
                        </motion.div>
                      </div>

                      {/* Enhanced Sidebar */}
                      <div className="space-y-6">
                        {/* Enhanced AI Features */}
                        <motion.div
                          initial={{ x: 30, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 1.3, duration: 0.6 }}
                          className={`${isDarkMode ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-500/40' : 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200'} rounded-2xl border backdrop-blur-xl shadow-2xl p-6`}
                        >
                          <div className="flex items-center space-x-3 mb-4">
                            <motion.div 
                              animate={{ rotate: [0, 360] }}
                              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                              className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-500/30' : 'bg-blue-100'}`}
                            >
                              <Bot className={`h-6 w-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                            </motion.div>
                            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              AI Magic ✨
                            </h3>
                          </div>
                          <ul className={`space-y-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {[
                              "Extract job title & level automatically",
                              "Generate 5 tailored interview rounds", 
                              "Create role-specific questions",
                              "Optimize interview duration",
                              "Include company context"
                            ].map((feature, index) => (
                              <motion.li 
                                key={feature}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 1.4 + index * 0.1, duration: 0.4 }}
                                className="flex items-start space-x-3 group"
                              >
                                <motion.div
                                  whileHover={{ scale: 1.2, rotate: 360 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <CheckCircle className={`h-4 w-4 mt-0.5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                                </motion.div>
                                <span className="text-xs group-hover:text-blue-400 transition-colors duration-200">{feature}</span>
                              </motion.li>
                            ))}
                          </ul>
                        </motion.div>

                        {/* Enhanced Pro Tips */}
                        <motion.div
                          initial={{ x: 30, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 1.8, duration: 0.6 }}
                          className={`${isDarkMode ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30' : 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200'} rounded-2xl border backdrop-blur-xl shadow-2xl p-6`}
                        >
                          <div className="flex items-center space-x-3 mb-4">
                            <motion.div 
                              animate={{ 
                                scale: [1, 1.1, 1],
                                rotate: [0, 5, -5, 0]
                              }}
                              transition={{ 
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                              className={`p-2 rounded-lg ${isDarkMode ? 'bg-yellow-500/30' : 'bg-yellow-100'}`}
                            >
                              <svg className={`h-6 w-6 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                            </motion.div>
                            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              Pro Tips 💡
                            </h3>
                          </div>
                          <ul className={`space-y-3 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {[
                              "Include specific technologies and frameworks",
                              "Mention years of experience required",
                              "Describe company culture and values",
                              "Include salary range and benefits",
                              "Specify remote/hybrid/onsite work"
                            ].map((tip, index) => (
                              <motion.li 
                                key={tip}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 1.9 + index * 0.1, duration: 0.4 }}
                                className="flex items-start space-x-3 group"
                              >
                                <motion.div
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ 
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: index * 0.2
                                  }}
                                  className={`w-2 h-2 rounded-full mt-2 ${isDarkMode ? 'bg-blue-400' : 'bg-blue-500'}`}
                                ></motion.div>
                                <span className="text-xs group-hover:text-yellow-400 transition-colors duration-200">{tip}</span>
                              </motion.li>
                            ))}
                          </ul>
                        </motion.div>

                        {/* Enhanced Example Output */}
                        <motion.div
                          initial={{ x: 30, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 2.3, duration: 0.6 }}
                          className={`${isDarkMode ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/30' : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'} rounded-2xl border backdrop-blur-xl shadow-2xl p-6`}
                        >
                          <div className="flex items-center space-x-3 mb-4">
                            <motion.div 
                              animate={{ 
                                y: [0, -5, 0],
                                rotate: [0, 10, -10, 0]
                              }}
                              transition={{ 
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                              }}
                              className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-500/30' : 'bg-green-100'}`}
                            >
                              <FileText className={`h-6 w-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                            </motion.div>
                            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              Example Output 📄
                            </h3>
                          </div>
                          <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} space-y-2`}>
                            {[
                              { label: "Job Title", value: "Senior React Developer" },
                              { label: "Duration", value: "25-30 minutes" },
                              { label: "Rounds", value: "5 interview rounds" },
                              { label: "Questions", value: "15+ tailored questions" },
                              { label: "Focus", value: "Technical skills, problem-solving, culture fit" }
                            ].map((item, index) => (
                              <motion.div
                                key={item.label}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 2.4 + index * 0.1, duration: 0.4 }}
                                className="flex justify-between items-center p-2 rounded-lg bg-black/10 border border-gray-600/20"
                              >
                                <span className="font-medium text-blue-400 text-xs">{item.label}:</span>
                                <span className="text-right text-xs">{item.value}</span>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Generated Interview Success */}
          {generatedInterview && (
            <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-semibold text-green-800">AI Interview Generated Successfully!</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Interview Details</h4>
                  <p className="text-sm text-gray-600"><strong>Title:</strong> {generatedInterview.title}</p>
                  <p className="text-sm text-gray-600"><strong>Duration:</strong> {generatedInterview.totalDuration || generatedInterview.duration} minutes</p>
                  <p className="text-sm text-gray-600"><strong>Rounds:</strong> {generatedInterview.rounds?.length || generatedInterview.questions?.length} rounds</p>
                  <p className="text-sm text-gray-600"><strong>Total Questions:</strong> {(generatedInterview.rounds?.length || 0) * 5} questions</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Share Interview Link</h4>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={interviewLink}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                    />
                    <button
                      onClick={copyLink}
                      className="flex items-center space-x-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      {modalLinkCopied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      <span>{modalLinkCopied ? 'Copied!' : 'Copy'}</span>
              </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Jobs List */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.6 }}
            className={`${isDarkMode ? 'bg-black/30 border border-blue-500/40 backdrop-blur-xl' : 'bg-white/90 backdrop-blur-sm'} rounded-2xl shadow-2xl overflow-hidden`}
          >
            <div className={`px-8 py-6 border-b ${isDarkMode ? 'border-blue-500/30' : 'border-gray-200'} flex items-center justify-between bg-gradient-to-r ${isDarkMode ? 'from-black/20 to-black/10' : 'from-blue-50/50 to-transparent'}`}>
              <div className="flex items-center space-x-3">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}
                >
                  <Briefcase className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                </motion.div>
                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Your AI Interview Jobs</h2>
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.6, type: "spring", stiffness: 200 }}
                className={`text-sm px-4 py-2 rounded-full font-medium ${isDarkMode ? 'bg-blue-500/20 text-blue-200 border border-blue-500/30' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}
              >
                {jobs.length} total
              </motion.div>
            </div>
            <div className="p-6">
              {jobs.length > 0 ? (
                <div className="space-y-4">
                  {jobs.map((job, idx) => (
                    <motion.div
                      key={job.id || idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.7 + idx * 0.1, duration: 0.5 }}
                      whileHover={{ 
                        y: -8, 
                        scale: 1.02,
                        transition: { duration: 0.2 }
                      }}
                      className={`group relative overflow-hidden rounded-2xl p-6 backdrop-blur-sm border transition-all duration-300 ${
                        isDarkMode 
                          ? 'border-blue-500/30 bg-black/20 hover:bg-black/30 shadow-lg shadow-blue-500/10' 
                          : 'border-gray-200 bg-white/80 hover:bg-white shadow-lg shadow-gray-500/5'
                      }`}
                    >
                      {/* Animated background gradient */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative z-10 flex justify-between items-start">
                        <div className="flex-1">
                          <motion.h3 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.8 + idx * 0.1 }}
                            className={`text-lg font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                          >
                            {job.title}
                          </motion.h3>
                          <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.9 + idx * 0.1 }}
                            className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm mb-3`}
                          >
                            {job.company}
                          </motion.p>
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 2.0 + idx * 0.1 }}
                            className="flex items-center mt-2 space-x-6"
                          >
                            <div className={`flex items-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              <motion.div
                                whileHover={{ scale: 1.2 }}
                                className="mr-2"
                              >
                                <MapPin className="h-4 w-4" />
                              </motion.div>
                              {job.location}
                            </div>
                            <div className={`flex items-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              <motion.div
                                whileHover={{ scale: 1.2 }}
                                className="mr-2"
                              >
                                <DollarSign className="h-4 w-4" />
                              </motion.div>
                              {job.salary}
                            </div>
                            <div className={`flex items-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                              <motion.div
                                whileHover={{ scale: 1.2 }}
                                className="mr-2"
                              >
                                <Clock className="h-4 w-4" />
                              </motion.div>
                              {job.duration} min
                          </div>
                          </motion.div>
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 2.1 + idx * 0.1 }}
                            className="mt-3"
                          >
                            <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${isDarkMode ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-green-100 text-green-800 border border-green-200'}`}>
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-2 h-2 bg-green-500 rounded-full mr-2"
                              ></motion.div>
                              {job.status}
                            </span>
                          </motion.div>
                          </div>
                        <motion.div 
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 2.2 + idx * 0.1 }}
                          className="flex flex-col space-y-3 ml-4"
                        >
                          {/* Always visible interview URL */}
                          <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800/50 border-gray-600 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                            <Link className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            <span className="text-xs font-mono truncate max-w-48">
                              {job.link || job.interviewLink || `${window.location.origin}/interview/${job.interviewId}`}
                            </span>
                          <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={async () => {
                              const computedLink = job.link || job.interviewLink || `${window.location.origin}/interview/${job.interviewId}`;
                                try {
                                  await navigator.clipboard.writeText(computedLink);
                                  setCopiedInterviewId(job.interviewId);
                                  setTimeout(() => setCopiedInterviewId(null), 2000);
                                } catch (err) {
                                  console.error('Failed to copy link:', err);
                                }
                              }}
                              className={`p-1 rounded transition-colors duration-200 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                              title="Copy link"
                            >
                              {copiedInterviewId === job.interviewId ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4 text-gray-500" />
                              )}
                          </motion.button>
                          </div>


                          {/* Action buttons row */}
                          <div className="flex flex-wrap gap-2">
                          {/* Approve and Reject buttons for pending interviews (including undefined for legacy interviews) */}
                          {(job.approvalStatus === 'pending' || job.approvalStatus === undefined) && (
                            <>
                              <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to approve this interview?')) {
                                    approveInterview(job.interviewId);
                                  }
                                }}
                                className={`group flex items-center space-x-2 px-4 py-2 text-sm rounded-xl transition-all duration-300 ${isDarkMode ? 'bg-green-500/20 text-green-200 hover:bg-green-500/30 border border-green-500/30' : 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-200'}`}
                              >
                                <motion.div
                                  whileHover={{ scale: 1.1 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <ThumbsUp className="h-4 w-4" />
                                </motion.div>
                                <span>Approve</span>
                              </motion.button>

                              <motion.button
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to reject this interview?')) {
                                    rejectInterview(job.interviewId);
                                  }
                                }}
                                className={`group flex items-center space-x-2 px-4 py-2 text-sm rounded-xl transition-all duration-300 ${isDarkMode ? 'bg-red-500/20 text-red-200 hover:bg-red-500/30 border border-red-500/30' : 'bg-red-100 text-red-800 hover:bg-red-200 border border-red-200'}`}
                              >
                                <motion.div
                                  whileHover={{ scale: 1.1 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <ThumbsDown className="h-4 w-4" />
                                </motion.div>
                                <span>Reject</span>
                              </motion.button>
                            </>
                          )}

                          {/* Show approval status for approved/rejected interviews */}
                          {job.approvalStatus === 'approved' && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className={`flex items-center space-x-2 px-4 py-2 text-sm rounded-xl ${isDarkMode ? 'bg-green-500/20 text-green-200 border border-green-500/30' : 'bg-green-100 text-green-800 border border-green-200'}`}
                            >
                              <CheckCircle className="h-4 w-4" />
                              <span>Approved</span>
                            </motion.div>
                          )}

                          {job.approvalStatus === 'rejected' && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className={`flex items-center space-x-2 px-4 py-2 text-sm rounded-xl ${isDarkMode ? 'bg-red-500/20 text-red-200 border border-red-500/30' : 'bg-red-100 text-red-800 border border-red-200'}`}
                            >
                              <X className="h-4 w-4" />
                              <span>Rejected</span>
                            </motion.div>
                          )}
                            
                            <motion.button
                              whileHover={{ scale: 1.05, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                window.location.href = `/recruiter/review/${job.interviewId}`;
                              }}
                              className={`group flex items-center space-x-2 px-4 py-2 text-sm rounded-xl transition-all duration-300 ${isDarkMode ? 'bg-blue-500/20 text-blue-200 hover:bg-blue-500/30 border border-blue-500/30' : 'bg-blue-100 text-blue-800 hover:bg-blue-200 border border-blue-200'}`}
                            >
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                transition={{ duration: 0.2 }}
                            >
                              <Edit3 className="h-4 w-4" />
                              </motion.div>
                              <span>Edit</span>
                            </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setPerformanceInterviewId(job.interviewId);
                              setShowPerformanceDashboard(true);
                            }}
                            className={`group flex items-center space-x-2 px-4 py-2 text-sm rounded-xl transition-all duration-300 ${isDarkMode ? 'bg-purple-500/20 text-purple-200 hover:bg-purple-500/30 border border-purple-500/30' : 'bg-purple-100 text-purple-800 hover:bg-purple-200 border border-purple-200'}`}
                          >
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              transition={{ duration: 0.2 }}
                          >
                            <BarChart3 className="h-4 w-4" />
                            </motion.div>
                            <span>View Performance</span>
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={async () => {
                              if (!window.confirm('Delete this interview? This cannot be undone.')) return;
                              try {
                                const res = await apiService.deleteInterview(job.interviewId);
                                if (res?.success) {
                                  setJobs(prev => prev.filter(j => (j.id || j.interviewId) !== (job.id || job.interviewId)));
                                } else {
                                  alert('Failed to delete interview');
                                }
                              } catch (e) {
                                alert('Error deleting interview');
                              }
                            }}
                            className={`group flex items-center space-x-2 px-4 py-2 text-sm rounded-xl transition-all duration-300 ${isDarkMode ? 'bg-red-500/20 text-red-200 hover:bg-red-500/30 border border-red-500/30' : 'bg-red-100 text-red-800 hover:bg-red-200 border border-red-200'}`}
                          >
                            <motion.span
                              whileHover={{ scale: 1.1 }}
                              transition={{ duration: 0.2 }}
                            >
                              Delete
                            </motion.span>
                          </motion.button>
                          </div>
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5, duration: 0.6 }}
                  className="text-center py-12"
                >
                  <motion.div
                    animate={{ 
                      y: [0, -10, 0],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="mb-6"
                  >
                    <Bot className="h-16 w-16 text-gray-400 mx-auto" />
                  </motion.div>
                  <motion.h3 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.7 }}
                    className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                  >
                    No AI interview jobs created yet
                  </motion.h3>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.8 }}
                    className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                  >
                    Create your first job with AI-powered interviews
                  </motion.p>
                </motion.div>
              )}
            </div>
          </motion.div>
          </>
        )}

        {activeTab === 'scheduler' && (
          <div className="space-y-6">
            {/* Scheduler Header */}
            <div className={`${isDarkMode ? 'bg-gradient-to-r from-green-900/50 to-slate-900/50 border border-green-500/30 backdrop-blur' : 'bg-gradient-to-r from-green-600 to-slate-700'} rounded-2xl shadow-2xl p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-white'} mb-2`}>
                    📅 Interview Scheduler
                  </h2>
                  <p className={`${isDarkMode ? 'text-green-200' : 'text-green-100'}`}>
                    Schedule interview rounds with specific time slots and requirements
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-green-800/30' : 'bg-green-500/20'}`}>
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-green-200' : 'text-green-100'}`}>
                      {jobs.length} Interviews
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interview Selection for Scheduler */}
            <div className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-white'} rounded-2xl shadow-xl p-6`}>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                Select Interview to Schedule Rounds
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {jobs.map((job) => (
                  <div
                    key={job.interviewId}
                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:scale-105 ${
                      isDarkMode 
                        ? 'bg-gray-700/50 border-gray-600 hover:border-green-500 hover:bg-gray-700' 
                        : 'bg-gray-50 border-gray-200 hover:border-green-500 hover:bg-green-50'
                    }`}
                    onClick={() => {
                      setSchedulerInterviewId(job.interviewId);
                      setShowScheduler(true);
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                          {job.title}
                        </h4>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                          {job.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        📅 Schedule Rounds
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSchedulerInterviewId(job.interviewId);
                          setShowScheduler(true);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          isDarkMode
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        Schedule
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'candidate-manager' && (
          <div className="space-y-6">
            {/* Candidate Manager Header */}
            <div className={`${isDarkMode ? 'bg-gradient-to-r from-purple-900/50 to-slate-900/50 border border-purple-500/30 backdrop-blur' : 'bg-gradient-to-r from-purple-600 to-slate-700'} rounded-2xl shadow-2xl p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-white'} mb-2`}>
                    👥 Candidate Manager
                  </h2>
                  <p className={`${isDarkMode ? 'text-purple-200' : 'text-purple-100'}`}>
                    Manage candidate progression through interview rounds
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-purple-800/30' : 'bg-purple-500/20'}`}>
                    <span className={`text-sm font-medium ${isDarkMode ? 'text-purple-200' : 'text-purple-100'}`}>
                      {jobs.length} Interviews
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interview Selection for Candidate Manager */}
            <div className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-white'} rounded-2xl shadow-xl p-6`}>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                Select Interview to Manage Candidates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {jobs.map((job) => (
                  <div
                    key={job.interviewId}
                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:scale-105 ${
                      isDarkMode 
                        ? 'bg-gray-700/50 border-gray-600 hover:border-purple-500 hover:bg-gray-700' 
                        : 'bg-gray-50 border-gray-200 hover:border-purple-500 hover:bg-purple-50'
                    }`}
                    onClick={() => {
                      setCandidateManagerInterviewId(job.interviewId);
                      setShowCandidateManager(true);
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                          {job.title}
                        </h4>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                          {job.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        👥 Manage Candidates
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCandidateManagerInterviewId(job.interviewId);
                          setShowCandidateManager(true);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          isDarkMode
                            ? 'bg-purple-600 hover:bg-purple-700 text-white'
                            : 'bg-purple-600 hover:bg-purple-700 text-white'
                        }`}
                      >
                        Manage
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'candidates' && (
          <div className="space-y-6">
            {/* Candidates Header */}
            <div className={`${isDarkMode ? 'bg-gradient-to-r from-blue-900/50 to-slate-900/50 border border-blue-500/30 backdrop-blur' : 'bg-gradient-to-r from-blue-600 to-slate-700'} rounded-2xl shadow-2xl p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-white'} mb-2`}>
                    👥 Candidate Management
                  </h2>
                  <p className={`${isDarkMode ? 'text-blue-200' : 'text-blue-100'}`}>
                    Manage and review candidates who have applied to your jobs
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className={`${isDarkMode ? 'bg-white/20' : 'bg-white/20'} rounded-xl p-4`}>
                    <div className="text-2xl font-bold text-white">
                      {candidates.interview?.length || 0}
                    </div>
                    <div className="text-sm text-blue-100">Interviewed</div>
                  </div>
                  <div className={`${isDarkMode ? 'bg-white/20' : 'bg-white/20'} rounded-xl p-4`}>
                    <div className="text-2xl font-bold text-white">
                      {candidates.applied?.length || 0}
                    </div>
                    <div className="text-sm text-blue-100">Applied</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Candidate View Tabs */}
            <div className={`${isDarkMode ? 'bg-white/10 border border-white/10 backdrop-blur' : 'bg-white'} rounded-2xl shadow-lg p-6`}>
              <div className="flex space-x-4 mb-6">
                <button
                  onClick={() => setCandidateViewType('interview')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    candidateViewType === 'interview'
                      ? isDarkMode 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : 'bg-blue-600 text-white shadow-lg'
                      : isDarkMode 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  🎯 Interview Candidates
                </button>
                <button
                  onClick={() => setCandidateViewType('applied')}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    candidateViewType === 'applied'
                      ? isDarkMode 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : 'bg-blue-600 text-white shadow-lg'
                      : isDarkMode 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  📝 Applied Candidates
                </button>
              </div>

              {/* Job-based Filters */}
              <div className="mb-6">
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                  🔍 Filter by Job Postings
                </h3>
                
                {/* Job Selection with Application Counts */}
                <div className="mb-4">
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                    Select Job to View Applications
                  </label>
                  <select
                    value={candidateFilters.jobId}
                    onChange={(e) => handleCandidateFilterChange('jobId', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white focus:border-blue-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                    }`}
                  >
                    <option value="">All Jobs</option>
                    {recruiterJobs.map(job => {
                      const applicationCount = candidates.applied?.filter(app => app.jobTitle === job.title).length || 0;
                      const interviewCount = candidates.interview?.filter(app => app.jobTitle === job.title).length || 0;
                      const totalCount = applicationCount + interviewCount;
                      
                      return (
                        <option key={job._id} value={job._id}>
                          {job.title} - {totalCount} {totalCount === 1 ? 'application' : 'applications'} ({applicationCount} applied, {interviewCount} interviewed)
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Additional Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Application Status
                    </label>
                    <select
                      value={candidateFilters.status}
                      onChange={(e) => handleCandidateFilterChange('status', e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-600 text-white focus:border-blue-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                      }`}
                    >
                      <option value="">All Statuses</option>
                      {candidateViewType === 'interview' ? (
                        <>
                          <option value="interviewed">Interviewed</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="rejected">Rejected</option>
                          <option value="hired">Hired</option>
                        </>
                      ) : (
                        <>
                          <option value="pending">Pending</option>
                          <option value="reviewing">Reviewing</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="rejected">Rejected</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Skills Search
                    </label>
                    <input
                      type="text"
                      value={candidateFilters.skills}
                      onChange={(e) => handleCandidateFilterChange('skills', e.target.value)}
                      placeholder="e.g., React, Python, JavaScript"
                      className={`w-full px-3 py-2 rounded-lg border-2 transition-all duration-200 ${
                        isDarkMode 
                          ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Job Application Summary */}
            {recruiterJobs.length > 0 && (
              <div className={`${isDarkMode ? 'bg-white/10 border border-white/10 backdrop-blur' : 'bg-white'} rounded-2xl shadow-lg p-6 mb-6`}>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                  📊 Application Summary by Job
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recruiterJobs.map(job => {
                    const applicationCount = candidates.applied?.filter(app => app.jobTitle === job.title).length || 0;
                    const interviewCount = candidates.interview?.filter(app => app.jobTitle === job.title).length || 0;
                    const totalCount = applicationCount + interviewCount;
                    
                    return (
                      <div key={job._id} className={`${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'} rounded-lg p-4`}>
                        <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                          {job.title}
                        </h4>
                        <div className="space-y-1 text-sm">
                          <div className={`flex justify-between ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            <span>Total Applications:</span>
                            <span className="font-medium">{totalCount}</span>
                          </div>
                          <div className={`flex justify-between ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                            <span>Applied:</span>
                            <span className="font-medium">{applicationCount}</span>
                          </div>
                          <div className={`flex justify-between ${isDarkMode ? 'text-green-300' : 'text-green-600'}`}>
                            <span>Interviewed:</span>
                            <span className="font-medium">{interviewCount}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Candidates List */}
            {candidatesLoading ? (
              <div className={`${isDarkMode ? 'bg-white/10 border border-white/10 backdrop-blur' : 'bg-white'} rounded-2xl shadow-lg p-12 text-center`}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-600'}`}>Loading candidates...</p>
              </div>
            ) : filteredCandidates.length > 0 ? (
              <div className="space-y-4">
                {filteredCandidates.map((candidate) => (
                  <div key={candidate._id} className={`${isDarkMode ? 'bg-white/10 border border-white/10 backdrop-blur' : 'bg-white'} rounded-2xl shadow-lg p-6`}>
                    {candidateViewType === 'interview' ? (
                      // Interview Candidate Card
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                            candidate.status === 'hired' ? 'bg-green-500' :
                            candidate.status === 'shortlisted' ? 'bg-blue-500' :
                            candidate.status === 'interviewed' ? 'bg-purple-500' :
                            candidate.status === 'rejected' ? 'bg-red-500' : 'bg-gray-500'
                          }`}>
                            {candidate.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {candidate.name}
                              </h3>
                              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                candidate.status === 'hired' ? 'bg-green-100 text-green-800' :
                                candidate.status === 'shortlisted' ? 'bg-blue-100 text-blue-800' :
                                candidate.status === 'interviewed' ? 'bg-purple-100 text-purple-800' :
                                candidate.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
                              </span>
                            </div>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                              {candidate.email} • {candidate.phone}
                            </p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
                              Applied for: <span className="font-medium">{candidate.jobTitle}</span> • {candidate.experience} experience
                            </p>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {candidate.skills.map((skill, idx) => (
                                <span key={idx} className={`px-2 py-1 text-xs rounded-full ${
                                  isDarkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {skill}
                                </span>
                              ))}
                            </div>
                            
                            {/* Interview Scores */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
                              <div className="text-center">
                                <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {candidate.overallScore}/5
                                </div>
                                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Overall</div>
                              </div>
                              <div className="text-center">
                                <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {candidate.technicalScore}/5
                                </div>
                                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Technical</div>
                              </div>
                              <div className="text-center">
                                <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {candidate.communicationScore}/5
                                </div>
                                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Communication</div>
                              </div>
                              <div className="text-center">
                                <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {candidate.problemSolvingScore}/5
                                </div>
                                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Problem Solving</div>
                              </div>
                              <div className="text-center">
                                <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {candidate.culturalFitScore}/5
                                </div>
                                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Cultural Fit</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <select
                            value={candidate.status}
                            onChange={(e) => handleCandidateStatusChange(candidate._id, e.target.value)}
                            className={`px-3 py-1 text-sm rounded-lg border transition-all duration-200 ${
                              isDarkMode 
                                ? 'bg-gray-800 border-gray-600 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          >
                            <option value="interviewed">Interviewed</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="rejected">Rejected</option>
                            <option value="hired">Hired</option>
                          </select>
                          <button
                            onClick={() => toggleExpand(candidate._id)}
                            className={`px-3 py-1 text-sm rounded-lg transition-all duration-200 ${
                              expandedCandidates[candidate._id]
                                ? isDarkMode 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-blue-600 text-white'
                                : isDarkMode 
                                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {expandedCandidates[candidate._id] ? 'Hide Details' : 'View Details'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Applied Candidate Card
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                            candidate.status === 'hired' ? 'bg-green-500' :
                            candidate.status === 'shortlisted' ? 'bg-blue-500' :
                            candidate.status === 'rejected' ? 'bg-red-500' : 'bg-gray-500'
                          }`}>
                            {candidate.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {candidate.name}
                              </h3>
                              <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                                candidate.status === 'hired' ? 'bg-green-100 text-green-800' :
                                candidate.status === 'shortlisted' ? 'bg-blue-100 text-blue-800' :
                                candidate.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {candidate.status.charAt(0).toUpperCase() + candidate.status.slice(1)}
                              </span>
                            </div>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                              {candidate.email} • {candidate.phone}
                            </p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-3`}>
                              Applied for: <span className="font-medium">{candidate.jobTitle}</span> • {candidate.experience} experience
                            </p>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {candidate.skills.map((skill, idx) => (
                                <span key={idx} className={`px-2 py-1 text-xs rounded-full ${
                                  isDarkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {skill}
                                </span>
                              ))}
                            </div>
                            
                            {/* Application Details */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                              <div>
                                <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  Expected Salary
                                </div>
                                <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                  {candidate.expectedSalary}
                                </div>
                              </div>
                              <div>
                                <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  Availability
                                </div>
                                <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                  {candidate.availability}
                                </div>
                              </div>
                              <div>
                                <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  Education
                                </div>
                                <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                  {candidate.education}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <select
                            value={candidate.status}
                            onChange={(e) => handleCandidateStatusChange(candidate._id, e.target.value)}
                            className={`px-3 py-1 text-sm rounded-lg border transition-all duration-200 ${
                              isDarkMode 
                                ? 'bg-gray-800 border-gray-600 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          >
                            <option value="applied">Applied</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="rejected">Rejected</option>
                          </select>
                          <button
                            onClick={() => toggleExpand(candidate._id)}
                            className={`px-3 py-1 text-sm rounded-lg transition-all duration-200 ${
                              expandedCandidates[candidate._id]
                                ? isDarkMode 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-blue-600 text-white'
                                : isDarkMode 
                                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {expandedCandidates[candidate._id] ? 'Hide Details' : 'View Details'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Expanded Details */}
                    {expandedCandidates[candidate._id] && (
                      <div className={`${isDarkMode ? 'bg-black/30 border border-blue-500/20' : 'bg-gray-50 border border-gray-200'} rounded-xl p-4 mt-4`}>
                        {candidateViewType === 'interview' ? (
                          // Interview Details
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                                Interview Notes
                              </h4>
                              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
                                {candidate.interviewNotes}
                              </p>
                              <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                                Strengths
                              </h4>
                              <div className="flex flex-wrap gap-1 mb-4">
                                {candidate.strengths.map((strength, idx) => (
                                  <span key={idx} className={`px-2 py-1 text-xs rounded-full ${
                                    isDarkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-800'
                                  }`}>
                                    {strength}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                                Areas for Improvement
                              </h4>
                              <div className="flex flex-wrap gap-1 mb-4">
                                {candidate.weaknesses.map((weakness, idx) => (
                                  <span key={idx} className={`px-2 py-1 text-xs rounded-full ${
                                    isDarkMode ? 'bg-yellow-500/20 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {weakness}
                                  </span>
                                ))}
                              </div>
                              <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                                Recommendation
                              </h4>
                              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
                                {candidate.recommendation}
                              </p>
                              <div className="text-xs text-gray-500">
                                Interviewed on: {new Date(candidate.interviewDate).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Application Details
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                                Cover Letter
                              </h4>
                              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
                                {candidate.coverLetter}
                              </p>
                              <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                                Previous Company
                              </h4>
                              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
                                {candidate.previousCompany}
                              </p>
                            </div>
                            <div>
                              <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                                Links
                              </h4>
                              <div className="space-y-2 mb-4">
                                <a href={candidate.portfolio} target="_blank" rel="noopener noreferrer" className={`text-sm ${isDarkMode ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-800'}`}>
                                  Portfolio: {candidate.portfolio}
                                </a>
                                <br />
                                <a href={candidate.linkedin} target="_blank" rel="noopener noreferrer" className={`text-sm ${isDarkMode ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-800'}`}>
                                  LinkedIn: {candidate.linkedin}
                                </a>
                                <br />
                                <a href={candidate.github} target="_blank" rel="noopener noreferrer" className={`text-sm ${isDarkMode ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-800'}`}>
                                  GitHub: {candidate.github}
                                </a>
                              </div>
                              <div className="flex space-x-2">
                                <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                  View Resume
                                </button>
                                <button className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                  Schedule Interview
                                </button>
                              </div>
                              <div className="text-xs text-gray-500 mt-2">
                                Applied on: {new Date(candidate.appliedDate).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={`${isDarkMode ? 'bg-white/10 border border-white/10 backdrop-blur' : 'bg-white'} rounded-2xl shadow-lg p-12 text-center`}>
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                  No {candidateViewType === 'interview' ? 'Interview' : 'Applied'} Candidates Found
                </h3>
                <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  No candidates match your current filters. Try adjusting your search criteria.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'answers' && (
          <div className="space-y-8">
            {/* Modern Performance Dashboard Header */}
            <div className={`${isDarkMode ? 'bg-gradient-to-r from-blue-900/50 to-slate-900/50 border border-blue-500/30 backdrop-blur' : 'bg-gradient-to-r from-blue-600 to-slate-700'} rounded-2xl shadow-2xl p-8`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-white'} mb-2`}>
                    🎯 Performance Analytics
                  </h2>
                  <p className={`${isDarkMode ? 'text-blue-200' : 'text-blue-100'} text-lg`}>
                    Comprehensive candidate performance insights and detailed interview analysis
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className={`${isDarkMode ? 'bg-white/20' : 'bg-white/20'} rounded-xl p-4`}>
                    <div className="text-2xl font-bold text-white">
                      {selectedInterviewId ? (answersSummary?.totalCandidates || Object.keys(answersByCandidate).length) : 0}
                    </div>
                    <div className="text-sm text-blue-100">Candidates</div>
                  </div>
                  <div className={`${isDarkMode ? 'bg-white/20' : 'bg-white/20'} rounded-xl p-4`}>
                    <div className="text-2xl font-bold text-white">
                      {selectedInterviewId ? (answersSummary?.totalAnswers || answers.length) : 0}
                    </div>
                    <div className="text-sm text-blue-100">Total Answers</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interview Selection */}
            <div className={`${isDarkMode ? 'bg-white/10 border border-white/10 backdrop-blur' : 'bg-white'} rounded-2xl shadow-lg p-6`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  📊 Select Interview to Analyze
                </h3>
                <div className="flex items-center space-x-3">
                <button
                  onClick={() => selectedInterviewId && loadAnswers(selectedInterviewId, selectedCandidateId)}
                  className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  🔄 Refresh Data
                </button>
                  <button
                    onClick={() => {
                      console.log('🔍 [DEBUG] Selected Interview ID:', selectedInterviewId);
                      if (selectedInterviewId) {
                        setResultsInterviewId(selectedInterviewId);
                        setShowInterviewResults(true);
                      } else {
                        console.log('❌ [DEBUG] No interview selected');
                      }
                    }}
                    disabled={!selectedInterviewId}
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      selectedInterviewId
                        ? isDarkMode 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'bg-green-600 hover:bg-green-700 text-white'
                        : isDarkMode 
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    📊 Comprehensive Results
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                    🎯 Interview Selection
                  </label>
                  <select
                    value={selectedInterviewId || ''}
                    onChange={(e) => setSelectedInterviewId(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white focus:border-blue-500' 
                        : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                    }`}
                  >
                    <option value="" disabled>Select an interview to analyze</option>
                    {jobs.map(job => (
                      <option key={job.interviewId} value={job.interviewId}>
                        {job.title} - {job.jobTitle}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                    🔍 Filter by Candidate (Optional)
                  </label>
                  <input
                    type="text"
                    value={selectedCandidateId}
                    onChange={(e) => setSelectedCandidateId(e.target.value)}
                    placeholder="candidate@example.com"
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Performance Dashboard Content */}
            {selectedInterviewId && (
              <div className="space-y-6">
                {answersLoading ? (
                  <div className={`${isDarkMode ? 'bg-white/10 border border-white/10 backdrop-blur' : 'bg-white'} rounded-2xl shadow-lg p-12 text-center`}>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-600'}`}>Loading performance data...</p>
                  </div>
                ) : (Object.keys(answersByCandidate).length > 0 || groupAnswersByCandidate().length > 0) ? (
                  <>
                    {/* Performance Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className={`${isDarkMode ? 'bg-black/20 border border-blue-500/30 backdrop-blur' : 'bg-white'} rounded-2xl shadow-lg p-6`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total Candidates</p>
                            <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {answersSummary?.totalCandidates || Object.keys(answersByCandidate).length || groupAnswersByCandidate().length}
                            </p>
                          </div>
                          <div className="p-3 bg-blue-100 rounded-xl">
                            <Users className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                      </div>

                      <div className={`${isDarkMode ? 'bg-black/20 border border-blue-500/30 backdrop-blur' : 'bg-white'} rounded-2xl shadow-lg p-6`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Average Score</p>
                            <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {(answersSummary?.averageScore || (groupAnswersByCandidate().reduce((sum, c) => sum + (c.averageScore || 0), 0) / Math.max(groupAnswersByCandidate().length, 1))).toFixed(1)}/4
                            </p>
                          </div>
                          <div className="p-3 bg-green-100 rounded-xl">
                            <BarChart3 className="h-6 w-6 text-green-600" />
                          </div>
                        </div>
                      </div>

                      <div className={`${isDarkMode ? 'bg-black/20 border border-blue-500/30 backdrop-blur' : 'bg-white'} rounded-2xl shadow-lg p-6`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Total Answers</p>
                            <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {answersSummary?.totalAnswers || answers.length}
                            </p>
                          </div>
                          <div className="p-3 bg-blue-100 rounded-xl">
                            <FileText className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                      </div>

                      <div className={`${isDarkMode ? 'bg-black/20 border border-blue-500/30 backdrop-blur' : 'bg-white'} rounded-2xl shadow-lg p-6`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Completion Rate</p>
                            <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {Math.round(answersSummary?.completionRate || (answers.length / Math.max((Object.keys(answersByCandidate).length || groupAnswersByCandidate().length) * 5, 1)) * 100)}%
                            </p>
                          </div>
                          <div className="p-3 bg-orange-100 rounded-xl">
                            <CheckCircle className="h-6 w-6 text-orange-600" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Candidate Performance Cards */}
                    <div className={`${isDarkMode ? 'bg-black/20 border border-blue-500/30 backdrop-blur' : 'bg-white'} rounded-2xl shadow-lg p-6`}>
                      <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-6`}>
                        👥 Candidate Performance Analysis
                      </h3>
                      
                      <div className="space-y-4">
                        {(groupAnswersByCandidate() || []).map((candidate, index) => (
                          <div key={candidate.candidateId} className={`${isDarkMode ? 'bg-black/30 border border-blue-500/20' : 'bg-gray-50 border border-gray-200'} rounded-xl p-6 transition-all duration-200 hover:shadow-lg`}>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                                  candidate.averageScore >= 3 ? 'bg-green-500' : 
                                  candidate.averageScore >= 2 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}>
                                  {candidate.candidateName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {candidate.candidateName}
                                  </h4>
                                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {candidate.candidateEmail}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-6">
                                <div className="text-center">
                                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {(candidate.averageScore || 0).toFixed(1)}/4
                                  </div>
                                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Avg Score</div>
                                </div>
                                
                                <button
                                  onClick={() => toggleExpand(candidate.candidateId)}
                                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                    expandedCandidates[candidate.candidateId]
                                      ? isDarkMode 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-blue-600 text-white'
                                      : isDarkMode 
                                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  {expandedCandidates[candidate.candidateId] ? '📖 Hide Details' : '📖 View Details'}
                                </button>
                              </div>
                            </div>

                            {/* Performance Bar */}
                            <div className="mb-4">
                              <div className="flex justify-between text-sm mb-1">
                                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>Performance</span>
                                <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                                  {Math.round((candidate.averageScore / 4) * 100)}%
                                </span>
                              </div>
                              <div className={`w-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-3`}>
                                <div 
                                  className={`h-3 rounded-full transition-all duration-1000 ${
                                    candidate.averageScore >= 3 ? 'bg-gradient-to-r from-green-500 to-green-600' : 
                                    candidate.averageScore >= 2 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 
                                    'bg-gradient-to-r from-red-500 to-red-600'
                                  }`}
                                  style={{ width: `${(candidate.averageScore / 4) * 100}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* Expanded Details */}
                            {expandedCandidates[candidate.candidateId] && (
                              <div className={`${isDarkMode ? 'bg-black/30 border border-blue-500/20' : 'bg-white border border-gray-200'} rounded-xl p-6 mt-4`}>
                                <h5 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                                  📝 Detailed Interview Responses
                                </h5>
                                
                                <div className="space-y-4">
                                  {answers
                                    .filter(a => a.candidateId === candidate.candidateId)
                                    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                                    .map((answer, idx) => (
                                      <div key={idx} className={`${isDarkMode ? 'bg-black/20 border border-blue-500/20' : 'bg-gray-50 border border-gray-200'} rounded-lg p-4`}>
                                        <div className="flex items-center justify-between mb-3">
                                          <div className="flex items-center space-x-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                              answer.roundTitle ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                              {answer.roundTitle || 'Round'}
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                              answer.type === 'voice' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                            }`}>
                                              {answer.type?.toUpperCase() || 'TEXT'}
                                            </span>
                                          </div>
                                          <div className="text-sm text-gray-500">
                                            {new Date(answer.timestamp).toLocaleString()}
                                          </div>
                                        </div>
                                        
                                        <div className="mb-3">
                                          <h6 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                                            Q: {answer.question}
                                          </h6>
                                          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} whitespace-pre-wrap`}>
                                            A: {answer.answer}
                                          </p>
                                        </div>

                                        {answer.aiEvaluation && (
                                          <div className={`${isDarkMode ? 'bg-black/20 border border-blue-500/20' : 'bg-white border border-gray-200'} rounded-lg p-4`}>
                                            <div className="flex items-center justify-between mb-3">
                                              <h6 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                🤖 AI Evaluation
                                              </h6>
                                              <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                                                answer.aiEvaluation.score >= 3 ? 'bg-green-100 text-green-800' : 
                                                answer.aiEvaluation.score >= 2 ? 'bg-yellow-100 text-yellow-800' : 
                                                'bg-red-100 text-red-800'
                                              }`}>
                                                {answer.aiEvaluation.score}/4
                                              </div>
                                            </div>
                                            
                                            {answer.aiEvaluation.feedback && (
                                              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                                                {answer.aiEvaluation.feedback}
                                              </p>
                                            )}
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                              {answer.aiEvaluation.strengths?.length > 0 && (
                                                <div>
                                                  <h6 className={`text-sm font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-700'} mb-2`}>
                                                    ✅ Strengths
                                                  </h6>
                                                  <ul className="space-y-1">
                                                    {answer.aiEvaluation.strengths.slice(0, 3).map((strength, i) => (
                                                      <li key={i} className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                        • {strength}
                                                      </li>
                                                    ))}
                                                  </ul>
                                                </div>
                                              )}
                                              
                                              {answer.aiEvaluation.improvements?.length > 0 && (
                                                <div>
                                                  <h6 className={`text-sm font-semibold ${isDarkMode ? 'text-orange-400' : 'text-orange-700'} mb-2`}>
                                                    🎯 Improvements
                                                  </h6>
                                                  <ul className="space-y-1">
                                                    {answer.aiEvaluation.improvements.slice(0, 3).map((improvement, i) => (
                                                      <li key={i} className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                        • {improvement}
                                                      </li>
                                                    ))}
                                                  </ul>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className={`${isDarkMode ? 'bg-black/20 border border-blue-500/30 backdrop-blur' : 'bg-white'} rounded-2xl shadow-lg p-12 text-center`}>
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                      No Performance Data Yet
                    </h3>
                    <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Candidates haven't started this interview yet. Share the interview link to begin collecting performance data.
                    </p>
                  </div>
                )}
              </div>
            )}

            {!selectedInterviewId && (
              <div className={`${isDarkMode ? 'bg-black/20 border border-blue-500/30 backdrop-blur' : 'bg-white'} rounded-2xl shadow-lg p-12 text-center`}>
                <div className="text-6xl mb-4">🎯</div>
                <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                  Select an Interview
                </h3>
                <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Choose an interview from the dropdown above to view detailed performance analytics and candidate insights.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'manage-jobs' && (
          <div className="space-y-6">
            {/* Job Management Header */}
            <div className={`${isDarkMode ? 'bg-gradient-to-r from-blue-900/50 to-slate-900/50 border border-blue-500/30 backdrop-blur' : 'bg-gradient-to-r from-blue-600 to-slate-700'} rounded-2xl shadow-2xl p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-white'} mb-2`}>
                    📋 Job Management
                  </h2>
                  <p className={`${isDarkMode ? 'text-blue-200' : 'text-blue-100'}`}>
                    Manage your job postings - view, edit, activate, pause, or delete
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className={`${isDarkMode ? 'bg-white/20' : 'bg-white/20'} rounded-xl p-4`}>
                    <div className="text-2xl font-bold text-white">
                      {recruiterJobs.length}
                    </div>
                    <div className="text-sm text-blue-100">Total Jobs</div>
                  </div>
                  <div className={`${isDarkMode ? 'bg-white/20' : 'bg-white/20'} rounded-xl p-4`}>
                    <div className="text-2xl font-bold text-white">
                      {recruiterJobs.filter(job => job.status === 'active').length}
                    </div>
                    <div className="text-sm text-blue-100">Active</div>
                  </div>
                  <div className={`${isDarkMode ? 'bg-white/20' : 'bg-white/20'} rounded-xl p-4`}>
                    <div className="text-2xl font-bold text-white">
                      {recruiterJobs.filter(job => job.status === 'paused').length}
                    </div>
                    <div className="text-sm text-blue-100">Paused</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Job Management List */}
            <div className={`${isDarkMode ? 'bg-white/10 border border-white/10 backdrop-blur' : 'bg-white'} rounded-2xl shadow-lg p-6`}>
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                Your Job Postings
              </h3>
              
              {recruiterJobs.length === 0 ? (
                <div className="text-center py-12">
                  <div className={`text-6xl mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>📝</div>
                  <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                    No Jobs Posted Yet
                  </h3>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
                    Start by creating your first job posting to attract candidates.
                  </p>
                  <button
                    onClick={() => setActiveTab('jobs')}
                    className="btn btn-primary"
                  >
                    Create Your First Job
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recruiterJobs.map((job) => {
                    const applicationCount = candidates.applied?.filter(app => app.jobTitle === job.title).length || 0;
                    const interviewCount = candidates.interview?.filter(app => app.jobTitle === job.title).length || 0;
                    const totalApplications = applicationCount + interviewCount;
                    
                    return (
                      <div key={job._id} className={`${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'} rounded-xl p-6`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {job.title}
                              </h4>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                job.status === 'active' 
                                  ? 'bg-green-100 text-green-800' 
                                  : job.status === 'paused'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {job.status}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Company</p>
                                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{job.company}</p>
                              </div>
                              <div>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Location</p>
                                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{job.location}</p>
                              </div>
                              <div>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Applications</p>
                                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {totalApplications} total ({applicationCount} applied, {interviewCount} interviewed)
                                </p>
                              </div>
                            </div>
                            
                            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} line-clamp-2`}>
                              {job.description}
                            </p>
                          </div>
                          
                          <div className="flex flex-col space-y-2 ml-4">
                            {/* View Button */}
                            <button
                              onClick={() => window.open(`/jobs/${job._id}`, '_blank')}
                              className={`px-3 py-1 text-sm rounded-lg transition-all duration-200 ${
                                isDarkMode 
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                            >
                              👁️ View
                            </button>
                            
                            {/* Status Toggle Buttons */}
                            {job.status === 'active' ? (
                              <button
                                onClick={() => handleJobStatusChange(job._id, 'paused')}
                                className={`px-3 py-1 text-sm rounded-lg transition-all duration-200 ${
                                  isDarkMode 
                                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                                    : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                }`}
                              >
                                ⏸️ Pause
                              </button>
                            ) : (
                              <button
                                onClick={() => handleJobStatusChange(job._id, 'active')}
                                className={`px-3 py-1 text-sm rounded-lg transition-all duration-200 ${
                                  isDarkMode 
                                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                                }`}
                              >
                                ▶️ Activate
                              </button>
                            )}
                            
                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteJob(job._id)}
                              className={`px-3 py-1 text-sm rounded-lg transition-all duration-200 ${
                                isDarkMode 
                                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                                  : 'bg-red-600 hover:bg-red-700 text-white'
                              }`}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

                  {activeTab === 'analytics' && (
                    <div className="space-y-6">
                      {/* Analytics Header */}
                      <div className={`${isDarkMode ? 'bg-black/20 border border-blue-500/30 backdrop-blur' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                              📊 Interview Analytics Dashboard
                            </h2>
                            <p className={`${isDarkMode ? 'text-blue-200' : 'text-gray-600'}`}>
                              Comprehensive performance analysis and communication insights
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className={`px-4 py-2 rounded-lg ${isDarkMode ? 'bg-blue-600/20 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                              <span className="text-sm font-medium">
                                {jobs.length} Interview{jobs.length !== 1 ? 's' : ''} Available
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Quick Stats Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Interviews</p>
                                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{jobs.length}</p>
                              </div>
                              <BarChart3 className={`h-8 w-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                            </div>
                          </div>
                          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Interviews</p>
                                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {jobs.filter(job => job.status === 'active').length}
                                </p>
                              </div>
                              <Users className={`h-8 w-8 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                            </div>
                          </div>
                          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Completed</p>
                                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {jobs.filter(job => job.status === 'completed').length}
                                </p>
                              </div>
                              <CheckCircle className={`h-8 w-8 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                            </div>
                          </div>
                          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg. Score</p>
                                <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {interviewStats ? Math.round(interviewStats.statistics.averageScore * 100) / 100 : 'N/A'}
                                </p>
                              </div>
                              <Target className={`h-8 w-8 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                            </div>
                          </div>
                        </div>

                        {/* Interview Selection Grid */}
                        <div>
                          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                            Select Interview for Detailed Analytics
                          </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {jobs.map((job) => (
                              <div
                              key={job.interviewId}
                                className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                                selectedInterviewId === job.interviewId
                                    ? `${isDarkMode ? 'border-blue-500 bg-blue-500/20' : 'border-blue-500 bg-blue-50'} shadow-md`
                                    : `${isDarkMode ? 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`
                                }`}
                                onClick={() => setSelectedInterviewId(job.interviewId)}
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                                      {job.title}
                                    </h4>
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                                      {job.jobTitle}
                                    </p>
                                    <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                Created: {new Date(job.createdAt).toLocaleDateString()}
                              </p>
                                  </div>
                                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    job.status === 'active' 
                                      ? `${isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'}`
                                      : `${isDarkMode ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-700'}`
                                  }`}>
                                    {job.status}
                                  </div>
                                </div>
                                
                                {/* Quick Analytics Preview */}
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center space-x-4">
                                    <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                      📊 Analytics Available
                                    </span>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAnalyticsInterviewId(job.interviewId);
                                      setShowAnalyticsDashboard(true);
                                    }}
                                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                                      isDarkMode 
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    }`}
                                  >
                                    View Analytics
                            </button>
                                </div>
                              </div>
                          ))}
                        </div>
                      </div>

                        {/* Selected Interview Quick Actions */}
                        {selectedInterviewId && (
                          <div className={`mt-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                            <h4 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3`}>
                              Quick Actions for Selected Interview
                            </h4>
                            <div className="flex flex-wrap gap-3">
                              <button
                                onClick={() => {
                                  setAnalyticsInterviewId(selectedInterviewId);
                                  setShowAnalyticsDashboard(true);
                                }}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                                  isDarkMode 
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                              >
                                <BarChart3 className="h-4 w-4" />
                                <span>View Detailed Analytics</span>
                              </button>
                              <button
                                onClick={() => {
                                  setResultsInterviewId(selectedInterviewId);
                                  setShowInterviewResults(true);
                                }}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                                  isDarkMode 
                                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                                    : 'bg-green-600 hover:bg-green-700 text-white'
                                }`}
                              >
                                <FileText className="h-4 w-4" />
                                <span>View Interview Results</span>
                              </button>
                              <button
                                onClick={() => {
                                  setPerformanceInterviewId(selectedInterviewId);
                                  setShowPerformanceDashboard(true);
                                }}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                                  isDarkMode 
                                    ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                                }`}
                              >
                                <Award className="h-4 w-4" />
                                <span>Performance Dashboard</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Enhanced Interview Statistics */}
                      {interviewStats && (
                          <div className={`${isDarkMode ? 'bg-black/20 border border-blue-500/30 backdrop-blur' : 'bg-white'} rounded-xl shadow-lg p-6`}>
                          <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Interview Analytics Overview</h2>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                              <div className="text-center">
                                <div className="text-3xl font-bold text-blue-600">{interviewStats.statistics.totalCandidates}</div>
                                <div className="text-sm text-gray-600">Total Candidates</div>
                              </div>
                              <div className="text-center">
                                <div className="text-3xl font-bold text-green-600">{interviewStats.statistics.completedInterviews}</div>
                                <div className="text-sm text-gray-600">Completed Interviews</div>
                              </div>
                              <div className="text-center">
                                <div className="text-3xl font-bold text-blue-600">{interviewStats.statistics.averageScore.toFixed(1)}/4</div>
                                <div className="text-sm text-gray-600">Average Score</div>
                              </div>
                              <div className="text-center">
                                <div className="text-3xl font-bold text-orange-600">{interviewStats.statistics.completionRate.toFixed(1)}%</div>
                                <div className="text-sm text-gray-600">Completion Rate</div>
                              </div>
                            </div>
                          </div>
                      )}
                    </div>
                  )}

        {activeTab === 'messages' && (
          <div className="space-y-6">
            <div className={`${isDarkMode ? 'bg-white/10 border border-white/10 backdrop-blur' : 'bg-white'} rounded-2xl shadow-lg p-6`}>
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                💬 Messages
              </h2>
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Communicate with candidates and manage conversations
              </p>
              <div className="mt-6 p-8 text-center">
                <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                  No Messages Yet
                </h3>
                <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Start conversations with candidates from the Candidates section
                </p>
        </div>
        </div>
      </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className={`${isDarkMode ? 'bg-white/10 border border-white/10 backdrop-blur' : 'bg-white'} rounded-2xl shadow-lg p-6`}>
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                ⚙️ Settings
              </h2>
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Manage your account preferences and system settings
              </p>
              <div className="mt-6 space-y-4">
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                    Profile Settings
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Update your personal information and preferences
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                    Notification Settings
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Configure email and push notifications
                  </p>
                </div>
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                    Interview Settings
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Customize AI interview parameters and scoring
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
          </div>
          </div>
        </div>
      </div>
      {/* Performance Dashboard Modal */}
      {showPerformanceDashboard && performanceInterviewId && (
        <InterviewPerformanceDashboard
          interviewId={performanceInterviewId}
          onClose={() => {
            setShowPerformanceDashboard(false);
            setPerformanceInterviewId(null);
          }}
        />
      )}

      {/* Comprehensive Interview Results Modal */}
      {showInterviewResults && resultsInterviewId && (
        <InterviewResults
          interviewId={resultsInterviewId}
          onClose={() => {
            setShowInterviewResults(false);
            setResultsInterviewId(null);
          }}
        />
      )}

      {/* Analytics Dashboard Modal */}
      {showAnalyticsDashboard && (
        <InterviewAnalyticsDashboard
          interviewId={analyticsInterviewId}
          onClose={() => {
            setShowAnalyticsDashboard(false);
            setAnalyticsInterviewId(null);
          }}
        />
      )}

      {/* Interview Scheduler Modal */}
      {showScheduler && (
        <InterviewScheduler
          interviewId={schedulerInterviewId}
          onClose={() => {
            setShowScheduler(false);
            setSchedulerInterviewId(null);
          }}
        />
      )}

      {/* Candidate Manager Modal */}
      {showCandidateManager && (
        <CandidateManager
          interviewId={candidateManagerInterviewId}
          onClose={() => {
            setShowCandidateManager(false);
            setCandidateManagerInterviewId(null);
          }}
        />
      )}

    </div>
  );
};

export default RecruiterDashboard;


