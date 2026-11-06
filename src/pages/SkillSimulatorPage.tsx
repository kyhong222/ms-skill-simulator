import { useNavigate } from "react-router-dom";
import Header from "../components/Header/Header";
import JobSelector from "../components/JobSelector/JobSelector";
import type { IJob } from "../types/job";

export default function SkillSimulatorPage() {
  const navigate = useNavigate();

  const handleJobSelect = (job: IJob) => {
    navigate(`/${job.id}`);
  };

  return (
    <>
      <Header />
      <JobSelector onSelect={handleJobSelect} />
    </>
  );
}
