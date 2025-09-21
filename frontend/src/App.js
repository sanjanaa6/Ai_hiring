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

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import JobDetails from './pages/JobDetails';
import CreateJob from './pages/CreateJob';
import Applications from './pages/Applications';
import Profile from './pages/Profile';
import Interview from './pages/Interview';
import StyleTest from './components/StyleTest';
import OpenRouterTest from './components/OpenRouterTest';
import NotFound from './pages/NotFound';

// Landing Pages
import LandingPage from './landing/LandingPage';

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
          {/* Landing Page */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<LandingPage />} />
          
          {/* Legal Pages */}
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/refund" element={<RefundPolicy />} />
          <Route path="/cookies" element={<CookiePolicy />} />
          <Route path="/pricing" element={<Pricing />} />
          
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetails />} />
          <Route path="/interview/:interviewId" element={<Interview />} />
          <Route path="/style-test" element={<StyleTest />} />
          <Route path="/openrouter-test" element={<OpenRouterTest />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/create-job" element={
            <ProtectedRoute allowedRoles={["recruiter", "admin"]}>
              <CreateJob />
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
