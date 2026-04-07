import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function ChangeEmail() {
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Re-authenticate with password first
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/portal/login", { replace: true }); return; }

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: session.user.email!,
      password,
    });

    if (signInErr) {
      setError("Incorrect password. Please try again.");
      setLoading(false);
      return;
    }

    const { error: updateErr } = await supabase.auth.updateUser({ email: newEmail });
    setLoading(false);

    if (updateErr) {
      setError(updateErr.message);
    } else {
      setDone(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link to="/portal" className="font-display text-3xl text-charcoal no-underline">Emily Russell</Link>
          <p className="font-body text-[10px] tracking-[4px] uppercase text-gold mt-1">Change Email</p>
        </div>

        <div className="bg-white p-8 shadow-md border border-border">
          {done ? (
            <div className="text-center">
              <h2 className="font-display text-xl text-charcoal mb-3">Confirmation Sent</h2>
              <p className="font-body text-sm text-slate-er leading-relaxed mb-6">
                We've sent a confirmation email to <strong>{newEmail}</strong>. Please click the link in that email to complete the change.
              </p>
              <Link to="/portal" className="btn-er-primary no-underline inline-block">Back to Portal</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h2 className="font-display text-xl text-charcoal mb-2">Update Email Address</h2>
              <p className="font-body text-sm text-slate-er mb-6">Enter your current password and new email address.</p>
              {error && <div className="text-destructive text-sm mb-4 font-body">{error}</div>}
              <input
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Current password" className="er-input mb-4"
              />
              <input
                type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)}
                placeholder="New email address" className="er-input mb-6"
              />
              <button type="submit" disabled={loading} className="btn-er-primary w-full">
                {loading ? "Updating…" : "Update Email"}
              </button>
              <Link to="/portal" className="block w-full text-center mt-4 font-body text-sm text-gold no-underline hover:underline">
                Cancel
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
