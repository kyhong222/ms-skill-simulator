import { useNavigate } from "react-router-dom";
import JobSelector from "../components/JobSelector/JobSelector";
import type { IJob } from "../types/job";

export default function SkillSimulatorPage() {
  const navigate = useNavigate();

  const handleJobSelect = (job: IJob) => {
    navigate(`/${job.id}`);
  };

  return <JobSelector onSelect={handleJobSelect} />;
}
