"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageLayout } from "../components";

const departments = [
  "Business Studies",
  "Information Systems",
  "Health Sciences",
  "Education",
  "Communication Arts",
  "Other",
];

export default function SignupPage() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    student_id: "",
    department: "",
    year_level: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);
    
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          year_level: Number(form.year_level),
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setSuccess(true);
        
        // Show success message and redirect to login page
        setTimeout(() => {
          router.push("/login");
        }, 2000);
        
        // Clear form
        setForm({
          full_name: "",
          email: "",
          password: "",
          student_id: "",
          department: "",
          year_level: "",
          phone: "",
        });
      } else {
        setError(data.error || "Sign up failed. Please try again.");
      }
    } catch {
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
            <h2 className="mt-10 text-center text-3xl font-extrabold text-[#359d49]">Student Sign Up</h2>
            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-[#359d49]">Full Name</label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  autoComplete="name"
                  required
                  value={form.full_name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-[#2a6b39]/30 bg-[#ddc753]/10 px-3 py-2 shadow-sm focus:border-[#359d49] focus:ring-2 focus:ring-[#359d49]/30 text-gray-900"
                />
              </div>
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
                  autoComplete="new-password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-[#2a6b39]/30 bg-[#ddc753]/10 px-3 py-2 shadow-sm focus:border-[#359d49] focus:ring-2 focus:ring-[#359d49]/30 text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="student_id" className="block text-sm font-medium text-[#359d49]">Student ID</label>
                <input
                  id="student_id"
                  name="student_id"
                  type="text"
                  required
                  value={form.student_id}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-[#2a6b39]/30 bg-[#ddc753]/10 px-3 py-2 shadow-sm focus:border-[#359d49] focus:ring-2 focus:ring-[#359d49]/30 text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-[#359d49]">Department</label>
                <select
                  id="department"
                  name="department"
                  required
                  value={form.department}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-[#2a6b39]/30 bg-[#ddc753]/10 px-3 py-2 shadow-sm focus:border-[#359d49] focus:ring-2 focus:ring-[#359d49]/30 text-gray-900"
                >
                  <option value="">Select department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="year_level" className="block text-sm font-medium text-[#359d49]">Year Level</label>
                <select
                  id="year_level"
                  name="year_level"
                  required
                  value={form.year_level}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-[#2a6b39]/30 bg-[#ddc753]/10 px-3 py-2 shadow-sm focus:border-[#359d49] focus:ring-2 focus:ring-[#359d49]/30 text-gray-900"
                >
                  <option value="">Select year</option>
                  {[1, 2, 3, 4].map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-[#359d49]">Phone (optional)</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-lg border border-[#2a6b39]/30 bg-[#ddc753]/10 px-3 py-2 shadow-sm focus:border-[#359d49] focus:ring-2 focus:ring-[#359d49]/30 text-gray-900"
                />
              </div>
              {error && <div className="text-red-600 text-sm font-medium">{error}</div>}
              {success && (
                <div className="text-green-600 text-sm font-medium">
                  Sign up successful! Redirecting to login page...
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-base font-semibold text-white bg-[#359d49] hover:bg-[#2a6b39] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#359d49] disabled:opacity-50 mt-4"
                style={{ position: 'sticky', bottom: 0, zIndex: 10 }}
              >
                {loading ? "Signing up..." : "Sign Up"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </PageLayout>
  );
} 