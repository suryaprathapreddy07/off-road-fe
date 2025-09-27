"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { Event, RegistrationFormData } from "@/types";
import { formatDate, formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

export default function EventRegisterPage() {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const eventId = params.id as string;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<RegistrationFormData>();

  useEffect(() => {
    if (!user) {
      router.push("/auth/signin");
      return;
    }
    if (eventId) {
      fetchEvent();
    }
  }, [eventId, user, router]);

  useEffect(() => {
    if (user) {
      // Pre-fill form with user data
      setValue("participantDetails.name", user.name);
      setValue("participantDetails.email", user.email);
      setValue("participantDetails.phone", user.phone);
    }
  }, [user, setValue]);

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

  const onSubmit = async (data: RegistrationFormData) => {
    if (!event) return;

    setSubmitting(true);
    try {
      const registrationData = {
        eventId: eventId,
        participantDetails: data.participantDetails,
      };

      await api.post("/registrations", registrationData);
      toast.success("Registration submitted successfully!");
      router.push(`/events/${eventId}?registered=true`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading registration form...</p>
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <Link
            href={`/events/${eventId}`}
            className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-6"
          >
            ← Back to Event Details
          </Link>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Event Summary */}
            <div className="bg-orange-50 p-6 border-b">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Register for {event.title}
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Date:</span>{" "}
                  {formatDate(event.date)}
                </div>
                <div>
                  <span className="font-medium">Location:</span>{" "}
                  {event.location.address}
                </div>
                <div>
                  <span className="font-medium">Price:</span>{" "}
                  {formatCurrency(event.price)}
                </div>
              </div>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
              {/* Personal Information */}
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      {...register("participantDetails.name", {
                        required: "Name is required",
                      })}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    />
                    {errors.participantDetails?.name && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.participantDetails.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      {...register("participantDetails.email", {
                        required: "Email is required",
                        pattern: {
                          value: /^\S+@\S+$/i,
                          message: "Invalid email address",
                        },
                      })}
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    />
                    {errors.participantDetails?.email && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.participantDetails.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      {...register("participantDetails.phone", {
                        required: "Phone number is required",
                      })}
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    />
                    {errors.participantDetails?.phone && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.participantDetails.phone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Experience Level *
                    </label>
                    <select
                      {...register("participantDetails.experience", {
                        required: "Experience level is required",
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="">Select experience level</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Some Experience">Some Experience</option>
                      <option value="Experienced">Experienced</option>
                      <option value="Expert">Expert</option>
                    </select>
                    {errors.participantDetails?.experience && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.participantDetails.experience.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Emergency Contact
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Name *
                    </label>
                    <input
                      {...register("participantDetails.emergencyContact.name", {
                        required: "Emergency contact name is required",
                      })}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    />
                    {errors.participantDetails?.emergencyContact?.name && (
                      <p className="mt-1 text-sm text-red-600">
                        {
                          errors.participantDetails.emergencyContact.name
                            .message
                        }
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Phone *
                    </label>
                    <input
                      {...register(
                        "participantDetails.emergencyContact.phone",
                        {
                          required: "Emergency contact phone is required",
                        }
                      )}
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    />
                    {errors.participantDetails?.emergencyContact?.phone && (
                      <p className="mt-1 text-sm text-red-600">
                        {
                          errors.participantDetails.emergencyContact.phone
                            .message
                        }
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Relationship *
                    </label>
                    <input
                      {...register(
                        "participantDetails.emergencyContact.relationship",
                        {
                          required: "Relationship is required",
                        }
                      )}
                      type="text"
                      placeholder="e.g., Spouse, Parent, Friend"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    />
                    {errors.participantDetails?.emergencyContact
                      ?.relationship && (
                      <p className="mt-1 text-sm text-red-600">
                        {
                          errors.participantDetails.emergencyContact
                            .relationship.message
                        }
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Vehicle Details */}
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Vehicle Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vehicle Make *
                    </label>
                    <input
                      {...register("participantDetails.vehicleDetails.make", {
                        required: "Vehicle make is required",
                      })}
                      type="text"
                      placeholder="e.g., Toyota, Ford, Jeep"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    />
                    {errors.participantDetails?.vehicleDetails?.make && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.participantDetails.vehicleDetails.make.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vehicle Model *
                    </label>
                    <input
                      {...register("participantDetails.vehicleDetails.model", {
                        required: "Vehicle model is required",
                      })}
                      type="text"
                      placeholder="e.g., Wrangler, F-150, 4Runner"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    />
                    {errors.participantDetails?.vehicleDetails?.model && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.participantDetails.vehicleDetails.model.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vehicle Year *
                    </label>
                    <input
                      {...register("participantDetails.vehicleDetails.year", {
                        required: "Vehicle year is required",
                        min: {
                          value: 1900,
                          message: "Invalid year",
                        },
                        max: {
                          value: new Date().getFullYear() + 1,
                          message: "Invalid year",
                        },
                      })}
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    />
                    {errors.participantDetails?.vehicleDetails?.year && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.participantDetails.vehicleDetails.year.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Modifications
                    </label>
                    <input
                      {...register(
                        "participantDetails.vehicleDetails.modifications"
                      )}
                      type="text"
                      placeholder="e.g., Lift kit, winch, rock sliders"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Medical Information
                </h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medical Conditions
                  </label>
                  <textarea
                    {...register("participantDetails.medicalConditions")}
                    rows={3}
                    placeholder="Please list any medical conditions, allergies, or medications we should be aware of. Leave blank if none."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Additional Information
                </h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    {...register("participantDetails.additionalNotes")}
                    rows={3}
                    placeholder="Any additional information or special requests..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="border-t pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="mb-4 sm:mb-0">
                    <p className="text-lg font-semibold">
                      Total: {formatCurrency(event.price)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Payment will be collected at the event
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto bg-orange-600 text-white px-8 py-3 rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Submitting..." : "Complete Registration"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
