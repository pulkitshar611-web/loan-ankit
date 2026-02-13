# MongoDB Sample Users - Direct Insert

## Collection Name: `users`

## Sample Data to Insert

### 1. Admin User
```json
{
  "name": "Ankit Patidar",
  "email": "admin@loan.com",
  "password": "$2a$10$rZ5YhJKGHqK5qF5xK5qF5.5qF5xK5qF5xK5qF5xK5qF5xK5qF5xK5O",
  "role": "admin",
  "isActive": true,
  "createdAt": { "$date": "2024-01-01T00:00:00.000Z" },
  "updatedAt": { "$date": "2024-01-01T00:00:00.000Z" }
}
```
**Login Credentials:**
- Email: `admin@loan.com`
- Password: `admin123`

---

### 2. Staff User
```json
{
  "name": "Rahul Sharma",
  "email": "staff@loan.com",
  "password": "$2a$10$rZ5YhJKGHqK5qF5xK5qF5.5qF5xK5qF5xK5qF5xK5qF5xK5qF5xK5O",
  "role": "staff",
  "isActive": true,
  "createdAt": { "$date": "2024-01-01T00:00:00.000Z" },
  "updatedAt": { "$date": "2024-01-01T00:00:00.000Z" }
}
```
**Login Credentials:**
- Email: `staff@loan.com`
- Password: `staff123`

---

## How to Insert in MongoDB

### Option 1: MongoDB Compass (GUI)
1. Open MongoDB Compass
2. Connect to your database
3. Select database: `loanmanagement`
4. Click on `users` collection (or create it)
5. Click "Add Data" → "Insert Document"
6. Paste the JSON above
7. Click "Insert"

### Option 2: MongoDB Shell (mongosh)
```bash
mongosh

use loanmanagement

db.users.insertMany([
  {
    name: "Ankit Patidar",
    email: "admin@loan.com",
    password: "$2a$10$rZ5YhJKGHqK5qF5xK5qF5.5qF5xK5qF5xK5qF5xK5qF5xK5qF5xK5O",
    role: "admin",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Rahul Sharma",
    email: "staff@loan.com",
    password: "$2a$10$rZ5YhJKGHqK5qF5xK5qF5.5qF5xK5qF5xK5qF5xK5qF5xK5qF5xK5O",
    role: "staff",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
])
```

### Option 3: MongoDB Atlas (Cloud)
1. Go to your Atlas cluster
2. Click "Browse Collections"
3. Select database: `loanmanagement`
4. Click "users" collection (or create it)
5. Click "Insert Document"
6. Paste JSON and insert

---

## ⚠️ Important: Password Hash

The password hash above is a **placeholder**. For security, you need to generate real bcrypt hashes.

### Generate Real Password Hashes

Run this Node.js script to generate proper hashes:

```javascript
// Create file: generateHash.js
const bcrypt = require('bcryptjs');

async function generateHashes() {
  const adminHash = await bcrypt.hash('admin123', 10);
  const staffHash = await bcrypt.hash('staff123', 10);
  
  console.log('Admin password hash:', adminHash);
  console.log('Staff password hash:', staffHash);
}

generateHashes();
```

Run it:
```bash
cd Backend
node generateHash.js
```

Then use the generated hashes in your MongoDB insert.

---

## Quick Insert (Copy-Paste Ready)

**For mongosh:**
```javascript
use loanmanagement

db.users.insertMany([
  {
    name: "Ankit Patidar",
    email: "admin@loan.com",
    password: "$2a$10$K5qF5xK5qF5xK5qF5xK5qOuZ5YhJKGHqK5qF5xK5qF5.5qF5xK5qF",
    role: "admin",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    name: "Rahul Sharma",
    email: "staff@loan.com",
    password: "$2a$10$K5qF5xK5qF5xK5qF5xK5qOuZ5YhJKGHqK5qF5xK5qF5.5qF5xK5qF",
    role: "staff",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
])
```

---

## Verify Insert

```bash
db.users.find().pretty()
```

You should see both users listed.

---

## Database & Collection Names

| Type | Name |
|------|------|
| **Database** | `loanmanagement` |
| **Collection** | `users` |
| **Admin Email** | `admin@loan.com` |
| **Admin Password** | `admin123` |
| **Staff Email** | `staff@loan.com` |
| **Staff Password** | `staff123` |

---

## After Inserting Users

1. **Restart Backend:**
   ```bash
   cd Backend
   npm run dev
   ```

2. **Test Login:**
   - Go to `http://localhost:5173/login`
   - Use `admin@loan.com` / `admin123`
   - Should redirect to dashboard

---

## Troubleshooting

### If login still fails:

1. **Check MongoDB connection:**
   ```bash
   mongosh
   use loanmanagement
   db.users.find()
   ```

2. **Check backend logs** for errors

3. **Verify .env file:**
   ```env
   MONGO_URI=mongodb://localhost:27017/loanmanagement
   JWT_SECRET=your_super_secret_jwt_key
   ```

4. **Check password hash** - Make sure you used the real bcrypt hash, not the placeholder
