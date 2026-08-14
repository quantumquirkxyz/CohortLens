import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Cohorts } from './pages/Cohorts';
import { GraphExplorer } from './pages/GraphExplorer';
import { Lenses } from './pages/Lenses';
import { Overview } from './pages/Overview';
import { Protocols } from './pages/Protocols';
import { Routes as RoutesPage } from './pages/Routes';
import { Settings } from './pages/Settings';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Overview />} />
        <Route path="graph" element={<GraphExplorer />} />
        <Route path="lenses" element={<Lenses />} />
        <Route path="cohorts" element={<Cohorts />} />
        <Route path="routes" element={<RoutesPage />} />
        <Route path="protocols" element={<Protocols />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
