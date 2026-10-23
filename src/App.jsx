import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import OfficerPortal from '@/pages/officer/OfficerPortal';
import OfficerSignIn from '@/pages/officer/OfficerSignIn';
import BusinessPortal from '@/pages/business/BusinessPortal';
import MemberPortal from '@/pages/member/MemberPortal';
import OnboardingWizard from '@/pages/onboarding/OnboardingWizard';
import MemberOnboarding from '@/pages/onboarding/MemberOnboarding';
// Add page imports here

const AuthenticatedApp = () => {
  const { isLoadingPublicSettings, authError } = useAuth();

  // Show loading spinner only while public settings load; auth can resolve
  // in the background — the public home page and ProtectedRoute handle the rest.
  if (isLoadingPublicSettings) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-page">
        <div className="w-8 h-8 border-4 border-soft border-t-brand rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <Routes>
      {/* Public login / signup homepage */}
      <Route path="/" element={<Home />} />
      {/* Boilerplate auth pages (kept for password reset flows) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected portal routes — each portal gates by account_type */}
      <Route element={<ProtectedRoute unauthenticatedElement={<OfficerSignIn />} />}>
        <Route path="/officer" element={<OfficerPortal />} />
        <Route path="/officer/:section" element={<OfficerPortal />} />
      </Route>
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/" replace />} />}>
        <Route path="/business" element={<BusinessPortal />} />
        <Route path="/business/:section" element={<BusinessPortal />} />
        <Route path="/member" element={<MemberPortal />} />
        <Route path="/member/:section" element={<MemberPortal />} />
        <Route path="/onboarding" element={<OnboardingWizard />} />
        <Route path="/member-onboarding" element={<MemberOnboarding />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App