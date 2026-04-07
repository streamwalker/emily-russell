import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    // Also check hash for type=recovery
    if (window.location.hash.includes("type=recovery")) {
      setReady(true);
    }
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message); } else { setDone(true); }
  };

  if (!ready && !done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream px-4">
        <div className="text-center">
          <h2 className="font-display text-xl text-charcoal mb-3">Invalid Reset Link</h2>
          <p className="font-body text-sm text-slate-er mb-6">This link is expired or invalid.</p>
          <Link to="/portal/login" className="btn-er-primary no-underline">Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link to="/" className="font-display text-3xl text-charcoal no-underline">Emily Russell</Link>
          <p className="font-body text-[10px] tracking-[4px] uppercase text-gold mt-1">Reset Password</p>
        </div>
        <div className="bg-white p-8 shadow-md border border-border">
          {done ? (
            <div className="text-center">
              <h2 className="font-display text-xl text-charcoal mb-3">Password Updated</h2>
              <p className="font-body text-sm text-slate-er mb-6">Your password has been successfully reset.</p>
              <button onClick={() => navigate("/portal")} className="btn-er-primary w-full">Go to Portal</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h2 className="font-display text-xl text-charcoal mb-6">Set New Password</h2>
              {error && <div className="text-destructive text-sm mb-4 font-body">{error}</div>}
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="New password" className="er-input mb-4" />
              <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Confirm password" className="er-input mb-6" />
              <button type="submit" disabled={loading} className="btn-er-primary w-full">{loading ? "Updating…" : "Update Password"}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
