"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import api from "@/lib/api";
import { Event } from "@/types";
import { toast } from "react-hot-toast";
import { getImageUrl } from "@/lib/utils";

export default function AdminEventsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    difficulty: "",
    search: "",
  });

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/signin");
      return;
    }

    if (user && user.role === "admin") {
      fetchEvents();
    }
  }, [user, isLoading, router, filters]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.difficulty) params.append("difficulty", filters.difficulty);
      if (filters.search) params.append("search", filters.search);

      const response = await api.get(`/admin/events?${params.toString()}`);
      setEvents(response.data.events);
    } catch (error) {
      toast.error("Failed to fetch events");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (eventId: string, newStatus: string) => {
    try {
      await api.patch(`/admin/events/${eventId}`, { status: newStatus });
      toast.success("Event status updated successfully");
      fetchEvents();
    } catch (error) {
      toast.error("Failed to update event status");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this event? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await api.delete(`/admin/events/${eventId}`);
      toast.success("Event deleted successfully");
      fetchEvents();
    } catch (error) {
      toast.error("Failed to delete event");
    }
  };

  if (isLoading || (loading && events.length === 0)) {
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

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Manage Events
              </h1>
              <p className="mt-2 text-gray-600">
                Create, edit, and manage adventure events
              </p>
            </div>
            <button
              onClick={() => router.push("/admin/events/create")}
              className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Create New Event
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Filter Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="search"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Search
                </label>
                <input
                  id="search"
                  type="text"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Search events..."
                />
              </div>
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Status
                </label>
                <select
                  id="status"
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, status: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="difficulty"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Difficulty
                </label>
                <select
                  id="difficulty"
                  value={filters.difficulty}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      difficulty: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">All Difficulties</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Expert">Expert</option>
                </select>
              </div>
            </div>
          </div>

          {/* Events List */}
          <div className="space-y-6">
            {events.map((event) => (
              <div
                key={event._id}
                className="bg-white rounded-lg shadow-sm overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {event.title}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            event.status === "active"
                              ? "bg-green-100 text-green-800"
                              : event.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : event.status === "completed"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {event.status}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            event.difficulty === "Beginner"
                              ? "bg-green-100 text-green-800"
                              : event.difficulty === "Intermediate"
                              ? "bg-yellow-100 text-yellow-800"
                              : event.difficulty === "Advanced"
                              ? "bg-orange-100 text-orange-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {event.difficulty}
                        </span>
                      </div>

                      <p className="text-gray-600 mb-4">
                        {event.shortDescription}
                      </p>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">
                            Date:
                          </span>
                          <p className="text-gray-600">
                            {new Date(event.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            Location:
                          </span>
                          <p className="text-gray-600">
                            {event.location.address}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            Price:
                          </span>
                          <p className="text-gray-600">${event.price}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            Participants:
                          </span>
                          <p className="text-gray-600">
                            {event.currentParticipants}/{event.maxParticipants}
                          </p>
                        </div>
                      </div>
                    </div>

                    {event.images.length > 0 && (
                      <div className="ml-6 flex-shrink-0">
                        <img
                          src={getImageUrl(
                            event.images.find((img) => img.isPrimary)?.url ||
                              event.images[0].url
                          )}
                          alt={
                            event.images.find((img) => img.isPrimary)?.alt ||
                            event.title
                          }
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-6 pt-4 border-t">
                    <div className="flex items-center space-x-4">
                      <select
                        value={event.status}
                        onChange={(e) =>
                          handleStatusChange(event._id, e.target.value)
                        }
                        className="text-sm px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                      >
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      <span className="text-sm text-gray-500">
                        Created:{" "}
                        {new Date(event.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => router.push(`/events/${event._id}`)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View
                      </button>
                      <button
                        onClick={() =>
                          router.push(`/admin/events/${event._id}/edit`)
                        }
                        className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          router.push(
                            `/admin/events/${event._id}/registrations`
                          )
                        }
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        Registrations ({event.currentParticipants})
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event._id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {events.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No events found</p>
                <p className="text-gray-400 mt-2">
                  Create your first event to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
