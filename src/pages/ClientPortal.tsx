import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import ClientDossierView from "@/components/portal/ClientDossierView";
import type { DossierData, CommentReply } from "@/components/portal/ClientDossierView";

export default function ClientPortal() {
  const [dossier, setDossier] = useState<DossierData | null>(null);
  const [dossierId, setDossierId] = useState("");
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const { isAdmin } = useAdminCheck();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/portal/login", { replace: true }); return; }
      setUserEmail(session.user.email || "");
      setUserId(session.user.id);

      const dossierRes = await supabase
        .from("client_dossiers")
        .select("id, dossier_data")
        .eq("user_id", session.user.id)
        .limit(1)
        .maybeSingle();

      if (dossierRes.error || !dossierRes.data) {
        setDossier(null);
      } else {
        setDossierId(dossierRes.data.id);
        setDossier(dossierRes.data.dossier_data as unknown as DossierData);
      }
      setLoading(false);
    };
    load();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/portal/login", { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-primary font-body text-lg">Loading your dossier…</div>
      </div>
    );
  }

  if (!dossier) {
    navigate("/portal/dashboard");
    return null;
  }

  return (
    <div className="font-body min-h-screen" style={{ background: "hsl(var(--background))", color: "hsl(var(--foreground))" }}>
      {/* Top nav bar for auth actions */}
      <div className="sticky top-0 z-50" style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)" }}>
        <div className="max-w-[960px] mx-auto px-6 py-2 flex justify-end items-center gap-3">
          <Link to="/portal/dashboard" className="font-body text-[11px] uppercase tracking-[2px] no-underline bg-transparent border border-white/30 text-white/70 px-4 py-2 hover:text-white hover:border-white/60 transition-colors">
            Dashboard
          </Link>
          {isAdmin && (
            <Link to="/portal/admin" className="font-body text-[11px] uppercase tracking-[2px] no-underline bg-transparent border border-primary/50 text-primary px-4 py-2 hover:border-primary hover:text-white transition-colors">
              Admin
            </Link>
          )}
          <Link to="/" className="font-body text-[11px] uppercase tracking-[2px] cursor-pointer bg-transparent border border-white/30 text-white/70 px-4 py-2 hover:text-white hover:border-white/60 transition-colors no-underline">
            🏠 Home
          </Link>
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="font-body text-[11px] uppercase tracking-[2px] cursor-pointer bg-transparent border border-white/30 text-white/70 px-4 py-2 hover:text-white hover:border-white/60 transition-colors"
            >
              ⚙ Account
            </button>
            {showSettings && (
              <div className="absolute right-0 top-full mt-2 bg-foreground border border-white/10 rounded shadow-xl min-w-[180px] py-1 z-50">
                <Link to="/portal/change-email" className="block px-4 py-2 text-[12px] text-white/70 no-underline hover:text-white hover:bg-white/5 font-body transition-colors">
                  Change Email
                </Link>
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-[12px] text-white/70 bg-transparent border-none cursor-pointer hover:text-white hover:bg-white/5 font-body transition-colors">
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ClientDossierView
        dossierData={dossier}
        dossierId={dossierId}
        clientUserId={userId}
        readOnly={false}
      />

      {/* Logged-in indicator */}
      <div className="fixed bottom-4 left-4 font-body text-[10px] text-muted-foreground opacity-50">
        Logged in as {userEmail}
      </div>
    </div>
  );
}
