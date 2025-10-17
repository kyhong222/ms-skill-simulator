import { useState } from "react";
import type { IJob } from "../../types/job";
import { groupedJobs } from "../../data/jobs";

export default function JobSelector({ onSelect }: { onSelect?: (job: IJob) => void }) {
  const [selectedJob, setSelectedJob] = useState<number | null>(null);

  const handleSelect = (job: IJob) => {
    setSelectedJob(job.id);
    if (onSelect) onSelect(job);
  };

  return (
    <div className="p-6 max-w-full mx-auto">
      <h1 className="text-2xl font-bold mb-4">직업을 선택하세요.</h1>

      {/* 그룹들을 가로로 나란히 배치 */}
      <div className="flex gap-8 overflow-x-auto">
        {Object.entries(groupedJobs).map(([groupName, jobs]) => (
          <div key={groupName} className="min-w-[160px]">
            <h2 className="text-xl font-semibold mb-3 text-center">{groupName}</h2>
            <ul className="flex flex-col gap-4">
              {jobs.map((job) => (
                <li
                  key={job.id}
                  className={`cursor-pointer p-4 border rounded text-center ${
                    selectedJob === job.id ? "bg-blue-500 text-white" : "bg-white text-black"
                  }`}
                  onClick={() => handleSelect(job)}
                >
                  {job.koname}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-8">
        <h1 className="text-2xl font-bold mb-4">6/20 패치 반영</h1>
        <h1 className="text-2xl font-bold mb-4">9/19 스나이핑 쿨타임 수정</h1>
        <h1 className="text-2xl font-bold mb-4">10/17 돌진 사거리 오류 수정</h1>
      </div>
    </div>
  );
}
