"use client";

import { useCallback } from "react";

import { useToast } from "@/components/ui/use-toast";

type ActionToastMessages = {
  loading: string;
  success: string;
  error: string;
  loadingDescription?: string;
  successDescription?: string;
  errorDescription?: string;
};

export function useActionToast() {
  const { toast, dismiss } = useToast();

  const runWithToast = useCallback(
    async <T>(action: () => Promise<T>, messages: ActionToastMessages) => {
      const loadingId = toast({
        title: messages.loading,
        description: messages.loadingDescription,
        durationMs: 0,
      });

      try {
        const result = await action();
        dismiss(loadingId);
        toast({
          title: messages.success,
          description: messages.successDescription,
          variant: "success",
        });
        return result;
      } catch (error) {
        dismiss(loadingId);
        const description =
          error instanceof Error ? error.message : messages.errorDescription || "Request failed";
        toast({
          title: messages.error,
          description,
          variant: "destructive",
          durationMs: 5000,
        });
        throw error;
      }
    },
    [dismiss, toast],
  );

  return { runWithToast, toast };
}
