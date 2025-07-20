"use client";

import { useState } from "react";
import Link from "next/link";
import { PageLayout } from "../components";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1000);
      } else {
        setError(data.error || "Login failed. Please try again.");
      }
    } catch (error) {
      console.error('Login error:', error);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout>
      <div className="flex min-h-[calc(100vh-120px)] items-center justify-center bg-gradient-to-br from-[#359d49]/10 via-[#ddc753]/10 to-[#2a6b39]/10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="rounded-2xl shadow-xl border border-[#2a6b39]/30 bg-white/95 backdrop-blur-md p-8 relative">
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center justify-center w-16 h-16 rounded-full bg-[#359d49] shadow-lg border-4 border-white">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
            </div>
            <h2 className="mt-10 text-center text-3xl font-extrabold text-[#359d49]">Login</h2>
            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#359d49]">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-[#2a6b39]/30 bg-[#ddc753]/10 px-3 py-2 shadow-sm focus:border-[#359d49] focus:ring-2 focus:ring-[#359d49]/30 text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#359d49]">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-[#2a6b39]/30 bg-[#ddc753]/10 px-3 py-2 shadow-sm focus:border-[#359d49] focus:ring-2 focus:ring-[#359d49]/30 text-gray-900"
                />
              </div>
              {error && <div className="text-red-600 text-sm font-medium">{error}</div>}
              {success && (
                <div className="text-green-600 text-sm font-medium">
                  Login successful! Redirecting to dashboard...
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-base font-semibold text-white bg-[#359d49] hover:bg-[#2a6b39] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#359d49] disabled:opacity-50 mt-4"
                style={{ position: 'sticky', bottom: 0, zIndex: 10 }}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
            <div className="mt-6 text-center">
              <span className="text-gray-700">Don&apos;t have an account? </span>
              <Link href="/signup" className="text-[#359d49] font-semibold hover:underline">Sign up</Link>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
} 