import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck, Mail, Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existing = document.getElementById("google-identity-script");
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("script load failed")));
      return;
    }

    const script = document.createElement("script");
    script.id = "google-identity-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("script load failed"));
    document.head.appendChild(script);
  });
}

export default function Login() {
  const buttonRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [email, setEmail] = useState("");
  const [accessKey, setAccessKey] = useState("");
  const [remember, setRemember] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user, loading, loginWithGoogle, loginWithPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading || !user) return;
    const dest = location.state?.from?.pathname || "/dashboard";
    navigate(dest, { replace: true });
  }, [user, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setError("Google sign-in is not configured. Set VITE_GOOGLE_CLIENT_ID in the frontend .env.");
      return;
    }

    let cancelled = false;

    async function handleCredentialResponse(response) {
      setError("");
      try {
        await loginWithGoogle(response.credential);
      } catch {
        setError("Sign-in failed. Please try again.");
      }
    }

    loadGoogleScript()
      .then(() => {
        if (cancelled || !buttonRef.current) return;
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          width: 320,
        });
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load Google sign-in. Check your connection.");
      });

    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCredentialSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    setSubmitting(true);
    try {
      await loginWithPassword(email, accessKey);
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleForgottenKey(e) {
    e.preventDefault();
    setNotice("Access-key recovery isn't available yet. Contact your system administrator.");
  }

  return (
    <div className="auth-screen">
      <div className="auth-shell">
        <div className="auth-logo-badge">
          <ShieldCheck size={26} />
        </div>
        <h1 className="auth-app-name">BISQ</h1>
        <p className="auth-app-subtitle">BIS Compliance Platform</p>

        <div className="auth-card">
          <div className="auth-card-header">
            <strong>System Access</strong>
            <span>Sign in with Google, or enter your officer credentials</span>
          </div>

          <div className="auth-card-body">
            <div className="google-button-slot" ref={buttonRef} />
            {!ready && !error && <p className="auth-hint">Loading Google sign-in…</p>}

            <div className="auth-divider">
              <span>or</span>
            </div>

            <form onSubmit={handleCredentialSubmit}>
              <label className="field-label" htmlFor="login-email">
                Site email / ID (Admin / Officer)
              </label>
              <div className="input-icon-group">
                <Mail size={13} />
                <input
                  id="login-email"
                  className="field-input"
                  type="email"
                  placeholder="yourname@verifybis.gov"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="auth-row-between">
                <label className="field-label" htmlFor="login-key" style={{ marginBottom: 0 }}>
                  Access key
                </label>
                <button type="button" className="link-button" onClick={handleForgottenKey}>
                  Forgotten key?
                </button>
              </div>
              <div className="input-icon-group">
                <Lock size={13} />
                <input
                  id="login-key"
                  className="field-input"
                  type="password"
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value)}
                />
              </div>

              <label className="auth-checkbox-row">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Keep me signed in on this device
              </label>

              <button type="submit" className="primary-button auth-submit" disabled={submitting}>
                {submitting ? "Signing in…" : "Login"}
                <ArrowRight size={13} />
              </button>
            </form>

            {notice && <p className="auth-notice">{notice}</p>}
            {error && <p className="auth-error">{error}</p>}

            <p className="auth-switch">
              Don't have an account? <Link to="/register">Create one</Link>
            </p>
          </div>

          <div className="auth-trust-bar">
            <CheckCircle2 size={14} />
            <div>
              <strong>Secured government gateway</strong>
              <p>
                Admin access grants standards configuration rights. Officer access
                provides tender review and compliance logging.
              </p>
            </div>
          </div>
        </div>

        <div className="auth-footer-links">
          <span>Help Center</span>
          <span>Security Protocol</span>
          <span>Terms of Service</span>
        </div>
      </div>
    </div>
  );
}
