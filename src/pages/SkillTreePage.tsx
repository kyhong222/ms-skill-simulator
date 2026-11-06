import { useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header/Header";
import SkillTree from "../components/SkillTree/SkillTree";
import SkillLogDialog from "../components/SkillTree/SkillLogDialog";
import SkillCodeDialog from "../components/SkillTree/SkillCodeDialog";
import { useSkillTree } from "../components/SkillTree/useSkillTree";
import { selectableJobs } from "../data/jobs";
import { isCygnusJobId } from "../constants/skillPoints";
import { captureElement } from "../utils/captureElement";
import type { IJob } from "../types/job";
import type { IHeaderAction } from "../types/header";

export default function SkillTreePage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const job = selectableJobs.find((j) => j.id === Number(jobId));

  useEffect(() => {
    if (!job) {
      navigate("/");
    }
  }, [job, navigate]);

  if (!job) {
    return null;
  }

  return <SkillTreeWorkspace job={job} />;
}

// job이 확정된 뒤에만 렌더링되므로 useSkillTree에 항상 유효한 직업 ID가 들어간다
function SkillTreeWorkspace({ job }: { job: IJob }) {
  const navigate = useNavigate();
  const skillTreeRef = useRef<HTMLDivElement>(null);
  const skillTreeOnlyRef = useRef<HTMLDivElement>(null);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [fourthOnly, setFourthOnly] = useState(false);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isCodeInputOpen, setIsCodeInputOpen] = useState(false);

  const tree = useSkillTree(job.id, fourthOnly);
  const isCygnus = isCygnusJobId(job.id);

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
    return targetElement ? captureElement(targetElement) : null;
  };

  const captureSkillTree = async () => {
    const canvas = await captureToCanvas();
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${job.koname} 스킬트리.png`;
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

  const handleReset = () => {
    if (window.confirm("스킬 레벨과 스킬 로그를 모두 초기화합니다. 계속할까요?")) {
      tree.resetLevels();
    }
  };

  // 로딩 중에는 스킬 목록이 비어 있어, 이때 저장하면 저장된 스킬 트리가 지워진다
  const headerActions: IHeaderAction[] = [
    // 시그너스는 4차 전직이 없어 "4차 이후만" 모드 미제공
    ...(isCygnus
      ? []
      : [{ label: fourthOnly ? "전체 보기" : "4차 이후만", onClick: () => setFourthOnly(!fourthOnly), active: fourthOnly }]),
    { label: "클립보드 복사", onClick: copyToClipboard },
    { label: "캡쳐하기", onClick: captureSkillTree },
    { label: "스킬 로그", onClick: () => setIsLogOpen(true), disabled: tree.loading },
    { label: "스킬코드 적용", onClick: () => setIsCodeInputOpen(true), disabled: tree.loading },
    { label: "직업 변경", onClick: () => navigate("/"), variant: "highlight" },
    { label: "스킬 초기화", onClick: handleReset, variant: "danger", disabled: tree.loading },
  ];

  return (
    <>
      <Header jobName={job.koname} actions={headerActions} />

      <div>
        <div ref={skillTreeRef} className="p-2 bg-gray-100 rounded-lg shadow md:p-4 dark:bg-dark-paper">
          <div ref={skillTreeOnlyRef}>
            <SkillTree tree={tree} fourthOnly={fourthOnly} />
          </div>
        </div>
      </div>

      <SkillLogDialog
        log={tree.skillLog}
        isOpen={isLogOpen}
        onClose={() => setIsLogOpen(false)}
        jobLevel={tree.jobLevel}
        fourthOnly={fourthOnly}
        jobName={job.koname ?? ""}
        jobId={job.id}
        isCygnus={tree.isCygnus}
        skillBranchIndex={tree.separateSp ? tree.skillBranchIndex : undefined}
      />

      <SkillCodeDialog
        isOpen={isCodeInputOpen}
        onClose={() => setIsCodeInputOpen(false)}
        onApply={tree.applySkillCode}
      />

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
