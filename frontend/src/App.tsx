import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { ErrorBoundary } from './components/ErrorBoundary';

// Group A Pages
import { Home } from './pages/Home';
import { NewReview } from './pages/NewReview';
import { ReviewFindings } from './pages/ReviewFindings';
import { ReviewQueue } from './pages/ReviewQueue';
import { BrandHub } from './pages/BrandHub';
import { AuditDisclosure } from './pages/AuditDisclosure';
import { Insights } from './pages/Insights';
import { NotFound } from './pages/NotFound';

// Group B Pages (Plan)
import { ExecutiveSummary } from './pages/plan/ExecutiveSummary';
import { ProblemRootCauses } from './pages/plan/ProblemRootCauses';
import { EvidenceRegister } from './pages/plan/EvidenceRegister';
import { UsersResearch } from './pages/plan/UsersResearch';
import { SolutionArchitecture } from './pages/plan/SolutionArchitecture';
import { WorkflowRoles } from './pages/plan/WorkflowRoles';
import { ScopeCommitments } from './pages/plan/ScopeCommitments';
import { TechnicalBlueprint } from './pages/plan/TechnicalBlueprint';
import { ResponsibleDesign } from './pages/plan/ResponsibleDesign';
import { PositioningOriginality } from './pages/plan/PositioningOriginality';
import { FeasibilityRisks } from './pages/plan/FeasibilityRisks';
import { DeliveryTeam } from './pages/plan/DeliveryTeam';
import { ReferencesPage } from './pages/plan/ReferencesPage';

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          {/* Group A: Product Routes */}
          <Route index element={<Home />} />
          <Route path="app/new" element={<NewReview />} />
          <Route path="app/review/:id" element={<ReviewFindings />} />
          <Route path="app/queue" element={<ReviewQueue />} />
          <Route path="app/hub" element={<BrandHub />} />
          <Route path="app/audit" element={<AuditDisclosure />} />
          <Route path="app/insights" element={<Insights />} />

          {/* Group B: 13 Plan Pages */}
          <Route path="plan/summary" element={<ExecutiveSummary />} />
          <Route path="plan/problem" element={<ProblemRootCauses />} />
          <Route path="plan/evidence" element={<EvidenceRegister />} />
          <Route path="plan/users" element={<UsersResearch />} />
          <Route path="plan/solution" element={<SolutionArchitecture />} />
          <Route path="plan/workflow" element={<WorkflowRoles />} />
          <Route path="plan/scope" element={<ScopeCommitments />} />
          <Route path="plan/technical" element={<TechnicalBlueprint />} />
          <Route path="plan/responsible" element={<ResponsibleDesign />} />
          <Route path="plan/positioning" element={<PositioningOriginality />} />
          <Route path="plan/feasibility" element={<FeasibilityRisks />} />
          <Route path="plan/delivery" element={<DeliveryTeam />} />
          <Route path="plan/references" element={<ReferencesPage />} />

          {/* Fallback 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
};

export default App;

