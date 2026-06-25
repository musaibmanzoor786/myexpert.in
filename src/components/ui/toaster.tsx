
'use client';

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { cn } from "@/lib/utils"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-center gap-4">
              {/* Branding Square - Consistent ME Logo Teal Square */}
              <div className="h-10 w-10 shrink-0 bg-[#00B894] rounded-xl flex items-center justify-center shadow-lg shadow-[#00B894]/20">
                <svg
                    viewBox="0 0 40 40"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-white"
                >
                    <g fill="currentColor">
                        <path d="M20 4L28 12L20 20L12 12L20 4Z" />
                        <path d="M4 14L20 28L36 14V36H28V22L20 30L12 22V36H4V14Z" />
                    </g>
                </svg>
              </div>
              
              <div className="grid gap-0.5">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription className={cn(
                    "text-[13px] font-bold tracking-tight",
                    variant === 'warning' ? 'text-[#B8860B]' : 'text-foreground'
                  )}>
                    {description}
                  </ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose className="text-muted-foreground/40 hover:text-foreground" />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
