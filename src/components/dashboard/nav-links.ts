import {
  LayoutDashboard,
  FlaskConical,
  ArrowDownCircle,
  ArrowUpCircle,
  CircleDollarSign,
  FileCog,
  Users,
} from "lucide-react";

export const navLinks = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/ingresos",
    label: "Ingresos",
    icon: ArrowUpCircle,
  },
  {
    href: "/dashboard/egresos",
    label: "Egresos",
    icon: ArrowDownCircle,
  },
  {
    href: "/dashboard/inventario/productos",
    label: "Inventario",
    icon: FlaskConical,
  },
  {
    href: "/dashboard/contactos/clientes",
    label: "Contactos",
    icon: Users,
  },
  {
    href: "/dashboard/cuentas",
    label: "Cuentas",
    icon: CircleDollarSign,
  },
  {
    href: "/dashboard/ajustes",
    label: "Ajustes",
    icon: FileCog,
  },
];
