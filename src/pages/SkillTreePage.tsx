import { useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SkillTree from "../components/SkillTree/SkillTree";
import { selectableJobs } from "../data/jobs";
import html2canvas from "html2canvas";

export default function SkillTreePage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const skillTreeRef = useRef<HTMLDivElement>(null);
  const skillTreeOnlyRef = useRef<HTMLDivElement>(null);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [fourthOnly, setFourthOnly] = useState(false);

  const job = selectableJobs.find((j) => j.id === Number(jobId));

  useEffect(() => {
    if (!job) {
      navigate("/");
    }
  }, [job, navigate]);

  if (!job) {
    return null;
  }

  const captureSkillTree = async () => {
    let targetElement: HTMLElement | null = null;

    if (fourthOnly && skillTreeOnlyRef.current) {
      targetElement = skillTreeOnlyRef.current.querySelector('.skill-branches-container');
    } else {
      targetElement = skillTreeRef.current;
    }

    if (!targetElement) return;

    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const canvas = await html2canvas(targetElement, {
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
    let targetElement: HTMLElement | null = null;

    if (fourthOnly && skillTreeOnlyRef.current) {
      targetElement = skillTreeOnlyRef.current.querySelector('.skill-branches-container');
    } else {
      targetElement = skillTreeRef.current;
    }

    if (!targetElement) return;

    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const canvas = await html2canvas(targetElement, {
      backgroundColor: "white",
      scale: 2,
      useCORS: true,
      ignoreElements: (element) => element.classList.contains("exclude-from-capture"),
    });

    canvas.toBlob(async (blob) => {
      if (blob) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              "image/png": blob,
            }),
          ]);
          setShowSnackbar(true);
          setTimeout(() => setShowSnackbar(false), 3000);
        } catch (err) {
          console.error("클립보드 복사 실패:", err);
        }
      }
    });
  };

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">전직명: {job.koname}</h2>
          <div>
            <button
              onClick={() => setFourthOnly(!fourthOnly)}
              className={`exclude-from-capture text-gray-900 ml-2 px-4 py-2 rounded ${
                fourthOnly ? "bg-green-300 hover:bg-green-400" : "bg-gray-200 hover:bg-gray-300"
              }`}
              style={{ width: "120px" }}
            >
              {fourthOnly ? "전체 보기" : "4차 이후만"}
            </button>
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
              onClick={() => navigate("/")}
              className="text-gray-900 ml-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
              style={{ width: "120px" }}
            >
              직업 변경
            </button>
          </div>
        </div>
        <div ref={skillTreeRef} className="p-4 bg-gray-100 rounded-lg shadow">
          <div ref={skillTreeOnlyRef}>
            <SkillTree selectedJobId={job.id} fourthOnly={fourthOnly} />
          </div>
        </div>
      </div>

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
    </>
  );
}
