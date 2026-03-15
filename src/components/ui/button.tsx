"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

const Button = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & {
        variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
        size?: "default" | "sm" | "lg" | "icon";
    }
>(({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
        <button
            className={cn(
                "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
                {
                    "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg":
                        variant === "default",
                    "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md":
                        variant === "destructive",
                    "border border-input bg-background hover:bg-muted hover:text-foreground":
                        variant === "outline",
                    "bg-secondary text-secondary-foreground hover:bg-secondary/80":
                        variant === "secondary",
                    "hover:bg-muted hover:text-foreground": variant === "ghost",
                    "text-primary underline-offset-4 hover:underline p-0": variant === "link",
                },
                {
                    "h-10 px-5 py-2": size === "default",
                    "h-8 rounded-md px-3 text-xs": size === "sm",
                    "h-12 rounded-lg px-8 text-base": size === "lg",
                    "h-10 w-10 p-0": size === "icon",
                },
                className
            )}
            ref={ref}
            {...props}
        />
    );
});
Button.displayName = "Button";

export { Button };
