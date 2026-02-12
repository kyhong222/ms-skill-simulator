import { useRef, useEffect, useMemo, useState } from "react";
import html2canvas from "html2canvas";
import {
  BRANCH_2ND_LEVEL,
  BRANCH_3RD_LEVEL,
  BRANCH_4TH_LEVEL,
  SP_PER_LEVEL,
  BRANCH_1ST_BONUS_SP,
  BRANCH_2ND_BONUS_SP,
  BRANCH_3RD_BONUS_SP,
} from "../../constants/skillPoints";

interface SkillLogEntry {
  skillId: number;
  skillName: string;
  icon: string;
  level: number;
  masterLevel: number;
}

interface SkillLogDialogProps {
  log: SkillLogEntry[];
  isOpen: boolean;
  onClose: () => void;
  jobLevel: number;
  fourthOnly: boolean;
  jobName: string;
  jobId: number;
}

const BRANCH_LABELS = [
  (jobLevel: number) => `1차 (${jobLevel}~30)`,
  () => "2차 (31~70)",
  () => "3차 (71~120)",
  () => "4차 (121~200)",
];

function categorizeLogs(log: SkillLogEntry[], jobLevel: number) {
  const threshold1 = (BRANCH_2ND_LEVEL - jobLevel) * SP_PER_LEVEL + BRANCH_1ST_BONUS_SP;
  const threshold2 = threshold1 + (BRANCH_3RD_LEVEL - BRANCH_2ND_LEVEL) * SP_PER_LEVEL + BRANCH_2ND_BONUS_SP;
  const threshold3 = threshold2 + (BRANCH_4TH_LEVEL - BRANCH_3RD_LEVEL) * SP_PER_LEVEL + BRANCH_3RD_BONUS_SP;

  const branches: [SkillLogEntry[], SkillLogEntry[], SkillLogEntry[], SkillLogEntry[]] = [[], [], [], []];
  const skillLastLevel: Record<number, number> = {};
  let cumulativeSP = 0;

  for (const entry of log) {
    const prevLevel = skillLastLevel[entry.skillId] || 0;
    const delta = Math.max(entry.level - prevLevel, 0);

    let branchIndex: number;
    if (cumulativeSP < threshold1) branchIndex = 0;
    else if (cumulativeSP < threshold2) branchIndex = 1;
    else if (cumulativeSP < threshold3) branchIndex = 2;
    else branchIndex = 3;

    branches[branchIndex].push(entry);
    cumulativeSP += delta;
    skillLastLevel[entry.skillId] = entry.level;
  }

  return branches;
}

function LogEntry({ entry }: { entry: SkillLogEntry }) {
  return (
    <li className="flex items-center gap-2 py-1.5">
      {entry.icon && (
        <img
          src={`data:image/png;base64,${entry.icon}`}
          alt={entry.skillName}
          className="w-8 h-8 shrink-0"
        />
      )}
      <span className="text-gray-800 break-keep">{entry.skillName}</span>
      <span className="text-gray-600 font-semibold ml-auto shrink-0">
        {entry.level >= entry.masterLevel ? "M" : entry.level}
      </span>
    </li>
  );
}

export default function SkillLogDialog({ log, isOpen, onClose, jobLevel, fourthOnly, jobName, jobId }: SkillLogDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [showCopied, setShowCopied] = useState(false);
  const [showCodeCopied, setShowCodeCopied] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  const branches = useMemo(() => categorizeLogs(log, jobLevel), [log, jobLevel]);

  const captureToCanvas = async () => {
    if (!contentRef.current) return null;

    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(resolve));

    return html2canvas(contentRef.current, {
      backgroundColor: "white",
      scale: 2,
      useCORS: true,
    });
  };

  const copyToClipboard = async () => {
    const canvas = await captureToCanvas();
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (blob) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          setShowCopied(true);
          setTimeout(() => setShowCopied(false), 2000);
        } catch (err) {
          console.error("클립보드 복사 실패:", err);
        }
      }
    });
  };

  const generateSkillCode = async () => {
    const data = { j: jobId, s: log.map((e) => [e.skillId, e.level]) };
    const code = btoa(JSON.stringify(data));
    try {
      await navigator.clipboard.writeText(code);
      setShowCodeCopied(true);
      setTimeout(() => setShowCodeCopied(false), 2000);
    } catch (err) {
      console.error("스킬코드 복사 실패:", err);
    }
  };

  const saveAsFile = async () => {
    const canvas = await captureToCanvas();
    if (!canvas) return;

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${jobName} 스킬로그.png`;
    link.click();
  };

  return (
    <dialog
      ref={dialogRef}
      className={`rounded-lg shadow-xl p-0 max-h-[85vh] backdrop:bg-black/50 ${fourthOnly ? "w-96" : "w-[1100px] max-w-[92vw]"}`}
    >
      <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50 rounded-t-lg">
        <h3 className="font-semibold text-lg text-gray-800">스킬 로그</h3>
        <div className="flex items-center gap-2">
          {log.length > 0 && (
            <>
              <button
                onClick={copyToClipboard}
                className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {showCopied ? "복사됨!" : "클립보드 복사"}
              </button>
              <button
                onClick={saveAsFile}
                className="px-3 py-1.5 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                파일 저장
              </button>
              <button
                onClick={generateSkillCode}
                className="px-3 py-1.5 text-sm bg-green-500 text-white rounded hover:bg-green-600"
              >
                {showCodeCopied ? "복사됨!" : "스킬코드 생성"}
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-xl leading-none px-1 ml-1"
          >
            ✕
          </button>
        </div>
      </div>

      <div ref={contentRef} className="px-5 py-4 overflow-y-auto max-h-[70vh]">
        {log.length === 0 ? (
          <p className="text-gray-500 text-center py-4">기록된 스킬 로그가 없습니다</p>
        ) : fourthOnly ? (
          <ol className="space-y-1">
            {log.map((entry, index) => (
              <LogEntry key={index} entry={entry} />
            ))}
          </ol>
        ) : (
          <div className="grid grid-cols-4 gap-5">
            {branches.map((entries, branchIdx) => (
              <div key={branchIdx} className="min-w-0">
                <h4 className="font-semibold text-center border-b pb-1.5 mb-2 text-gray-700">
                  {BRANCH_LABELS[branchIdx](jobLevel)}
                </h4>
                {entries.length === 0 ? (
                  <p className="text-gray-400 text-xs text-center py-2">-</p>
                ) : (
                  <ol className="space-y-1">
                    {entries.map((entry, index) => (
                      <LogEntry key={index} entry={entry} />
                    ))}
                  </ol>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </dialog>
  );
}
