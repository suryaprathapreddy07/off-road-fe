"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import api from "@/lib/api";
import { toast } from "react-hot-toast";

interface DashboardStats {
  totalEvents: number;
  totalRegistrations: number;
  totalUsers: number;
  totalGalleryImages: number;
  recentRegistrations: any[];
  recentContacts: any[];
}

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/signin");
      return;
    }

    if (user && user.role === "admin") {
      fetchStats();
    }
  }, [user, isLoading, router]);

  const fetchStats = async () => {
    try {
      const response = await api.get("/admin/dashboard-stats");
      setStats(response.data);
    } catch (error) {
      toast.error("Failed to fetch dashboard statistics");
    } finally {
      setStatsLoading(false);
    }
  };

  if (isLoading || statsLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="mt-2 text-gray-600">Welcome back, {user.name}!</p>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Events
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalEvents}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Registrations
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalRegistrations}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <svg
                      className="w-6 h-6 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Users
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalUsers}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <svg
                      className="w-6 h-6 text-orange-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Gallery Images
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalGalleryImages}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => router.push("/admin/events/create")}
                className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left"
              >
                <div className="flex items-center">
                  <svg
                    className="w-8 h-8 text-blue-600 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <div>
                    <h3 className="font-medium text-blue-900">Create Event</h3>
                    <p className="text-sm text-blue-600">Add new adventure</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => router.push("/admin/gallery/upload")}
                className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-left"
              >
                <div className="flex items-center">
                  <svg
                    className="w-8 h-8 text-green-600 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <div>
                    <h3 className="font-medium text-green-900">
                      Upload Images
                    </h3>
                    <p className="text-sm text-green-600">Add to gallery</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => router.push("/admin/registrations")}
                className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-left"
              >
                <div className="flex items-center">
                  <svg
                    className="w-8 h-8 text-purple-600 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <div>
                    <h3 className="font-medium text-purple-900">
                      View Registrations
                    </h3>
                    <p className="text-sm text-purple-600">
                      Manage participants
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => router.push("/admin/contacts")}
                className="p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors text-left"
              >
                <div className="flex items-center">
                  <svg
                    className="w-8 h-8 text-orange-600 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <div>
                    <h3 className="font-medium text-orange-900">
                      View Messages
                    </h3>
                    <p className="text-sm text-orange-600">Contact inquiries</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          {stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Registrations */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Recent Registrations
                </h2>
                {stats.recentRegistrations.length === 0 ? (
                  <p className="text-gray-500">No recent registrations</p>
                ) : (
                  <div className="space-y-4">
                    {stats.recentRegistrations.map((registration) => (
                      <div
                        key={registration._id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {registration.personalInfo.firstName}{" "}
                            {registration.personalInfo.lastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {registration.event.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(
                              registration.createdAt
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            registration.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : registration.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {registration.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Contacts */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Recent Messages
                </h2>
                {stats.recentContacts.length === 0 ? (
                  <p className="text-gray-500">No recent messages</p>
                ) : (
                  <div className="space-y-4">
                    {stats.recentContacts.map((contact) => (
                      <div
                        key={contact._id}
                        className="p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-gray-900">
                            {contact.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(contact.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {contact.subject}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {contact.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
