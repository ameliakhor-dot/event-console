"use client";

import { useEffect } from "react";

interface Props {
  title: string;
}

/**
 * Updates document.title on mount/change.
 * Used for client-side pages where metadata export isn't available.
 * Format: "[Page-specific] — Event Console"
 */
export function PageTitle({ title }: Props) {
  useEffect(() => {
    document.title = title;
  }, [title]);

  return null;
}
