"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/utils/api";
import Link from "next/link";
import "./register.css";

export default function RegisterOrgPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    ownerName: "",
    ownerEmail: "",
    password: "",
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiFetch("/api/auth/orgs", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      if (data.success) {
        router.push("/dashboard/admin");
      }
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container fade-in">
      <div className="register-card">

        <h1 className="register-title">
          Get Started
        </h1>

        <p className="register-subtitle">
          Create your organization and admin account.
        </p>

        {error && (
          <div className="register-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">

          <div className="register-row">
            <input
              type="text"
              name="name"
              placeholder="Organization Name"
              value={formData.name}
              onChange={handleChange}
              required
              className="register-input"
            />

            <input
              type="text"
              name="slug"
              placeholder="Org Slug (e.g. my-biz)"
              value={formData.slug}
              onChange={handleChange}
              required
              className="register-input"
            />
          </div>

          <input
            type="text"
            name="ownerName"
            placeholder="Your Full Name"
            value={formData.ownerName}
            onChange={handleChange}
            required
            className="register-input"
          />

          <input
            type="email"
            name="ownerEmail"
            placeholder="Work Email Address"
            value={formData.ownerEmail}
            onChange={handleChange}
            required
            className="register-input"
          />

          <input
            type="password"
            name="password"
            placeholder="Create Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="register-input"
          />

          <button
            type="submit"
            className="register-button animate-tap"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Organization"}
          </button>
        </form>

        <p className="register-login">
          Already have an account?{" "}
          <Link href="/login" className="register-link">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  );
}