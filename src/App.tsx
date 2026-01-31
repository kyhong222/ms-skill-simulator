import { Routes, Route } from "react-router-dom";
import SkillSimulatorPage from "./pages/SkillSimulatorPage";
import SkillTreePage from "./pages/SkillTreePage";
import "./App.css";

function App() {
  return (
    <div className="p-0 min-w-[1500px] flex flex-col mx-auto max-w-full">
      <Routes>
        <Route path="/" element={<SkillSimulatorPage />} />
        <Route path="/:jobId" element={<SkillTreePage />} />
      </Routes>
    </div>
  );
}

export default App;
