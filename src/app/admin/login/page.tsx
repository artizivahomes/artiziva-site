"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Mail, ArrowRight } from "lucide-react";
import Image from "next/image";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }
      window.location.href = "/admin";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full bg-bg-card border border-border px-4 py-3.5 text-cream text-sm placeholder:text-text-muted focus:border-gold transition-colors";

  return (
    <section className="min-h-screen flex items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="relative w-12 h-12 mx-auto mb-4 overflow-hidden rounded-sm">
            <Image src="/images/logo.png" alt="Artiziva Homes" fill className="object-cover" />
          </div>
          <h1 className="font-serif text-2xl text-cream mb-1">Admin Access</h1>
          <p className="text-text-muted text-sm">Founders only</p>
        </div>

        <form onSubmit={handleLogin} className="p-8 border border-border bg-bg-card luxury-shadow space-y-5">
          {error && (
            <div className="p-3 bg-error/10 border border-error/30 text-error text-sm">{error}</div>
          )}
          <div>
            <label className="block text-xs tracking-[0.15em] uppercase text-text-secondary mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="founder@artizivahomes.com" className={`${inputClass} pl-10`} />
            </div>
          </div>
          <div>
            <label className="block text-xs tracking-[0.15em] uppercase text-text-secondary mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className={`${inputClass} pl-10`} />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-luxury btn-gold w-full group">
            {loading ? "Signing in..." : "Sign In"}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>
      </motion.div>
    </section>
  );
}
