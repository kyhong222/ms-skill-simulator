import type { IJobSkill } from "../../types/jobSkillBook";
import { SkillToolTipPostfix } from "./SkillToolTipPostfix";

interface SkillTooltipProps {
  skill: IJobSkill;
  allSkills: { id: number; name: string }[];
  curLevel: number;
}

// 스킬 상세 설명을 만드는 함수
const makeSkillDetail = (skill: IJobSkill, curLevel: number) => {
  const rawDetail = skill.description?.detail;

  // 현재 레벨에 해당하는 levelProperties를 찾음, hs는 "h" + 레벨 숫자
  if (!skill.levelProperties || skill.levelProperties.length === 0) return rawDetail || "상세 설명 없음";
  const currentLevelProperties = skill.levelProperties.find((prop) => prop.hs === `h${curLevel}`);

  // currentLevelProperties가 존재하면 해당 properties의 keys를 가져옴
  if (!currentLevelProperties) return rawDetail || "상세 설명 없음";

  // 현재 레벨 속성의 키를 가져옴
  const keys = Object.keys(currentLevelProperties).filter((key) => key !== "hs");

  if (!rawDetail) return "상세 설명 없음";
  // rawDetail이 없으면 기본 메시지로 대체
  let detail = rawDetail;
  keys.forEach(
    (key) => {
      let value = "0";

      value = currentLevelProperties[key as keyof typeof currentLevelProperties] || "0";

      // lt(공격범위) 파싱
      if (key === "lt") {
        // "lt": "Point [ X=-160, Y=-50 ]"
        // X의 값을 반환
        const match = value.match(/X=(-?\d+)/);
        if (match) {
          value = match[1];
        }
      }

      // rb(공격범위) 파싱
      if (key === "rb") {
        // "rb": "Point [ X=130, Y=98 ]"
        // X의 값을 반환
        const match = value.match(/X=(\d+)/);
        if (match) {
          value = match[1];
        }
      }

      value = SkillToolTipPostfix(skill, curLevel, key, value);

      // value가 -로 시작하면 -를 제거
      if (value.startsWith("-")) {
        value = value.slice(1);
      }

      // #hpCon, #mpCon, #damage 등을 찾아서 해당 속성으로 대체
      detail = detail.replace(new RegExp(`#${key}`, "g"), value.toString());
    }
    // 만약 detail이 비어있으면 기본 메시지로 대체
  );
  if (!detail || detail.trim() === "") {
    detail = "상세 설명 없음";
  }
  return detail;
};

const SkillTooltip: React.FC<SkillTooltipProps> = (props: SkillTooltipProps) => {
  const { skill, allSkills, curLevel } = props;

  // 필요한 스킬 이름 찾기 함수
  const getSkillNameById = (id: number) => {
    const found = allSkills.find((s) => s.id === id);
    return found ? found.name : `스킬 ID ${id}`;
  };

  return (
    <div className="p-3 w-128 bg-white border border-gray-300 rounded shadow-lg text-sm text-gray-800">
      {/* 스킬명 */}
      <h3 className="font-bold mb-2">{skill.description?.name || "알 수 없는 스킬"}</h3>

      {/* 스킬 설명 */}
      <div className="flex items-start gap-2 mb-1">
        {skill.icon && (
          <img
            src={`data:image/png;base64,${skill.iconMouseover || skill.icon}`}
            alt={`${skill.description?.name} icon`}
            className="w-16 h-16 flex-shrink-0"
          />
        )}
        <div className="flex flex-col text-left">
          <p className="text-gray-600 mb-1">{`[마스터 레벨 : ${skill.masterLevel || 0}]`}</p>
          <p className="whitespace-pre-line">{(skill.description?.desc || "설명 없음").replace(/\\n/g, "\n")}</p>

          {/* 필요 스킬 */}
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

      {/* 현재 레벨, 현재 레벨 설명 */}
      <div>
        <div className="text-center">
          {curLevel >= 1 ? `[현재 레벨: ${curLevel}]` : `[마스터 레벨: ${skill.masterLevel}]`}
        </div>
        <div className="text-center">
          {curLevel >= 1 ? `${makeSkillDetail(skill, curLevel)}` : `${makeSkillDetail(skill, skill.masterLevel)}`}
        </div>
      </div>
    </div>
  );
};

export default SkillTooltip;
