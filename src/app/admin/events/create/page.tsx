"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import api from "@/lib/api";

interface EventFormData {
  title: string;
  description: string;
  shortDescription: string;
  date: string;
  location: {
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  price: number;
  maxParticipants: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  duration: string;
  equipment: string[];
  requirements: string[];
  includes: string[];
  registrationDeadline: string;
  tags: string[];
  status: "active" | "draft";
}

export default function CreateEventPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [equipmentInput, setEquipmentInput] = useState("");
  const [requirementInput, setRequirementInput] = useState("");
  const [includesInput, setIncludesInput] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EventFormData>({
    defaultValues: {
      equipment: [],
      requirements: [],
      includes: [],
      tags: [],
      status: "draft",
    },
  });

  const equipment = watch("equipment") || [];
  const requirements = watch("requirements") || [];
  const includes = watch("includes") || [];
  const tags = watch("tags") || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    router.push("/signin");
    return null;
  }

  const addItem = (
    type: "equipment" | "requirements" | "includes" | "tags",
    value: string
  ) => {
    if (!value.trim()) return;

    const currentItems = watch(type) || [];
    if (!currentItems.includes(value.trim())) {
      setValue(type, [...currentItems, value.trim()]);
    }

    // Clear input
    switch (type) {
      case "equipment":
        setEquipmentInput("");
        break;
      case "requirements":
        setRequirementInput("");
        break;
      case "includes":
        setIncludesInput("");
        break;
      case "tags":
        setTagsInput("");
        break;
    }
  };

  const removeItem = (
    type: "equipment" | "requirements" | "includes" | "tags",
    index: number
  ) => {
    const currentItems = watch(type) || [];
    setValue(
      type,
      currentItems.filter((_, i) => i !== index)
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const onSubmit = async (data: EventFormData) => {
    try {
      setIsSubmitting(true);

      const formData = new FormData();

      // Add event data
      Object.keys(data).forEach((key) => {
        const value = data[key as keyof EventFormData];
        if (typeof value === "object" && value !== null) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });

      // Add images
      images.forEach((image, index) => {
        formData.append("images", image);
        if (index === 0) {
          formData.append("primaryImage", "0"); // First image as primary
        }
      });

      const response = await api.post("/admin/events", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Event created successfully!");
      router.push("/admin/events");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create event");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Create New Event
            </h1>
            <p className="mt-2 text-gray-600">
              Add a new off-road adventure event
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Basic Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Event Title *
                  </label>
                  <input
                    id="title"
                    type="text"
                    {...register("title", { required: "Title is required" })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter event title"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="shortDescription"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Short Description *
                  </label>
                  <input
                    id="shortDescription"
                    type="text"
                    {...register("shortDescription", {
                      required: "Short description is required",
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Brief description for event cards"
                  />
                  {errors.shortDescription && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.shortDescription.message}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Full Description *
                  </label>
                  <textarea
                    id="description"
                    rows={6}
                    {...register("description", {
                      required: "Description is required",
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Detailed event description"
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="date"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Event Date *
                  </label>
                  <input
                    id="date"
                    type="datetime-local"
                    {...register("date", { required: "Date is required" })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.date.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="registrationDeadline"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Registration Deadline *
                  </label>
                  <input
                    id="registrationDeadline"
                    type="datetime-local"
                    {...register("registrationDeadline", {
                      required: "Registration deadline is required",
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                  {errors.registrationDeadline && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.registrationDeadline.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="location.address"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Location *
                  </label>
                  <input
                    id="location.address"
                    type="text"
                    {...register("location.address", {
                      required: "Location is required",
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Event location address"
                  />
                  {errors.location?.address && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.location.address.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="duration"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Duration *
                  </label>
                  <input
                    id="duration"
                    type="text"
                    {...register("duration", {
                      required: "Duration is required",
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    placeholder="e.g., 2 days, 6 hours"
                  />
                  {errors.duration && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.duration.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Event Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Event Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label
                    htmlFor="price"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Price ($) *
                  </label>
                  <input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    {...register("price", {
                      required: "Price is required",
                      min: 0,
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    placeholder="0.00"
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.price.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="maxParticipants"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Max Participants *
                  </label>
                  <input
                    id="maxParticipants"
                    type="number"
                    min="1"
                    {...register("maxParticipants", {
                      required: "Max participants is required",
                      min: 1,
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    placeholder="e.g., 20"
                  />
                  {errors.maxParticipants && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.maxParticipants.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="difficulty"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Difficulty Level *
                  </label>
                  <select
                    id="difficulty"
                    {...register("difficulty", {
                      required: "Difficulty is required",
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="">Select difficulty</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                  {errors.difficulty && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.difficulty.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Equipment, Requirements, Includes */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Additional Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Equipment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Equipment
                  </label>
                  <div className="flex mb-2">
                    <input
                      type="text"
                      value={equipmentInput}
                      onChange={(e) => setEquipmentInput(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Add equipment"
                      onKeyPress={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(),
                        addItem("equipment", equipmentInput))
                      }
                    />
                    <button
                      type="button"
                      onClick={() => addItem("equipment", equipmentInput)}
                      className="px-4 py-2 bg-orange-600 text-white rounded-r-md hover:bg-orange-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-1">
                    {equipment.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-100 px-3 py-1 rounded"
                      >
                        <span className="text-sm">{item}</span>
                        <button
                          type="button"
                          onClick={() => removeItem("equipment", index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Requirements */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Requirements
                  </label>
                  <div className="flex mb-2">
                    <input
                      type="text"
                      value={requirementInput}
                      onChange={(e) => setRequirementInput(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Add requirement"
                      onKeyPress={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(),
                        addItem("requirements", requirementInput))
                      }
                    />
                    <button
                      type="button"
                      onClick={() => addItem("requirements", requirementInput)}
                      className="px-4 py-2 bg-orange-600 text-white rounded-r-md hover:bg-orange-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-1">
                    {requirements.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-100 px-3 py-1 rounded"
                      >
                        <span className="text-sm">{item}</span>
                        <button
                          type="button"
                          onClick={() => removeItem("requirements", index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Includes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What's Included
                  </label>
                  <div className="flex mb-2">
                    <input
                      type="text"
                      value={includesInput}
                      onChange={(e) => setIncludesInput(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Add included item"
                      onKeyPress={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), addItem("includes", includesInput))
                      }
                    />
                    <button
                      type="button"
                      onClick={() => addItem("includes", includesInput)}
                      className="px-4 py-2 bg-orange-600 text-white rounded-r-md hover:bg-orange-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-1">
                    {includes.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-100 px-3 py-1 rounded"
                      >
                        <span className="text-sm">{item}</span>
                        <button
                          type="button"
                          onClick={() => removeItem("includes", index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Images and Tags */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Images and Tags
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="images"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Event Images
                  </label>
                  <input
                    id="images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Upload multiple images. First image will be used as primary.
                  </p>
                  {images.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        {images.length} image(s) selected
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="flex mb-2">
                    <input
                      type="text"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Add tag"
                      onKeyPress={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), addItem("tags", tagsInput))
                      }
                    />
                    <button
                      type="button"
                      onClick={() => addItem("tags", tagsInput)}
                      className="px-4 py-2 bg-orange-600 text-white rounded-r-md hover:bg-orange-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-1">
                    {tags.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-100 px-3 py-1 rounded"
                      >
                        <span className="text-sm">{item}</span>
                        <button
                          type="button"
                          onClick={() => removeItem("tags", index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Status and Submit */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <label
                    htmlFor="status"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Status
                  </label>
                  <select
                    id="status"
                    {...register("status")}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                  </select>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => router.push("/admin/events")}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? "Creating..." : "Create Event"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
