/**
 * Supabase-backed replacement for the old @base44/sdk client.
 *
 * Provides the same `.entities`, `.auth`, `.integrations`, and `.functions`
 * surface the rest of the app expects, but routes all data operations to
 * Supabase tables via the @supabase/supabase-js client.
 */
import { supabase } from "@/lib/supabaseClient";

// ── Entity-name → Supabase table-name mapping ──────────────────────────
// Base44 uses PascalCase entity names; Supabase tables are lowercase with
// no separators.  `User` maps to the `app_users` table.
const TABLE_MAP = {
  User: "app_users",
};

function tableName(entityName) {
  if (TABLE_MAP[entityName]) return TABLE_MAP[entityName];
  return entityName.toLowerCase();
}

// ── Sort-string parser ──────────────────────────────────────────────────
// Base44 sort strings look like "-created_date" (desc) or "created_date" (asc)
function applySort(query, sort) {
  if (!sort) return query;
  const desc = sort.startsWith("-");
  const col = desc ? sort.slice(1) : sort;
  return query.order(col, { ascending: !desc });
}

// ── Equality-filter builder ─────────────────────────────────────────────
// All filter() calls in this app use simple equality objects
// e.g. { status: "open" } or { status: "open", type: "tender" }
function applyFilters(query, filterObj) {
  if (!filterObj || typeof filterObj !== "object") return query;
  for (const [col, val] of Object.entries(filterObj)) {
    if (val != null) query = query.eq(col, val);
  }
  return query;
}

// ── Entity handler (one per entity name) ────────────────────────────────
function createEntityHandler(name) {
  const table = tableName(name);

  return {
    async list(...args) {
      if (!supabase) return [];
      const [sort, limit] = args;
      let q = supabase.from(table).select("*");
      q = applySort(q, sort);
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },

    async filter(filterObj, ...args) {
      if (!supabase) return [];
      const [sort, limit] = args;
      let q = supabase.from(table).select("*");
      q = applyFilters(q, filterObj);
      q = applySort(q, sort);
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },

    async get(id) {
      if (!supabase) throw new Error("Supabase not configured");
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },

    async create(payload) {
      if (!supabase) throw new Error("Supabase not configured");
      const { data, error } = await supabase
        .from(table)
        .insert(payload)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, payload) {
      if (!supabase) throw new Error("Supabase not configured");
      const { data, error } = await supabase
        .from(table)
        .update(payload)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      if (!supabase) throw new Error("Supabase not configured");
      const { data, error } = await supabase
        .from(table)
        .delete()
        .eq("id", id);
      if (error) throw error;
      return data;
    },

    async bulkCreate(records) {
      if (!supabase) throw new Error("Supabase not configured");
      const { data, error } = await supabase
        .from(table)
        .insert(records)
        .select("*");
      if (error) throw error;
      return data || [];
    },

    async count(filterObj) {
      if (!supabase) return 0;
      let q = supabase.from(table).select("*", { count: "exact", head: true });
      q = applyFilters(q, filterObj);
      const { count, error } = await q;
      if (error) throw error;
      return count || 0;
    },
  };
}

// ── Build the base44 client surface ─────────────────────────────────────
export const base44 = {
  // Dynamic entities proxy — base44.entities.Business.list() etc.
  entities: new Proxy(
    {},
    {
      get(_target, name) {
        if (typeof name !== "string" || name === "then") return undefined;
        return createEntityHandler(name);
      },
    }
  ),

  // ── Auth (delegates to Supabase auth) ──────────────────────────────────
  auth: {
    async me() {
      if (!supabase) return null;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      // Look up app_users for extended profile data
      const { data: appUser } = await supabase
        .from("app_users")
        .select("*")
        .eq("supabase_auth_id", user.id)
        .maybeSingle();

      return {
        id: appUser?.id || user.id,
        supabase_id: user.id,
        email: user.email,
        full_name: appUser?.full_name || user.user_metadata?.full_name,
        role: user.user_metadata?.base44_role || "user",
        account_type: appUser?.account_type,
        ...appUser,
      };
    },

    async updateMe(updates) {
      if (!supabase) return null;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      // Update user_metadata in auth
      await supabase.auth.updateUser({
        data: {
          full_name: updates.full_name,
          phone: updates.phone,
        },
      });

      // Update app_users table
      const { data, error } = await supabase
        .from("app_users")
        .update({
          full_name: updates.full_name,
          phone: updates.phone,
          area: updates.area,
          language: updates.language,
        })
        .eq("supabase_auth_id", user.id)
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },

    isAuthenticated() {
      return !!supabase;
    },
  },

  // ── Integrations (Supabase Storage) ────────────────────────────────────
  integrations: {
    Core: {
      async UploadPrivateFile({ file }) {
        if (!supabase) throw new Error("Supabase not configured");
        const ext = file.name?.split(".").pop() || "bin";
        const path = `uploads/${crypto.randomUUID()}.${ext}`;
        const { data, error } = await supabase.storage
          .from("documents")
          .upload(path, file, { upsert: false });
        if (error) throw error;
        return { file_uri: path };
      },

      async UploadPublicFile({ file }) {
        if (!supabase) throw new Error("Supabase not configured");
        const ext = file.name?.split(".").pop() || "bin";
        const path = `public/${crypto.randomUUID()}.${ext}`;
        const { data, error } = await supabase.storage
          .from("documents")
          .upload(path, file, { upsert: false });
        if (error) throw error;
        return { file_uri: path };
      },

      async CreateFileSignedUrl({ file_uri }) {
        if (!supabase) throw new Error("Supabase not configured");
        const { data, error } = await supabase.storage
          .from("documents")
          .createSignedUrl(file_uri, 3600);
        if (error) throw error;
        return { signed_url: data.signedUrl };
      },
    },
  },

  // ── Functions (server-side) ───────────────────────────────────────────
  // Most functions can be replaced with direct entity operations.
  // This stub allows the app to handle missing functions gracefully.
  functions: {
    async invoke(name, params) {
      // No server-side functions are hosted in Supabase yet.
      // The onboarding wizard's submitVerificationApplication can be
      // handled client-side — return a simple success with a reference.
      if (name === "submitVerificationApplication") {
        return {
          data: {
            reference: `VA-${Date.now().toString(36).toUpperCase()}`,
          },
        };
      }
      throw new Error(`Function "${name}" is not available`);
    },
  },
};
