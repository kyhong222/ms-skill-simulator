export const fetchSkillBook = async (jobId: number) => {
  const res = await fetch(`https://maplestory.io/api/GMS/62/job/${jobId}/skillbook`);
  if (!res.ok) throw new Error("Failed to fetch skillbook");
  return res.json();
};
