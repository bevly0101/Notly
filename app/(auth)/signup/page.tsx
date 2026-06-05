"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function SignupPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    if (password !== confirm) {
      setError("As senhas não coincidem");
      return;
    }

    setLoading(true);

    const { error: err } = await signUp(email, password);
    if (err) {
      setError(err);
      setLoading(false);
      return;
    }

    router.push("/login?verified=false");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-primary">Criar conta</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Regista-te para sincronizar os teus dados na cloud
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="block text-xs text-on-surface-variant mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@exemplo.com"
            className="w-full px-3 py-2 text-sm bg-surface-container rounded-lg text-on-surface placeholder:text-on-surface-variant outline-none ring-1 ring-outline-variant focus:ring-accent transition-shadow"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-xs text-on-surface-variant mb-1">
            Senha
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2 text-sm bg-surface-container rounded-lg text-on-surface placeholder:text-on-surface-variant outline-none ring-1 ring-outline-variant focus:ring-accent transition-shadow"
          />
        </div>

        <div>
          <label htmlFor="confirm" className="block text-xs text-on-surface-variant mb-1">
            Confirmar senha
          </label>
          <input
            id="confirm"
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2 text-sm bg-surface-container rounded-lg text-on-surface placeholder:text-on-surface-variant outline-none ring-1 ring-outline-variant focus:ring-accent transition-shadow"
          />
        </div>

        {error && (
          <div className="text-xs text-error bg-error/10 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-40"
        >
          {loading ? "A criar conta..." : "Criar conta"}
        </button>
      </form>

      <div className="text-center text-sm text-on-surface-variant">
        Já tens conta?{" "}
        <Link href="/login" className="text-accent hover:underline">
          Entrar
        </Link>
      </div>
    </div>
  );
}
