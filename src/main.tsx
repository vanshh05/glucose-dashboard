import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

import Layout from "./components/Layout";
import OverviewPage from "./pages/OverviewPage";
import SubjectsPage from "./pages/SubjectsPage";
import SubjectDetailPage from "./pages/SubjectDetailPage";
import SessionsPage from "./pages/SessionsPage";
import SessionDetailPage from "./pages/SessionDetailPage";
import ErrorGridPage from "./pages/ErrorGridPage";
import DataQualityPage from "./pages/DataQualityPage";
import ModelsPage from "./pages/ModelsPage";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview" element={<OverviewPage />} />
          <Route path="subjects" element={<SubjectsPage />} />
          <Route path="subjects/:pseudonym" element={<SubjectDetailPage />} />
          <Route path="sessions" element={<SessionsPage />} />
          <Route path="sessions/:id" element={<SessionDetailPage />} />
          <Route path="error-grid" element={<ErrorGridPage />} />
          <Route path="data-quality" element={<DataQualityPage />} />
          <Route path="models" element={<ModelsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
