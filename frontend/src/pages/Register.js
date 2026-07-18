import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const S = {
  page: {
    minHeight: "100vh",
    display: "flex",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    background: "#f5f7ff",
  },
  left: {
    flex: 1,
    background: "linear-gradient(135deg, #4f6ef7 0%, #3a56d4 100%)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "60px 56px",
    color: "#fff",
  },
  leftBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    padding: "6px 14px",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 0.5,
    marginBottom: 40,
    width: "fit-content",
  },
  leftTitle: {
    fontSize: 38,
    fontWeight: 800,
    lineHeight: 1.2,
    margin: "0 0 16px",
  },
  leftSub: {
    fontSize: 15,
    opacity: 0.8,
    lineHeight: 1.7,
    margin: "0 0 48px",
    maxWidth: 340,
  },
  steps: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  step: {
    display: "flex",
    alignItems: "flex-start",
    gap: 14,
  },
  stepNum: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: "rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
    fontWeight: 700,
    flexShrink: 0,
  },
  stepText: {
    fontSize: 14,
    opacity: 0.9,
    lineHeight: 1.5,
  },
  stepLabel: {
    fontWeight: 700,
    display: "block",
    marginBottom: 2,
  },
  right: {
    width: 500,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 48px",
    background: "#fff",
    overflowY: "auto",
  },
  form: {
    width: "100%",
    maxWidth: 400,
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 32,
  },
  logoIcon: {
    width: 36,
    height: 36,
    background: "#4f6ef7",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 16,
    fontWeight: 700,
    color: "#111",
  },
  heading: {
    fontSize: 26,
    fontWeight: 800,
    color: "#111",
    margin: "0 0 6px",
  },
  headingSub: {
    fontSize: 14,
    color: "#888",
    margin: "0 0 28px",
  },
  row2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: "#333",
    marginBottom: 7,
  },
  inputWrap: {
    position: "relative",
    marginBottom: 16,
  },
  input: {
    width: "100%",
    padding: "12px 14px 12px 42px",
    fontSize: 14,
    border: "1.5px solid #e8e8e8",
    borderRadius: 10,
    outline: "none",
    boxSizing: "border-box",
    background: "#fafafa",
    color: "#111",
  },
  inputIcon: {
    position: "absolute",
    left: 13,
    top: "50%",
    transform: "translateY(-50%)",
    color: "#aaa",
    pointerEvents: "none",
  },
  eyeBtn: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#aaa",
    padding: 0,
  },
  strengthBar: {
    display: "flex",
    gap: 4,
    marginTop: -8,
    marginBottom: 16,
  },
  strengthSeg: (active, color) => ({
    flex: 1,
    height: 3,
    borderRadius: 2,
    background: active ? color : "#eee",
    transition: "background 0.3s",
  }),
  strengthLabel: (color) => ({
    fontSize: 11,
    color: color || "#bbb",
    marginTop: 4,
    fontWeight: 600,
  }),
  btnPrimary: {
    width: "100%",
    padding: "13px",
    background: "#4f6ef7",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: 0.2,
    marginTop: 4,
    marginBottom: 0,
  },
  error: {
    background: "#fff5f5",
    color: "#c62828",
    border: "1px solid #ffcdd2",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    marginBottom: 18,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  footer: {
    textAlign: "center",
    marginTop: 24,
    fontSize: 13,
    color: "#999",
  },
  link: { color: "#4f6ef7", fontWeight: 700, textDecoration: "none" },
  terms: {
    fontSize: 12,
    color: "#bbb",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 1.6,
  },
  termsLink: { color: "#4f6ef7", textDecoration: "none" },
};

const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path d={d} />
  </svg>
);

function getStrength(pwd) {
  if (!pwd) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { score: 1, label: "Weak", color: "#e53935" };
  if (score <= 2) return { score: 2, label: "Fair", color: "#fb8c00" };
  if (score <= 3) return { score: 3, label: "Good", color: "#fdd835" };
  if (score <= 4) return { score: 4, label: "Strong", color: "#43a047" };
  return { score: 5, label: "Very strong", color: "#00897b" };
}

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = getStrength(password);
  const passwordsMatch = confirmPassword && password === confirmPassword;
  const passwordsMismatch = confirmPassword && password !== confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) return setError("Passwords do not match.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true);
    const success = await register(name, email, password);
    setLoading(false);
    if (success) navigate("/login");
    else setError("Registration failed. This email may already be in use.");
  };

  return (
    <div style={S.page}>
      {/* Left panel */}
      <div style={S.left}>
        <div style={S.leftBadge}>✦ Task Manager Pro</div>
        <h2 style={S.leftTitle}>Start for free.<br />Achieve more.</h2>
        <p style={S.leftSub}>
          Join thousands of teams who use Task Manager to stay organized, hit deadlines, and do their best work.
        </p>
        <div style={S.steps}>
          {[
            { n: "01", label: "Create your account", desc: "Sign up in under 30 seconds — no credit card needed." },
            { n: "02", label: "Set up your workspace", desc: "Organize projects, invite teammates, and assign roles." },
            { n: "03", label: "Start managing tasks", desc: "Create tasks, set deadlines, and track everything in real time." },
          ].map((s) => (
            <div key={s.n} style={S.step}>
              <div style={S.stepNum}>{s.n}</div>
              <div style={S.stepText}>
                <span style={S.stepLabel}>{s.label}</span>
                {s.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={S.right}>
        <div style={S.form}>
          <div style={S.logoRow}>
            <div style={S.logoIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="7" height="7" rx="1.5" fill="#fff" opacity="0.95"/>
                <rect x="14" y="3" width="7" height="7" rx="1.5" fill="#fff" opacity="0.6"/>
                <rect x="3" y="14" width="7" height="7" rx="1.5" fill="#fff" opacity="0.6"/>
                <rect x="14" y="14" width="7" height="7" rx="1.5" fill="#fff" opacity="0.3"/>
              </svg>
            </div>
            <span style={S.logoText}>Task Manager</span>
          </div>

          <h1 style={S.heading}>Create account</h1>
          <p style={S.headingSub}>Fill in your details to get started for free.</p>

          {error && (
            <div style={S.error}>
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Name + Email row */}
            <div style={S.row2}>
              <div>
                <label style={S.label}>Full name</label>
                <div style={{ ...S.inputWrap, marginBottom: 0 }}>
                  <span style={S.inputIcon}>
                    <Icon d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    style={S.input}
                    required
                  />
                </div>
              </div>
              <div>
                <label style={S.label}>Email</label>
                <div style={{ ...S.inputWrap, marginBottom: 0 }}>
                  <span style={S.inputIcon}>
                    <Icon d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={S.input}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <label style={{ ...S.label, marginTop: 16 }}>Password</label>
            <div style={S.inputWrap}>
              <span style={S.inputIcon}>
                <Icon d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4" />
              </span>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                style={{ ...S.input, paddingRight: 42 }}
                required
              />
              <button type="button" style={S.eyeBtn} onClick={() => setShowPass(!showPass)}>
                <Icon d={showPass
                  ? "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"
                  : "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"}
                />
              </button>
            </div>

            {/* Strength bar */}
            {password.length > 0 && (
              <>
                <div style={S.strengthBar}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} style={S.strengthSeg(i <= strength.score, strength.color)} />
                  ))}
                </div>
                <div style={{ ...S.strengthLabel(strength.color), marginBottom: 16, marginTop: -4 }}>
                  {strength.label}
                </div>
              </>
            )}

            {/* Confirm password */}
            <label style={S.label}>Confirm password</label>
            <div style={S.inputWrap}>
              <span style={{
                ...S.inputIcon,
                color: passwordsMatch ? "#43a047" : passwordsMismatch ? "#e53935" : "#aaa"
              }}>
                <Icon d={passwordsMatch
                  ? "M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
                  : "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4"}
                />
              </span>
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                style={{
                  ...S.input,
                  paddingRight: 42,
                  borderColor: passwordsMatch ? "#43a047" : passwordsMismatch ? "#e53935" : "#e8e8e8",
                }}
                required
              />
              <button type="button" style={S.eyeBtn} onClick={() => setShowConfirm(!showConfirm)}>
                <Icon d={showConfirm
                  ? "M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22"
                  : "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"}
                />
              </button>
            </div>

            <button type="submit" style={S.btnPrimary} disabled={loading}>
              {loading ? "Creating account…" : "Create account →"}
            </button>
          </form>

          <p style={S.terms}>
            By registering, you agree to our{" "}
            <a href="/terms" style={S.termsLink}>Terms of Service</a> and{" "}
            <a href="/privacy" style={S.termsLink}>Privacy Policy</a>.
          </p>

          <p style={S.footer}>
            Already have an account?{" "}
            <a href="/login" style={S.link}>Sign in →</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;