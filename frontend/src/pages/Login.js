import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  features: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  featureItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    fontSize: 14,
    opacity: 0.9,
  },
  featureDot: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: "rgba(255,255,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  right: {
    width: 480,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 48px",
    background: "#fff",
  },
  form: {
    width: "100%",
    maxWidth: 380,
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 36,
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
    margin: "0 0 32px",
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
    marginBottom: 18,
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
    transition: "border-color 0.2s, background 0.2s",
  },
  inputIcon: {
    position: "absolute",
    left: 13,
    top: "50%",
    transform: "translateY(-50%)",
    color: "#aaa",
    pointerEvents: "none",
  },
  forgotRow: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: -10,
    marginBottom: 22,
  },
  forgot: {
    fontSize: 12,
    color: "#4f6ef7",
    textDecoration: "none",
    fontWeight: 600,
  },
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
    marginBottom: 20,
    transition: "opacity 0.2s",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    color: "#ccc",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 0.5,
  },
  line: { flex: 1, height: 1, background: "#eee" },
  btnGoogle: {
    width: "100%",
    padding: "12px",
    background: "#fff",
    color: "#333",
    border: "1.5px solid #e8e8e8",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    transition: "background 0.2s",
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
    marginTop: 28,
    fontSize: 13,
    color: "#999",
  },
  link: { color: "#4f6ef7", fontWeight: 700, textDecoration: "none" },
};

const GoogleSVG = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-9 20-20 0-1.3-.1-2.7-.4-4z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 10-1.9 13.7-5.1l-6.3-5.3C29.5 35.5 26.9 36 24 36c-5.2 0-9.6-2.9-11.3-7l-6.6 5.1C9.6 39.6 16.3 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.6l6.3 5.3C41 35.3 44 30 44 24c0-1.3-.1-2.7-.4-4z"/>
  </svg>
);

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    if (token) {
      localStorage.setItem("token", token);
      window.location.href = "/";
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    if (success) navigate("/");
    else setError("Invalid email or password. Please try again.");
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:5000/api/auth/google";
  };

  return (
    <div style={S.page}>
      {/* Left panel */}
      <div style={S.left}>
        <div style={S.leftBadge}>
          <span>✦</span> Task Manager Pro
        </div>
        <h2 style={S.leftTitle}>Organize your work,<br />amplify your focus.</h2>
        <p style={S.leftSub}>
          A smarter way to manage tasks, track progress, and collaborate with your team — all in one place.
        </p>
        <div style={S.features}>
          {[
            { icon: "📋", text: "Create and assign tasks in seconds" },
            { icon: "📊", text: "Track progress with visual dashboards" },
            { icon: "🔔", text: "Get real-time notifications & reminders" },
            { icon: "🤝", text: "Collaborate seamlessly with your team" },
          ].map((f, i) => (
            <div key={i} style={S.featureItem}>
              <div style={S.featureDot}>{f.icon}</div>
              <span>{f.text}</span>
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

          <h1 style={S.heading}>Sign in</h1>
          <p style={S.headingSub}>Welcome back! Enter your credentials to continue.</p>

          {error && (
            <div style={S.error}>
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label style={S.label}>Email address</label>
            <div style={S.inputWrap}>
              <span style={S.inputIcon}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/>
                </svg>
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

            <label style={S.label}>Password</label>
            <div style={{ ...S.inputWrap, marginBottom: 8 }}>
              <span style={S.inputIcon}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ ...S.input, paddingRight: 42 }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: "absolute", right: 12, top: "50%",
                  transform: "translateY(-50%)", background: "none",
                  border: "none", cursor: "pointer", color: "#aaa", padding: 0,
                }}
              >
                {showPass ? (
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>

            <div style={S.forgotRow}>
              <a href="/forgot-password" style={S.forgot}>Forgot password?</a>
            </div>

            <button type="submit" style={S.btnPrimary} disabled={loading}>
              {loading ? "Signing in…" : "Sign in →"}
            </button>
          </form>

          <div style={S.divider}>
            <span style={S.line} /> OR <span style={S.line} />
          </div>

          <button onClick={handleGoogleLogin} style={S.btnGoogle}>
            <GoogleSVG />
            Continue with Google
          </button>

          <p style={S.footer}>
            No account?{" "}
            <a href="/register" style={S.link}>Create one free →</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;