export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'user' | 'admin';
  profileImage?: string;
  createdAt: string;
}

export interface Event {
  _id: string;
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
  currentParticipants: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  duration: string;
  images: {
    url: string;
    alt: string;
    isPrimary: boolean;
  }[];
  equipment: string[];
  requirements: string[];
  includes: string[];
  status: 'active' | 'cancelled' | 'completed' | 'draft';
  registrationDeadline: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
  isFull: boolean;
  availableSpots: number;
}

export interface Registration {
  _id: string;
  event: Event;
  user: User;
  participantDetails: {
    name: string;
    email: string;
    phone: string;
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    };
    medicalConditions: string;
    experience: 'Beginner' | 'Some Experience' | 'Experienced' | 'Expert';
    vehicleDetails: {
      make: string;
      model: string;
      year: number;
      modifications: string;
    };
    additionalNotes?: string;
  };
  registrationStatus: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  registrationDate: string;
  paymentDate?: string;
  paymentAmount: number;
  waiverSigned: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryImage {
  _id: string;
  title: string;
  description?: string;
  imageUrl: string;
  altText: string;
  category: 'Events' | 'Vehicles' | 'Landscapes' | 'Action' | 'Group Photos' | 'Other';
  tags: string[];
  event?: {
    _id: string;
    title: string;
    date: string;
  };
  uploadedBy: {
    _id: string;
    name: string;
  };
  isActive: boolean;
  views: number;
  likes: number;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  adminNotes?: string;
  responseDate?: string;
  whatsappSent: boolean;
  whatsappSentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  message: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role?: 'user' | 'admin';
  }) => Promise<void>;
  logout: () => void;
}

export interface EventFormData {
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
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  duration: string;
  equipment: string[];
  requirements: string[];
  includes: string[];
  registrationDeadline: string;
  tags: string[];
  images?: FileList;
}

export interface RegistrationFormData {
  eventId: string;
  participantDetails: {
    name: string;
    email: string;
    phone: string;
    emergencyContact: {
      name: string;
      phone: string;
      relationship: string;
    };
    medicalConditions: string;
    experience: 'Beginner' | 'Some Experience' | 'Experienced' | 'Expert';
    vehicleDetails: {
      make: string;
      model: string;
      year: number;
      modifications: string;
    };
    additionalNotes?: string;
  };
}