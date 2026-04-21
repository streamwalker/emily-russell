import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, EyeOff, KeyRound } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  currentEmail: string;
  clientName?: string | null;
  onUpdated?: (next: { email: string }) => void;
}

export default function ClientCredentialsDialog({
  open, onOpenChange, userId, currentEmail, clientName, onUpdated,
}: Props) {
  const [email, setEmail] = useState(currentEmail);
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset local state when reopening for a different client
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setPassword("");
      setShowPwd(false);
      setError(null);
    } else {
      setEmail(currentEmail);
    }
    onOpenChange(next);
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let pwd = "";
    const arr = new Uint32Array(14);
    crypto.getRandomValues(arr);
    for (let i = 0; i < arr.length; i++) pwd += chars[arr[i] % chars.length];
    pwd += "!9";
    setPassword(pwd);
    setShowPwd(true);
  };

  const submit = async () => {
    setError(null);
    const trimmedEmail = email.trim();
    const emailChanged = trimmedEmail.toLowerCase() !== currentEmail.toLowerCase();
    const passwordChanged = password.length > 0;

    if (!emailChanged && !passwordChanged) {
      setError("Change the email or set a new password before saving.");
      return;
    }
    if (emailChanged && !trimmedEmail.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    if (passwordChanged && password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSaving(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("update-client-credentials", {
        body: {
          user_id: userId,
          email: emailChanged ? trimmedEmail : null,
          password: passwordChanged ? password : null,
        },
      });
      if (fnErr) throw new Error(fnErr.message || "Failed to update credentials");
      if (data?.error) throw new Error(data.error);

      const parts: string[] = [];
      if (emailChanged) parts.push("email");
      if (passwordChanged) parts.push("password");
      toast.success(`Updated ${parts.join(" and ")} for ${clientName || trimmedEmail}`);
      onUpdated?.({ email: emailChanged ? trimmedEmail : currentEmail });
      handleOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update credentials");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <KeyRound className="w-4 h-4" /> Edit Client Credentials
          </DialogTitle>
          <DialogDescription className="font-body text-xs">
            Update sign-in email and/or reset the password for{" "}
            <strong>{clientName || currentEmail}</strong>. Changes take effect immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-[10px] uppercase tracking-[2px] text-muted-foreground font-body font-semibold block mb-1.5">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@example.com"
              autoComplete="off"
              className="font-body text-sm"
            />
            <p className="text-[10px] text-muted-foreground font-body mt-1">
              Email is auto-confirmed — the client can sign in immediately with the new address.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] uppercase tracking-[2px] text-muted-foreground font-body font-semibold">
                New Password
              </label>
              <button
                type="button"
                onClick={generatePassword}
                className="text-[10px] font-body text-primary hover:underline"
              >
                Generate
              </button>
            </div>
            <div className="relative">
              <Input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                autoComplete="new-password"
                className="font-body text-sm pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                title={showPwd ? "Hide" : "Show"}
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground font-body mt-1">
              Minimum 8 characters. Share securely with the client.
            </p>
          </div>

          {error && (
            <div className="text-xs font-body text-destructive bg-destructive/10 border border-destructive/30 rounded px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving} className="gap-1.5">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
