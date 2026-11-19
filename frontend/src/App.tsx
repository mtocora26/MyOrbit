import UndoToast from "./components/UndoToast";
import { useCallback, useEffect, useState } from "react";
import HomeScreen from "./screens/HomeScreen";
import TasksScreen from "./screens/TasksScreen";
import AgendaScreen from "./screens/AgendaScreen";
import UniversityScreen from "./screens/UniversityScreen";
import MoreScreen from "./screens/MoreScreen";
import BottomNav from "./components/BottomNav";
import SideNav from "./components/SideNav";
import OfflineBanner from "./components/OfflineBanner";
import TaskDetailScreen from "./screens/TaskDetailScreen";
import SubjectDetailScreen from "./screens/SubjectDetailScreen";
import GradesScreen from "./screens/GradesScreen";
import HabitsScreen from "./screens/HabitsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import AdminScreen from "./screens/AdminScreen";
import CategoriesScreen from "./screens/CategoriesScreen";
import NotificationsScreen from "./screens/NotificationsScreen";
import type { Subject } from "./services/subjectsApi";
import { useUnreadNotifications } from "./hooks/useUnreadNotifications";
import QuickAddSheet from "./components/QuickAddSheet";
import QuickEventSheet from "./components/QuickEventSheet";
import WelcomeOnboarding from "./components/WelcomeOnboarding";
import AuthScreen from "./screens/AuthScreen";
import { hideSplash, useBackHandler } from "./hooks/useNativeApp";
import { useResume } from "./hooks/useResume";
import BootScreen from "./components/BootScreen";
import { clearLocalReminders, syncLocalReminders } from "./services/localReminders";
import { ensureTimeZone, getSession, logout, refreshSession, type AuthSession } from "./services/authApi";

/** Lo máximo que la animación de arranque retiene la app esperando al servidor. */
const BOOT_MAX_MS = 1200;
/** Tiempo en segundo plano a partir del cual, al volver, se revalida con la animación. */
const RESUME_AFTER_MS = 30 * 60_000;

export type MainTab = "home" | "tasks" | "agenda" | "university" | "more";
export type SubScreen = null | "taskDetail" | "subjectDetail" | "grades" | "habits" | "profile" | "admin" | "categories" | "notifications";

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(() => getSession());
  const [showWelcome, setShowWelcome] = useState(false);
  const unread = useUnreadNotifications(session !== null);

  // Con sesión guardada, la animación de arranque cubre solo la confirmación real (como mucho BOOT_MAX_MS): luego se
  // muestra lo guardado y las pantallas siguen con sus esqueletos. Sin sesión no hay nada que esperar.
  const [booting, setBooting] = useState(() => getSession() !== null);

  // Confirma la sesión y trae el rol actual (también invalida sesiones desactivadas).
  const revalidate = useCallback(async () => {
    const fresh = await refreshSession();
    setSession(fresh);
    if (fresh) setSession(await ensureTimeZone(fresh));
  }, []);

  useEffect(() => {
    const cap = setTimeout(() => setBooting(false), BOOT_MAX_MS);
    revalidate().catch(() => undefined).finally(() => { clearTimeout(cap); setBooting(false); });
    return () => clearTimeout(cap);
  }, [revalidate]);
  const [activeTab, setActiveTab] = useState<MainTab>("home");
  const [subScreen, setSubScreen] = useState<SubScreen>(null);
  const [fabOpen, setFabOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [tasksRefreshTick, setTasksRefreshTick] = useState(0);
  const [habitsRefreshTick, setHabitsRefreshTick] = useState(0);

  // Tras mucho tiempo en segundo plano se vuelve a confirmar la sesión y a pedir los datos.
  const resuming = useResume(RESUME_AFTER_MS, async () => {
    await revalidate();
    setTasksRefreshTick((prev) => prev + 1);
    setHabitsRefreshTick((prev) => prev + 1);
  });

  const navigate = (tab: MainTab, sub?: SubScreen) => {
    setActiveTab(tab);
    setSubScreen(sub ?? null);
  };

  // Botón «atrás» de Android: sube un nivel (subpantalla → pestaña → Hoy) y solo al final cierra la app.
  useBackHandler(() => {
    if (fabOpen) { setFabOpen(false); return true; }
    if (subScreen === "grades") { setSubScreen("subjectDetail"); return true; }
    if (subScreen !== null) { goBack(); return true; }
    if (activeTab !== "home") { navigate("home"); return true; }
    return false;
  });

  useEffect(() => { hideSplash(); }, []);

  // En Android, el teléfono programa sus propios avisos (clases, recordatorios, fechas límite): se recalculan al
  // iniciar sesión, al volver a la app y cada vez que cambian los datos. Sin sesión no deben quedar avisos.
  const signedIn = session !== null;
  useEffect(() => {
    if (!signedIn || booting) return;
    syncLocalReminders().catch(() => undefined);
  }, [signedIn, booting, tasksRefreshTick, habitsRefreshTick]);

  // Al recuperar la conexión, las pantallas vuelven a pedir sus datos.
  useEffect(() => {
    const refreshAll = () => { setTasksRefreshTick((prev) => prev + 1); setHabitsRefreshTick((prev) => prev + 1); };
    window.addEventListener("myorbit:recovered", refreshAll);
    return () => window.removeEventListener("myorbit:recovered", refreshAll);
  }, []);

  const goBack = () => {
    const wasTaskDetail = subScreen === "taskDetail";
    setSubScreen(null);
    if (wasTaskDetail || subScreen === "profile" || subScreen === "categories") {
      setTasksRefreshTick((prev) => prev + 1);
    }
  };

  const openTaskDetail = (taskId?: string) => {
    setSelectedTaskId(taskId ?? null);
    setSubScreen("taskDetail");
  };

  async function handleLogout() {
    await logout();
    clearLocalReminders().catch(() => undefined);
    setSession(null);
    setSubScreen(null);
    setActiveTab("home");
  }

  if (booting && session) return <BootScreen />;

  if (!session) {
    return <AuthScreen onAuthenticated={(newSession, isNewAccount) => {
      setSession(newSession);
      setShowWelcome(isNewAccount);
      ensureTimeZone(newSession).then(setSession);
    }} />;
  }

  return (
    <div className="relative h-dvh bg-paper">
      {resuming && <BootScreen overlay label="Actualizando MyOrbit" />}
      <div className="w-full h-dvh flex flex-col overflow-hidden lg:flex-row">
          <SideNav active={activeTab} userName={session.name} onChange={(t) => navigate(t)} onFab={() => setFabOpen(true)} onProfile={() => { navigate("more"); setSubScreen("profile"); }} unreadCount={unread.count} onNotifications={() => setSubScreen("notifications")} />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <OfflineBanner />
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <div className={`h-full w-full lg:mx-auto ${subScreen === null ? "lg:max-w-[1180px]" : "lg:max-w-[820px] lg:mx-0"}`}>
            {/* Cada cambio de pestaña o subpantalla entra con un movimiento corto (fundido o empuje lateral). */}
            <div key={subScreen ?? activeTab} className={`h-full w-full ${subScreen === null ? "orbit-fade" : "orbit-push"}`}>
            {subScreen === "taskDetail"    && <TaskDetailScreen onBack={goBack} taskId={selectedTaskId} />}
            {subScreen === "subjectDetail" && selectedSubject && <SubjectDetailScreen key={selectedSubject.id} subject={selectedSubject} onBack={goBack} onDeleted={goBack} onGrades={() => setSubScreen("grades")} />}
            {subScreen === "grades"        && selectedSubject && <GradesScreen subject={selectedSubject} onBack={() => setSubScreen("subjectDetail")} />}
            {subScreen === "habits"        && <HabitsScreen onBack={goBack} refreshTick={habitsRefreshTick} />}
            {subScreen === "profile"       && <ProfileScreen onBack={goBack} user={session} onLogout={handleLogout} onUserUpdated={(next) => setSession(next)} />}
            {subScreen === "admin"         && <AdminScreen onBack={goBack} />}
            {subScreen === "categories"    && <CategoriesScreen onBack={goBack} />}
            {subScreen === "notifications" && <NotificationsScreen onBack={goBack} onUnreadChange={unread.setCount} onOpenTask={openTaskDetail} onOpenHabits={() => setSubScreen("habits")} onOpenUniversity={() => navigate("university")} onOpenTasks={() => navigate("tasks")} onOpenAgenda={() => navigate("agenda")} />}

            {subScreen === null && (
              <>
                {activeTab === "home"       && <HomeScreen userName={session.name} onTaskTap={openTaskDetail} onHabits={() => { navigate("more"); setSubScreen("habits"); }} onFab={() => setFabOpen(true)} onViewTasks={() => navigate("tasks")} onUniversity={() => navigate("university")} unreadCount={unread.count} onNotifications={() => setSubScreen("notifications")} onAgenda={() => navigate("agenda")} refreshTick={tasksRefreshTick} />}
                {activeTab === "tasks"      && <TasksScreen onTaskTap={(taskId) => openTaskDetail(taskId)} onFab={() => setFabOpen(true)} refreshTick={tasksRefreshTick} />}
                {activeTab === "agenda"     && <AgendaScreen onFab={() => setFabOpen(true)} refreshTick={tasksRefreshTick} />}
                {activeTab === "university" && <UniversityScreen onSubjectTap={(subject) => { setSelectedSubject(subject); setSubScreen("subjectDetail"); }} />}
                {activeTab === "more"       && <MoreScreen userName={session.name} onHabits={() => setSubScreen("habits")} onProfile={() => setSubScreen("profile")} onCategories={() => setSubScreen("categories")} onNotifications={() => setSubScreen("notifications")} unreadCount={unread.count} onAdmin={() => setSubScreen("admin")} isAdmin={session.role === "ADMIN"} />}
              </>
            )}

            </div>
            </div>

            <UndoToast />

            {showWelcome && (
              <WelcomeOnboarding
                name={session.name}
                onClose={() => setShowWelcome(false)}
                onCreateTask={() => { setShowWelcome(false); setFabOpen(true); }}
                onConfigureHabits={() => { setShowWelcome(false); navigate("more"); setSubScreen("habits"); }}
                onConfigureProfile={() => { setShowWelcome(false); navigate("more"); setSubScreen("profile"); }}
              />
            )}
          </div>

          {subScreen === null && (
            <BottomNav active={activeTab} onChange={(t) => navigate(t)} onFab={() => setFabOpen(true)} />
          )}
          </div>
      </div>
      {/* Fuera del área de contenido: el sheet y su velo cubren también la barra inferior. */}
      <QuickAddSheet open={fabOpen} onClose={() => setFabOpen(false)} onTaskCreated={() => setTasksRefreshTick((prev) => prev + 1)} onHabitCreated={() => setHabitsRefreshTick((prev) => prev + 1)} onEventRequested={() => setEventOpen(true)} />
      <QuickEventSheet open={eventOpen} onClose={() => setEventOpen(false)} onSaved={() => setTasksRefreshTick((prev) => prev + 1)} />
    </div>
  );
}
