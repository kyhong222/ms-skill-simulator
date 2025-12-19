import { useRef, useState } from "react";
import JobSelector from "./components/JobSelector/JobSelector";
import SkillTree from "./components/SkillTree/SkillTree";
import type { IJob } from "./types/job";
import "./App.css";
import html2canvas from "html2canvas";

function App() {
  const [job, setJob] = useState<IJob | null>(null);
  const skillTreeRef = useRef<HTMLDivElement>(null);
  const [showSnackbar, setShowSnackbar] = useState(false);

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
    link.download = `${job?.koname} 스킬트리.png`;
    link.click();
  };

  const copyToClipboard = async () => {
    if (!skillTreeRef.current) return;

    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const canvas = await html2canvas(skillTreeRef.current, {
      backgroundColor: "white",
      scale: 2,
      useCORS: true,
      ignoreElements: (element) => element.classList.contains("exclude-from-capture"),
    });

    // canvas를 blob으로 변환 후 클립보드에 복사
    canvas.toBlob(async (blob) => {
      if (blob) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              "image/png": blob,
            }),
          ]);
          // 스낵바 표시
          setShowSnackbar(true);
          setTimeout(() => setShowSnackbar(false), 3000);
        } catch (err) {
          console.error("클립보드 복사 실패:", err);
        }
      }
    });
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
                onClick={copyToClipboard}
                className="text-gray-900 ml-2 px-4 py-2 bg-blue-200 hover:bg-blue-300 rounded"
                style={{ width: "140px" }}
              >
                클립보드 복사
              </button>
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
      
      {/* 스낵바 */}
      {showSnackbar && (
        <div
          className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in"
          style={{
            animation: "fadeIn 0.3s ease-in-out",
          }}
        >
          클립보드에 복사되었습니다!
        </div>
      )}
    </div>
  );
}

export default App;
