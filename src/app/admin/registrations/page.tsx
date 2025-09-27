"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import api from "@/lib/api";
import { toast } from "react-hot-toast";

interface Registration {
  _id: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  vehicleInfo: {
    make: string;
    model: string;
    year: number;
    modifications?: string;
  };
  medicalInfo: {
    conditions?: string;
    medications?: string;
    allergies?: string;
    insuranceProvider?: string;
    insuranceNumber?: string;
  };
  experienceLevel: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  specialRequests?: string;
  status: "pending" | "approved" | "rejected";
  event: {
    _id: string;
    title: string;
    date: string;
  };
  user: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function AdminRegistrationsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegistration, setSelectedRegistration] =
    useState<Registration | null>(null);
  const [filters, setFilters] = useState({
    status: "",
    event: "",
    search: "",
  });

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/signin");
      return;
    }

    if (user && user.role === "admin") {
      fetchRegistrations();
    }
  }, [user, isLoading, router, filters]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.event) params.append("event", filters.event);
      if (filters.search) params.append("search", filters.search);

      const response = await api.get(
        `/admin/registrations?${params.toString()}`
      );
      setRegistrations(response.data.registrations || []);
    } catch (error) {
      toast.error("Failed to fetch registrations");
      console.error("Error fetching registrations:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateRegistrationStatus = async (
    registrationId: string,
    newStatus: string
  ) => {
    try {
      await api.patch(`/admin/registrations/${registrationId}`, {
        status: newStatus,
      });
      toast.success("Registration status updated successfully");
      fetchRegistrations();
    } catch (error) {
      toast.error("Failed to update registration status");
      console.error("Error updating registration:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getExperienceColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "bg-green-100 text-green-800";
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "Advanced":
        return "bg-orange-100 text-orange-800";
      case "Expert":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading registrations...</p>
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
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Event Registrations
            </h1>
            <p className="mt-2 text-gray-600">
              Manage participant registrations for events
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Filter Registrations</h2>
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
                  placeholder="Search by name or email..."
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
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="event"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Event
                </label>
                <select
                  id="event"
                  value={filters.event}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, event: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">All Events</option>
                  {Array.from(
                    new Set(registrations.map((r) => r.event._id))
                  ).map((eventId) => {
                    const event = registrations.find(
                      (r) => r.event._id === eventId
                    )?.event;
                    return event ? (
                      <option key={eventId} value={eventId}>
                        {event.title}
                      </option>
                    ) : null;
                  })}
                </select>
              </div>
            </div>
          </div>

          {/* Registrations List */}
          <div className="space-y-4">
            {registrations.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No registrations found</p>
                <p className="text-gray-400 mt-2">
                  Registrations will appear here when users sign up for events
                </p>
              </div>
            ) : (
              registrations.map((registration) => (
                <div
                  key={registration._id}
                  className="bg-white rounded-lg shadow-sm p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {registration.personalInfo.firstName}{" "}
                          {registration.personalInfo.lastName}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                            registration.status
                          )}`}
                        >
                          {registration.status}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getExperienceColor(
                            registration.experienceLevel
                          )}`}
                        >
                          {registration.experienceLevel}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <span className="font-medium text-gray-700">
                            Event:
                          </span>
                          <p className="text-gray-600">
                            {registration.event.title}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            Email:
                          </span>
                          <p className="text-gray-600">
                            {registration.personalInfo.email}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            Phone:
                          </span>
                          <p className="text-gray-600">
                            {registration.personalInfo.phone}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">
                            Vehicle:
                          </span>
                          <p className="text-gray-600">
                            {registration.vehicleInfo.year}{" "}
                            {registration.vehicleInfo.make}{" "}
                            {registration.vehicleInfo.model}
                          </p>
                        </div>
                      </div>

                      <div className="text-sm text-gray-500">
                        Registered:{" "}
                        {new Date(registration.createdAt).toLocaleDateString()}{" "}
                        at{" "}
                        {new Date(registration.createdAt).toLocaleTimeString()}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => setSelectedRegistration(registration)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Details
                      </button>

                      {registration.status === "pending" && (
                        <>
                          <button
                            onClick={() =>
                              updateRegistrationStatus(
                                registration._id,
                                "approved"
                              )
                            }
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              updateRegistrationStatus(
                                registration._id,
                                "rejected"
                              )
                            }
                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {registration.status !== "pending" && (
                        <select
                          value={registration.status}
                          onChange={(e) =>
                            updateRegistrationStatus(
                              registration._id,
                              e.target.value
                            )
                          }
                          className="text-sm px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Registration Details Modal */}
      {selectedRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Registration Details
                </h2>
                <button
                  onClick={() => setSelectedRegistration(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Personal Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Name:</span>{" "}
                      {selectedRegistration.personalInfo.firstName}{" "}
                      {selectedRegistration.personalInfo.lastName}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span>{" "}
                      {selectedRegistration.personalInfo.email}
                    </div>
                    <div>
                      <span className="font-medium">Phone:</span>{" "}
                      {selectedRegistration.personalInfo.phone}
                    </div>
                    <div>
                      <span className="font-medium">Date of Birth:</span>{" "}
                      {new Date(
                        selectedRegistration.personalInfo.dateOfBirth
                      ).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Address:</span>
                      <div className="ml-4">
                        {selectedRegistration.personalInfo.address.street}
                        <br />
                        {selectedRegistration.personalInfo.address.city},{" "}
                        {selectedRegistration.personalInfo.address.state}{" "}
                        {selectedRegistration.personalInfo.address.zipCode}
                        <br />
                        {selectedRegistration.personalInfo.address.country}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Emergency Contact
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Name:</span>{" "}
                      {selectedRegistration.emergencyContact.name}
                    </div>
                    <div>
                      <span className="font-medium">Relationship:</span>{" "}
                      {selectedRegistration.emergencyContact.relationship}
                    </div>
                    <div>
                      <span className="font-medium">Phone:</span>{" "}
                      {selectedRegistration.emergencyContact.phone}
                    </div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Vehicle Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Vehicle:</span>{" "}
                      {selectedRegistration.vehicleInfo.year}{" "}
                      {selectedRegistration.vehicleInfo.make}{" "}
                      {selectedRegistration.vehicleInfo.model}
                    </div>
                    {selectedRegistration.vehicleInfo.modifications && (
                      <div>
                        <span className="font-medium">Modifications:</span>{" "}
                        {selectedRegistration.vehicleInfo.modifications}
                      </div>
                    )}
                  </div>
                </div>

                {/* Medical Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Medical Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    {selectedRegistration.medicalInfo.conditions && (
                      <div>
                        <span className="font-medium">Medical Conditions:</span>{" "}
                        {selectedRegistration.medicalInfo.conditions}
                      </div>
                    )}
                    {selectedRegistration.medicalInfo.medications && (
                      <div>
                        <span className="font-medium">Medications:</span>{" "}
                        {selectedRegistration.medicalInfo.medications}
                      </div>
                    )}
                    {selectedRegistration.medicalInfo.allergies && (
                      <div>
                        <span className="font-medium">Allergies:</span>{" "}
                        {selectedRegistration.medicalInfo.allergies}
                      </div>
                    )}
                    {selectedRegistration.medicalInfo.insuranceProvider && (
                      <div>
                        <span className="font-medium">Insurance:</span>{" "}
                        {selectedRegistration.medicalInfo.insuranceProvider}
                        {selectedRegistration.medicalInfo.insuranceNumber &&
                          ` - ${selectedRegistration.medicalInfo.insuranceNumber}`}
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Information */}
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Additional Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Experience Level:</span>{" "}
                      {selectedRegistration.experienceLevel}
                    </div>
                    {selectedRegistration.specialRequests && (
                      <div>
                        <span className="font-medium">Special Requests:</span>{" "}
                        {selectedRegistration.specialRequests}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Event:</span>{" "}
                      {selectedRegistration.event.title}
                    </div>
                    <div>
                      <span className="font-medium">Registration Date:</span>{" "}
                      {new Date(
                        selectedRegistration.createdAt
                      ).toLocaleDateString()}{" "}
                      at{" "}
                      {new Date(
                        selectedRegistration.createdAt
                      ).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                {selectedRegistration.status === "pending" && (
                  <>
                    <button
                      onClick={() => {
                        updateRegistrationStatus(
                          selectedRegistration._id,
                          "approved"
                        );
                        setSelectedRegistration(null);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        updateRegistrationStatus(
                          selectedRegistration._id,
                          "rejected"
                        );
                        setSelectedRegistration(null);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedRegistration(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
