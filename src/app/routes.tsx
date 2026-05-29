import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { AppLayout } from './components/AppLayout';
import { RequireAuth } from './components/RequireAuth';
const LoginPage = lazy(() => import('../pages/LoginPage'));
const CandidatePortal = lazy(() => import('../pages/CandidatePortal'));
const DashboardPage = lazy(() => import('../pages/Dashboard'));
const Users = lazy(() => import('./pages/Users').then((m) => ({ default: m.Users })));
const DeletedUsers = lazy(() => import('./pages/DeletedUsers').then((m) => ({ default: m.DeletedUsers })));
const UserDetail = lazy(() => import('./pages/UserDetail').then((m) => ({ default: m.UserDetail })));
const SettingsLayout = lazy(() =>
  import('./pages/settings/SettingsLayout').then((m) => ({ default: m.SettingsLayout })),
);
const SettingsHub = lazy(() =>
  import('./pages/settings/SettingsHub').then((m) => ({ default: m.SettingsHub })),
);
const SettingsFiles = lazy(() =>
  import('./pages/settings/SettingsFiles').then((m) => ({ default: m.SettingsFiles })),
);
const SettingsRegions = lazy(() =>
  import('./pages/settings/SettingsRegions').then((m) => ({ default: m.SettingsRegions })),
);
const SettingsRegionDistricts = lazy(() =>
  import('./pages/settings/SettingsRegionDistricts').then((m) => ({ default: m.SettingsRegionDistricts })),
);
const SettingsUniversities = lazy(() =>
  import('./pages/settings/SettingsUniversities').then((m) => ({ default: m.SettingsUniversities })),
);
const Candidates = lazy(() => import('./pages/Candidates').then((m) => ({ default: m.Candidates })));
const CandidateDetail = lazy(() =>
  import('./pages/CandidateDetail').then((m) => ({ default: m.CandidateDetail })),
);
const Vacancies = lazy(() => import('./pages/Vacancies').then((m) => ({ default: m.Vacancies })));
const VacancyDetail = lazy(() => import('./pages/VacancyDetail').then((m) => ({ default: m.VacancyDetail })));
const VacancyForm = lazy(() => import('./pages/VacancyForm').then((m) => ({ default: m.VacancyForm })));
const CustomProfessions = lazy(() =>
  import('./pages/CustomProfessions').then((m) => ({ default: m.CustomProfessions })),
);
const Professions = lazy(() => import('./pages/Professions').then((m) => ({ default: m.Professions })));
const DestinationCountries = lazy(() =>
  import('./pages/DestinationCountries').then((m) => ({ default: m.DestinationCountries })),
);

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
        <CandidatePortal />
      </LazyBoundary>
    ),
  },
  {
    path: '/login',
    element: (
      <LazyBoundary>
        <LoginPage />
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
                <DashboardPage />
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
            path: 'users/deleted',
            element: (
              <LazyBoundary>
                <DeletedUsers />
              </LazyBoundary>
            ),
          },
          {
            path: 'users/:id',
            element: (
              <LazyBoundary>
                <UserDetail />
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
            path: 'vacancies/:id',
            element: (
              <LazyBoundary>
                <VacancyDetail />
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
            path: 'destination-countries',
            element: (
              <LazyBoundary>
                <DestinationCountries />
              </LazyBoundary>
            ),
          },
          {
            path: 'settings',
            element: (
              <LazyBoundary>
                <SettingsLayout />
              </LazyBoundary>
            ),
            children: [
              {
                index: true,
                element: (
                  <LazyBoundary>
                    <SettingsHub />
                  </LazyBoundary>
                ),
              },
              {
                path: 'files',
                element: (
                  <LazyBoundary>
                    <SettingsFiles />
                  </LazyBoundary>
                ),
              },
              {
                path: 'deleted-users',
                element: (
                  <LazyBoundary>
                    <DeletedUsers />
                  </LazyBoundary>
                ),
              },
              {
                path: 'regions',
                element: (
                  <LazyBoundary>
                    <SettingsRegions />
                  </LazyBoundary>
                ),
              },
              {
                path: 'regions/:id',
                element: (
                  <LazyBoundary>
                    <SettingsRegionDistricts />
                  </LazyBoundary>
                ),
              },
              {
                path: 'universities',
                element: (
                  <LazyBoundary>
                    <SettingsUniversities />
                  </LazyBoundary>
                ),
              },
            ],
          },
          {
            path: 'settings/deleted-users',
            element: <Navigate to="/admin/settings/deleted-users" replace />,
          },
          {
            path: 'users/deleted',
            element: <Navigate to="/admin/settings/deleted-users" replace />,
          },
        ],
      },
    ],
  },
]);
