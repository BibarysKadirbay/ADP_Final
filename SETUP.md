# Bookstore Application - Complete Stack

A full-stack online bookstore application with a Go/MongoDB backend and React/Vite frontend. Features complete e-commerce functionality for books in physical, digital, and audio formats.

## 📁 Project Structure

```
ADP_Final/
├── backend files (Go API)
│   ├── main.go
│   ├── go.mod
│   ├── config/
│   ├── db/
│   ├── handlers/
│   ├── models/
│   ├── middleware/
│   ├── routes/
│   ├── .env.example
│   └── README.md
│
└── frontend/
    ├── src/
    ├── public/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── README.md
    └── .env.example
```

## 🚀 Quick Start (Both Backend & Frontend)

### 1. Backend Setup (Go)

```bash
# Navigate to project root
cd /Users/bibaryskadyrbaj/Desktop/ADP_Final

# Create .env from template
cp .env.example .env

# Edit .env with your MongoDB Atlas credentials
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority

# Download dependencies
go mod download

# Run the server
go run main.go

# Server will start on http://localhost:8080
```

### 2. Frontend Setup (React + Vite)

```bash
# In a new terminal window, navigate to frontend
cd /Users/bibaryskadyrbaj/Desktop/ADP_Final/frontend

# Install dependencies
npm install

# Start development server
npm run dev

# App will be available at http://localhost:5173
```

## 🌐 Backend API (Go/MongoDB)

**Technology Stack:**
- Language: Go 1.25.5
- Database: MongoDB Atlas
- Framework: Gin-gonic (HTTP web framework)
- Auth: JWT (JSON Web Tokens)
- Password: bcrypt hashing

**Key Features:**
- REST API with role-based access control
- User authentication and authorization
- Complete book management system
- Shopping cart and order processing
- Digital/audio book access management
- Admin dashboard capabilities
- Database indexes for performance
- CORS support for frontend communication

**API Endpoints:**
- Authentication: `/auth/*` (register, login, profile)
- Books: `/books/*` (catalog, search, details)
- Orders: `/orders/*` (create, view, cancel)
- Admin: `/admin/*` (manage books, orders, users)
- Digital Library: `/library/*` (personal library, access)

See `README.md` in the root directory for detailed API documentation.

## 💻 Frontend App (React/Vite)

**Technology Stack:**
- Framework: React 18
- Router: React Router v6
- HTTP Client: Axios
- Build Tool: Vite
- State Management: React Context API

**Key Features:**
- Responsive design (mobile, tablet, desktop)
- User authentication UI
- Book catalog with search and filtering
- Shopping cart with persistent storage
- Order management
- Personal digital library
- Admin dashboard
- Real-time cart updates
- Token-based authorization

**Main Pages:**
- Home - Landing page with features
- Login/Register - User authentication
- Books - Catalog with search
- Book Details - Individual book information
- Shopping Cart - Order summary & checkout
- Orders - Order history & management
- Library - Personal digital book library
- Admin Dashboard - System management

See `frontend/README.md` for detailed frontend documentation.

## 🔐 Security Features

### Backend
- Password hashing with bcrypt
- JWT token-based authentication
- Role-based access control (RBAC)
- Protected admin endpoints
- Input validation
- CORS enabled

### Frontend
- Token stored securely in localStorage
- Protected routes for authenticated users
- Admin-only page access
- Automatic logout on token expiry
- HTTPS ready for production

## 📊 Database Schema

### Collections (MongoDB)

**users**
- ID, username, email, password (hashed), role, timestamps

**books**
- ID, title, author, description, timestamps

**book_formats**
- ID, book_id (FK), type (Physical/Digital/Audio), price, stock_quantity, timestamps

**orders**
- ID, user_id (FK), order_date, status, total_amount, timestamps

**order_items**
- ID, order_id (FK), format_id (FK), quantity, price_at_purchase, timestamps

**digital_access**
- ID, user_id (FK), format_id (FK), access_granted_date, expiry_date, access_url, timestamps

## 🔄 Installation Prerequisites

### System Requirements
- macOS, Linux, or Windows (with WSL2)
- 2GB RAM minimum
- 500MB disk space

### Required Software
- **Go** 1.25.5+ - [Download](https://golang.org/dl/)
- **Node.js** 16+ (includes npm) - [Download](https://nodejs.org/)
- **MongoDB Atlas** account (free tier available) - [Create Account](https://www.mongodb.com/cloud/atlas)
- **Git** (optional) - [Download](https://git-scm.com/)

## 🧪 Testing the Application

### 1. Health Check
```bash
curl http://localhost:8080/health
# Response: {"status":"ok","message":"Bookstore API is running"}
```

### 2. Create Test User (via Frontend)
1. Go to http://localhost:5173
2. Click "Register"
3. Fill in details and create an account

### 3. Create Admin User (via API)
```bash
# First, register a user via UI
# Then, manually update in MongoDB or use API
curl -X POST http://localhost:8080/admin/users/{user_id}/role \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"role":"Admin"}'
```

### 4. Add Test Books (Admin)
1. Login as admin
2. Go to Admin Dashboard
3. Click "Add New Book"
4. Fill in details with multiple formats

### 5. Test Shopping Flow
1. Browse books on Catalog page
2. Add items to cart
3. Proceed to checkout
4. View order in Orders page
5. View digital books in Library page

## 🎯 Common Tasks

### Add Books via Admin Dashboard
1. Login with admin account
2. Navigate to Admin Dashboard
3. Click "Books" tab
4. Click "Add New Book"
5. Fill in title, author, description
6. Add formats (Physical $19.99, Digital $9.99, Audio $14.99)
7. Submit

### Manage Orders (Admin)
1. Go to Admin Dashboard
2. Click "Orders" tab
3. View all customer orders
4. Update order status (Pending → Completed)

### View Customer Statistics
1. Go to Admin Dashboard
2. "Statistics" tab shows total users, customers, admins

## 🐛 Troubleshooting

### Backend Won't Start
- Check MongoDB Atlas credentials in `.env`
- Verify IP whitelist in MongoDB Atlas
- Ensure port 8080 is not in use: `lsof -i :8080`

### Frontend Can't Reach Backend
- Verify backend is running on `http://localhost:8080`
- Check CORS is enabled in backend
- Check browser console for network errors
- Try accessing `/health` endpoint directly

### MongoDB Connection Issues
- Verify connection string format
- Check username/password don't have special characters
- Whitelist your IP in MongoDB Atlas
- Ensure database is created

### Cart Items Not Persisting
- Check browser localStorage is enabled
- Clear browser cache: Cmd+Shift+Delete
- Check storage quota isn't exceeded

## 📝 Notes

- Default JWT token expiry: 24 hours
- Digital book access expiry: 1 year from purchase
- Cart data stored in browser localStorage
- All passwords are bcrypt hashed (10 rounds)
- Database indexes for optimized queries

## 🚀 Deployment

### Backend Deployment (Heroku/Railway/Render)
1. Create account on hosting platform
2. Set up MongoDB Atlas (if not already)
3. Deploy Go application
4. Set environment variables (MONGO_URI, JWT_SECRET, etc.)
5. Configure custom domain

### Frontend Deployment (Vercel/Netlify)
1. Push code to GitHub
2. Connect repository to Vercel/Netlify
3. Set build command: `npm run build`
4. Set API URL in environment variables
5. Deploy automatically on git push

## 📚 Documentation

- **Backend API Docs**: See [README.md](README.md)
- **Frontend Docs**: See [frontend/README.md](frontend/README.md)
- **MongoDB Schema**: See database models in backend code
- **API Examples**: See README.md for cURL examples

## 🤝 Contributing

Feel free to modify and extend this application for your needs!

## 📄 License

This project is provided as-is for educational and commercial use.

## ℹ️ Support

For issues or questions:
1. Check the relevant README file
2. Review error messages in browser console/terminal
3. Verify all prerequisites are installed
4. Ensure backend and frontend are running correctly

## ✨ Next Steps

After setup, consider implementing:
- [ ] Payment gateway integration (Stripe/PayPal)
- [ ] Email notifications for orders
- [ ] Book reviews and ratings
- [ ] Wishlist functionality
- [ ] Advanced search filters
- [ ] Book recommendations
- [ ] User profile pages
- [ ] Dark mode theme
- [ ] Mobile app (React Native)
- [ ] API documentation (Swagger/OpenAPI)
