import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Context

import { AuthProvider } from './context/AuthContext';

// Components
import Header from './components/layout/Header';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import ConditionalLanding from './components/ConditionalLanding';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import JobDetails from './pages/JobDetails';
import Applications from './pages/Applications';
import Profile from './pages/Profile';
import Interview from './pages/Interview';
import UserDashboard from './user/pages/UserDashboard';
import StyleTest from './components/StyleTest';
import OpenRouterTest from './components/OpenRouterTest';
import InteractiveCodingTutor from './components/InteractiveCodingTutor';
import DynamicInterviewCreator from './components/DynamicInterviewCreator';
import DynamicInterviewDemo from './components/DynamicInterviewDemo';
import LanguageDetectionTest from './components/LanguageDetectionTest';
import LanguageDetectionDebug from './components/LanguageDetectionDebug';
import InterviewGenerationTest from './components/InterviewGenerationTest';
import InterviewTest from './components/InterviewTest';
import NotFound from './pages/NotFound';

// Recruiter components
import { InterviewReviewer } from './recruiter/components/InterviewReviewer';
import RecruiterDashboard from './recruiter/pages/RecruiterDashboard';

// Admin components
import AdminDashboard from './admin/pages/AdminDashboard';
import AdminUsers from './admin/pages/AdminUsers';
import RecruiterApprovals from './admin/pages/RecruiterApprovals';

// Job components
import { JobSearch, JobManagement, JobCreate } from './jobs';

// Landing Pages

// Legal Pages
import TermsOfService from './landing/legal/TermsOfService';
import PrivacyPolicy from './landing/legal/PrivacyPolicy';
import RefundPolicy from './landing/legal/RefundPolicy';
import CookiePolicy from './landing/legal/CookiePolicy';
import Pricing from './landing/legal/Pricing';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppShell() {
  const location = useLocation();
  const path = location.pathname || '';
  // Hide header on auth pages, legal pages, and landing pages
  const hideGlobalNavbar = (
    path.startsWith('/login') ||
    path.startsWith('/register') ||
    path.startsWith('/terms') ||
    path.startsWith('/privacy') ||
    path.startsWith('/refund') ||
    path.startsWith('/cookies') ||
    path.startsWith('/pricing')
  );

  return (
    <div className="App min-h-screen flex flex-col">
      {!hideGlobalNavbar && <Header />}
      <main className="flex-1">
        <Routes>
          {/* Landing Page - Only shows when not logged in */}
          <Route path="/" element={<ConditionalLanding />} />
          <Route path="/landing" element={<ConditionalLanding />} />
          
          {/* Legal Pages */}
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/refund" element={<RefundPolicy />} />
          <Route path="/cookies" element={<CookiePolicy />} />
          <Route path="/pricing" element={<Pricing />} />
          
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/jobs" element={<JobSearch />} />
          <Route path="/jobs/:id" element={<JobDetails />} />
          <Route path="/interview/:interviewId" element={<Interview />} />
          <Route path="/style-test" element={<StyleTest />} />
          <Route path="/openrouter-test" element={<OpenRouterTest />} />
          <Route path="/coding-tutor" element={<InteractiveCodingTutor />} />
          <Route path="/dynamic-interview" element={<DynamicInterviewCreator onClose={() => window.history.back()} />} />
          <Route path="/dynamic-interview-demo" element={<DynamicInterviewDemo />} />
          <Route path="/language-detection-test" element={<LanguageDetectionTest />} />
          <Route path="/language-detection-debug" element={<LanguageDetectionDebug />} />
            <Route path="/interview-generation-test" element={<InterviewGenerationTest />} />
            <Route path="/interview-test" element={<InterviewTest />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          {/* Recruiter Routes */}
          <Route path="/recruiter/review/:interviewId" element={
            <ProtectedRoute allowedRoles={["recruiter", "admin"]}>
              <InterviewReviewer />
            </ProtectedRoute>
          } />
          <Route path="/recruiter" element={
            <ProtectedRoute allowedRoles={["recruiter", "admin"]}>
              <RecruiterDashboard />
            </ProtectedRoute>
          } />
          <Route path="/recruiter/jobs" element={
            <ProtectedRoute allowedRoles={["recruiter", "admin"]}>
              <JobManagement />
            </ProtectedRoute>
          } />
          <Route path="/recruiter/create-job" element={
            <ProtectedRoute allowedRoles={["recruiter", "admin"]}>
              <JobCreate />
            </ProtectedRoute>
          } />
          <Route path="/recruiter/applications" element={
            <ProtectedRoute allowedRoles={["recruiter", "admin"]}>
              <Applications />
            </ProtectedRoute>
          } />
          <Route path="/recruiter/candidates" element={
            <ProtectedRoute allowedRoles={["recruiter", "admin"]}>
              <Applications />
            </ProtectedRoute>
          } />
          <Route path="/recruiter/analytics" element={
            <ProtectedRoute allowedRoles={["recruiter", "admin"]}>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          {/* User/Candidate Routes */}
          <Route path="/user" element={
            <ProtectedRoute allowedRoles={["candidate", "user"]}>
              <UserDashboard />
            </ProtectedRoute>
          } />
          <Route path="/user/jobs" element={
            <ProtectedRoute allowedRoles={["candidate", "user"]}>
              <JobSearch />
            </ProtectedRoute>
          } />
          <Route path="/user/applications" element={
            <ProtectedRoute allowedRoles={["candidate", "user"]}>
              <Applications />
            </ProtectedRoute>
          } />
          <Route path="/user/profile" element={
            <ProtectedRoute allowedRoles={["candidate", "user"]}>
              <Profile />
            </ProtectedRoute>
          } />
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminUsers />
            </ProtectedRoute>
          } />
          <Route path="/admin/recruiter-approvals" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <RecruiterApprovals />
            </ProtectedRoute>
          } />
          
          {/* Legacy Routes */}
          <Route path="/create-job" element={
            <ProtectedRoute allowedRoles={["recruiter", "admin"]}>
              <JobCreate />
            </ProtectedRoute>
          } />
          <Route path="/jobs/create" element={
            <ProtectedRoute allowedRoles={["recruiter", "admin"]}>
              <JobCreate />
            </ProtectedRoute>
          } />
          <Route path="/jobs/manage" element={
            <ProtectedRoute allowedRoles={["recruiter", "admin"]}>
              <JobManagement />
            </ProtectedRoute>
          } />
          <Route path="/applications" element={
            <ProtectedRoute>
              <Applications />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          
          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <Router>
            <AppShell />
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
