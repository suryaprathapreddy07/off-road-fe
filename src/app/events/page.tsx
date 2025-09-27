"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import api from "@/lib/api";
import { Event } from "@/types";
import {
  formatDate,
  formatCurrency,
  getDifficultyColor,
  getImageUrl,
} from "@/lib/utils";

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    difficulty: "",
    search: "",
  });

  const searchParams = useSearchParams();

  useEffect(() => {
    fetchEvents();
  }, [filters]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.difficulty) params.append("difficulty", filters.difficulty);
      if (filters.search) params.append("search", filters.search);

      const response = await api.get(`/events?${params.toString()}`);
      setEvents(response.data.events);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading events...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-50">
        {/* Hero Section */}
        <div className="bg-orange-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold text-center mb-4">
              Off-Road Adventures
            </h1>
            <p className="text-xl text-center max-w-2xl mx-auto">
              Discover exciting off-road events and join the adventure community
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Filter Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Events
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Search events..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty Level
                </label>
                <select
                  value={filters.difficulty}
                  onChange={(e) =>
                    handleFilterChange("difficulty", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">All Levels</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-8">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Events Grid */}
          {events.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No events found</p>
              <p className="text-gray-400 mt-2">
                Try adjusting your filters or check back later
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <div
                  key={event._id}
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Event Image */}
                  <div className="h-48 bg-gray-200 relative">
                    {event.images.length > 0 ? (
                      <img
                        src={getImageUrl(event.images[0].url)}
                        alt={event.images[0].alt}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-4xl">🏔️</span>
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
                          event.difficulty
                        )}`}
                      >
                        {event.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {event.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {event.shortDescription}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2">📅</span>
                        {formatDate(event.date)}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2">📍</span>
                        {event.location.address}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2">⏱️</span>
                        {event.duration}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="mr-2">👥</span>
                        {event.currentParticipants}/{event.maxParticipants}{" "}
                        participants
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-orange-600">
                        {formatCurrency(event.price)}
                      </span>
                      <Link
                        href={`/events/${event._id}`}
                        className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
