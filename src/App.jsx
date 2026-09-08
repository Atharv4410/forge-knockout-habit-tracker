import { Navigate, Route, Routes } from "react-router-dom";
import { useApp } from "./context/AppContext.jsx";
import { usePushSync } from "./hooks/usePushSync.js";
import AppShell from "./components/layout/AppShell.jsx";
import Landing from "./pages/Landing.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Habits from "./pages/Habits.jsx";
import HabitDetail from "./pages/HabitDetail.jsx";
import Progress from "./pages/Progress.jsx";
import Insights from "./pages/Insights.jsx";
import Coach from "./pages/Coach.jsx";
import Profile from "./pages/Profile.jsx";

function RequireOnboarded({ children }) {
  const { user } = useApp();
  if (!user?.onboarded) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  usePushSync();

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route
        path="/app/*"
        element={
          <RequireOnboarded>
            <AppShell>
              <Routes>
                <Route index element={<Dashboard />} />
                <Route path="habits" element={<Habits />} />
                <Route path="habits/:habitId" element={<HabitDetail />} />
                <Route path="progress" element={<Progress />} />
                <Route path="insights" element={<Insights />} />
                <Route path="coach" element={<Coach />} />
                <Route path="profile" element={<Profile />} />
              </Routes>
            </AppShell>
          </RequireOnboarded>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
