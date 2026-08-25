import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Tenders from "./pages/Tenders.jsx";
import TenderUpload from "./pages/TenderUpload.jsx";
import TenderAnalysis from "./pages/TenderAnalysis.jsx";
import Compliance from "./pages/Compliance.jsx";
import Standards from "./pages/Standards.jsx";
import Reports from "./pages/Reports.jsx";
import Settings from "./pages/Settings.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tenders" element={<Tenders />} />
          <Route path="/tenders/new" element={<TenderUpload />} />
          <Route path="/tenders/:id" element={<TenderAnalysis />} />
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/standards" element={<Standards />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
