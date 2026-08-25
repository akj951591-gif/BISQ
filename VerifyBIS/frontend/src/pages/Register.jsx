import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck, User, Mail, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user, loading, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading || !user) return;
    const dest = location.state?.from?.pathname || "/dashboard";
    navigate(dest, { replace: true });
  }, [user, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Access key must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Access keys don't match.");
      return;
    }

    setSubmitting(true);
    try {
      await register(name, email, password);
    } catch (err) {
      setError(err.message || "Couldn't create the account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-shell">
        <div className="auth-logo-badge">
          <ShieldCheck size={26} />
        </div>
        <h1 className="auth-app-name">VerifyBIS</h1>
        <p className="auth-app-subtitle">BIS Compliance Platform</p>

        <div className="auth-card">
          <div className="auth-card-header">
            <strong>Create Account</strong>
            <span>Register for officer access to the compliance workspace</span>
          </div>

          <div className="auth-card-body">
            <form onSubmit={handleSubmit}>
              <label className="field-label" htmlFor="register-name">
                Full name
              </label>
              <div className="input-icon-group">
                <User size={13} />
                <input
                  id="register-name"
                  className="field-input"
                  type="text"
                  placeholder="Jane Doe"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <label className="field-label" htmlFor="register-email">
                Site email / ID
              </label>
              <div className="input-icon-group">
                <Mail size={13} />
                <input
                  id="register-email"
                  className="field-input"
                  type="email"
                  placeholder="yourname@verifybis.gov"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <label className="field-label" htmlFor="register-password">
                Access key
              </label>
              <div className="input-icon-group">
                <Lock size={13} />
                <input
                  id="register-password"
                  className="field-input"
                  type="password"
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <label className="field-label" htmlFor="register-confirm">
                Confirm access key
              </label>
              <div className="input-icon-group">
                <Lock size={13} />
                <input
                  id="register-confirm"
                  className="field-input"
                  type="password"
                  placeholder="Re-enter access key"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="primary-button auth-submit" disabled={submitting}>
                {submitting ? "Creating account…" : "Create Account"}
                <ArrowRight size={13} />
              </button>
            </form>

            {error && <p className="auth-error">{error}</p>}

            <p className="auth-switch">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
