"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function FieldIndex() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/workspace/field/${params.id}/setup`);
  }, [params.id, router]);
  return null;
}
