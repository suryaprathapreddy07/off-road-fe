"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import api from "@/lib/api";
import { toast } from "react-hot-toast";

interface Contact {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: "new" | "in-progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  adminNotes?: string;
  responseDate?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminContactsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    search: "",
  });

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/signin");
      return;
    }

    if (user && user.role === "admin") {
      fetchContacts();
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

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.priority) params.append("priority", filters.priority);
      if (filters.search) params.append("search", filters.search);

      const response = await api.get(`/admin/contacts?${params.toString()}`);
      setContacts(response.data.contacts || []);
    } catch (error) {
      toast.error("Failed to fetch contacts");
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateContactStatus = async (contactId: string, newStatus: string) => {
    try {
      await api.patch(`/admin/contacts/${contactId}`, { status: newStatus });
      toast.success("Contact status updated successfully");
      fetchContacts();
      if (selectedContact && selectedContact._id === contactId) {
        setSelectedContact({ ...selectedContact, status: newStatus as any });
      }
    } catch (error) {
      toast.error("Failed to update contact status");
      console.error("Error updating contact:", error);
    }
  };

  const updateContactPriority = async (
    contactId: string,
    newPriority: string
  ) => {
    try {
      await api.patch(`/admin/contacts/${contactId}`, {
        priority: newPriority,
      });
      toast.success("Contact priority updated successfully");
      fetchContacts();
      if (selectedContact && selectedContact._id === contactId) {
        setSelectedContact({
          ...selectedContact,
          priority: newPriority as any,
        });
      }
    } catch (error) {
      toast.error("Failed to update contact priority");
      console.error("Error updating contact:", error);
    }
  };

  const updateAdminNotes = async (contactId: string, notes: string) => {
    try {
      await api.patch(`/admin/contacts/${contactId}`, { adminNotes: notes });
      toast.success("Admin notes updated successfully");
      fetchContacts();
      if (selectedContact && selectedContact._id === contactId) {
        setSelectedContact({ ...selectedContact, adminNotes: notes });
      }
    } catch (error) {
      toast.error("Failed to update admin notes");
      console.error("Error updating notes:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "in-progress":
        return "bg-yellow-100 text-yellow-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
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
            <p className="mt-4 text-gray-600">Loading contacts...</p>
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
              Contact Messages
            </h1>
            <p className="mt-2 text-gray-600">
              Manage customer inquiries and support requests
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Filter Messages</h2>
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
                  placeholder="Search by name, email, or subject..."
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
                  <option value="new">New</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="priority"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Priority
                </label>
                <select
                  id="priority"
                  value={filters.priority}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      priority: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contacts List */}
          <div className="space-y-4">
            {contacts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">
                  No contact messages found
                </p>
                <p className="text-gray-400 mt-2">
                  Messages will appear here when customers use the contact form
                </p>
              </div>
            ) : (
              contacts.map((contact) => (
                <div
                  key={contact._id}
                  className="bg-white rounded-lg shadow-sm p-6"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {contact.name}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                            contact.status
                          )}`}
                        >
                          {contact.status}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(
                            contact.priority
                          )}`}
                        >
                          {contact.priority}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-4">
                        <div>
                          <span className="font-medium text-gray-700">
                            Email:
                          </span>
                          <p className="text-gray-600">{contact.email}</p>
                        </div>
                        {contact.phone && (
                          <div>
                            <span className="font-medium text-gray-700">
                              Phone:
                            </span>
                            <p className="text-gray-600">{contact.phone}</p>
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-700">
                            Subject:
                          </span>
                          <p className="text-gray-600">{contact.subject}</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <span className="font-medium text-gray-700 text-sm">
                          Message:
                        </span>
                        <p className="text-gray-600 mt-1 line-clamp-3">
                          {contact.message}
                        </p>
                      </div>

                      <div className="text-sm text-gray-500">
                        Received:{" "}
                        {new Date(contact.createdAt).toLocaleDateString()} at{" "}
                        {new Date(contact.createdAt).toLocaleTimeString()}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => {
                          setSelectedContact(contact);
                          setAdminNotes(contact.adminNotes || "");
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Details
                      </button>

                      <select
                        value={contact.status}
                        onChange={(e) =>
                          updateContactStatus(contact._id, e.target.value)
                        }
                        className="text-sm px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                      >
                        <option value="new">New</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>

                      <select
                        value={contact.priority}
                        onChange={(e) =>
                          updateContactPriority(contact._id, e.target.value)
                        }
                        className="text-sm px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Contact Details Modal */}
      {selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl max-h-full overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Contact Details
                </h2>
                <button
                  onClick={() => setSelectedContact(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Contact Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Name:</span>{" "}
                      {selectedContact.name}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span>{" "}
                      {selectedContact.email}
                    </div>
                    {selectedContact.phone && (
                      <div>
                        <span className="font-medium">Phone:</span>{" "}
                        {selectedContact.phone}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Subject:</span>{" "}
                      {selectedContact.subject}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Status:</span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                          selectedContact.status
                        )}`}
                      >
                        {selectedContact.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Priority:</span>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(
                          selectedContact.priority
                        )}`}
                      >
                        {selectedContact.priority}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Received:</span>{" "}
                      {new Date(selectedContact.createdAt).toLocaleDateString()}{" "}
                      at{" "}
                      {new Date(selectedContact.createdAt).toLocaleTimeString()}
                    </div>
                    {selectedContact.responseDate && (
                      <div>
                        <span className="font-medium">Last Updated:</span>{" "}
                        {new Date(
                          selectedContact.responseDate
                        ).toLocaleDateString()}{" "}
                        at{" "}
                        {new Date(
                          selectedContact.responseDate
                        ).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Message
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedContact.message}
                    </p>
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Admin Notes
                  </h3>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                    rows={4}
                    placeholder="Add internal notes about this contact..."
                  />
                  <button
                    onClick={() =>
                      updateAdminNotes(selectedContact._id, adminNotes)
                    }
                    className="mt-2 px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                  >
                    Update Notes
                  </button>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <select
                  value={selectedContact.status}
                  onChange={(e) =>
                    updateContactStatus(selectedContact._id, e.target.value)
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="new">New</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>

                <select
                  value={selectedContact.priority}
                  onChange={(e) =>
                    updateContactPriority(selectedContact._id, e.target.value)
                  }
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>

                <button
                  onClick={() => setSelectedContact(null)}
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
