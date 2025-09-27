"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-orange-600">
              Off-Road Adventures
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link
              href="/events"
              className="text-gray-700 hover:text-orange-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              Events
            </Link>
            <Link
              href="/gallery"
              className="text-gray-700 hover:text-orange-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              Gallery
            </Link>
            <Link
              href="/contact"
              className="text-gray-700 hover:text-orange-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              Contact
            </Link>
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Welcome, {user.name}
                </span>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="bg-orange-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-orange-700"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/profile"
                  className="text-gray-700 hover:text-orange-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Profile
                </Link>
                <button
                  onClick={logout}
                  className="text-gray-700 hover:text-orange-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/auth/signin"
                  className="text-gray-700 hover:text-orange-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-700"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
