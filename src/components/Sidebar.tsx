"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  Trophy,
  FileSpreadsheet,
  Ticket,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cadastro", label: "Novo Cadastro", icon: UserPlus },
  { href: "/cadastros", label: "Cadastros", icon: Users },
  { href: "/cotas", label: "Cotas", icon: Ticket },
  { href: "/ranking", label: "Ranking", icon: Trophy },
  { href: "/exportar", label: "Exportar", icon: FileSpreadsheet },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 flex flex-col z-10">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-xl font-bold text-primary-700">Tax Summit 2026</h1>
        <p className="text-xs text-gray-500 mt-1">Gestão de Ingressos</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                isActive
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">
          150 ingressos disponíveis
        </p>
      </div>
    </aside>
  );
}
