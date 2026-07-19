"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [masterMode, setMasterMode] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Fase 1: sem autenticação real ainda. Encaminha para o sistema.
    // A fiação do Better Auth entra quando BETTER_AUTH_SECRET estiver configurada.
    setTimeout(() => router.push("/dashboard"), 500);
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 flex flex-col items-center text-center">
        <Image
          src="/multigraos-logo.png"
          alt="Multigrãos — Amendoim & Especiarias"
          width={160}
          height={160}
          priority
          className="h-32 w-32 object-contain"
        />
        <p className="mt-2 font-mono text-xs uppercase tracking-[0.3em] text-white/50">
          Sistema Interno
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-md"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="username"
              className="text-sm font-medium text-white/80"
            >
              {masterMode ? "Master key" : "Nome de usuário"}
            </label>
            <input
              id="username"
              type={masterMode ? "password" : "text"}
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={
                masterMode ? "Chave de administrador" : "seu.usuario"
              }
              className="h-11 rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-white/40"
            />
          </div>

          {!masterMode && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-white/80"
              >
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 w-full rounded-lg border border-white/10 bg-black/40 px-3 pr-10 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-white/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-white/40 transition-colors hover:text-white/80"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex h-11 items-center justify-center gap-2 rounded-lg bg-white text-sm font-semibold text-black transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            {masterMode ? "Acessar como administrador" : "Entrar"}
          </button>

          <button
            type="button"
            onClick={() => setMasterMode((v) => !v)}
            className="flex items-center justify-center gap-2 text-xs text-white/50 transition-colors hover:text-white/80"
          >
            <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
            {masterMode
              ? "Voltar ao login normal"
              : "Acesso via master key (administrador)"}
          </button>
        </div>
      </form>

      <p className="mt-6 text-center text-xs text-white/30">
        Acesso restrito. Usuários são criados internamente pela administração.
      </p>
    </div>
  );
}
