"use client";

import { ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { WorkspaceShell } from "@/components/shell/WorkspaceShell";
import { useEffect } from "react";
import { useFieldState, workspaceActions } from "@/lib/store";

export default function FieldLayout({ children }: { children: ReactNode }) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const fs = useFieldState(id);

  useEffect(() => {
    if (id) workspaceActions.setActive(id);
  }, [id]);

  useEffect(() => {
    if (!fs) {
      // Field doesn't exist; bounce to workspace home.
      router.replace("/workspace");
    }
  }, [fs, router]);

  if (!fs) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="text-sm text-ink-500">Loading field…</div>
      </div>
    );
  }

  return <WorkspaceShell fieldId={id}>{children}</WorkspaceShell>;
}
