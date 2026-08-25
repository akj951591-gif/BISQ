import { useEffect, useState } from "react";
import { Search, Bell, Sun, Moon, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function getInitialTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function initials(name) {
  if (!name) return "PO";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export default function Topbar() {
  const [theme, setTheme] = useState(getInitialTheme);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="topbar">
      <div className="search">
        <Search size={13} />
        <input type="text" placeholder="Search standards or tenders..." />
      </div>

      <div className="user">
        <button
          className="theme-toggle"
          onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          aria-label="Toggle dark mode"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        <div className="notification">
          <Bell size={14} />
        </div>

        {user?.picture ? (
          <img className="avatar avatar-img" src={user.picture} alt={user.name} />
        ) : (
          <div className="avatar">{initials(user?.name)}</div>
        )}

        <div>
          <strong>{user?.name || "Procurement Officer"}</strong>
          <small>{user?.email || "Government Operations"}</small>
        </div>

        <button
          className="theme-toggle"
          onClick={handleLogout}
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut size={14} />
        </button>
      </div>
    </header>
  );
}