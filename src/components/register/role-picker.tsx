import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { RoleIcon } from "@/components/register/role-icon";
import { registerRoles } from "@/content/audiences";
import "./registration-experience.css";

export function RolePicker({ labelledBy }: { labelledBy: string }) {
  return (
    <ul aria-labelledby={labelledBy} className="registration-role-list">
      {registerRoles.map((role) => {
        const body = (
          <>
            <RoleIcon roleId={role.id} />
            <span className="flex min-w-0 flex-col gap-1">
              <span className="font-heading text-lg font-semibold leading-snug">{role.label}</span>
              <span className="text-sm leading-relaxed text-ink-muted">{role.detail}</span>
            </span>
            {role.href ? (
              <ArrowUpRight aria-hidden="true" className="ml-auto size-4 shrink-0 text-teal-600" />
            ) : (
              <ArrowRight aria-hidden="true" className="ml-auto size-4 shrink-0 text-teal-600" />
            )}
          </>
        );
        return (
          <li key={role.id} className={role.id === "resident" ? "sm:col-span-2" : undefined}>
            {role.href ? (
              <a href={role.href} data-role={role.id} className="registration-role-link">
                {body}
              </a>
            ) : (
              <Link
                to="/register/$role"
                params={{ role: role.id }}
                data-role={role.id}
                className="registration-role-link"
              >
                {body}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
