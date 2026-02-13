# Backend - Loan Management System

Complete backend API for Loan Management System built with Node.js, Express, and MongoDB.

## Features

- ✅ JWT Authentication
- ✅ Role-based Access Control (Admin/Staff)
- ✅ 19 RESTful APIs
- ✅ Auto-generate 4-month payment schedule
- ✅ MongoDB with Mongoose ODM
- ✅ Input validation
- ✅ Error handling middleware
- ✅ Excel import functionality

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env` and update MongoDB URI and JWT secret

3. **Seed initial users:**
   ```bash
   node seed.js
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Start production server:**
   ```bash
   npm start
   ```

## Default Users

After running seed.js:

- **Admin:** admin@loan.com / admin123
- **Staff:** staff@loan.com / staff123

## API Endpoints

### Authentication (3 APIs)
- POST `/api/auth/login` - Login
- POST `/api/auth/logout` - Logout
- GET `/api/auth/profile` - Get profile

### Users/Staff (4 APIs)
- POST `/api/users/create` - Create staff (Admin)
- GET `/api/users` - Get all staff (Admin)
- PUT `/api/users/:id` - Update staff (Admin)
- PATCH `/api/users/:id/status` - Toggle status (Admin)

### Clients (4 APIs)
- POST `/api/clients` - Create client + loan + schedule
- GET `/api/clients` - Get all clients (role-filtered)
- GET `/api/clients/:id` - Get client details
- PUT `/api/clients/:id` - Update client
- DELETE `/api/clients/:id` - Delete client (Admin)

### Payments (3 APIs)
- POST `/api/payments/manual` - Record manual payment
- POST `/api/payments/stripe/webhook` - Stripe webhook
- GET `/api/payments/client/:clientId` - Get client payments

### Reminders (2 APIs)
- POST `/api/reminders/send` - Send reminder (Admin)
- GET `/api/reminders/logs` - Get reminder logs (Admin)

### Dashboard (2 APIs)
- GET `/api/dashboard/admin/summary` - Admin stats
- GET `/api/dashboard/staff/summary` - Staff stats

### Import (1 API)
- POST `/api/import/excel` - Import Excel file (Admin)

## Tech Stack

- Node.js
- Express.js
- MongoDB + Mongoose
- JWT Authentication
- bcryptjs
- express-validator
- multer (file upload)
- xlsx (Excel parsing)
- Stripe integration

## License

ISC
