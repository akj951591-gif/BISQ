import {
  LayoutDashboard,
  FileText,
  ShieldCheck,
  ClipboardCheck,
  BarChart3,
  Settings,
  HelpCircle,
  Plus,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

const navigation = [
  { name: "Overview", path: "/dashboard", icon: LayoutDashboard },
  { name: "Tenders", path: "/tenders", icon: FileText },
  { name: "Compliance", path: "/compliance", icon: ClipboardCheck },
  { name: "BIS Standards", path: "/standards", icon: ShieldCheck },
  { name: "Reports", path: "/reports", icon: BarChart3 },
];

export default function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo">
          <ShieldCheck size={19} />
        </div>

        <div>
          <div className="brand-title">VerifyBIS</div>
          <div className="brand-subtitle">Enterprise Compliance</div>
        </div>
      </div>

      <button
        className="analyze-button"
        onClick={() => navigate("/tenders/new")}
      >
        <Plus size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
        Analyze New Tender
      </button>

      <nav>
        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            >
              <span>
                <Icon size={14} />
              </span>
              {item.name}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <span>
            <Settings size={14} />
          </span>
          Settings
        </NavLink>

        <div className="nav-item">
          <span>
            <HelpCircle size={14} />
          </span>
          Help
        </div>
      </div>
    </aside>
  );
}
