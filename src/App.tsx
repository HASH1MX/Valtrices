import { HashRouter, Navigate, Route, Routes } from "react-router";
import { StartupSplash } from "./components/StartupSplash";
import { AppShell } from "./layout/AppShell";
import { DashboardPage } from "./pages/DashboardPage";
import { SettingsPage } from "./pages/SettingsPage";

// HashRouter keeps routing self-contained inside the packaged app, where pages are
// served from a custom protocol rather than a web server with history fallback.
export default function App() {
  return (
    <HashRouter>
      <StartupSplash />
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
