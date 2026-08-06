import { useState } from "react";
import type { IJob } from "../../types/job";
import { groupedJobs, cygnusByGroup } from "../../data/jobs";

// 패치 이력 (신규 항목은 아래에 추가)
const PATCH_NOTES = [
  "25.06.20  패치 반영",
  "25.09.19  스나이핑 쿨타임 수정",
  "25.10.17  돌진 사거리 오류, 마그넷 설명 수정",
  "25.10.21  숙련도 오류 수정",
  "25.12.19  패치 반영, 클립보드 복사기능, 스킬트리 자체 저장기능 추가",
  "25.12.23  4차만 찍어보기 기능, 5레벨씩 찍기(Shift+클릭) 추가",
  "26.06.14  시그너스 직업군 스킬 추가",
  "26.07.29  생츄어리, 위협, 블로킹, 블래스트 변경점 적용",
  "26.08.06  브랜디쉬 변경점 적용",
];

export default function JobSelector({ onSelect }: { onSelect?: (job: IJob) => void }) {
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  // 모바일 전용 패치 노트 접기 상태 (데스크톱에서는 CSS로 항상 펼침)
  const [isPatchOpen, setIsPatchOpen] = useState(false);

  const handleSelect = (job: IJob) => {
    setSelectedJob(job.id);
    if (onSelect) onSelect(job);
  };

  const renderJob = (job: IJob) => (
    <li
      key={job.id}
      className={`cursor-pointer p-2 border rounded text-center text-sm break-keep md:p-4 md:text-base ${
        selectedJob === job.id ? "bg-blue-500 text-white" : "bg-white text-black"
      }`}
      onClick={() => handleSelect(job)}
    >
      {job.koname}
    </li>
  );

  const groupNames = Object.keys(groupedJobs);

  return (
    <div className="p-3 max-w-full mx-auto md:p-6">
      <h1 className="text-xl font-bold mb-4 md:text-2xl">직업을 선택하세요.</h1>

      {/* 모바일: 그룹 블록 2열 그리드 / 데스크톱(md~): 기존 가로 5열 + 가로 스크롤 */}
      <div className="md:overflow-x-auto">
        <div className="md:min-w-max">
          {/* 모험가 직업군 (상단) */}
          <div className="grid grid-cols-2 items-start gap-x-3 gap-y-5 md:flex md:gap-8">
            {groupNames.map((groupName) => (
              <div key={groupName} className="w-full md:w-[160px]">
                <h2 className="text-base font-semibold mb-2 text-center md:text-xl md:mb-3">{groupName}</h2>
                <ul className="flex flex-col gap-2 md:gap-4">
                  {groupedJobs[groupName].map(renderJob)}
                </ul>
              </div>
            ))}
          </div>

          {/* 구분선 */}
          <hr className="my-5 border-t border-gray-300 md:my-6" />

          {/* 시그너스 직업군 (하단, 데스크톱은 각 모험가 열에 대응) */}
          <h2 className="text-base font-semibold mb-2 text-center md:hidden">시그너스 기사단</h2>
          <div className="grid grid-cols-2 items-start gap-x-3 gap-y-2 md:flex md:gap-8">
            {groupNames.map((groupName) => (
              <div key={groupName} className="w-full md:w-[160px]">
                <ul className="flex flex-col gap-2 md:gap-4">
                  {cygnusByGroup[groupName] && renderJob(cygnusByGroup[groupName])}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 text-left">
        {/* 패치 노트 접기 토글 (모바일 전용) */}
        <button
          type="button"
          onClick={() => setIsPatchOpen((prev) => !prev)}
          aria-expanded={isPatchOpen}
          className="flex w-full items-center gap-2 mb-3 border-0 rounded-none bg-transparent p-0 text-left text-base font-bold focus:outline-none md:hidden"
        >
          패치 노트
          <span className="ml-auto text-gray-500 leading-none" aria-hidden="true">
            {isPatchOpen ? "▲" : "▼"}
          </span>
        </button>

        <ul className={isPatchOpen ? "block" : "hidden md:block"}>
          {PATCH_NOTES.map((note) => (
            <li key={note} className="text-base font-bold mb-4 break-keep md:text-2xl">
              {note}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
