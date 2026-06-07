import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const C = {
  blue:   "#4f6ef7",
  green:  "#22c55e",
  amber:  "#f59e0b",
  red:    "#ef4444",
  cyan:   "#06b6d4",
  bg:     "#f5f7ff",
  white:  "#ffffff",
  text:   "#111827",
  muted:  "#6b7280",
  border: "#e8e8e8",
};

const priority = {
  urgent: { color: C.red,   label: "Urgent",  dot: "#ef4444" },
  high:   { color: "#f97316", label: "Haute",  dot: "#f97316" },
  medium: { color: C.amber, label: "Moyenne", dot: "#f59e0b" },
  low:    { color: C.green, label: "Basse",   dot: "#22c55e" },
};

const statusMap = {
  pending:     { label: "En attente", color: C.muted  },
  in_progress: { label: "En cours",   color: C.cyan   },
  completed:   { label: "Terminé",    color: C.green  },
};

const S = {
  page: { minHeight: "100vh", background: C.bg, fontFamily: "'Segoe UI', system-ui, sans-serif" },

  // Header
  header: {
    background: C.white, borderBottom: `1px solid ${C.border}`,
    padding: "0 2rem", height: 64, display: "flex", alignItems: "center",
    position: "sticky", top: 0, zIndex: 100,
  },
  headerInner: { maxWidth: 1300, margin: "0 auto", width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" },
  logoRow: { display: "flex", alignItems: "center", gap: 10 },
  logoIcon: { width: 32, height: 32, background: C.blue, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" },
  logoText: { fontSize: 17, fontWeight: 800, color: C.text, letterSpacing: -0.3 },
  userChip: { display: "flex", alignItems: "center", gap: 12 },
  avatar: { width: 36, height: 36, borderRadius: "50%", background: C.blue, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14 },
  userName: { fontSize: 14, fontWeight: 600, color: C.text },
  userEmail: { fontSize: 12, color: C.muted },
  btnLogout: { padding: "8px 16px", background: "#fff", color: C.red, border: `1.5px solid ${C.red}`, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" },

  // Main
  main: { maxWidth: 1300, margin: "0 auto", padding: "2rem" },

  // Stat cards
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 },
  statCard: (accent) => ({
    background: C.white, borderRadius: 12, padding: "20px 22px",
    borderTop: `3px solid ${accent}`, display: "flex", flexDirection: "column", gap: 6,
  }),
  statLabel: { fontSize: 12, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 },
  statValue: (color) => ({ fontSize: 30, fontWeight: 800, color, lineHeight: 1 }),
  statSub: { fontSize: 12, color: C.muted },

  // Progress
  progressCard: { background: C.white, borderRadius: 12, padding: "20px 24px", marginBottom: 24 },
  progressHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  progressLabel: { fontSize: 14, fontWeight: 600, color: C.text },
  progressPct: { fontSize: 14, fontWeight: 700, color: C.green },
  progressTrack: { height: 8, background: "#e5e7eb", borderRadius: 4, overflow: "hidden" },
  progressFill: (w) => ({ height: "100%", width: `${w}%`, background: C.green, borderRadius: 4, transition: "width 0.4s" }),

  // Toolbar
  toolbar: {
    background: C.white, borderRadius: 12, padding: "14px 20px",
    display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center",
    marginBottom: 24, justifyContent: "space-between",
  },
  toolbarLeft: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" },
  filterLabel: { fontSize: 13, fontWeight: 600, color: C.muted },
  select: {
    padding: "8px 12px", borderRadius: 8, border: `1.5px solid ${C.border}`,
    fontSize: 13, color: C.text, background: C.bg, cursor: "pointer", outline: "none",
  },
  btnReset: { padding: "8px 14px", background: C.bg, color: C.muted, border: `1.5px solid ${C.border}`, borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 600 },
  btnNew: {
    padding: "9px 20px", background: C.blue, color: "#fff",
    border: "none", borderRadius: 8, fontSize: 14, fontWeight: 700,
    cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
  },

  // Form card
  formCard: { background: C.white, borderRadius: 12, padding: "24px", marginBottom: 24 },
  formTitle: { fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16, margin: "0 0 16px" },
  formInput: {
    width: "100%", padding: "11px 14px", borderRadius: 9, border: `1.5px solid ${C.border}`,
    fontSize: 14, color: C.text, background: "#fafafa", boxSizing: "border-box", outline: "none",
    marginBottom: 12,
  },
  formRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 },
  formBtns: { display: "flex", gap: 10, marginTop: 4 },
  btnCreate: { flex: 1, padding: "11px", background: C.blue, color: "#fff", border: "none", borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: "pointer" },
  btnCancel: { flex: 1, padding: "11px", background: C.bg, color: C.muted, border: `1.5px solid ${C.border}`, borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: "pointer" },

  // Tasks
  sectionHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: 800, color: C.text, margin: 0 },
  taskCount: { fontSize: 13, color: C.muted, fontWeight: 600 },
  taskList: { display: "flex", flexDirection: "column", gap: 10 },
  taskCard: {
    background: C.white, borderRadius: 12, padding: "16px 20px",
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    gap: 16, flexWrap: "wrap",
  },
  taskLeft: { flex: 1, minWidth: 200 },
  taskTitleRow: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 },
  taskTitle: { fontSize: 15, fontWeight: 700, color: C.text },
  badge: (bg) => ({
    fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
    background: bg + "20", color: bg, letterSpacing: 0.3,
  }),
  taskDesc: { fontSize: 13, color: C.muted, lineHeight: 1.6, margin: "0 0 8px" },
  taskDate: { fontSize: 11, color: "#9ca3af" },
  taskRight: { display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" },
  taskSelect: {
    padding: "7px 11px", borderRadius: 8, border: `1.5px solid ${C.border}`,
    fontSize: 12, color: C.text, background: C.bg, cursor: "pointer", outline: "none",
  },
  btnDelete: {
    padding: "7px 14px", background: "#fff5f5", color: C.red,
    border: `1.5px solid #fecaca`, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
  },
  emptyState: {
    background: C.white, borderRadius: 12, padding: "60px 20px",
    textAlign: "center", color: C.muted, fontSize: 14,
  },

  // Loading
  loading: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", flexDirection: "column", gap: 12, color: C.muted, fontSize: 14 },
};

const LogoSVG = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="3" width="7" height="7" rx="1.5" fill="#fff" opacity="0.95"/>
    <rect x="14" y="3" width="7" height="7" rx="1.5" fill="#fff" opacity="0.6"/>
    <rect x="3" y="14" width="7" height="7" rx="1.5" fill="#fff" opacity="0.6"/>
    <rect x="14" y="14" width="7" height="7" rx="1.5" fill="#fff" opacity="0.3"/>
  </svg>
);

function PriorityDot({ p }) {
  return <span style={{ width: 8, height: 8, borderRadius: "50%", background: priority[p]?.dot || C.muted, display: "inline-block" }} />;
}

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "medium" });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("token", token);
      navigate("/dashboard", { replace: true });
      window.location.reload();
      return;
    }
    const storedToken = localStorage.getItem("token");
    if (!storedToken) { navigate("/login"); return; }
    if (user) fetchTasks();
  }, [location, user, navigate]);

  const fetchTasks = async () => {
    try {
      const res = await api.get("/tasks");
      setTasks(res.data);
    } catch (err) {
      if (err.response?.status === 401) { localStorage.removeItem("token"); navigate("/login"); }
    } finally { setLoading(false); }
  };

  const createTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    try {
      await api.post("/tasks", newTask);
      setNewTask({ title: "", description: "", priority: "medium" });
      setShowForm(false);
      fetchTasks();
    } catch {}
  };

  const updateStatus   = async (id, status)   => { try { await api.put(`/tasks/${id}`, { status });   fetchTasks(); } catch {} };
  const updatePriority = async (id, prio)      => { try { await api.put(`/tasks/${id}`, { priority: prio }); fetchTasks(); } catch {} };
  const deleteTask     = async (id) => {
    if (!window.confirm("Supprimer cette tâche ?")) return;
    try { await api.delete(`/tasks/${id}`); fetchTasks(); } catch {}
  };

  const filtered = tasks.filter(t =>
    (filterStatus === "all"   || t.status   === filterStatus) &&
    (filterPriority === "all" || t.priority === filterPriority)
  );

  const stats = {
    total:      tasks.length,
    completed:  tasks.filter(t => t.status === "completed").length,
    inProgress: tasks.filter(t => t.status === "in_progress").length,
    pending:    tasks.filter(t => t.status === "pending").length,
    urgent:     tasks.filter(t => t.priority === "urgent").length,
  };
  const rate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  const initials = user?.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "U";

  if (loading) return (
    <div style={S.loading}>
      <div style={{ width: 36, height: 36, border: `3px solid ${C.border}`, borderTopColor: C.blue, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      Chargement…
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );

  return (
    <div style={S.page}>
      {/* ── Header ── */}
      <header style={S.header}>
        <div style={S.headerInner}>
          <div style={S.logoRow}>
            <div style={S.logoIcon}><LogoSVG /></div>
            <span style={S.logoText}>Task Manager</span>
          </div>
          <div style={S.userChip}>
            <div style={S.avatar}>{initials}</div>
            <div>
              <div style={S.userName}>{user?.name}</div>
              <div style={S.userEmail}>{user?.email}</div>
            </div>
            <button style={S.btnLogout} onClick={() => { logout(); navigate("/login"); }}>
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main style={S.main}>
        {/* ── Stats ── */}
        <div style={S.statsGrid}>
          {[
            { label: "Total tâches",  value: stats.total,      accent: C.blue,  sub: "toutes catégories" },
            { label: "Terminées",     value: stats.completed,  accent: C.green, sub: `${rate}% du total` },
            { label: "En cours",      value: stats.inProgress, accent: C.cyan,  sub: "en progression" },
            { label: "En attente",    value: stats.pending,    accent: C.amber, sub: "à démarrer" },
            { label: "Urgentes",      value: stats.urgent,     accent: C.red,   sub: "priorité critique" },
          ].map((s) => (
            <div key={s.label} style={S.statCard(s.accent)}>
              <div style={S.statLabel}>{s.label}</div>
              <div style={S.statValue(s.accent)}>{s.value}</div>
              <div style={S.statSub}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Progress ── */}
        <div style={S.progressCard}>
          <div style={S.progressHeader}>
            <span style={S.progressLabel}>Progression globale</span>
            <span style={S.progressPct}>{rate}% complété</span>
          </div>
          <div style={S.progressTrack}>
            <div style={S.progressFill(rate)} />
          </div>
          <div style={{ display: "flex", gap: 20, marginTop: 12, flexWrap: "wrap" }}>
            {[
              { label: "Terminées", val: stats.completed, color: C.green },
              { label: "En cours",  val: stats.inProgress, color: C.cyan },
              { label: "En attente",val: stats.pending,    color: C.amber },
            ].map(x => (
              <div key={x.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.muted }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: x.color, display: "inline-block" }} />
                {x.label}: <strong style={{ color: C.text }}>{x.val}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* ── Toolbar ── */}
        <div style={S.toolbar}>
          <div style={S.toolbarLeft}>
            <span style={S.filterLabel}>Filtrer :</span>
            <select style={S.select} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Terminé</option>
            </select>
            <select style={S.select} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <option value="all">Toutes priorités</option>
              <option value="urgent">Urgent</option>
              <option value="high">Haute</option>
              <option value="medium">Moyenne</option>
              <option value="low">Basse</option>
            </select>
            {(filterStatus !== "all" || filterPriority !== "all") && (
              <button style={S.btnReset} onClick={() => { setFilterStatus("all"); setFilterPriority("all"); }}>
                Réinitialiser
              </button>
            )}
          </div>
          <button style={S.btnNew} onClick={() => setShowForm(!showForm)}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>{showForm ? "×" : "+"}</span>
            {showForm ? "Fermer" : "Nouvelle tâche"}
          </button>
        </div>

        {/* ── Form ── */}
        {showForm && (
          <div style={S.formCard}>
            <h3 style={S.formTitle}>Créer une nouvelle tâche</h3>
            <form onSubmit={createTask}>
              <input
                style={S.formInput}
                type="text"
                placeholder="Titre de la tâche *"
                value={newTask.title}
                onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                required
              />
              <textarea
                style={{ ...S.formInput, minHeight: 90, resize: "vertical" }}
                placeholder="Description (optionnelle)"
                value={newTask.description}
                onChange={e => setNewTask({ ...newTask, description: e.target.value })}
              />
              <div style={S.formRow}>
                <select
                  style={S.formInput}
                  value={newTask.priority}
                  onChange={e => setNewTask({ ...newTask, priority: e.target.value })}
                >
                  <option value="low">Basse priorité</option>
                  <option value="medium">Moyenne priorité</option>
                  <option value="high">Haute priorité</option>
                  <option value="urgent">Urgent</option>
                </select>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.muted, paddingLeft: 4 }}>
                  <PriorityDot p={newTask.priority} />
                  Priorité : <strong style={{ color: priority[newTask.priority]?.dot }}>{priority[newTask.priority]?.label}</strong>
                </div>
              </div>
              <div style={S.formBtns}>
                <button type="submit" style={S.btnCreate}>Créer la tâche →</button>
                <button type="button" style={S.btnCancel} onClick={() => setShowForm(false)}>Annuler</button>
              </div>
            </form>
          </div>
        )}

        {/* ── Task list ── */}
        <div style={S.sectionHeader}>
          <h2 style={S.sectionTitle}>Mes tâches</h2>
          <span style={S.taskCount}>{filtered.length} tâche{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {filtered.length === 0 ? (
          <div style={S.emptyState}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Aucune tâche trouvée</div>
            <div style={{ fontSize: 12 }}>Ajustez les filtres ou créez une nouvelle tâche.</div>
          </div>
        ) : (
          <div style={S.taskList}>
            {filtered.map(task => {
              const st = statusMap[task.status] || statusMap.pending;
              const pr = priority[task.priority] || priority.medium;
              return (
                <div key={task.id} style={S.taskCard}>
                  <div style={S.taskLeft}>
                    <div style={S.taskTitleRow}>
                      <PriorityDot p={task.priority} />
                      <span style={S.taskTitle}>{task.title}</span>
                      <span style={S.badge(pr.color)}>{pr.label}</span>
                      <span style={S.badge(st.color)}>{st.label}</span>
                    </div>
                    {task.description && <p style={S.taskDesc}>{task.description}</p>}
                    <div style={S.taskDate}>
                      Créée le {new Date(task.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                  </div>
                  <div style={S.taskRight}>
                    <select style={S.taskSelect} value={task.status} onChange={e => updateStatus(task.id, e.target.value)}>
                      <option value="pending">En attente</option>
                      <option value="in_progress">En cours</option>
                      <option value="completed">Terminé</option>
                    </select>
                    <select style={S.taskSelect} value={task.priority} onChange={e => updatePriority(task.id, e.target.value)}>
                      <option value="low">Basse</option>
                      <option value="medium">Moyenne</option>
                      <option value="high">Haute</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    <button style={S.btnDelete} onClick={() => deleteTask(task.id)}>Supprimer</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;