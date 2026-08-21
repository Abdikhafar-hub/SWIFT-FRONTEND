"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminAuditRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/audit-trail");
  }, [router]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-zinc-400 font-mono text-xs">
      Redirecting to Audit Trail...
    </div>
  );
}
