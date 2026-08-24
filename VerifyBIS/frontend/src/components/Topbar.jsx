import { useEffect, useState } from "react";
import { Search, Bell, Sun, Moon } from "lucide-react";

function getInitialTheme() {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function Topbar() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

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

        <div className="avatar">PO</div>

        <div>
          <strong>Procurement Officer</strong>
          <small>Government Operations</small>
        </div>
      </div>
    </header>
  );
}