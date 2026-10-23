import { createClient } from "@supabase/supabase-js";

/**
 * Vite dev-server plugin that handles profile-picture uploads server-side.
 *
 * The Supabase project's storage RLS policies don't allow the anon key to
 * upload, but the service role key (available only on the server, never
 * exposed to the browser) bypasses RLS.  This middleware accepts a base64
 * image from the frontend, uploads it to the `avatars` bucket with the
 * service role key, and returns the public URL.
 *
 * For production the app should either deploy the RLS policies in
 * supabase_setup.sql (so the anon key can upload directly) or replace this
 * dev-only endpoint with a proper backend.
 */
export function avatarUploadPlugin() {
  return {
    name: "avatar-upload",
    configureServer(server) {
      server.middlewares.use("/api/upload-avatar", async (req, res) => {
        if (req.method !== "POST") {
          res.statusCode = 405;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }

        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceKey) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({ error: "Server missing Supabase credentials" })
          );
          return;
        }

        // Read JSON body
        let body = "";
        for await (const chunk of req) body += chunk;

        try {
          const { file: base64, filename, userId, contentType } = JSON.parse(body);
          const buffer = Buffer.from(base64, "base64");
          const ext = (filename || "avatar.png").split(".").pop() || "png";
          const path = `${userId}/avatar-${Date.now()}.${ext}`;

          const admin = createClient(supabaseUrl, serviceKey);
          const { error } = await admin.storage
            .from("avatars")
            .upload(path, buffer, {
              upsert: true,
              contentType: contentType || "image/png",
            });

          if (error) throw error;

          const { data } = admin.storage.from("avatars").getPublicUrl(path);

          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ path, publicUrl: data.publicUrl }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}
