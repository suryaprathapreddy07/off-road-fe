# Off-Road Adventures - Full Stack Application

## Project Overview

This is a complete full-stack web application for an off-road adventure company. It includes user and admin functionality, event management, registration system, image gallery, and contact forms with WhatsApp integration.

## Features

### User Features

- User authentication (signup/signin)
- Browse and view events
- Register for events with detailed form
- View image gallery
- Contact form submission

### Admin Features

- Admin dashboard
- Event management (CRUD operations)
- User registration management
- Image gallery management
- Contact form management
- WhatsApp notifications for registrations and contacts

## Technology Stack

### Backend

- Node.js with Express.js
- MongoDB with Mongoose
- JWT authentication
- Multer for file uploads
- WhatsApp API integration
- bcryptjs for password hashing

### Frontend

- Next.js 15 with TypeScript
- Tailwind CSS for styling
- React Hook Form for form management
- React Hot Toast for notifications
- Axios for API calls
- Cookie-based authentication

## Setup Instructions

### 1. Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance)

### 2. Environment Setup

Create `.env` file in `backend/` directory:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/offroad-adventure
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
ADMIN_EMAIL=admin@offroad.com
ADMIN_PASSWORD=admin123
```

Create `.env.local` file in root directory:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Backend Setup

```bash
cd backend
npm install
mkdir -p uploads/events uploads/gallery
npm run seed-admin  # Creates admin user
npm run dev         # Starts on port 5000
```

### 4. Frontend Setup

```bash
cd ..
npm install
npm run dev         # Starts on port 3000
```

## Default Admin Account

- Email: admin@offroad.com
- Password: admin123

## API Endpoints

- **Auth:** `/api/auth/login`, `/api/auth/register`
- **Events:** `/api/events` (GET, POST, PUT, DELETE)
- **Registrations:** `/api/registrations`
- **Gallery:** `/api/gallery`
- **Contact:** `/api/contact`

## Project Structure

```
off-road/
├── backend/           # Express.js API
├── src/              # Next.js frontend
├── package.json      # Frontend deps
└── README.md
```

Visit http://localhost:3000 to see the application!
