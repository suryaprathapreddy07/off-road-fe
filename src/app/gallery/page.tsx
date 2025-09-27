"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import api from "@/lib/api";
import { GalleryImage } from "@/types";
import { getImageUrl } from "@/lib/utils";

export default function GalleryPage() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [filters, setFilters] = useState({
    category: "",
    featured: "",
  });

  useEffect(() => {
    fetchImages();
  }, [filters]);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.category) params.append("category", filters.category);
      if (filters.featured) params.append("featured", filters.featured);

      const response = await api.get(`/gallery?${params.toString()}`);
      setImages(response.data.images);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch gallery images");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const openModal = (image: GalleryImage) => {
    setSelectedImage(image);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  const likeImage = async (imageId: string) => {
    try {
      await api.post(`/gallery/${imageId}/like`);
      // Update the local state
      setImages((prev) =>
        prev.map((img) =>
          img._id === imageId ? { ...img, likes: img.likes + 1 } : img
        )
      );
    } catch (err) {
      console.error("Failed to like image:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading gallery...</p>
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
              Adventure Gallery
            </h1>
            <p className="text-xl text-center max-w-2xl mx-auto">
              Explore breathtaking moments from our off-road adventures
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Filter Images</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Category
                </label>
                <select
                  id="category"
                  value={filters.category}
                  onChange={(e) =>
                    handleFilterChange("category", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">All Categories</option>
                  <option value="Events">Events</option>
                  <option value="Vehicles">Vehicles</option>
                  <option value="Landscapes">Landscapes</option>
                  <option value="Action">Action</option>
                  <option value="Group Photos">Group Photos</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="featured"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Featured
                </label>
                <select
                  id="featured"
                  value={filters.featured}
                  onChange={(e) =>
                    handleFilterChange("featured", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">All Images</option>
                  <option value="true">Featured Only</option>
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

          {/* Images Grid */}
          {images.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No images found</p>
              <p className="text-gray-400 mt-2">
                Try adjusting your filters or check back later
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image) => (
                <div
                  key={image._id}
                  className="relative group cursor-pointer bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  onClick={() => openModal(image)}
                >
                  <div className="aspect-square relative">
                    <img
                      src={getImageUrl(image.imageUrl)}
                      alt={image.altText}
                      className="w-full h-full object-cover"
                    />
                    {image.featured && (
                      <div className="absolute top-2 left-2">
                        <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full">
                          ⭐ Featured
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-center">
                        <p className="font-medium">{image.title}</p>
                        <p className="text-sm mt-1">{image.category}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3">
                    <h3 className="font-medium text-gray-900 truncate">
                      {image.title}
                    </h3>
                    <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                      <span>{image.category}</span>
                      <div className="flex items-center space-x-3">
                        <span>👁️ {image.views}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            likeImage(image._id);
                          }}
                          className="flex items-center hover:text-red-500 transition-colors"
                        >
                          ❤️ {image.likes}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto">
              <div className="relative">
                <button
                  onClick={closeModal}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 bg-white rounded-full p-2 z-10"
                >
                  ✕
                </button>
                <img
                  src={getImageUrl(selectedImage.imageUrl)}
                  alt={selectedImage.altText}
                  className="w-full h-auto max-h-96 object-contain"
                />
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedImage.title}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {selectedImage.category}
                    </p>
                  </div>
                  {selectedImage.featured && (
                    <span className="bg-yellow-500 text-white text-sm px-3 py-1 rounded-full">
                      ⭐ Featured
                    </span>
                  )}
                </div>

                {selectedImage.description && (
                  <p className="text-gray-700 mb-4">
                    {selectedImage.description}
                  </p>
                )}

                {selectedImage.event && (
                  <div className="bg-orange-50 p-3 rounded-md mb-4">
                    <p className="text-sm text-gray-600">From event:</p>
                    <p className="font-medium text-orange-600">
                      {selectedImage.event.title}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span>👁️ {selectedImage.views} views</span>
                    <button
                      onClick={() => likeImage(selectedImage._id)}
                      className="flex items-center hover:text-red-500 transition-colors"
                    >
                      ❤️ {selectedImage.likes} likes
                    </button>
                  </div>
                  <p>By {selectedImage.uploadedBy.name}</p>
                </div>

                {selectedImage.tags.length > 0 && (
                  <div className="mt-4">
                    <div className="flex flex-wrap gap-2">
                      {selectedImage.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
