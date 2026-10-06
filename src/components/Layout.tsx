import { NavLink, Outlet } from "react-router-dom";

const navItems = [
  { to: "/overview",     label: "Overview" },
  { to: "/subjects",     label: "Subjects" },
  { to: "/sessions",     label: "Sessions" },
  { to: "/error-grid",   label: "Error Grid" },
  { to: "/data-quality", label: "Data Quality" },
  { to: "/models",       label: "Models" },
];

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Research banner — always visible */}
      <div className="bg-amber/15 border-b border-amber/30 text-ink text-xs px-4 py-2 text-center">
        <span className="font-semibold text-[#8A5A00]">Research instrument.</span>{" "}
        Experimental estimates from optical measurements. Not a medical device,
        not clinically validated, not for any treatment or dosing decision.
      </div>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-60 bg-dark text-white hidden md:flex flex-col">
          <div className="px-5 pt-6 pb-4 border-b border-white/10">
            <div className="font-serif text-lg font-bold">Glucose Monitor</div>
            <div className="text-xs text-mint/80 tracking-wide uppercase mt-1">
              Research Dashboard
            </div>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-sm transition ${
                    isActive
                      ? "bg-teal/30 text-white font-semibold"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="px-5 py-4 text-[11px] text-white/40 border-t border-white/10">
            v0.1 · dev
          </div>
        </aside>

        {/* Mobile top nav */}
        <div className="md:hidden fixed top-9 left-0 right-0 bg-dark text-white z-10 px-3 py-2 overflow-x-auto flex gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `shrink-0 px-3 py-1.5 rounded-md text-xs ${
                  isActive ? "bg-teal/30 font-semibold" : "text-white/70"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Main */}
        <main className="flex-1 md:ml-0 pt-16 md:pt-0 overflow-x-hidden">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
