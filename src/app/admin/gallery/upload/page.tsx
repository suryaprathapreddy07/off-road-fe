"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import api from "@/lib/api";
import React from "react";

interface GalleryFormData {
  title: string;
  description?: string;
  altText: string;
  category:
    | "Events"
    | "Vehicles"
    | "Landscapes"
    | "Action"
    | "Group Photos"
    | "Other";
  tags: string[];
  featured: boolean;
  eventId?: string;
}

interface Event {
  _id: string;
  title: string;
  date: string;
}

export default function UploadGalleryPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [tagsInput, setTagsInput] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<GalleryFormData>({
    defaultValues: {
      tags: [],
      featured: false,
      category: "Other",
    },
  });

  const tags = watch("tags") || [];
  const category = watch("category");

  React.useEffect(() => {
    if (category === "Events") {
      fetchEvents();
    }
  }, [category]);

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

  const fetchEvents = async () => {
    try {
      setLoadingEvents(true);
      const response = await api.get("/events");
      setEvents(response.data.events || []);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoadingEvents(false);
    }
  };

  const addTag = (value: string) => {
    if (!value.trim()) return;

    const currentTags = watch("tags") || [];
    if (!currentTags.includes(value.trim())) {
      setValue("tags", [...currentTags, value.trim()]);
    }
    setTagsInput("");
  };

  const removeTag = (index: number) => {
    const currentTags = watch("tags") || [];
    setValue(
      "tags",
      currentTags.filter((_, i) => i !== index)
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImages(files);

      // Create previews
      const previews = files.map((file) => URL.createObjectURL(file));
      setImagePreviews(previews);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);

    setImages(newImages);
    setImagePreviews(newPreviews);

    // Revoke the removed preview URL
    URL.revokeObjectURL(imagePreviews[index]);
  };

  const onSubmit = async (data: GalleryFormData) => {
    if (images.length === 0) {
      toast.error("Please select at least one image");
      return;
    }

    try {
      setIsSubmitting(true);

      for (const image of images) {
        const formData = new FormData();

        // Add image
        formData.append("image", image);

        // Add metadata
        formData.append("title", data.title);
        formData.append("altText", data.altText);
        formData.append("category", data.category);
        formData.append("featured", String(data.featured));

        if (data.description) {
          formData.append("description", data.description);
        }

        if (data.eventId) {
          formData.append("eventId", data.eventId);
        }

        // Add tags
        data.tags.forEach((tag) => {
          formData.append("tags[]", tag);
        });

        await api.post("gallery/", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      toast.success(`${images.length} image(s) uploaded successfully!`);
      router.push("/gallery");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to upload images");
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
            <h1 className="text-3xl font-bold text-gray-900">Upload Images</h1>
            <p className="mt-2 text-gray-600">Add new images to the gallery</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Image Upload */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Select Images
              </h2>

              <div>
                <label
                  htmlFor="images"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Images *
                </label>
                <input
                  id="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Select multiple images to upload. Supported formats: JPG, PNG,
                  GIF
                </p>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Selected Images ({imagePreviews.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {imagePreviews.map((preview, index) => (
                      <div key={preview} className="relative">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-700"
                        >
                          ×
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 rounded-b-lg">
                          {images[index]?.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Image Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Image Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Title *
                  </label>
                  <input
                    id="title"
                    type="text"
                    {...register("title", { required: "Title is required" })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Enter image title"
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="altText"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Alt Text *
                  </label>
                  <input
                    id="altText"
                    type="text"
                    {...register("altText", {
                      required: "Alt text is required",
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Describe the image for accessibility"
                  />
                  {errors.altText && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.altText.message}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    {...register("description")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Optional description for the image"
                  />
                </div>

                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Category *
                  </label>
                  <select
                    id="category"
                    {...register("category", {
                      required: "Category is required",
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option value="Events">Events</option>
                    <option value="Vehicles">Vehicles</option>
                    <option value="Landscapes">Landscapes</option>
                    <option value="Action">Action</option>
                    <option value="Group Photos">Group Photos</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.category.message}
                    </p>
                  )}
                </div>

                {category === "Events" && (
                  <div>
                    <label
                      htmlFor="eventId"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Related Event
                    </label>
                    <select
                      id="eventId"
                      {...register("eventId")}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                      disabled={loadingEvents}
                    >
                      <option value="">Select an event (optional)</option>
                      {events.map((event) => (
                        <option key={event._id} value={event._id}>
                          {event.title} -{" "}
                          {new Date(event.date).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                    {loadingEvents && (
                      <p className="mt-1 text-sm text-gray-500">
                        Loading events...
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Tags and Settings */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Tags and Settings
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="tags-input"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Tags
                  </label>
                  <div className="flex mb-2">
                    <input
                      id="tags-input"
                      type="text"
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Add tag"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag(tagsInput);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => addTag(tagsInput)}
                      className="px-4 py-2 bg-orange-600 text-white rounded-r-md hover:bg-orange-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-1">
                    {tags.map((tag, index) => (
                      <div
                        key={`${tag}-${index}`}
                        className="flex items-center justify-between bg-gray-100 px-3 py-1 rounded"
                      >
                        <span className="text-sm">{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeTag(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Settings
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        id="featured"
                        type="checkbox"
                        {...register("featured")}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="featured"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        Mark as featured image
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">
                    {images.length > 0
                      ? `Ready to upload ${images.length} image(s)`
                      : "No images selected"}
                  </p>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => router.push("/gallery")}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || images.length === 0}
                    className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? "Uploading..." : "Upload Images"}
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
