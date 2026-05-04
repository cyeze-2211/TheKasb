import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { RequireAuth } from './components/RequireAuth';
import { RootRedirect } from './components/RootRedirect';

const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const DashboardPremium = lazy(() =>
  import('./pages/DashboardPremium').then((m) => ({ default: m.DashboardPremium })),
);
const Users = lazy(() => import('./pages/Users').then((m) => ({ default: m.Users })));
const Candidates = lazy(() => import('./pages/Candidates').then((m) => ({ default: m.Candidates })));
const CandidateDetail = lazy(() =>
  import('./pages/CandidateDetail').then((m) => ({ default: m.CandidateDetail })),
);
const Vacancies = lazy(() => import('./pages/Vacancies').then((m) => ({ default: m.Vacancies })));
const VacancyForm = lazy(() => import('./pages/VacancyForm').then((m) => ({ default: m.VacancyForm })));
const CustomProfessions = lazy(() =>
  import('./pages/CustomProfessions').then((m) => ({ default: m.CustomProfessions })),
);
const Professions = lazy(() => import('./pages/Professions').then((m) => ({ default: m.Professions })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));

function LazyBoundary({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center bg-background text-sm text-text-muted">
          Yuklanmoqda…
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <LazyBoundary>
        <RootRedirect />
      </LazyBoundary>
    ),
  },
  {
    path: '/login',
    element: (
      <LazyBoundary>
        <Login />
      </LazyBoundary>
    ),
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: '/admin',
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/admin/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: (
              <LazyBoundary>
                <DashboardPremium />
              </LazyBoundary>
            ),
          },
          {
            path: 'users',
            element: (
              <LazyBoundary>
                <Users />
              </LazyBoundary>
            ),
          },
          {
            path: 'candidates',
            element: (
              <LazyBoundary>
                <Candidates />
              </LazyBoundary>
            ),
          },
          {
            path: 'candidates/:id',
            element: (
              <LazyBoundary>
                <CandidateDetail />
              </LazyBoundary>
            ),
          },
          {
            path: 'vacancies',
            element: (
              <LazyBoundary>
                <Vacancies />
              </LazyBoundary>
            ),
          },
          {
            path: 'vacancies/create',
            element: (
              <LazyBoundary>
                <VacancyForm />
              </LazyBoundary>
            ),
          },
          {
            path: 'vacancies/:id/edit',
            element: (
              <LazyBoundary>
                <VacancyForm />
              </LazyBoundary>
            ),
          },
          {
            path: 'custom-professions',
            element: (
              <LazyBoundary>
                <CustomProfessions />
              </LazyBoundary>
            ),
          },
          {
            path: 'professions',
            element: (
              <LazyBoundary>
                <Professions />
              </LazyBoundary>
            ),
          },
          {
            path: 'settings',
            element: (
              <LazyBoundary>
                <Settings />
              </LazyBoundary>
            ),
          },
        ],
      },
    ],
  },
]);
