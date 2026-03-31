import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleChoice = (choice: "accepted" | "declined") => {
    localStorage.setItem("cookie_consent", choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] animate-in slide-in-from-bottom duration-500">
      <div className="bg-charcoal border-t border-white/10 px-6 py-4">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center gap-4">
          <p className="font-body text-[13px] leading-[1.6] text-white/70 flex-1">
            We use cookies to improve your browsing experience and analyze site traffic. By clicking "Accept," you consent to our use of cookies. See our{" "}
            <Link to="/privacy" className="text-gold-light hover:underline">Privacy Policy</Link> for details.
          </p>
          <div className="flex gap-3 shrink-0">
            <button
              onClick={() => handleChoice("declined")}
              className="font-body text-[12px] tracking-[1px] uppercase px-5 py-2 border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-colors rounded-sm"
            >
              Decline
            </button>
            <button
              onClick={() => handleChoice("accepted")}
              className="font-body text-[12px] tracking-[1px] uppercase px-5 py-2 bg-gold text-white hover:bg-gold-dark transition-colors rounded-sm"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
