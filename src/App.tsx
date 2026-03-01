import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAppStore } from '@/stores/useAppStore';

import LockScreen from '@/pages/LockScreen';
import ProfileSelect from '@/pages/ProfileSelect';
import Welcome from '@/pages/onboarding/Welcome';
import ApiKey from '@/pages/onboarding/ApiKey';
import Goals from '@/pages/onboarding/Goals';
import Equipment from '@/pages/onboarding/Equipment';
import Injuries from '@/pages/onboarding/Injuries';
import Schedule from '@/pages/onboarding/Schedule';
import AppShell from '@/components/layout/AppShell';
import TodayPage from '@/pages/TodayPage';
import WeekPage from '@/pages/WeekPage';
import CoachPage from '@/pages/CoachPage';
import ProfilePage from '@/pages/ProfilePage';
import WorkoutDetailPage from '@/pages/WorkoutDetailPage';

function AuthGuard() {
  const isUnlocked = useAuthStore((s) => s.isUnlocked);
  if (!isUnlocked) return <Navigate to="/lock" replace />;
  return <Outlet />;
}

function ProfileGuard() {
  const activeProfileId = useAppStore((s) => s.activeProfileId);
  if (!activeProfileId) return <Navigate to="/profiles" replace />;
  return <Outlet />;
}

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter basename="/FlexCoach-web">
      <Routes>
        <Route path="/lock" element={<LockScreen />} />

        {/* Authenticated routes */}
        <Route element={<AuthGuard />}>
          <Route path="/profiles" element={<ProfileSelect />} />

          {/* Onboarding routes */}
          <Route path="/onboarding/welcome" element={<Welcome />} />
          <Route path="/onboarding/apikey" element={<ApiKey />} />
          <Route path="/onboarding/goals" element={<Goals />} />
          <Route path="/onboarding/equipment" element={<Equipment />} />
          <Route path="/onboarding/injuries" element={<Injuries />} />
          <Route path="/onboarding/schedule" element={<Schedule />} />

          {/* Profile-scoped routes */}
          <Route element={<ProfileGuard />}>
            <Route element={<AppShell />}>
              <Route path="/" element={<TodayPage />} />
              <Route path="/week" element={<WeekPage />} />
              <Route path="/coach" element={<CoachPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/workout/:workoutId" element={<WorkoutDetailPage />} />
            </Route>
          </Route>
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/lock" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
