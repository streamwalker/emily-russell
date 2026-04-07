import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type Status = "loading" | "valid" | "already" | "invalid" | "confirming" | "done" | "error";

const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    const validate = async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`;
        const res = await fetch(url, { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } });
        const data = await res.json();
        if (!res.ok) { setStatus("invalid"); return; }
        if (data.valid === false && data.reason === "already_unsubscribed") { setStatus("already"); return; }
        if (data.valid) { setStatus("valid"); return; }
        setStatus("invalid");
      } catch { setStatus("error"); }
    };
    validate();
  }, [token]);

  const handleConfirm = async () => {
    setStatus("confirming");
    try {
      const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
      if (error) { setStatus("error"); return; }
      if (data?.success) { setStatus("done"); return; }
      if (data?.reason === "already_unsubscribed") { setStatus("already"); return; }
      setStatus("error");
    } catch { setStatus("error"); }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-card border border-border p-8 text-center space-y-6">
        <h1 className="font-display text-2xl text-foreground">Email Preferences</h1>

        {status === "loading" && <p className="text-muted-foreground">Verifying…</p>}

        {status === "valid" && (
          <>
            <p className="text-muted-foreground">Click below to unsubscribe from notification emails.</p>
            <button onClick={handleConfirm} className="bg-primary text-primary-foreground px-6 py-2.5 font-body text-sm uppercase tracking-wider hover:bg-primary/90 transition-colors">
              Confirm Unsubscribe
            </button>
          </>
        )}

        {status === "confirming" && <p className="text-muted-foreground">Processing…</p>}

        {status === "done" && (
          <p className="text-foreground">You have been unsubscribed. You will no longer receive notification emails.</p>
        )}

        {status === "already" && (
          <p className="text-muted-foreground">You are already unsubscribed from notification emails.</p>
        )}

        {status === "invalid" && (
          <p className="text-destructive">This unsubscribe link is invalid or has expired.</p>
        )}

        {status === "error" && (
          <p className="text-destructive">Something went wrong. Please try again later.</p>
        )}
      </div>
    </div>
  );
};

export default Unsubscribe;
