import { Link, useLocation } from "wouter";
import { 
  Calculator, 
  Settings, 
  History, 
  Menu, 
  LayoutDashboard,
  WalletCards,
  Users,
  LogOut,
  ChevronDown,
  Shield,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LayoutProps {
  children: React.ReactNode;
}

const operatorNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/simulator", label: "Simulador", icon: Calculator },
  { href: "/history", label: "Histórico", icon: History },
];

const adminNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/simulator", label: "Simulador", icon: Calculator },
  { href: "/history", label: "Histórico", icon: History },
  { href: "/settings", label: "Configurações", icon: Settings },
  { href: "/users", label: "Usuários", icon: Users },
];

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAdmin, logout } = useAuth();

  const navItems = isAdmin ? adminNavItems : operatorNavItems;

  const handleLogout = async () => {
    await logout();
  };

  const NavContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <WalletCards className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold font-display tracking-tight">Antecipa<span className="text-emerald-400">Net</span></h1>
          <p className="text-xs text-slate-400">Gestão de Recebíveis</p>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group",
              isActive 
                ? "bg-emerald-500/10 text-emerald-400 shadow-sm border border-emerald-500/20" 
                : "text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            )}>
              <item.icon className={cn(
                "w-5 h-5 transition-colors",
                isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-white"
              )} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-3">
        <div className="bg-slate-800 rounded-lg p-3">
          <p className="text-xs text-slate-400 mb-1">Status do Sistema</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-medium text-white">Operacional</span>
          </div>
        </div>

        {/* User info + logout */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              data-testid="button-user-menu"
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-left"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isAdmin ? "bg-emerald-500/20" : "bg-slate-700"}`}>
                {isAdmin
                  ? <Shield className="w-4 h-4 text-emerald-400" />
                  : <User className="w-4 h-4 text-slate-400" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate" data-testid="text-current-user">{user?.name}</p>
                <p className="text-xs text-slate-400">{isAdmin ? "Administrador" : "Operador"}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-500 flex-shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="w-52">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-slate-500">@{user?.username}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              data-testid="button-logout"
              onClick={handleLogout}
              className="text-red-600 cursor-pointer focus:text-red-600"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair do sistema
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 fixed inset-y-0 left-0 z-50">
        <NavContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden fixed top-4 left-4 z-50">
            <Menu className="w-6 h-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64 border-r-slate-800">
          <NavContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
