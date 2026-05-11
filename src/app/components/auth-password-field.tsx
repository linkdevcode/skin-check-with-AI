"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { authFieldClass } from "@/lib/auth-field-classes";
import { cn } from "@/lib/utils";

type AuthPasswordFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  wrapperClassName?: string;
};

export function AuthPasswordField({
  wrapperClassName,
  className,
  disabled,
  ...rest
}: AuthPasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={cn("relative mt-1", wrapperClassName)}>
      <input
        type={visible ? "text" : "password"}
        className={cn(authFieldClass, "pr-12", className)}
        disabled={disabled}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        disabled={disabled}
        className="sk-press-feedback absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-100 disabled:pointer-events-none disabled:opacity-40"
        aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        aria-pressed={visible}
      >
        {visible ? <EyeOff className="h-5 w-5" aria-hidden /> : <Eye className="h-5 w-5" aria-hidden />}
      </button>
    </div>
  );
}
