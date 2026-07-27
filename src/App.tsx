import { Routes, Route } from "react-router-dom";
import SkillSimulatorPage from "./pages/SkillSimulatorPage";
import SkillTreePage from "./pages/SkillTreePage";
import "./App.css";

function App() {
  return (
    // 모바일에서는 최소 너비 제약 없이 화면 폭에 맞춤
    <div className="p-0 md:min-w-[1500px] flex flex-col mx-auto max-w-full">
      <Routes>
        <Route path="/" element={<SkillSimulatorPage />} />
        <Route path="/:jobId" element={<SkillTreePage />} />
      </Routes>
    </div>
  );
}

export default App;
