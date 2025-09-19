"use client";

import { toast as sonnerToast } from "sonner";

// Re-export sonner toast with our TAMI-specific styling
export const toast = {
  success: (message: string) => {
    sonnerToast.success(message, {
      duration: 4000,
      style: {
        background: "hsl(var(--background))",
        border: "1px solid hsl(var(--border))",
        color: "hsl(var(--foreground))",
      }
    });
  },
  error: (message: string) => {
    sonnerToast.error(message, {
      duration: 6000,
      style: {
        background: "hsl(var(--background))",
        border: "1px solid hsl(var(--destructive))",
        color: "hsl(var(--foreground))",
      }
    });
  },
  info: (message: string) => {
    sonnerToast.info(message, {
      duration: 4000,
      style: {
        background: "hsl(var(--background))",
        border: "1px solid hsl(var(--border))",
        color: "hsl(var(--foreground))",
      }
    });
  }
};

export default toast;