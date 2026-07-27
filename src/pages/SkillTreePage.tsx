import { useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SkillTree from "../components/SkillTree/SkillTree";
import { selectableJobs } from "../data/jobs";
import { isCygnusJobId } from "../constants/skillPoints";
import html2canvas from "html2canvas";

export default function SkillTreePage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const skillTreeRef = useRef<HTMLDivElement>(null);
  const skillTreeOnlyRef = useRef<HTMLDivElement>(null);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [fourthOnly, setFourthOnly] = useState(false);

  const job = selectableJobs.find((j) => j.id === Number(jobId));
  const isCygnus = job ? isCygnusJobId(job.id) : false;

  useEffect(() => {
    if (!job) {
      navigate("/");
    }
  }, [job, navigate]);

  if (!job) {
    return null;
  }

  // 캡처 대상 요소를 반환하는 공통 함수
  const getCaptureTarget = (): HTMLElement | null => {
    if (fourthOnly && skillTreeOnlyRef.current) {
      return skillTreeOnlyRef.current.querySelector('.skill-branches-container');
    }
    return skillTreeRef.current;
  };

  // html2canvas로 캡처하는 공통 함수
  const captureToCanvas = async (): Promise<HTMLCanvasElement | null> => {
    const targetElement = getCaptureTarget();
    if (!targetElement) return null;

    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(resolve));

    return html2canvas(targetElement, {
      backgroundColor: "white",
      scale: 2,
      useCORS: true,
      ignoreElements: (element) => element.classList.contains("exclude-from-capture"),
    });
  };

  const captureSkillTree = async () => {
    const canvas = await captureToCanvas();
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${job?.koname} 스킬트리.png`;
    link.click();
  };

  const copyToClipboard = async () => {
    const canvas = await captureToCanvas();
    if (!canvas) return;

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
        <div className="flex flex-col gap-2 mb-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold text-left md:text-xl">전직명: {job.koname}</h2>
          <div className="flex flex-wrap gap-2">
            {/* 시그너스는 4차 전직이 없어 "4차 이후만" 모드 미제공 */}
            {!isCygnus && (
              <button
                onClick={() => setFourthOnly(!fourthOnly)}
                className={`exclude-from-capture flex-1 text-gray-900 px-2 py-2 text-sm rounded md:flex-none md:w-[120px] md:px-4 md:text-base ${
                  fourthOnly ? "bg-green-300 hover:bg-green-400" : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                {fourthOnly ? "전체 보기" : "4차 이후만"}
              </button>
            )}
            <button
              onClick={copyToClipboard}
              className="flex-1 text-gray-900 px-2 py-2 text-sm bg-blue-200 hover:bg-blue-300 rounded md:flex-none md:w-[140px] md:px-4 md:text-base"
            >
              클립보드 복사
            </button>
            <button
              onClick={captureSkillTree}
              className="flex-1 text-gray-900 px-2 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded md:flex-none md:w-[120px] md:px-4 md:text-base"
            >
              캡쳐하기
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex-1 text-gray-900 px-2 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded md:flex-none md:w-[120px] md:px-4 md:text-base"
            >
              직업 변경
            </button>
          </div>
        </div>
        <div ref={skillTreeRef} className="p-2 bg-gray-100 rounded-lg shadow md:p-4">
          <div ref={skillTreeOnlyRef}>
            <SkillTree selectedJobId={job.id} jobName={job.koname} fourthOnly={fourthOnly} />
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
