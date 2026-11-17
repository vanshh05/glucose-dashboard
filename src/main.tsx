import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

// ----- Existing research dashboard -----
import Layout from "./components/Layout";
import OverviewPage from "./pages/OverviewPage";
import SubjectsPage from "./pages/SubjectsPage";
import SubjectDetailPage from "./pages/SubjectDetailPage";
import SessionsPage from "./pages/SessionsPage";
import SessionDetailPage from "./pages/SessionDetailPage";
import ErrorGridPage from "./pages/ErrorGridPage";
import DataQualityPage from "./pages/DataQualityPage";
import ModelsPage from "./pages/ModelsPage";

// ----- NEW: patient-facing app -----
import MeLayout from "./pages/me/MeLayout";
import MeHomePage from "./pages/me/MeHomePage";
import MeCapturePage from "./pages/me/MeCapturePage";
import MeHistoryPage from "./pages/me/MeHistoryPage";
import MeSessionDetailPage from "./pages/me/MeSessionDetailPage";
import MeAboutPage from "./pages/me/MeAboutPage";

// ----- Simple "pick your side" landing -----
function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7FAFA] px-6">
      <div className="max-w-md w-full text-center">
        <h1 className="font-serif text-3xl font-bold text-ink">Glucose Monitor</h1>
        <p className="text-sm text-mute mt-2">Research project · experimental</p>
        <div className="mt-8 space-y-3">
          <a href="/me" className="block w-full bg-teal text-white font-semibold py-3 rounded-xl">
            Open patient app
          </a>
          <a href="/overview" className="block w-full border border-[#D8E4E4] text-ink font-semibold py-3 rounded-xl">
            Open research dashboard
          </a>
        </div>
        <p className="text-[11px] text-mute mt-6">
          Research instrument. Not for treatment decisions.
        </p>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Landing */}
        <Route path="/" element={<LandingPage />} />

        {/* Patient-facing */}
        <Route path="/me" element={<MeLayout />}>
          <Route index element={<MeHomePage />} />
          <Route path="capture" element={<MeCapturePage />} />
          <Route path="history" element={<MeHistoryPage />} />
          <Route path="session/:id" element={<MeSessionDetailPage />} />
          <Route path="about" element={<MeAboutPage />} />
        </Route>

        {/* Research dashboard (unchanged) */}
        <Route element={<Layout />}>
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/subjects" element={<SubjectsPage />} />
          <Route path="/subjects/:pseudonym" element={<SubjectDetailPage />} />
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/sessions/:id" element={<SessionDetailPage />} />
          <Route path="/error-grid" element={<ErrorGridPage />} />
          <Route path="/data-quality" element={<DataQualityPage />} />
          <Route path="/models" element={<ModelsPage />} />
        </Route>

        {/* Backward-compatible: some bookmarks go straight to /overview */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
