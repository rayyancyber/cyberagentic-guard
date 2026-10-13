import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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

export function useSave<T extends TableName>(table: T, invalidate: TableName[] = []) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { id?: string; values?: Partial<Tables[T]["Insert"]>; remove?: boolean }) => {
      // ✅ FIX: Verify auth session exists AND refresh if needed
      let { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      // If session error or no session, try to refresh
      if (sessionError || !sessionData.session) {
        console.warn("[useSave] No session found, attempting refresh...");
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          console.error("[useSave] Session refresh failed:", refreshError);
          throw new Error("Session expired. Please sign in again.");
        }
        
        sessionData = refreshData;
        console.log("[useSave] Session refreshed successfully");
      }

      if (!sessionData.session) {
        throw new Error("Authentication required. Please sign in again.");
      }

      const t = supabase.from(table) as any;
      const userId = sessionData.session.user.id;
      
      // For insert operations, ensure user_id is set when needed
      if (!args.remove && !args.id && args.values) {
        // Tables that require user_id
        if (table === "progress" && !args.values.user_id) {
          args.values.user_id = userId;
        }
        // Tables that have created_by/owner_id fields
        if ((table === "assets" || table === "findings" || table === "team_tasks") && !args.values.created_by) {
          args.values.created_by = userId;
        }
        if ((table === "assessments" || table === "incidents") && !args.values.owner_id) {
          args.values.owner_id = userId;
        }
        if (table === "task_comments" && !args.values.author_id) {
          args.values.author_id = userId;
        }
        if (table === "evidence" && !args.values.uploaded_by) {
          args.values.uploaded_by = userId;
        }
        if (table === "security_events" && !args.values.created_at) {
          // Ensure created_at is set for events
          args.values.created_at = new Date().toISOString();
        }
      }

      console.log(`[useSave] Attempting ${args.remove ? 'DELETE' : args.id ? 'UPDATE' : 'INSERT'} on table:`, table);

      const res = args.remove
        ? await t.delete().eq("id", args.id)
        : args.id
          ? await t.update(args.values).eq("id", args.id).select()
          : await t.insert(args.values).select();
      
      if (res.error) {
        console.error("[useSave] Database operation failed:", {
          table,
          operation: args.remove ? 'DELETE' : args.id ? 'UPDATE' : 'INSERT',
          error: res.error,
          values: args.values
        });
        throw res.error;
      }
      
      console.log(`[useSave] Success on table ${table}:`, res.data);
      return res.data;
    },
    onSuccess: (_d, args) => {
      toast.success(args.remove ? "Deleted" : args.id ? "Saved" : "Created");
      [table, ...invalidate].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
    },
    onError: (e: Error) => {
      const msg = e.message.toLowerCase();
      console.error("[useSave] Error:", e);
      
      if (msg.includes("row-level security") || msg.includes("rls")) {
        toast.error("Permission denied. Please refresh the page and try again.");
      } else if (msg.includes("authentication") || msg.includes("auth") || msg.includes("session")) {
        toast.error("Session expired. Please refresh the page.");
      } else if (msg.includes("unique") || msg.includes("duplicate")) {
        toast.error("This record already exists.");
      } else if (msg.includes("foreign key") || msg.includes("violates")) {
        toast.error("Invalid reference. Please check linked resources.");
      } else {
        toast.error(e.message);
      }
    },
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
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return null;
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      return {
        user,
        roles: (roles ?? []).map((r) => r.role),
        isAdmin: !!roles?.some((r) => r.role === "admin"),
      };
    },
  });
}

export function meanMinutes<T>(rows: T[], from: (r: T) => string | null, to: (r: T) => string | null) {
  const d = rows
    .map((r) => [from(r), to(r)] as const)
    .filter(([a, b]) => a && b)
    .map(([a, b]) => (new Date(b!).getTime() - new Date(a!).getTime()) / 60000);
  return d.length ? Math.round(d.reduce((x, y) => x + y, 0) / d.length) : null;
}

export function postureScore(findings: { severity: string; status: string }[], openAlerts: number) {
  const w: Record<string, number> = { Critical: 15, High: 8, Medium: 4, Low: 1, Info: 0 };
  const penalty = findings.filter((f) => OPEN_VULN.includes(f.status)).reduce((s, f) => s + (w[f.severity] ?? 0), 0);
  return Math.max(0, Math.min(100, 100 - penalty - openAlerts * 3));
}

export async function sha256Hex(file: File) {
  const buf = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
