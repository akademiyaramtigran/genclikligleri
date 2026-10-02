import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Base = { label: string; name: string; required?: boolean; hint?: string; className?: string };

export function TextField({ label, name, required, hint, className, defaultValue, type = "text", placeholder, ...rest }: Base & { defaultValue?: string | number | null; type?: string; placeholder?: string; min?: number | string; max?: number | string; step?: number | string; maxLength?: number; pattern?: string; autoComplete?: string }) {
  return (
    <div className={className}>
      <label className="label" htmlFor={name}>{label}{required && <span className="text-red-500"> *</span>}</label>
      <input id={name} name={name} type={type} required={required} defaultValue={defaultValue ?? ""} placeholder={placeholder} className="input" {...rest} />
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

export function TextArea({ label, name, required, hint, className, defaultValue, rows = 4, placeholder }: Base & { defaultValue?: string | null; rows?: number; placeholder?: string }) {
  return (
    <div className={className}>
      <label className="label" htmlFor={name}>{label}{required && <span className="text-red-500"> *</span>}</label>
      <textarea id={name} name={name} required={required} defaultValue={defaultValue ?? ""} rows={rows} placeholder={placeholder} className="input" />
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

export function SelectField({ label, name, required, hint, className, defaultValue, options, empty }: Base & { defaultValue?: string | null; options: { value: string; label: string }[] | Record<string, string>; empty?: string }) {
  const opts = Array.isArray(options) ? options : Object.entries(options).map(([value, label]) => ({ value, label }));
  return (
    <div className={className}>
      <label className="label" htmlFor={name}>{label}{required && <span className="text-red-500"> *</span>}</label>
      <select id={name} name={name} required={required} defaultValue={defaultValue ?? ""} className="input">
        {empty !== undefined && <option value="">{empty}</option>}
        {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

export function CheckField({ label, name, defaultChecked, hint, className }: { label: string; name: string; defaultChecked?: boolean; hint?: string; className?: string }) {
  return (
    <label className={cn("flex items-start gap-3 rounded-xl border border-basalt-200 p-3 text-sm", className)}>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 h-4 w-4 accent-dicle-600" />
      <span><span className="font-medium text-basalt-800">{label}</span>{hint && <span className="block text-xs text-basalt-500">{hint}</span>}</span>
    </label>
  );
}

export function FileField({ label, name, hint, current, className, accept = "image/*" }: { label: string; name: string; hint?: string; current?: string | null; className?: string; accept?: string }) {
  return (
    <div className={className}>
      <label className="label" htmlFor={name}>{label}</label>
      <div className="flex items-center gap-3">
        {current && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current} alt="" className="h-12 w-12 rounded-lg object-cover ring-1 ring-basalt-200" />
        )}
        <input id={name} name={name} type="file" accept={accept} className="block w-full text-sm text-basalt-600 file:mr-3 file:rounded-lg file:border-0 file:bg-basalt-100 file:px-3 file:py-2 file:text-sm file:font-semibold hover:file:bg-basalt-200" />
      </div>
      {current && <label className="mt-1 flex items-center gap-2 text-xs text-basalt-500"><input type="checkbox" name={`${name}_remove`} /> Mevcut görseli kaldır</label>}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

export function FormGrid({ children, cols = 2 }: { children: ReactNode; cols?: 2 | 3 | 4 }) {
  return <div className={cn("grid gap-4", cols === 2 && "sm:grid-cols-2", cols === 3 && "sm:grid-cols-3", cols === 4 && "sm:grid-cols-2 lg:grid-cols-4")}>{children}</div>;
}

export function Panel({ title, children, actions, className, description }: { title?: ReactNode; children: ReactNode; actions?: ReactNode; className?: string; description?: ReactNode }) {
  return (
    <section className={cn("card", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-basalt-100 px-5 py-4">
          <div>
            {title && <h2 className="font-semibold text-basalt-900">{title}</h2>}
            {description && <p className="text-xs text-basalt-500">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function AdminHeader({ title, description, actions, back }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {back && <a href={back.href} className="text-sm text-basalt-500 hover:text-basalt-900">← {back.label}</a>}
        <h1 className="mt-1 text-2xl font-bold text-basalt-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-basalt-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
