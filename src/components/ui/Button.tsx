import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "graphite" | "outline" | "ghost" | "subtle";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    const isDisabled = Boolean(disabled || isLoading);

    const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
      primary:
        "bg-[#F28C28] text-[#1B1E22] font-semibold hover:bg-[#DF7B18] active:bg-[#C96C10] shadow-xs border border-[#DF7B18]/40",
      graphite:
        "bg-[#24272B] text-[#F7F4EE] font-semibold hover:bg-[#32363C] active:bg-[#191B1E] shadow-xs border border-[#24272B]",
      outline:
        "bg-white text-[#24272B] font-medium border border-[#D5CEC2] hover:border-[#24272B] hover:bg-[#F7F4EE]/70 active:bg-[#EFEAE1]",
      subtle:
        "bg-[#EFEAE1] text-[#24272B] font-medium hover:bg-[#E4DDD2] active:bg-[#D8CFC1] border border-transparent",
      ghost:
        "bg-transparent text-[#24272B] font-medium hover:bg-[#EFEAE1]/80 active:bg-[#E4DDD2]",
    };

    const sizeStyles: Record<NonNullable<ButtonProps["size"]>, string> = {
      sm: "h-9 px-3.5 text-xs rounded-lg gap-1.5",
      md: "h-11 px-4.5 text-sm rounded-xl gap-2",
      lg: "h-12 px-6 text-base rounded-xl gap-2.5",
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={isLoading}
        className={cn(
          "inline-flex items-center justify-center transition-colors duration-150 cursor-pointer select-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F28C28] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7F4EE]",
          "disabled:opacity-55 disabled:pointer-events-none disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
