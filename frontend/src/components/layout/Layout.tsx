import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

// 主布局：左侧侧边栏 + 右侧内容区
function Layout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main
        style={{
          flex: 1,
          padding: 24,
          backgroundColor: "var(--bg-primary)",
          overflow: "auto",
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
