import { useState } from 'react';
import JobSelector from './components/JobSelector/JobSelector';
import SkillTree from './components/SkillTree/SkillTree';
import type { IJob } from './types/job';
import './App.css';

function App() {
  const [job, setJob] = useState<IJob | null>(null);

  return (
    <div className="p-6">
      {!job && <JobSelector onSelect={setJob} />}
      {job && (
        <div>
          <button
            onClick={() => setJob(null)}
            className="mb-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded"
          >
            직업 변경
          </button>

          <h2 className="text-xl font-semibold mb-4">
            선택한 직업: {job.koname}
          </h2>

          <SkillTree selectedJobId={job.id} />
        </div>
      )}
    </div>
  );
}

export default App;
