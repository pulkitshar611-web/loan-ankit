# MongoDB Setup Guide

Your backend needs MongoDB to run. You have **3 options**:

---

## ✅ Option 1: MongoDB Atlas (Cloud - FREE & EASIEST)

**Recommended for quick setup!**

### Steps:

1. **Go to MongoDB Atlas:**
   - Visit: https://www.mongodb.com/cloud/atlas/register
   - Sign up for free account

2. **Create a Free Cluster:**
   - Click "Build a Database"
   - Choose **FREE** tier (M0)
   - Select a cloud provider and region
   - Click "Create"

3. **Create Database User:**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Username: `loanadmin`
   - Password: `loan123` (or your choice)
   - Click "Add User"

4. **Whitelist Your IP:**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development)
   - Click "Confirm"

5. **Get Connection String:**
   - Go to "Database" → Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - It looks like: `mongodb+srv://loanadmin:<password>@cluster0.xxxxx.mongodb.net/`

6. **Update `.env` file:**
   ```env
   MONGO_URI=mongodb+srv://loanadmin:loan123@cluster0.xxxxx.mongodb.net/loanmanagement?retryWrites=true&w=majority
   ```
   Replace:
   - `loanadmin` with your username
   - `loan123` with your password
   - `cluster0.xxxxx.mongodb.net` with your cluster URL

7. **Restart server:**
   ```bash
   npm run dev
   ```

---

## Option 2: Install MongoDB Locally

### Windows:

1. **Download MongoDB:**
   - Visit: https://www.mongodb.com/try/download/community
   - Download Windows MSI installer
   - Run installer (choose "Complete" setup)

2. **Start MongoDB:**
   ```bash
   # MongoDB should auto-start as a service
   # Or manually start:
   net start MongoDB
   ```

3. **Verify:**
   ```bash
   mongosh
   ```

4. **Update `.env`:**
   ```env
   MONGO_URI=mongodb://localhost:27017/loanmanagement
   ```

---

## Option 3: Use Docker (if you have Docker installed)

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

Then use:
```env
MONGO_URI=mongodb://localhost:27017/loanmanagement
```

---

## ⚡ Quick Start (Recommended: MongoDB Atlas)

1. Create free Atlas account
2. Get connection string
3. Update `.env` with your connection string
4. Run: `npm run dev`
5. Run: `node seed.js` (to create initial users)

**That's it! Your backend will be running!**
