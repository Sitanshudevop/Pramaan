import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { ErrorBoundary } from './components/ErrorBoundary';

// Core Product Pages
import { Home } from './pages/Home';
import { NewReview } from './pages/NewReview';
import { ReviewFindings } from './pages/ReviewFindings';
import { ReviewQueue } from './pages/ReviewQueue';
import { BrandHub } from './pages/BrandHub';
import { AuditDisclosure } from './pages/AuditDisclosure';
import { Insights } from './pages/Insights';
import { About } from './pages/About';
import { Onboarding } from './pages/Onboarding';
import { Team } from './pages/Team';
import { Settings } from './pages/Settings';
import { AcceptInvite } from './pages/AcceptInvite';
import { PrivacyPolicy } from './pages/legal/PrivacyPolicy';
import { TermsOfService } from './pages/legal/TermsOfService';
import { AIDisclosure } from './pages/legal/AIDisclosure';
import { NotFound } from './pages/NotFound';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          {/* Core Product Routes */}
          <Route index element={<Home />} />
          <Route path="app/onboarding" element={<Onboarding />} />
          <Route path="app/new" element={<NewReview />} />
          <Route path="app/review/:id" element={<ReviewFindings />} />
          <Route path="app/queue" element={<ReviewQueue />} />
          <Route path="app/hub" element={<BrandHub />} />
          <Route path="app/team" element={<Team />} />
          <Route path="app/settings" element={<Settings />} />
          <Route path="app/audit" element={<AuditDisclosure />} />
          <Route path="app/insights" element={<Insights />} />
          <Route path="join/:token" element={<AcceptInvite />} />
          <Route path="about" element={<About />} />
          <Route path="privacy" element={<PrivacyPolicy />} />
          <Route path="terms" element={<TermsOfService />} />
          <Route path="ai-disclosure" element={<AIDisclosure />} />

          {/* Redirects for legacy /plan/* URLs */}
          <Route path="plan/*" element={<Navigate to="/about" replace />} />

          {/* Fallback 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
};

export default App;
