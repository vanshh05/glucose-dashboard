import { NavLink, Outlet, useNavigate } from "react-router-dom";

/**
 * MeLayout — patient-side shell. Bottom-tab navigation (mobile-first), fixed
 * research banner, and a tiny top bar with the subject identity and a
 * "research instrument" chip. Looks like a consumer glucose app; behaves
 * like a research prototype.
 */

const tabs = [
  { to: "/me",         label: "Home",     icon: "home" },
  { to: "/me/history", label: "History",  icon: "chart" },
  { to: "/me/capture", label: "Measure",  icon: "plus", primary: true },
  { to: "/me/about",   label: "About",    icon: "info" },
];

export default function MeLayout() {
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-[#F7FAFA] flex flex-col max-w-md mx-auto border-x border-[#E3EBEB]">
      {/* Research banner — slim but always visible */}
      <div className="bg-amber/15 text-[#8A5A00] text-[11px] px-3 py-1.5 text-center font-medium border-b border-amber/30">
        Research instrument · not for dosing decisions
      </div>

      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#E3EBEB]">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-mute">Subject</div>
          <div className="font-serif text-base font-bold text-ink">S007</div>
        </div>
        <button
          onClick={() => nav("/me/about")}
          className="text-[11px] px-2.5 py-1 rounded-full border border-teal/40 text-teal font-semibold hover:bg-teal/5"
        >
          Research · v0
        </button>
      </header>

      {/* Scrollable body */}
      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-[#E3EBEB] grid grid-cols-4 px-2 pt-1.5 pb-2 z-20">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === "/me"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-1.5 rounded-lg text-[10px] font-semibold ${
                t.primary
                  ? "text-white"
                  : isActive
                    ? "text-teal"
                    : "text-mute"
              }`
            }
          >
            {t.primary ? (
              <span className="w-10 h-10 -mt-5 bg-teal rounded-full flex items-center justify-center shadow-lg ring-4 ring-white">
                <Icon name={t.icon} size={18} color="white" />
              </span>
            ) : (
              <Icon name={t.icon} size={20} />
            )}
            <span className={t.primary ? "mt-0.5" : ""}>{t.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

/** Minimal inline icon set — no external deps. */
function Icon({ name, size = 20, color = "currentColor" }: { name: string; size?: number; color?: string }) {
  const s = size;
  const common = { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "home":  return <svg {...common}><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>;
    case "chart": return <svg {...common}><path d="M3 20h18"/><path d="M6 16l4-6 4 4 5-9"/></svg>;
    case "plus":  return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
    case "info":  return <svg {...common}><circle cx="12" cy="12" r="9"/><path d="M12 8v0M12 11v5"/></svg>;
    default:      return null;
  }
}
