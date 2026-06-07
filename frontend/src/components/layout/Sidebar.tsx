import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";

// 侧边栏导航项配置
const navItems = [
  { path: "/", label: "Dashboard", icon: "■" },
  { path: "/tracer", label: "Tracer", icon: "▶" },
  { path: "/evaluator", label: "Evaluator", icon: "☰" },
];

function Sidebar() {
  return (
    <aside
      style={{
        width: 220,
        minHeight: "100vh",
        backgroundColor: "var(--bg-secondary)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Logo 区域 */}
      <div
        style={{
          padding: "20px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 20, color: "var(--accent)" }}>&#x25C8;</span>
        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "0.5px",
          }}
        >
          AgentScope
        </span>
      </div>

      {/* 导航菜单 */}
      <nav style={{ flex: 1, padding: "12px 8px" }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            style={{ textDecoration: "none" }}
          >
            {({ isActive }) => (
              <motion.div
                whileHover={{ backgroundColor: "var(--bg-tertiary)" }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 6,
                  marginBottom: 4,
                  backgroundColor: isActive
                    ? "var(--accent)"
                    : "transparent",
                  color: isActive ? "#fff" : "var(--text-primary)",
                  cursor: "pointer",
                  transition: "background-color 0.15s",
                }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span style={{ fontSize: 14 }}>{item.label}</span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* 底部版本信息 */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--border)",
          fontSize: 12,
          color: "var(--text-secondary)",
        }}
      >
        v0.1.0
      </div>
    </aside>
  );
}

export default Sidebar;
