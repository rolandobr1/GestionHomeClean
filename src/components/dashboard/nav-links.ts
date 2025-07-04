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
  },
  {
    href: "/dashboard/registros/ingresos",
    label: "Registros",
    icon: ClipboardList,
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
    href: "/dashboard/balance",
    label: "Balance",
    icon: Scale,
  },
  {
    href: "/dashboard/ajustes",
    label: "Ajustes",
    icon: FileCog,
  },
];
