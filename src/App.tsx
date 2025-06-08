import { useRef, useState } from "react";
import JobSelector from "./components/JobSelector/JobSelector";
import SkillTree from "./components/SkillTree/SkillTree";
import type { IJob } from "./types/job";
import "./App.css";
import html2canvas from "html2canvas";

function App() {
  const [job, setJob] = useState<IJob | null>(null);
  const skillTreeRef = useRef<HTMLDivElement>(null);

  const captureSkillTree = async () => {
    if (!skillTreeRef.current) return;

    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const canvas = await html2canvas(skillTreeRef.current, {
      backgroundColor: "white",
      scale: 2,
      useCORS: true,
      ignoreElements: (element) => element.classList.contains("exclude-from-capture"),
    });

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "skilltree.png";
    link.click();
  };

  return (
    <div className="p-0 min-w-[1500px] flex flex-col mx-auto max-w-full">
      {!job && <JobSelector onSelect={setJob} />}
      {job && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">전직명: {job.koname}</h2>
            <div>
              <button
                onClick={captureSkillTree}
                className="text-gray-900 ml-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
                style={{ width: "120px" }}
              >
                캡쳐하기
              </button>
              <button
                onClick={() => setJob(null)}
                className="text-gray-900 ml-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
                style={{ width: "120px" }}
              >
                직업 변경
              </button>
            </div>
          </div>
          <div ref={skillTreeRef} className="p-4 bg-gray-100 rounded-lg shadow">
            <SkillTree selectedJobId={job.id} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
