import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function ClientLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/portal", { replace: true });
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError("Invalid email or password.");
    } else {
      navigate("/portal", { replace: true });
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/portal/reset-password`,
    });
    setLoading(false);
    if (err) {
      setError("Could not send reset email. Please try again.");
    } else {
      setForgotSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link to="/" className="font-display text-3xl text-charcoal no-underline">Emily Russell</Link>
          <p className="font-body text-[10px] tracking-[4px] uppercase text-gold mt-1">Client Portal</p>
        </div>

        <div className="bg-white p-8 shadow-md border border-border">
          {forgot ? (
            forgotSent ? (
              <div className="text-center">
                <h2 className="font-display text-xl text-charcoal mb-3">Check Your Email</h2>
                <p className="font-body text-sm text-slate-er leading-relaxed">
                  We've sent a password reset link to <strong>{email}</strong>.
                </p>
                <button onClick={() => { setForgot(false); setForgotSent(false); }} className="btn-er-primary mt-6 w-full">
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgot}>
                <h2 className="font-display text-xl text-charcoal mb-2">Reset Password</h2>
                <p className="font-body text-sm text-slate-er mb-6">Enter your email and we'll send a reset link.</p>
                {error && <div className="text-destructive text-sm mb-4 font-body">{error}</div>}
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="Email address" className="er-input mb-4"
                />
                <button type="submit" disabled={loading} className="btn-er-primary w-full">
                  {loading ? "Sending…" : "Send Reset Link"}
                </button>
                <button type="button" onClick={() => setForgot(false)} className="w-full text-center mt-4 font-body text-sm text-gold cursor-pointer bg-transparent border-none hover:underline">
                  Back to Login
                </button>
              </form>
            )
          ) : (
            <form onSubmit={handleLogin}>
              <h2 className="font-display text-xl text-charcoal mb-6">Sign In</h2>
              {error && <div className="text-destructive text-sm mb-4 font-body">{error}</div>}
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Email address" className="er-input mb-4"
              />
              <input
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Password" className="er-input mb-6"
              />
              <button type="submit" disabled={loading} className="btn-er-primary w-full">
                {loading ? "Signing in…" : "Sign In"}
              </button>
              <button type="button" onClick={() => setForgot(true)} className="w-full text-center mt-4 font-body text-sm text-gold cursor-pointer bg-transparent border-none hover:underline">
                Forgot password?
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-6 font-body text-[11px] text-slate-er">
          Access is by invitation only. Contact Emily at{" "}
          <a href="tel:2109120806" className="text-gold no-underline">(210) 912-0806</a> for assistance.
        </p>
      </div>
    </div>
  );
}
