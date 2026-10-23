import React, { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Camera } from "lucide-react";

/**
 * Dialog for editing the signed-in user's personal profile:
 * profile picture, full name, phone, and area.
 * Works for both business and officer portals.
 *
 * Saves to the `app_users` table (creating a record if none exists)
 * and updates Supabase auth user_metadata for full_name.
 * Profile pictures are stored in the Supabase `avatars` storage bucket.
 */
export default function EditProfileDialog({ open, onOpenChange }) {
  const { user, checkAppState } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [pendingPicturePath, setPendingPicturePath] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (open && user) {
      setFullName(user.full_name || "");
      setPhone(user.phone || "");
      setArea(user.area || "");
      setPendingPicturePath(null);
      if (user.profile_picture) {
        const { data } = supabase.storage
          .from("avatars")
          .getPublicUrl(user.profile_picture);
        setAvatarUrl(data.publicUrl);
      } else {
        setAvatarUrl(null);
      }
    }
  }, [open, user]);

  const initials = (user?.full_name || user?.email || "U")
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Image too large",
        description: "Maximum 5 MB.",
        variant: "destructive",
      });
      return;
    }
    setUploading(true);
    try {
      // Convert to base64 for the server-side upload endpoint
      const reader = new FileReader();
      const base64 = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await fetch("/api/upload-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file: base64,
          filename: file.name,
          userId: user.supabase_id,
          contentType: file.type,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Upload failed");

      setAvatarUrl(result.publicUrl);
      setPendingPicturePath(result.path);
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Update auth user_metadata — full_name and profile_picture path.
      // Using user_metadata avoids needing a database column migration.
      const metadataUpdate = { full_name: fullName.trim() };
      if (pendingPicturePath) metadataUpdate.profile_picture = pendingPicturePath;

      await supabase.auth.updateUser({ data: metadataUpdate });

      // Update or create the app_users record for phone and area
      const { data: existing } = await supabase
        .from("app_users")
        .select("id")
        .eq("supabase_auth_id", user.supabase_id)
        .maybeSingle();

      const payload = {
        full_name: fullName.trim(),
        phone: phone.trim(),
        area: area.trim(),
      };

      if (existing?.id) {
        const { error } = await supabase
          .from("app_users")
          .update(payload)
          .eq("supabase_auth_id", user.supabase_id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("app_users").insert({
          ...payload,
          supabase_auth_id: user.supabase_id,
          email: user.email,
          account_type: user.account_type,
        });
        if (error) throw error;
      }

      await checkAppState(); // refresh user state so the sidebar updates
      toast({ title: "Profile updated", description: "Your changes have been saved." });
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Update failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Update your personal details and profile picture.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={save} className="space-y-4">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden grid place-items-center bg-aqua text-white text-2xl font-medium shadow-md">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  initials
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-brand text-white grid place-items-center shadow-md hover:opacity-90 disabled:opacity-60"
              >
                {uploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <p className="text-xs text-mute">Click the camera icon to upload a photo</p>
          </div>

          {/* Full name */}
          <div>
            <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">
              Full name
            </label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="led-field"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">
              Phone
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="082 123 4567"
              className="led-field"
            />
          </div>

          {/* Area */}
          <div>
            <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">
              Area
            </label>
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. Sebokeng"
              className="led-field"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-xs font-semibold text-mute uppercase tracking-wide mb-1.5">
              Email
            </label>
            <input value={user?.email || ""} disabled className="led-field opacity-60" />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="led-btn w-full flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save changes
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
