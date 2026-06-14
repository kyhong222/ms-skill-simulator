import { useState } from "react";
import type { IJob } from "../../types/job";
import { groupedJobs, cygnusByGroup } from "../../data/jobs";

export default function JobSelector({ onSelect }: { onSelect?: (job: IJob) => void }) {
  const [selectedJob, setSelectedJob] = useState<number | null>(null);

  const handleSelect = (job: IJob) => {
    setSelectedJob(job.id);
    if (onSelect) onSelect(job);
  };

  const renderJob = (job: IJob) => (
    <li
      key={job.id}
      className={`cursor-pointer p-4 border rounded text-center ${
        selectedJob === job.id ? "bg-blue-500 text-white" : "bg-white text-black"
      }`}
      onClick={() => handleSelect(job)}
    >
      {job.koname}
    </li>
  );

  const groupNames = Object.keys(groupedJobs);

  return (
    <div className="p-6 max-w-full mx-auto">
      <h1 className="text-2xl font-bold mb-4">직업을 선택하세요.</h1>

      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* 모험가 직업군 (상단) */}
          <div className="flex gap-8">
            {groupNames.map((groupName) => (
              <div key={groupName} className="w-[160px]">
                <h2 className="text-xl font-semibold mb-3 text-center">{groupName}</h2>
                <ul className="flex flex-col gap-4">
                  {groupedJobs[groupName].map(renderJob)}
                </ul>
              </div>
            ))}
          </div>

          {/* 구분선 */}
          <hr className="my-6 border-t border-gray-300" />

          {/* 시그너스 직업군 (하단, 각 모험가 열에 대응) */}
          <div className="flex gap-8">
            {groupNames.map((groupName) => (
              <div key={groupName} className="w-[160px]">
                <ul className="flex flex-col gap-4">
                  {cygnusByGroup[groupName] && renderJob(cygnusByGroup[groupName])}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 text-left">
        <h1 className="text-2xl font-bold mb-4">25.06.20  패치 반영</h1>
        <h1 className="text-2xl font-bold mb-4">25.09.19  스나이핑 쿨타임 수정</h1>
        <h1 className="text-2xl font-bold mb-4">25.10.17  돌진 사거리 오류, 마그넷 설명 수정</h1>
        <h1 className="text-2xl font-bold mb-4">25.10.21  숙련도 오류 수정</h1>
        <h1 className="text-2xl font-bold mb-4">25.12.19  패치 반영, 클립보드 복사기능, 스킬트리 자체 저장기능 추가</h1>
        <h1 className="text-2xl font-bold mb-4">25.12.23  4차만 찍어보기 기능, 5레벨씩 찍기(Shift+클릭) 추가</h1>
        <h1 className="text-2xl font-bold mb-4">26.06.14  시그너스 직업군 스킬 추가</h1>
        <br/>
      </div>
    </div>
  );
}
