import { useState } from "react";
import type { IJob } from "../../types/job";
import { groupedJobs, cygnusByGroup, resistanceByGroup } from "../../data/jobs";

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
  "26.08.07  문의하기 기능 추가",
  "26.08.14  스나이핑 재사용 대기시간 변경점 적용",
  "26.09.05  레지스탕스 배틀메이지(임시) 스킬 추가",
  "26.09.08  배틀메이지 1차 전직 스킬포인트 5로 수정",
  "26.10.21  배틀메이지 스킬 최신화(1~3차 스킬 및 피니쉬 블로우 반영 완료)",
  "26.11.06  상단 헤더 추가, 다크 모드 지원",
  "26.11.08  바이퍼 드래곤 스트라이크, 피스트 변경점 적용",
  "26.11.12  바이퍼 데몰리션 변경점 적용",
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
      // 가장 긴 이름 "아크메이지(썬,콜)"(16px 기준 약 125px)이 한 줄에 들어가도록 좌우 패딩을 줄였다
      // md: 칸 폭 119px~ → 14px 글씨(약 110px) / lg~: 칸 폭 160px 고정 → 16px 글씨
      className={`cursor-pointer p-2 border rounded text-center text-sm break-keep md:px-0.5 lg:px-2 lg:text-base xl:py-4 ${
        selectedJob === job.id ? "bg-blue-500 text-white" : "bg-white text-black dark:bg-dark-paper dark:text-gray-100"
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

      {/* 모바일: 그룹 블록 2열 그리드 / 데스크톱(md~): 화면 폭에 맞춘 가로 5열 */}
      <div>
        <div>
          {/* 모험가 직업군 (상단) */}
          <div className="grid grid-cols-2 items-start gap-x-3 gap-y-5 md:flex md:justify-center md:gap-3 xl:gap-8">
            {groupNames.map((groupName) => (
              <div key={groupName} className="w-full min-w-0 md:flex-1 md:max-w-[160px] lg:w-[160px] lg:flex-none">
                <h2 className="text-base font-semibold mb-2 text-center md:text-xl md:mb-3">{groupName}</h2>
                <ul className="flex flex-col gap-2 md:gap-4">
                  {groupedJobs[groupName].map(renderJob)}
                </ul>
              </div>
            ))}
          </div>

          {/* 구분선 */}
          <hr className="my-5 border-t border-gray-300 dark:border-gray-700 md:my-6" />

          {/* 시그너스 직업군 (하단, 데스크톱은 각 모험가 열에 대응) */}
          <h2 className="text-base font-semibold mb-2 text-center md:hidden">시그너스 기사단</h2>
          <div className="grid grid-cols-2 items-start gap-x-3 gap-y-2 md:flex md:justify-center md:gap-3 xl:gap-8">
            {groupNames.map((groupName) => (
              <div key={groupName} className="w-full min-w-0 md:flex-1 md:max-w-[160px] lg:w-[160px] lg:flex-none">
                <ul className="flex flex-col gap-2 md:gap-4">
                  {cygnusByGroup[groupName] && renderJob(cygnusByGroup[groupName])}
                </ul>
              </div>
            ))}
          </div>

          {/* 구분선 */}
          <hr className="my-5 border-t border-gray-300 dark:border-gray-700 md:my-6" />

          {/* 레지스탕스 직업군 (하단, 데스크톱은 각 모험가 열에 대응) */}
          <h2 className="text-base font-semibold mb-2 text-center md:hidden">레지스탕스</h2>
          <div className="grid grid-cols-2 items-start gap-x-3 gap-y-2 md:flex md:justify-center md:gap-3 xl:gap-8">
            {groupNames.map((groupName) => (
              <div key={groupName} className="w-full min-w-0 md:flex-1 md:max-w-[160px] lg:w-[160px] lg:flex-none">
                <ul className="flex flex-col gap-2 md:gap-4">
                  {resistanceByGroup[groupName] && renderJob(resistanceByGroup[groupName])}
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
