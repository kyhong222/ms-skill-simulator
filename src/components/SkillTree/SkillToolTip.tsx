import type { IJobSkill } from "../../types/jobSkillBook";

interface SkillTooltipProps {
  skill: IJobSkill;
  allSkills: { id: number; name: string }[];
}

const SkillTooltip: React.FC<SkillTooltipProps> = ({ skill, allSkills }) => {
  // 필요한 스킬 이름 찾기 함수
  const getSkillNameById = (id: number) => {
    const found = allSkills.find((s) => s.id === id);
    return found ? found.name : `스킬 ID ${id}`;
  };

  return (
    <div className="p-3 w-128 bg-white border border-gray-300 rounded shadow-lg text-sm text-gray-800">
      {/* 스킬명 */}
      <h3 className="font-bold mb-2">{skill.description?.name || "알 수 없는 스킬"}</h3>

      {/* 스킬 설명 (아이콘과 함께 한 번만 표시) */}
      <div className="flex items-start gap-2 mb-1">
        {skill.icon && (
          <img
            src={`data:image/png;base64,${skill.iconMouseover || skill.icon}`}
            alt={`${skill.description?.name} icon`}
            className="w-16 h-16 flex-shrink-0"
          />
        )}
        <div className="flex flex-col text-left">
          <p className="text-gray-600 mb-1">
            {`[마스터 레벨 : ${skill.masterLevel || 0}]`}
            </p>
          <p className="whitespace-pre-line">
            {(skill.description?.desc || "설명 없음").replace(/\\n/g, "\n")}
          </p>

          {/* 필요 스킬 (설명 바로 아래에 위치) */}
          {skill.requiredSkillLevels && Object.keys(skill.requiredSkillLevels).length > 0 && (
            <div className="mt-1">
              <strong>필요 스킬:</strong>
              <ul className="list-disc list-inside ml-4">
                {Object.entries(skill.requiredSkillLevels).map(([reqSkillId, reqLevel]) => (
                  <p key={reqSkillId}>
                    {getSkillNameById(Number(reqSkillId))} {reqLevel}레벨 이상
                  </p>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <hr className="my-2" />

      {/* 현재 레벨, 현재 레벨 설명 (미구현) */}
      <div className="ml-[30px]">
        <div>현재 레벨: -</div>
        <div>현재 레벨 설명: -</div>
      </div>
    </div>
  );
};

export default SkillTooltip;
