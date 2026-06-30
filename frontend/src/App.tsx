import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { LandingPage } from "./pages/LandingPage";
import { UploadPage } from "./pages/UploadPage";
import { WorkspacePage } from "./pages/WorkspacePage";
import { ExportPage } from "./pages/ExportPage";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/workspace/*" element={<WorkspacePage />} />
        <Route path="/export" element={<ExportPage />} />
      </Route>
    </Routes>
  );
}
