import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/integrations/firebase/client";
import type { Database } from "@/integrations/supabase/types";

export type Tables = Database["public"]["Tables"];
export type TableName = keyof Tables;
export type Row<T extends TableName> = Tables[T]["Row"];

export const SEVERITIES = ["Critical", "High", "Medium", "Low", "Info"] as const;
export const VULN_STATUSES = [
  "Discovered", "Triaged", "Assigned", "Fix in Progress", "Ready for Verification", "Verified Fixed", "Accepted Risk", "False Positive",
] as const;
export const OPEN_VULN = ["Discovered", "Triaged", "Assigned", "Fix in Progress", "Ready for Verification"];
export const TASK_STATUSES = ["Backlog", "To Do", "In Progress", "Review", "Done"] as const;

/** Read every row of a shared team table (RLS applies as the signed-in user). */
export function useRows<T extends TableName>(table: T, opts?: { order?: string; ascending?: boolean; limit?: number }) {
  return useQuery({
    queryKey: [table, opts],
    queryFn: async () => {
      let q = supabase.from(table).select("*").order(opts?.order ?? "created_at", { ascending: opts?.ascending ?? false });
      if (opts?.limit) q = q.limit(opts.limit);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as Row<T>[];
    },
  });
}

/** Insert / update / delete with toast feedback and cache refresh. */
export function useSave<T extends TableName>(table: T, invalidate: TableName[] = []) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id?: string; values?: Partial<Tables[T]["Insert"]>; remove?: boolean }) => {
      const t = supabase.from(table) as any;
      const res = args.remove
        ? await t.delete().eq("id", args.id)
        : args.id
          ? await t.update(args.values).eq("id", args.id)
          : await t.insert(args.values);
      if (res.error) throw res.error;
    },
    onSuccess: (_d, args) => {
      toast.success(args.remove ? "Deleted" : args.id ? "Saved" : "Created");
      [table, ...invalidate].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      // Use Firebase for current user identity
      const fbUser = getCurrentUser();
      if (!fbUser) return null;
      const userId = fbUser.uid;
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      return {
        user: { id: userId, email: fbUser.email ?? "" },
        roles: (roles ?? []).map((r) => r.role),
        isAdmin: !!roles?.some((r) => r.role === "admin"),
      };
    },
  });
}

/** Mean time in minutes between two timestamp fields, from stored records only. */
export function meanMinutes<T>(rows: T[], from: (r: T) => string | null, to: (r: T) => string | null) {
  const d = rows
    .map((r) => [from(r), to(r)] as const)
    .filter(([a, b]) => a && b)
    .map(([a, b]) => (new Date(b!).getTime() - new Date(a!).getTime()) / 60000);
  return d.length ? Math.round(d.reduce((x, y) => x + y, 0) / d.length) : null;
}

/** Security posture: 100 minus weighted open findings and open alerts, floored at 0. */
export function postureScore(findings: { severity: string; status: string }[], openAlerts: number) {
  const w: Record<string, number> = { Critical: 15, High: 8, Medium: 4, Low: 1, Info: 0 };
  const penalty = findings.filter((f) => OPEN_VULN.includes(f.status)).reduce((s, f) => s + (w[f.severity] ?? 0), 0);
  return Math.max(0, Math.min(100, 100 - penalty - openAlerts * 3));
}

export async function sha256Hex(file: File) {
  const buf = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
