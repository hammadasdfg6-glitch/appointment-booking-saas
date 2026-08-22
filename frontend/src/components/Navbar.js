"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
  const pathname = usePathname();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Dashboard par navbar show nahi hoga
  if (pathname?.startsWith("/dashboard")) {
    return null;
  }

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className={`navbar ${isScrolled ? "shadow" : ""}`}>
      
      {/* Logo */}
      <Link href="/" className="nav-brand" onClick={closeMenu}>
        VestAuth
      </Link>

      {/* Desktop / Mobile Links */}
      <div className={`nav-links ${isMenuOpen ? "mobile-open" : ""}`}>
        <Link
          href="/"
          className={pathname === "/" ? "nav-link active" : "nav-link"}
          onClick={closeMenu}
        >
          Home
        </Link>

        <Link
          href="/book"
          className={
            pathname === "/book" ? "nav-link active" : "nav-link"
          }
          onClick={closeMenu}
        >
          Book Service
        </Link>

        <Link
          href="/login"
          className="nav-btn animate-tap"
          onClick={closeMenu}
        >
          Sign In
        </Link>
      </div>

      {/* Hamburger Button */}
      <button
        className={`menu-toggle ${isMenuOpen ? "open" : ""}`}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle navigation menu"
        aria-expanded={isMenuOpen}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </nav>
  );
}