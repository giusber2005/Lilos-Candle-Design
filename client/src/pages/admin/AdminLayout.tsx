import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAdminAuth } from "@/lib/admin-auth";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  FileText,
  Settings,
  LogOut,
  Upload,
} from "lucide-react";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Prodotti", icon: Package },
  { href: "/admin/orders", label: "Ordini", icon: ShoppingBag },
  { href: "/admin/content", label: "Contenuti", icon: FileText },
  { href: "/admin/settings", label: "Impostazioni", icon: Settings },
  { href: "/admin/deploy", label: "Pubblica", icon: Upload },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { logout } = useAdminAuth();
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex bg-[#F5F2EE]">
      {/* Sidebar */}
      <aside className="w-56 bg-[#2C2826] text-[#C5BEB8] flex flex-col flex-shrink-0">
        <div className="px-6 py-6 border-b border-[#3C3835]">
          <p className="font-serif text-lg text-white">LilosCandle</p>
          <p className="text-xs text-[#6B6560] mt-0.5">Admin</p>
        </div>
        <nav className="flex-1 py-4">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <span
                className={`flex items-center gap-3 px-6 py-3 text-sm cursor-pointer transition-colors ${
                  location === href || location.startsWith(href)
                    ? "bg-[#3C3835] text-white"
                    : "hover:bg-[#3C3835] hover:text-white"
                }`}
              >
                <Icon size={16} />
                {label}
              </span>
            </Link>
          ))}
        </nav>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-6 py-4 text-sm border-t border-[#3C3835] hover:text-white transition-colors"
        >
          <LogOut size={16} />
          Esci
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
