"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { Event } from "@/types";
import {
  formatDate,
  formatCurrency,
  getDifficultyColor,
  getImageUrl,
  isEventRegistrationOpen,
} from "@/lib/utils";

export default function EventDetailPage() {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);

  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const eventId = params.id as string;

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/events/${eventId}`);
      setEvent(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch event details");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    if (!user) {
      router.push("/auth/signin");
      return;
    }
    router.push(`/events/${eventId}/register`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading event details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 text-lg">{error || "Event not found"}</p>
            <Link
              href="/events"
              className="mt-4 inline-block bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700"
            >
              Back to Events
            </Link>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <Link
            href="/events"
            className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-6"
          >
            ← Back to Events
          </Link>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Event Images */}
            {event.images.length > 0 && (
              <div className="h-64 md:h-96 relative">
                <img
                  src={getImageUrl(event.images[0].url)}
                  alt={event.images[0].alt}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(
                      event.difficulty
                    )}`}
                  >
                    {event.difficulty}
                  </span>
                </div>
              </div>
            )}

            <div className="p-6 md:p-8">
              {/* Event Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {event.title}
                  </h1>
                  <p className="text-lg text-gray-600">
                    {event.shortDescription}
                  </p>
                </div>
                <div className="mt-4 md:mt-0 text-right">
                  <div className="text-3xl font-bold text-orange-600">
                    {formatCurrency(event.price)}
                  </div>
                  <div className="text-sm text-gray-500">per person</div>
                </div>
              </div>

              {/* Event Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <span className="text-gray-400 mr-3">📅</span>
                    <div>
                      <div className="font-medium">Date</div>
                      <div className="text-gray-600">
                        {formatDate(event.date)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <span className="text-gray-400 mr-3">📍</span>
                    <div>
                      <div className="font-medium">Location</div>
                      <div className="text-gray-600">
                        {event.location.address}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <span className="text-gray-400 mr-3">⏱️</span>
                    <div>
                      <div className="font-medium">Duration</div>
                      <div className="text-gray-600">{event.duration}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <span className="text-gray-400 mr-3">👥</span>
                    <div>
                      <div className="font-medium">Participants</div>
                      <div className="text-gray-600">
                        {event.currentParticipants}/{event.maxParticipants}{" "}
                        registered
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <span className="text-gray-400 mr-3">🎯</span>
                    <div>
                      <div className="font-medium">Difficulty</div>
                      <div className="text-gray-600">{event.difficulty}</div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <span className="text-gray-400 mr-3">⏰</span>
                    <div>
                      <div className="font-medium">Registration Deadline</div>
                      <div className="text-gray-600">
                        {formatDate(event.registrationDeadline)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Description</h2>
                <div className="prose max-w-none text-gray-700">
                  {event.description.split("\n").map((paragraph, index) => (
                    <p key={index} className="mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              {/* Equipment & Requirements */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {event.equipment.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      Equipment Needed
                    </h3>
                    <ul className="space-y-2">
                      {event.equipment.map((item, index) => (
                        <li
                          key={index}
                          className="flex items-center text-gray-600"
                        >
                          <span className="text-orange-600 mr-2">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {event.requirements.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Requirements</h3>
                    <ul className="space-y-2">
                      {event.requirements.map((item, index) => (
                        <li
                          key={index}
                          className="flex items-center text-gray-600"
                        >
                          <span className="text-orange-600 mr-2">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {event.includes.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">
                      What's Included
                    </h3>
                    <ul className="space-y-2">
                      {event.includes.map((item, index) => (
                        <li
                          key={index}
                          className="flex items-center text-gray-600"
                        >
                          <span className="text-green-600 mr-2">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Registration Button */}
              <div className="border-t pt-6">
                {isEventRegistrationOpen(event) ? (
                  <button
                    onClick={handleRegister}
                    disabled={registering}
                    className="w-full md:w-auto bg-orange-600 text-white px-8 py-3 rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {registering ? "Processing..." : "Register for this Event"}
                  </button>
                ) : (
                  <div className="text-center md:text-left">
                    <div className="inline-block bg-gray-100 text-gray-600 px-8 py-3 rounded-md">
                      Registration Closed
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {event.currentParticipants >= event.maxParticipants
                        ? "This event is fully booked"
                        : "Registration deadline has passed"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
