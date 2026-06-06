"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/providers/AppProviders";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

export default function LoginPage() {
  const router = useRouter();
  const { setLocalMode } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }

    setLocalMode(false);
    router.push("/workspaces");
  };

  const handleOAuth = async (provider: "google" | "github") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/workspaces` },
    });
  };

  const handleLocalWorkspace = () => {
    localStorage.setItem("notly_local_mode", "true");
    setLocalMode(true);
    window.location.href = "/workspaces";
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex items-center justify-center relative overflow-hidden mesh-bg">
      <div
        className="absolute w-[600px] h-[600px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(75, 142, 255, 0.05) 0%, rgba(19, 19, 19, 0) 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />
      <main className="w-full max-w-[440px] px-gutter relative z-10">
        <div className="glass-panel rounded-xl p-8 sm:p-10 flex flex-col items-center w-full">
          <div className="flex flex-col items-center mb-8 text-center w-full">
            <div className="w-16 h-16 rounded-lg bg-surface-container flex items-center justify-center mb-6 border border-outline-variant/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] text-3xl">
              📝
            </div>
            <h1 className="text-headline-md text-primary mb-2 tracking-tight font-semibold">
              Welcome back to NOTLY
            </h1>
            <p className="text-body-sm text-on-surface-variant">Your local-first workspace</p>
          </div>

          <form onSubmit={handleLogin} className="w-full space-y-5">
            {error && (
              <div className="text-error text-body-sm bg-error-container/20 p-3 rounded-lg">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-label-mono font-mono text-on-surface-variant uppercase tracking-wider"
              >
                Email Address
              </label>
              <div className="relative">
                <MaterialIcon
                  name="mail"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  size={20}
                />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-surface border border-outline-variant/30 rounded-lg py-2.5 pl-10 pr-4 text-body-base text-primary focus:border-secondary focus:ring-1 focus:ring-secondary/50 focus:outline-none placeholder:text-outline-variant/50"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-label-mono font-mono text-on-surface-variant uppercase tracking-wider"
              >
                Password
              </label>
              <div className="relative">
                <MaterialIcon
                  name="key"
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  size={20}
                />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface border border-outline-variant/30 rounded-lg py-2.5 pl-10 pr-4 text-body-base text-primary focus:border-secondary focus:ring-1 focus:ring-secondary/50 focus:outline-none placeholder:text-outline-variant/50"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary py-3 rounded-lg text-body-base font-semibold hover:opacity-90 transition-opacity shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Log In"}
              <MaterialIcon name="arrow_forward" size={20} />
            </button>
          </form>

          <div className="w-full flex items-center gap-4 my-6">
            <div className="h-px bg-outline-variant/30 flex-1" />
            <span className="text-label-mono font-mono text-on-surface-variant">OR</span>
            <div className="h-px bg-outline-variant/30 flex-1" />
          </div>

          <div className="w-full space-y-3">
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              className="w-full bg-surface border border-outline-variant/30 text-on-surface py-2.5 rounded-lg text-body-sm font-semibold hover:bg-surface-variant transition-colors"
            >
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuth("github")}
              className="w-full bg-surface border border-outline-variant/30 text-on-surface py-2.5 rounded-lg text-body-sm font-semibold hover:bg-surface-variant transition-colors"
            >
              Continue with GitHub
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={handleLocalWorkspace}
            className="text-body-sm text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <MaterialIcon name="dns" size={18} />
            Create a new local workspace
          </button>
        </div>
      </main>
    </div>
  );
}
