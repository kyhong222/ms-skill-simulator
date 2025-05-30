import { useState } from 'react';
import JobSelector from './components/JobSelector/JobSelector';
import SkillTree from './components/SkillTree/SkillTree';
import type { IJob } from './types/job';
import './App.css';

function App() {
  const [job, setJob] = useState<IJob | null>(null);

  return (
    <div className="p-0 min-w-[1500px] flex flex-col mx-auto max-w-full">
      {!job && <JobSelector onSelect={setJob} />}
      {job && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              전직명: {job.koname}
            </h2>
            <button
              onClick={() => setJob(null)}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
              style={{width: '120px'}}
            >
              직업 변경
            </button>
          </div>

          <SkillTree selectedJobId={job.id} />
        </div>
      )}
    </div>
  );
}

export default App;
