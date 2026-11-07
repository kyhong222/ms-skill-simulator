import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { CloudContext } from "./cloudContext";
import CloudPromptDialog from "./CloudPromptDialog";
import { APP_ID, isCloudEnabled, supabase } from "../../data/cloud/supabase";
import { checkIsAdmin } from "../../data/cloud/feedback";
import { createCloudSync, type ICloudSync } from "../../data/cloud/sync";
import { fetchState, pushState } from "../../data/cloud/userData";
import {
  captureAccountTrees,
  clearAccountCaches,
  copyGuestTreesToAccount,
  hasGuestSkillData,
  replaceAccountTrees,
  setStorageAccount,
  subscribeSkillTreeChange,
} from "../../data/skillTreeStorage";
import type { AuthStatus, CloudPrompt, ICloudUser, SyncStatus } from "../../types/cloud";

const SCHEMA_VERSION = 1;

function toUser(session: Session | null): ICloudUser | null {
  if (!session) return null;
  const meta = (session.user.user_metadata ?? {}) as Record<string, unknown>;
  const pick = (...keys: string[]) => {
    const key = keys.find((k) => typeof meta[k] === "string" && meta[k]);
    return key ? (meta[key] as string) : undefined;
  };
  return {
    id: session.user.id,
    name: pick("full_name", "name", "user_name", "preferred_username") ?? "디스코드 사용자",
    avatarUrl: pick("avatar_url", "picture"),
  };
}

// 로그인 세션과 계정 동기화를 앱 전체에 연결한다
export default function CloudProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(isCloudEnabled ? "loading" : "disabled");
  const [user, setUser] = useState<ICloudUser | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [isAccountReady, setIsAccountReady] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const [prompt, setPrompt] = useState<CloudPrompt | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [adminUserId, setAdminUserId] = useState<string | null>(null);
  const syncRef = useRef<ICloudSync | null>(null);

  const userId = user?.id;
  // 확인한 계정과 지금 계정이 같을 때만 어드민 — 계정이 바뀌면 다시 확인할 때까지 false
  const isAdmin = userId !== undefined && adminUserId === userId;

  useEffect(() => {
    if (!userId) return;
    let isAlive = true;
    void checkIsAdmin(userId).then((result) => {
      if (isAlive) setAdminUserId(result ? userId : null);
    });
    return () => {
      isAlive = false;
    };
  }, [userId]);
  const bumpDataVersion = useCallback(() => setDataVersion((version) => version + 1), []);

  useEffect(() => {
    if (!isCloudEnabled) return;
    // 콜백 안에서 supabase를 다시 await하면 교착될 수 있어 상태 반영만 한다
    const { data } = supabase().auth.onAuthStateChange((_event, session) => {
      setStatus(session ? "signedIn" : "signedOut");
      setUser(toUser(session));
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const boot = useCallback(async (sync: ICloudSync) => {
    setPrompt(null);
    try {
      const result = await sync.start();
      if (syncRef.current !== sync) return;

      if (result === "tooNew") {
        setPrompt("loadError");
      } else if (result === "firstLogin" && hasGuestSkillData()) {
        setPrompt("migrate");
      } else {
        // 처음 로그인했지만 올릴 데이터가 없어도 행을 만들어 이후 이관을 묻지 않는다
        if (result === "firstLogin") await sync.finishFirstLogin();
        if (syncRef.current !== sync) return;
        bumpDataVersion();
        setIsAccountReady(true);
      }
    } catch (error) {
      console.error("계정 데이터를 불러오지 못했습니다", error);
      if (syncRef.current === sync) setPrompt("loadError");
    }
  }, [bumpDataVersion]);

  useEffect(() => {
    if (status === "signedOut") {
      setStorageAccount(null);
      clearAccountCaches();
      setPrompt(null);
      setIsAccountReady(false);
      setSyncStatus("idle");
      bumpDataVersion();
      return;
    }
    if (status !== "signedIn" || !userId) return;

    setStorageAccount(userId);
    setIsAccountReady(false);

    const sync = createCloudSync({
      schemaVersion: SCHEMA_VERSION,
      fetchState: () => fetchState(userId, APP_ID),
      pushState: (payload, version, rev) => pushState(userId, APP_ID, payload, version, rev),
      captureState: captureAccountTrees,
      applyState: (payload) => {
        replaceAccountTrees(payload);
        bumpDataVersion();
      },
      onStatus: setSyncStatus,
      onConflict: () => setPrompt("conflict"),
    });
    syncRef.current = sync;
    void boot(sync);

    const unsubscribe = subscribeSkillTreeChange(() => sync.schedulePush());
    const handleFocus = () => void sync.checkRemote();
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") void sync.flush();
    };
    const handlePageHide = () => void sync.flush();

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      unsubscribe();
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pagehide", handlePageHide);
      sync.dispose();
      syncRef.current = null;
    };
  }, [status, userId, boot, bumpDataVersion]);

  const signIn = useCallback(async () => {
    if (!isCloudEnabled) return;
    const { error } = await supabase().auth.signInWithOAuth({
      provider: "discord",
      options: {
        // 로그인 후 보던 직업 화면으로 돌아온다
        redirectTo: `${window.location.origin}${window.location.pathname}`,
        scopes: "identify email",
      },
    });
    if (error) console.error("디스코드 로그인 실패", error);
  }, []);

  const signOut = useCallback(async () => {
    if (!isCloudEnabled) return;
    await syncRef.current?.flush(); // 디바운스 대기 중인 변경을 잃지 않도록
    const { error } = await supabase().auth.signOut();
    if (error) console.error("로그아웃 실패", error);
  }, []);

  const runPrompt = async (action: (sync: ICloudSync) => Promise<void>) => {
    const sync = syncRef.current;
    if (!sync) return;
    setIsBusy(true);
    try {
      await action(sync);
      bumpDataVersion();
      setPrompt(null);
      setIsAccountReady(true);
    } finally {
      setIsBusy(false);
    }
  };

  const handleMigrate = (shouldMigrate: boolean) =>
    runPrompt(async (sync) => {
      replaceAccountTrees(null);
      if (shouldMigrate) copyGuestTreesToAccount();
      await sync.finishFirstLogin();
    });

  const handleRetry = () => {
    if (syncRef.current) void boot(syncRef.current);
  };

  const value = useMemo(
    () => ({
      status,
      user,
      syncStatus,
      isAdmin,
      isStorageReady: status === "disabled" || status === "signedOut" || (status === "signedIn" && isAccountReady),
      dataVersion,
      signIn,
      signOut,
    }),
    [status, user, syncStatus, isAdmin, isAccountReady, dataVersion, signIn, signOut],
  );

  return (
    <CloudContext.Provider value={value}>
      {children}
      <CloudPromptDialog
        prompt={prompt}
        isBusy={isBusy}
        onMigrate={handleMigrate}
        onTakeRemote={() => runPrompt((sync) => sync.takeRemote())}
        onKeepLocal={() => runPrompt((sync) => sync.keepLocal())}
        onRetry={handleRetry}
        onSignOut={signOut}
      />
    </CloudContext.Provider>
  );
}
