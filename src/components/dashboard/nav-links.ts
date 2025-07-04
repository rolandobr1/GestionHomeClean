
import {
  LayoutDashboard,
  FlaskConical,
  CircleDollarSign,
  FileCog,
  Users,
  ClipboardList,
  Scale,
} from "lucide-react";

export const navLinks = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    matcher: /^\/dashboard$/,
  },
  {
    href: "/dashboard/registros/ingresos",
    label: "Registros",
    icon: ClipboardList,
    matcher: /^\/dashboard\/registros/,
  },
  {
    href: "/dashboard/inventario/productos",
    label: "Inventario",
    icon: FlaskConical,
    matcher: /^\/dashboard\/inventario/,
  },
  {
    href: "/dashboard/contactos/clientes",
    label: "Contactos",
    icon: Users,
    matcher: /^\/dashboard\/contactos/,
  },
  {
    href: "/dashboard/cuentas/por-cobrar",
    label: "Cuentas",
    icon: CircleDollarSign,
    matcher: /^\/dashboard\/cuentas/,
  },
  {
    href: "/dashboard/balance",
    label: "Balance",
    icon: Scale,
    matcher: /^\/dashboard\/balance$/,
  },
  {
    href: "/dashboard/ajustes",
    label: "Ajustes",
    icon: FileCog,
    matcher: /^\/dashboard\/ajustes$/,
  },
];

    