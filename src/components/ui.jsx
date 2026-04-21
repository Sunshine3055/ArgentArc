import React from "react";
import { cn } from "../utils/helpers";

export function Card({ className = "", children }) {
  return <div className={cn("bg-white", className)}>{children}</div>;
}
export function CardHeader({ className = "", children }) {
  return <div className={cn("p-6", className)}>{children}</div>;
}
export function CardContent({ className = "", children }) {
  return <div className={cn("p-6 pt-0", className)}>{children}</div>;
}
export function CardTitle({ className = "", children }) {
  return <h3 className={cn("text-xl font-semibold text-slate-900", className)}>{children}</h3>;
}
export function CardDescription({ className = "", children }) {
  return <p className={cn("mt-1 text-sm text-slate-500", className)}>{children}</p>;
}
export function Button({ className = "", variant = "default", size = "default", children, ...props }) {
  const variantClasses = {
    default: "bg-[#1f4fa3] text-white hover:bg-[#173d82] border-transparent",
    outline: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
    secondary: "bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200",
    ghost: "bg-transparent text-slate-700 border-transparent hover:bg-slate-100",
  };
  const sizeClasses = {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-9 px-3 py-2 text-sm",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl transition disabled:opacity-50",
        variantClasses[variant] || variantClasses.default,
        sizeClasses[size] || sizeClasses.default,
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
export function Input({ className = "", ...props }) {
  return <input className={cn("w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#1f4fa3]", className)} {...props} />;
}
export function Textarea({ className = "", ...props }) {
  return <textarea className={cn("w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-[#1f4fa3]", className)} {...props} />;
}
export function Badge({ className = "", children }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", className)}>{children}</span>;
}
export function Label({ className = "", children, ...props }) {
  return <label className={cn("text-sm font-medium text-slate-700", className)} {...props}>{children}</label>;
}
export function Separator({ className = "" }) {
  return <div className={cn("h-px w-full bg-slate-200", className)} />;
}
export function ScrollArea({ className = "", children }) {
  return <div className={cn("overflow-auto", className)}>{children}</div>;
}
export function Checkbox({ checked, onCheckedChange, className = "" }) {
  return <input type="checkbox" checked={!!checked} onChange={() => onCheckedChange?.(!checked)} className={cn("h-4 w-4 rounded border-slate-300 accent-[#1f4fa3]", className)} />;
}
export function Select({ value, onValueChange, children }) {
  const options = [];
  React.Children.forEach(children, (child) => {
    if (!child) return;
    if (child.type === SelectContent) {
      React.Children.forEach(child.props.children, (grandchild) => {
        if (grandchild && grandchild.type === SelectItem) {
          options.push({ value: grandchild.props.value, label: grandchild.props.children });
        }
      });
    }
  });
  return (
    <select value={value} onChange={(e) => onValueChange?.(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1f4fa3]">
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  );
}
export function SelectContent({ children }) {
  return <>{children}</>;
}
export function SelectItem() {
  return null;
}
export function Dialog({ open, children }) {
  if (!open) return null;
  return <>{children}</>;
}
export function DialogContent({ className = "", children }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 overflow-auto"><div className={cn("w-full bg-white shadow-xl", className)}>{children}</div></div>;
}
export function DialogHeader({ className = "", children }) {
  return <div className={cn("p-6 pb-0", className)}>{children}</div>;
}
export function DialogTitle({ className = "", children }) {
  return <h3 className={cn("text-lg font-semibold text-slate-900", className)}>{children}</h3>;
}
export function DialogFooter({ className = "", children }) {
  return <div className={cn("flex justify-end gap-3 p-6 pt-4", className)}>{children}</div>;
}
