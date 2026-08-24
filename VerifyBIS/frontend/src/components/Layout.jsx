import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Topbar from "./Topbar.jsx";

export default function Layout() {
  return (
    <div className="app">
      <Sidebar />

      <section className="main">
        <Topbar />

        <main className="content">
          <Outlet />
        </main>
      </section>
    </div>
  );
}
