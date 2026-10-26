import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import GoogleIcon from "@/components/GoogleIcon";
import { Image } from "@/components/ui/image";
import { LOGO_URL } from "@/lib/ledUtils";

// Private sign-in for the LED Officer portal. Reached only via the /officer link.
// Officers are invited accounts (role "admin" or account_type "officer").
const CITYSCAPE_URL =
  "https://media.base44.com/images/public/6ac748a5e17c2620a194f576/3b39ab929_generated_a84a13d4.jpg";

export default function OfficerSignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!supabase) {
      setError("Authentication is not configured. Please contact support.");
      return;
    }
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw signInError;
      window.location.href = "/officer";
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    if (!supabase) {
      setError("Authentication is not configured. Please contact support.");
      return;
    }
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/officer` },
    });
  };

  return (
    <div className="officer-signin">
      <div className="os-wash" aria-hidden="true" />
      <div className="os-wash2" aria-hidden="true" />
      <div className="os-grid" aria-hidden="true" />

      <div className="os-stage">
        <div className="os-panel">
          <Image
            src={LOGO_URL}
            alt="Emfuleni Local Municipality logo"
            fittingType="fit"
            originWidth={1024}
            originHeight={684}
            className="os-logo"
          />

          <div className="os-ttl">
            <div className="os-rail" aria-hidden="true" />
            <div>
              <h1>LED Officer sign in</h1>
              <p>Officer access is by invitation only</p>
            </div>
          </div>

          <button type="button" className="os-g" onClick={handleGoogle}>
            <GoogleIcon className="w-5 h-5" />
            Continue with Google
          </button>

          <div className="os-or">or</div>

          {error && <div className="os-err">{error}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="os-f">
              <label htmlFor="officer-email">Email</label>
              <div className="os-w">
                <svg viewBox="0 0 24 24" fill="none" stroke="#6b8791" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 7l9 6 9-6" />
                </svg>
                <input
                  id="officer-email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  placeholder="you@emfuleni.gov.za"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="os-in"
                  required
                />
              </div>
            </div>

            <div className="os-f">
              <label htmlFor="officer-password">Password</label>
              <div className="os-w">
                <svg viewBox="0 0 24 24" fill="none" stroke="#6b8791" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="4" y="11" width="16" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
                <input
                  id="officer-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="os-in"
                  required
                />
              </div>
            </div>

            <button type="submit" className="os-sub" disabled={loading}>
              {loading ? (
                <>
                  <span className="os-sp" aria-hidden="true" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p className="os-ft">
            <Link to="/forgot-password" className="os-fp">
              Forgot password?
            </Link>
          </p>
        </div>

        <div className="os-strip">
          <Image
            src={CITYSCAPE_URL}
            alt="Midnight cityscape with teal and amber light"
            fittingType="fill"
            className="os-strip-img"
          />
        </div>
      </div>

      <div className="os-below" aria-hidden="true" />
    </div>
  );
}
