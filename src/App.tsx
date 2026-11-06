import { Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import SkillSimulatorPage from "./pages/SkillSimulatorPage";
import SkillTreePage from "./pages/SkillTreePage";
import CloudProvider from "./components/Cloud/CloudProvider";
import "./App.css";

function App() {
  return (
    // 화면 폭에 맞춘다. 고정 최소 너비를 두면 768~1500px에서 오른쪽이 잘린다
    <div className="p-0 w-full flex flex-col mx-auto max-w-full">
      <CloudProvider>
        <Routes>
          <Route path="/" element={<SkillSimulatorPage />} />
          <Route path="/:jobId" element={<SkillTreePage />} />
        </Routes>
      </CloudProvider>
      <Analytics />
    </div>
  );
}

export default App;
