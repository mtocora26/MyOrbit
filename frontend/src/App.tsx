import { useEffect, useState } from "react";
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
import RadarScreen from "./screens/RadarScreen";
import ProfileScreen from "./screens/ProfileScreen";
import AdminScreen from "./screens/AdminScreen";
import QuickAddSheet from "./components/QuickAddSheet";
import WelcomeOnboarding from "./components/WelcomeOnboarding";
import AuthScreen from "./screens/AuthScreen";
import { getSession, logout, refreshSession, type AuthSession } from "./services/authApi";

export type MainTab = "home" | "tasks" | "agenda" | "university" | "more";
export type SubScreen = null | "taskDetail" | "subjectDetail" | "grades" | "habits" | "radar" | "profile" | "admin";

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(() => getSession());
  const [showWelcome, setShowWelcome] = useState(false);

  // Al abrir la app se confirma la sesión y se trae el rol actual (también invalida sesiones desactivadas).
  useEffect(() => {
    refreshSession().then((fresh) => setSession(fresh)).catch(() => undefined);
  }, []);
  const [activeTab, setActiveTab] = useState<MainTab>("home");
  const [subScreen, setSubScreen] = useState<SubScreen>(null);
  const [fabOpen, setFabOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [tasksRefreshTick, setTasksRefreshTick] = useState(0);
  const [habitsRefreshTick, setHabitsRefreshTick] = useState(0);

  const navigate = (tab: MainTab, sub?: SubScreen) => {
    setActiveTab(tab);
    setSubScreen(sub ?? null);
  };

  const goBack = () => {
    const wasTaskDetail = subScreen === "taskDetail";
    setSubScreen(null);
    if (wasTaskDetail || subScreen === "profile") {
      setTasksRefreshTick((prev) => prev + 1);
    }
  };

  const openTaskDetail = (taskId?: string) => {
    setSelectedTaskId(taskId ?? null);
    setSubScreen("taskDetail");
  };

  async function handleLogout() {
    await logout();
    setSession(null);
    setSubScreen(null);
    setActiveTab("home");
  }

  if (!session) {
    return <AuthScreen onAuthenticated={(newSession, isNewAccount) => {
      setSession(newSession);
      setShowWelcome(isNewAccount);
    }} />;
  }

  return (
    <div className="relative h-dvh bg-paper">
      <div className="w-full h-dvh flex flex-col overflow-hidden lg:flex-row">
          <SideNav active={activeTab} userName={session.name} onChange={(t) => navigate(t)} onFab={() => setFabOpen(true)} onProfile={() => { navigate("more"); setSubScreen("profile"); }} />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <OfflineBanner />
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <div className={`h-full w-full lg:mx-auto ${subScreen === null ? "lg:max-w-[1180px]" : "lg:max-w-[820px] lg:mx-0"}`}>
            {subScreen === "taskDetail"    && <TaskDetailScreen onBack={goBack} taskId={selectedTaskId} />}
            {subScreen === "subjectDetail" && <SubjectDetailScreen onBack={goBack} onGrades={() => setSubScreen("grades")} />}
            {subScreen === "grades"        && <GradesScreen onBack={() => setSubScreen("subjectDetail")} />}
            {subScreen === "habits"        && <HabitsScreen onBack={goBack} refreshTick={habitsRefreshTick} />}
            {subScreen === "radar"         && <RadarScreen onBack={goBack} />}
            {subScreen === "profile"       && <ProfileScreen onBack={goBack} user={session} onLogout={handleLogout} />}
            {subScreen === "admin"         && <AdminScreen onBack={goBack} />}

            {subScreen === null && (
              <>
                {activeTab === "home"       && <HomeScreen userName={session.name} onTaskTap={openTaskDetail} onHabits={() => { navigate("more"); setSubScreen("habits"); }} onFab={() => setFabOpen(true)} onViewTasks={() => navigate("tasks")} onConfigureProfile={() => { navigate("more"); setSubScreen("profile"); }} onAgenda={() => navigate("agenda")} refreshTick={tasksRefreshTick} />}
                {activeTab === "tasks"      && <TasksScreen onTaskTap={(taskId) => openTaskDetail(taskId)} onFab={() => setFabOpen(true)} refreshTick={tasksRefreshTick} />}
                {activeTab === "agenda"     && <AgendaScreen onFab={() => setFabOpen(true)} refreshTick={tasksRefreshTick} />}
                {activeTab === "university" && <UniversityScreen onSubjectTap={() => setSubScreen("subjectDetail")} />}
                {activeTab === "more"       && <MoreScreen userName={session.name} onHabits={() => setSubScreen("habits")} onRadar={() => setSubScreen("radar")} onProfile={() => setSubScreen("profile")} onAdmin={() => setSubScreen("admin")} isAdmin={session.role === "ADMIN"} />}
              </>
            )}

            </div>

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
      <QuickAddSheet open={fabOpen} onClose={() => setFabOpen(false)} onTaskCreated={() => setTasksRefreshTick((prev) => prev + 1)} onHabitCreated={() => setHabitsRefreshTick((prev) => prev + 1)} />
    </div>
  );
}
