import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../components/shared";
import SubjectFormSheet from "../components/SubjectFormSheet";
import { fetchAcademicSummary, formatGrade, gradeStatus, type AcademicSummary, type SubjectStanding } from "../services/academicApi";
import { fetchSubjects, type Subject } from "../services/subjectsApi";

interface Props { onSubjectTap: (subject: Subject) => void; }

export default function UniversityScreen({ onSubjectTap }: Props) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [semester, setSemester] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [summary, setSummary] = useState<AcademicSummary | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      setSubjects(await fetchSubjects());
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible cargar las materias");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const semesters = useMemo(() => [...new Set(subjects.map((subject) => subject.semester))].sort().reverse(), [subjects]);
  // Sin elección (o si la elegida ya no existe) se muestra el semestre más reciente.
  const activeSemester = semester && semesters.includes(semester) ? semester : semesters[0] ?? null;
  const visible = useMemo(() => subjects.filter((subject) => subject.semester === activeSemester), [subjects, activeSemester]);
  const totalCredits = visible.reduce((sum, subject) => sum + subject.credits, 0);

  // El resumen es informativo: si falla, la lista de materias sigue funcionando sin cifras.
  const subjectsKey = visible.map((subject) => `${subject.id}:${subject.credits}`).join("|");
  useEffect(() => {
    if (!activeSemester || visible.length === 0) { setSummary(null); return; }
    let cancelled = false;
    fetchAcademicSummary(activeSemester).then((value) => { if (!cancelled) setSummary(value); }).catch(() => { if (!cancelled) setSummary(null); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSemester, subjectsKey]);

  const standingById = useMemo(() => new Map<string, SubjectStanding>((summary?.subjects ?? []).map((standing) => [standing.subjectId, standing])), [summary]);

  return (
    <div className="relative flex h-full flex-col bg-paper">
      <header className="flex-shrink-0 border-b border-line px-4 pt-5 pb-4 lg:px-8 lg:pt-8">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-display text-[34px] font-semibold leading-none tracking-tight text-ink lg:text-[44px]">Universidad</h1>
            <p className="mt-1.5 text-[14px] text-ink-2">{activeSemester ? `Semestre ${activeSemester}` : "Tus materias del semestre"}</p>
          </div>
          <button onClick={() => setCreating(true)} aria-label="Crear materia" className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md bg-coral text-[24px] font-semibold text-night">+</button>
        </div>

        {visible.length > 0 && (
          <>
          <dl className="mt-4 grid grid-cols-3 divide-x divide-line rounded-md border border-line bg-card lg:max-w-[560px]">
            <Stat label="Promedio" value={summary?.weightedAverage != null ? formatGrade(summary.weightedAverage) : "–"} sub="/5" />
            <Stat label="Meta" value={summary ? formatGrade(summary.targetGrade) : "–"} sub="/5" accent />
            <Stat label="Créditos" value={String(totalCredits)} />
          </dl>
          {summary && summary.atRisk.length > 0 && (
            <p className="mt-2 inline-flex items-center gap-2 rounded-[4px] bg-danger-wash px-2 py-1.5 text-[14px] font-semibold text-danger">
              <span aria-hidden="true" className="num">!</span>
              {summary.atRisk.length === 1 ? "1 materia en riesgo" : `${summary.atRisk.length} materias en riesgo`}
            </p>
          )}
          </>
        )}

        {semesters.length > 1 && (
          <div role="radiogroup" aria-label="Semestre" className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
            {semesters.map((option) => (
              <button key={option} type="button" role="radio" aria-checked={option === activeSemester} onClick={() => setSemester(option)} className={`num min-h-[40px] flex-shrink-0 rounded-md border px-3 text-[14px] font-semibold ${option === activeSemester ? "border-ink bg-wash text-ink" : "border-line text-ink-2"}`}>{option}</button>
            ))}
          </div>
        )}
      </header>

      <div className="no-scrollbar flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4 pb-6 lg:px-8">
        {error && (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-md border border-danger-line bg-danger-wash px-3 py-2">
            <p className="text-[14px] font-semibold text-danger">{error}</p>
            <button onClick={load} className="min-h-[44px] flex-shrink-0 px-2 text-[14px] font-semibold text-coral-ink">Reintentar</button>
          </div>
        )}

        {loading ? (
          <p className="text-[14px] text-ink-2">Cargando materias...</p>
        ) : visible.length === 0 && !error ? (
          <EmptyState title="Aún no tienes materias" sub="Agrega las materias del semestre para seguir tus evaluaciones y notas." action="Crear materia" onAction={() => setCreating(true)} />
        ) : (
          <>
            <h2 className="px-1 font-display text-[20px] font-semibold leading-none text-ink">Materias ({visible.length})</h2>
            <ul className="overflow-hidden rounded-md border border-line bg-card lg:max-w-[760px]">
              {visible.map((subject, index) => (
                <li key={subject.id} className={index > 0 ? "border-t border-line" : ""}>
                  <button onClick={() => onSubjectTap(subject)} className="flex min-h-[64px] w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-wash">
                    <span className="h-3 w-3 flex-shrink-0 rounded-[3px]" style={{ background: subject.color }} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[16px] font-semibold text-ink">{subject.name}</span>
                      <span className="num block text-[13px] text-ink-2">{subject.credits} {subject.credits === 1 ? "crédito" : "créditos"}{standingById.get(subject.id) ? ` · ${gradeStatus(standingById.get(subject.id)!.grades).short}` : ""}</span>
                    </span>
                    {standingById.get(subject.id) && (
                      <span className="flex flex-shrink-0 flex-col items-end gap-1">
                        <span className="num text-[26px] font-semibold leading-none text-ink">{standingById.get(subject.id)!.grades.currentGrade === null ? "–" : formatGrade(standingById.get(subject.id)!.grades.currentGrade as number)}</span>
                        {standingById.get(subject.id)!.atRisk && <span className="rounded-[3px] bg-danger-wash px-1.5 py-[3px] text-[12px] font-semibold leading-none text-danger">En riesgo</span>}
                      </span>
                    )}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-line-strong)" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <SubjectFormSheet
        open={creating}
        onClose={() => setCreating(false)}
        subject={null}
        knownSemesters={semesters}
        defaultSemester={activeSemester ?? undefined}
        onSaved={(saved) => { setSubjects((current) => [...current, saved]); setSemester(saved.semester); }}
      />
    </div>
  );
}

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="px-3 py-3">
      <dt className="text-[13px] font-medium text-ink-2">{label}</dt>
      <dd className="mt-1 flex items-baseline gap-0.5">
        <span className={`num text-[28px] font-semibold leading-none ${accent ? "text-coral-ink" : "text-ink"}`}>{value}</span>
        {sub && <span className="num text-[14px] text-ink-3">{sub}</span>}
      </dd>
    </div>
  );
}
