import { createContext, useContext } from "react";
import type { AuthStatus, ICloudUser, SyncStatus } from "../../types/cloud";

export interface ICloudContext {
  status: AuthStatus;
  user: ICloudUser | null;
  syncStatus: SyncStatus;
  isAdmin: boolean; // 운영자(admins 행 보유) — 문의 관리 메뉴 표시용. 실제 권한은 RLS가 건다
  isStorageReady: boolean; // false면 어느 저장소를 읽을지 아직 모른다 — 스킬 트리를 읽거나 쓰면 안 됨
  dataVersion: number; // 계정 데이터가 바뀌어 스킬 트리를 다시 읽어야 할 때 증가
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const CloudContext = createContext<ICloudContext | null>(null);

export function useCloud() {
  const context = useContext(CloudContext);
  if (!context) throw new Error("CloudProvider 안에서만 사용할 수 있습니다");
  return context;
}
