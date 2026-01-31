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
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">직업을 선택하세요</h1>
          <p className="text-gray-500 mt-2">원하는 직업을 선택하여 스킬 트리를 확인해보세요.</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {Object.entries(groupedJobs).map(([groupName, jobs]) => (
            <div key={groupName} className="bg-white rounded-lg shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300">
              <div className="p-4 bg-gray-800 text-white">
                <h2 className="text-xl font-bold text-center">{groupName}</h2>
              </div>
              <ul className="p-4 space-y-2">
                {jobs.map((job) => (
                  <li key={job.id}>
                    <button
                      className={`w-full text-left p-3 rounded-md transition-colors duration-200 font-semibold ${
                        selectedJob === job.id
                          ? "bg-blue-600 text-white shadow-lg"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                      }`}
                      onClick={() => handleSelect(job)}
                    >
                      {job.koname}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <footer className="mt-12 p-6 bg-white rounded-lg shadow-md text-sm text-gray-600">
          <h3 className="text-lg font-bold text-gray-800 mb-3">업데이트 내역</h3>
          <ul className="space-y-1 list-disc list-inside">
            <li><span className="font-semibold">25.06.20:</span> 패치 반영</li>
            <li><span className="font-semibold">25.09.19:</span> 스나이핑 쿨타임 수정</li>
            <li><span className="font-semibold">25.10.17:</span> 돌진 사거리 오류, 마그넷 설명 수정</li>
            <li><span className="font-semibold">25.10.21:</span> 숙련도 오류 수정</li>
            <li><span className="font-semibold">25.12.19:</span> 패치 반영, 클립보드 복사기능, 스킬트리 자체 저장기능 추가</li>
            <li><span className="font-semibold">25.12.23:</span> 4차만 찍어보기 기능, 5레벨씩 찍기 추가</li>
          </ul>
           <div className="mt-4 pt-4 border-t border-gray-200">
             <p className="font-bold text-gray-800">* <kbd>Shift</kbd> + 클릭시 5레벨씩 스킬레벨이 바뀝니다.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
