import { useEffect, useMemo, useState } from "react";
import { Badge, Card, CategoryBadge, Checkbox, ProgressBar, ProgressRing, SectionTitle, OrbitDecor } from "../components/shared";
import {
  IconPencil, IconCalendar, IconBell, IconTarget,
  IconGraduation,
} from "../components/icons";
import { fetchTasks, toUiTask, updateTaskStatus, type UiTask } from "../services/tasksApi";
import { fetchUserProfile, type UserProfile } from "../services/profileApi";
import { fetchCategories, type Category } from "../services/categoriesApi";
import { isOverdue } from "../services/taskDue";

interface Props {
  userName: string;
  onTaskTap: (taskId: string) => void;
  onHabits: () => void;
  onFab: () => void;
  onViewTasks: () => void;
  onConfigureProfile: () => void;
  onAgenda: () => void;
  refreshTick: number;
}

const QuickAction = ({ icon, label, bg, onClick }: { icon: React.ReactNode; label: string; bg: string; onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-2 rounded-2xl py-3.5 active:scale-95 transition-transform"
    style={{ background: bg }}
  >
    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.7)" }}>
      {icon}
    </div>
    <span className="text-[11px] font-semibold text-[#667085]">{label}</span>
  </button>
);

const PRIORITY_COLOR = { alta: "#FF6B4A", media: "#F79009", baja: "#12B76A" };

function currentDateLabel(): string {
  const formatted = new Intl.DateTimeFormat("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());
  return formatted.charAt(0).toUpperCase() + formatted.slice(1).replace(" de ", " · ");
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default function HomeScreen({ userName, onTaskTap, onHabits, onFab, onViewTasks, onConfigureProfile, onAgenda, refreshTick }: Props) {
  const [tasks, setTasks] = useState<UiTask[]>([]);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadTasks() {
      try {
        const apiTasks = await fetchTasks();
        if (!ignore) {
          setTasks(apiTasks.map(toUiTask));
          setTaskError(null);
        }
      } catch (err) {
        if (!ignore) {
          setTaskError(err instanceof Error ? err.message : "No fue posible cargar las tareas");
        }
      }
    }

    loadTasks();
    fetchUserProfile().then((data) => { if (!ignore) setProfile(data); }).catch(() => { if (!ignore) setProfile(null); });
    return () => { ignore = true; };
  }, [refreshTick]);

  const priorityTasks = useMemo(
    () => [...tasks].filter((task) => !task.done).sort((a, b) => {
      const weight = { alta: 0, media: 1, baja: 2 };
      return weight[a.priority] - weight[b.priority];
    }).slice(0, 3),
    [tasks],
  );

  const completedTasks = tasks.filter((task) => task.done).length;
  const pendingTasks = tasks.length - completedTasks;
  const taskProgress = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;
  const dateLabel = currentDateLabel();
  const salutation = greeting();

  async function toggleTask(task: UiTask) {
    const previousTasks = tasks;
    setTasks(tasks.map((item) => item.id === task.id ? { ...item, done: !item.done } : item));

    try {
      await updateTaskStatus(task.id, !task.done);
    } catch (err) {
      setTasks(previousTasks);
      setTaskError(err instanceof Error ? err.message : "No fue posible actualizar la tarea");
    }
  }

  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-[#F7F8FA]">
      {/* Hero */}
      <div
        className="relative px-5 pt-2 pb-7 overflow-hidden"
        style={{ background: "linear-gradient(160deg, #101828 0%, #1D3461 100%)", borderRadius: "0 0 28px 28px" }}
      >
        <OrbitDecor className="absolute top-0 right-0" />
        <p className="text-[12px] text-[#94A3BF] font-medium relative z-10">{dateLabel}</p>
        <h2 className="text-[24px] font-extrabold text-white mt-0.5 relative z-10 leading-tight">{salutation}, {userName}</h2>

        {/* Day summary */}
        <div className="bg-white/[0.08] border border-white/10 rounded-2xl px-4 py-3 mt-4 relative z-10">
          <p className="text-[11px] text-[#64748B] font-semibold uppercase tracking-wider mb-2">Tu órbita de hoy</p>
          <div className="flex gap-4">
            {[
              { n: String(tasks.length), label: "tareas", color: "#FF6B4A" },
              { n: String(pendingTasks), label: "pendientes", color: "#F79009" },
              { n: String(completedTasks), label: "completadas", color: "#12B76A" },
              { n: String(priorityTasks.length), label: "prioritarias", color: "#7A5AF8" },
            ].map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-0.5">
                <span className="text-[20px] font-extrabold text-white leading-none">{item.n}</span>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: item.color }} />
                  <span className="text-[10px] text-[#94A3BF] font-medium">{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4 flex items-center gap-4 relative z-10">
          <ProgressRing value={taskProgress} size={66} stroke={5} color="#FF6B4A" trackColor="rgba(255,255,255,0.12)">
            <span className="text-[13px] font-bold text-white">{taskProgress}%</span>
          </ProgressRing>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[13px] font-semibold text-white">Progreso del día</p>
              <span className="text-[12px] text-[#94A3BF]">{completedTasks}/{tasks.length}</span>
            </div>
            <ProgressBar value={taskProgress} color="#FF6B4A" height={5} bg="rgba(255,255,255,0.12)" />
            <p className="text-[11px] text-[#64748B] mt-1">{completedTasks} de {tasks.length} tareas completadas</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-24 flex flex-col gap-5">
        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-2">
          <QuickAction icon={<IconPencil size={18} color="#FF6B4A" />} label="Tarea" bg="#FFF0EC" onClick={onFab} />
          <QuickAction icon={<IconCalendar size={18} color="#2E90FA" />} label="Evento" bg="#EFF8FF" onClick={onAgenda} />
          <QuickAction icon={<IconBell size={18} color="#F79009" />} label="Recordatorio" bg="#FFFAEB" />
          <QuickAction icon={<IconTarget size={18} color="#7A5AF8" />} label="Hábito" bg="#F4F3FF" />
        </div>

        {/* Empty setup states until their modules have user data */}
        <div className="flex gap-3">
          <Card className="flex-1" onClick={onAgenda}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#F4F3FF" }}>
                <IconCalendar size={16} color="#2E90FA" />
              </div>
            </div>
            <p className="text-[13px] font-bold text-[#172033] leading-snug">Planea tu semana</p>
            <p className="text-[11px] text-[#667085] mt-0.5">Agrega tu primer evento.</p>
          </Card>

          <Card className="flex-1" onClick={onHabits}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#EFF8FF" }}>
                <IconTarget size={16} color="#7A5AF8" />
              </div>
            </div>
            <p className="text-[13px] font-bold text-[#172033] leading-snug">Crea una rutina</p>
            <p className="text-[11px] text-[#667085] mt-0.5">Configura tu primer hábito.</p>
          </Card>
        </div>

        {/* Priority tasks */}
        <div>
          <SectionTitle label="Tareas prioritarias" action="Ver todas" onAction={onViewTasks} />
          <div className="flex flex-col gap-2">
            {taskError ? <p className="text-[12px] font-semibold text-[#B42318]">{taskError}</p> : priorityTasks.length === 0 ? (
              <p className="text-[13px] text-[#667085]">No hay tareas pendientes.</p>
            ) : priorityTasks.map((task) => {
              const overdue = isOverdue(task.rawDue);
              return (
                <div
                  key={task.id}
                  onClick={() => onTaskTap(task.id)}
                  className="bg-white rounded-2xl px-4 py-3 flex items-start gap-3 cursor-pointer active:scale-[0.985] transition-transform"
                  style={{ boxShadow: overdue ? "0 0 0 1.5px #FDA29B, 0 1px 4px rgba(16,24,40,0.07)" : "0 1px 4px rgba(16,24,40,0.07), 0 0 0 1px rgba(16,24,40,0.04)" }}
                >
                  <Checkbox checked={task.done} onChange={() => toggleTask(task)} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-[14px] font-semibold leading-snug ${task.done ? "line-through text-[#D0D5DD]" : "text-[#172033]"}`}>
                      {task.label}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <div className={`flex items-center gap-1 ${overdue ? "text-[#B42318] font-bold" : "text-[#94A3B8]"}`}>
                        <IconCalendar size={11} color={overdue ? "#B42318" : "#94A3B8"} strokeWidth={2} />
                        <span className="text-[11px]">{task.due}</span>
                      </div>
                      <CategoryBadge name={task.tag} color={categories.find((category) => category.name === task.tag)?.color} />
                    </div>
                  </div>
                  <div className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0" style={{ background: PRIORITY_COLOR[task.priority] }} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Habits */}
        <div>
          <SectionTitle label="Hábitos de hoy" action="Ver todos" onAction={onHabits} />
          <Card onClick={onHabits} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F4F3FF] flex items-center justify-center"><IconTarget size={19} color="#7A5AF8" /></div>
            <div className="flex-1"><p className="text-[14px] font-bold text-[#172033]">Todavía no hay hábitos</p><p className="mt-0.5 text-[12px] text-[#667085]">Crea uno pequeño para empezar a medir tu constancia.</p></div>
            <span className="text-[12px] font-bold text-[#7A5AF8]">Crear</span>
          </Card>
        </div>

        <Card>
          {profile?.program ? (
            <div>
              <div className="flex items-center justify-between mb-3"><p className="text-[14px] font-bold text-[#172033]">Resumen académico</p><Badge label={profile.semester || "Configurado"} color="night" /></div>
              <p className="text-[14px] font-semibold text-[#344054]">{profile.program}</p>
              <div className="mt-3 flex gap-4"><Metric label="Meta" value={profile.gradeTarget || "-"} color="#12B76A" /><Metric label="Código" value={profile.studentCode || "-"} color="#2E90FA" /></div>
            </div>
          ) : (
            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-[#EFF8FF] flex items-center justify-center"><IconGraduation size={19} color="#2E90FA" /></div><div className="flex-1"><p className="text-[14px] font-bold text-[#172033]">Crea tu resumen académico</p><p className="mt-0.5 text-[12px] text-[#667085]">Añade programa, semestre y una meta cuando quieras.</p></div><button onClick={onConfigureProfile} className="text-[12px] font-bold text-[#2E90FA]">Configurar</button></div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color: string }) {
  return <div><p className="text-[11px] font-semibold text-[#98A2B3]">{label}</p><p className="mt-0.5 text-[18px] font-extrabold" style={{ color }}>{value}</p></div>;
}
