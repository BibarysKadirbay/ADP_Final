# Bookstore API - MongoDB Atlas Integration

A comprehensive Go backend for an online bookstore with MongoDB Atlas, featuring role-based access control, complete catalog management, shopping functionality, and digital/audio book access.

## Features

### Customer Features
- ✅ User registration and login with JWT authentication
- ✅ Book search and filtering
- ✅ View detailed book information with formats
- ✅ Shopping cart and order management
- ✅ Personal library for digital and audio books
- ✅ Order history tracking

### Admin Features
- ✅ Complete book management (CRUD operations)
- ✅ Book format management (Physical, Digital, Audio)
- ✅ Order status management
- ✅ User management and role assignment
- ✅ System statistics and analytics

## Project Structure

```
.
├── config/              # Configuration management
├── db/                  # Database connection setup
├── handlers/            # HTTP request handlers
│   ├── auth.go         # Authentication handlers
│   ├── book.go         # Book management handlers
│   ├── order.go        # Order management handlers
│   ├── digital_access.go # Digital library handlers
│   └── user.go         # User management handlers
├── middleware/          # Middleware functions
│   └── auth.go         # JWT authentication middleware
├── models/             # Data models
│   ├── user.go
│   ├── book.go
│   ├── order.go
│   └── digital_access.go
├── routes/             # API routes definition
│   └── routes.go
├── main.go            # Application entry point
├── go.mod             # Go module definition
└── .env.example       # Environment variables template
```

## Prerequisites

- Go 1.25.5 or later
- MongoDB Atlas account (free tier available at https://www.mongodb.com/cloud/atlas)
- Postman or similar API testing tool (optional)

## Setup Instructions

### 1. MongoDB Atlas Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account or sign in
3. Create a new cluster (M0 free tier is sufficient)
4. Get your connection string:
   - Click "Connect" on your cluster
   - Choose "Drivers"
   - Copy the connection string
   - Replace `<password>` with your database password

### 2. Project Setup

```bash
# Clone or navigate to the project directory
cd /Users/bibaryskadyrbaj/Desktop/ADP_Final

# Download dependencies
go mod download

# Create .env file from template
cp .env.example .env

# Edit .env with your MongoDB Atlas credentials
# Update MONGO_URI with your actual connection string
```

### 3. Environment Variables

Edit `.env` file with your settings:

```env
MONGO_URI=mongodb+srv://username:password@cluster-name.mongodb.net/?retryWrites=true&w=majority
MONGO_DB_NAME=bookstore
JWT_SECRET=your-secure-secret-key
PORT=:8080
```

### 4. Run the Application

```bash
# Install dependencies (if not done)
go mod download

# Run the server
go run main.go
```

Server will start on `http://localhost:8080`

## API Documentation

### Health Check
```
GET /health
```

### Authentication Endpoints

#### Register
```
POST /auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword"
}

Response: 201 Created
{
  "message": "User registered successfully",
  "user_id": "507f1f77bcf86cd799439011"
}
```

#### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword"
}

Response: 200 OK
{
  "id": "507f1f77bcf86cd799439011",
  "username": "john_doe",
  "email": "john@example.com",
  "role": "Customer",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Get Profile
```
GET /auth/profile
Authorization: Bearer <token>

Response: 200 OK
{
  "id": "507f1f77bcf86cd799439011",
  "username": "john_doe",
  "email": "john@example.com",
  "role": "Customer"
}
```

### Book Endpoints

#### Search/List Books
```
GET /books
GET /books?search=Harry%20Potter

Response: 200 OK
[
  {
    "id": "507f1f77bcf86cd799439011",
    "title": "Harry Potter and the Philosopher's Stone",
    "author": "J.K. Rowling",
    "description": "...",
    "formats": [
      {
        "id": "507f1f77bcf86cd799439012",
        "book_id": "507f1f77bcf86cd799439011",
        "type": "Physical",
        "price": 15.99,
        "stock_quantity": 50
      }
    ]
  }
]
```

#### Get Book Details
```
GET /books/:id

Response: 200 OK
{
  "id": "507f1f77bcf86cd799439011",
  "title": "Harry Potter",
  "author": "J.K. Rowling",
  "description": "...",
  "formats": [...]
}
```

#### Create Book (Admin)
```
POST /admin/books
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "The Hobbit",
  "author": "J.R.R. Tolkien",
  "description": "A fantasy adventure",
  "formats": [
    {
      "type": "Physical",
      "price": 12.99,
      "stock_quantity": 100
    },
    {
      "type": "Digital",
      "price": 9.99,
      "stock_quantity": 1000
    },
    {
      "type": "Audio",
      "price": 14.99,
      "stock_quantity": 500
    }
  ]
}

Response: 201 Created
{
  "message": "Book created successfully",
  "book_id": "507f1f77bcf86cd799439013"
}
```

#### Update Book (Admin)
```
PUT /admin/books/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "Updated Title",
  "author": "Updated Author",
  "description": "Updated description"
}

Response: 200 OK
{
  "message": "Book updated successfully"
}
```

#### Delete Book (Admin)
```
DELETE /admin/books/:id
Authorization: Bearer <admin_token>

Response: 200 OK
{
  "message": "Book deleted successfully"
}
```

### Order Endpoints

#### Create Order
```
POST /orders
Authorization: Bearer <customer_token>
Content-Type: application/json

{
  "items": [
    {
      "format_id": "507f1f77bcf86cd799439012",
      "quantity": 1
    }
  ]
}

Response: 201 Created
{
  "message": "Order created successfully",
  "order_id": "507f1f77bcf86cd799439014",
  "total_amount": 15.99
}
```

#### Get User Orders
```
GET /orders
Authorization: Bearer <customer_token>

Response: 200 OK
[
  {
    "id": "507f1f77bcf86cd799439014",
    "user_id": "507f1f77bcf86cd799439011",
    "order_date": "2024-02-09T10:30:00Z",
    "status": "Pending",
    "total_amount": 15.99,
    "items": [...]
  }
]
```

#### Cancel Order
```
DELETE /orders/:id
Authorization: Bearer <customer_token>

Response: 200 OK
{
  "message": "Order cancelled successfully"
}
```

#### Get All Orders (Admin)
```
GET /admin/orders
Authorization: Bearer <admin_token>

Response: 200 OK
[...]
```

#### Update Order Status (Admin)
```
PUT /admin/orders/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "Completed"
}

Response: 200 OK
{
  "message": "Order status updated successfully"
}
```

### Digital Library Endpoints

#### Get Personal Library
```
GET /library
Authorization: Bearer <customer_token>

Response: 200 OK
{
  "user_id": "507f1f77bcf86cd799439011",
  "books": [
    {
      "id": "507f1f77bcf86cd799439015",
      "book_id": "507f1f77bcf86cd799439011",
      "book_title": "Harry Potter",
      "book_author": "J.K. Rowling",
      "format": "Digital",
      "access_url": "https://library.bookstore.com/access/...",
      "accessed_date": "2024-02-09T10:30:00Z"
    }
  ]
}
```

#### Get Specific Digital Access
```
GET /library/:format_id
Authorization: Bearer <customer_token>

Response: 200 OK
{
  "id": "507f1f77bcf86cd799439015",
  "access_url": "https://library.bookstore.com/access/...",
  "access_date": "2024-02-09T10:30:00Z",
  "expiry_date": "2025-02-09T10:30:00Z"
}
```

#### List Available Digital Books
```
GET /digital-books

Response: 200 OK
[
  {
    "format_id": "507f1f77bcf86cd799439012",
    "book_id": "507f1f77bcf86cd799439011",
    "title": "Harry Potter",
    "author": "J.K. Rowling",
    "type": "Digital",
    "price": 9.99,
    "stock_quantity": 1000
  }
]
```

### User Management Endpoints (Admin Only)

#### Get All Users
```
GET /admin/users
Authorization: Bearer <admin_token>

Response: 200 OK
[...]
```

#### Get User Details
```
GET /admin/users/:id
Authorization: Bearer <admin_token>

Response: 200 OK
{
  "_id": "507f1f77bcf86cd799439011",
  "username": "john_doe",
  "email": "john@example.com",
  "role": "Customer"
}
```

#### Update User Role
```
PUT /admin/users/:id/role
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "role": "Admin"
}

Response: 200 OK
{
  "message": "User role updated successfully"
}
```

#### Delete User
```
DELETE /admin/users/:id
Authorization: Bearer <admin_token>

Response: 200 OK
{
  "message": "User deleted successfully"
}
```

#### Get System Statistics
```
GET /admin/stats
Authorization: Bearer <admin_token>

Response: 200 OK
{
  "total_users": 150,
  "customers": 148,
  "admins": 2
}
```

## Testing the API

### Using cURL

```bash
# Register a customer
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'

# Login
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Search books
curl http://localhost:8080/books?search=Harry
```

### Using Postman

1. Import the API endpoints into Postman
2. Set variables for `base_url` and `token`
3. Start testing each endpoint

## Database Models

### Users
- `_id`: ObjectID (Primary Key)
- `username`: String (Unique)
- `email`: String (Unique)
- `password`: String (Hashed)
- `role`: String (Customer or Admin)
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Books
- `_id`: ObjectID (Primary Key)
- `title`: String
- `author`: String
- `description`: String
- `created_at`: Timestamp
- `updated_at`: Timestamp

### BookFormats
- `_id`: ObjectID (Primary Key)
- `book_id`: ObjectID (Foreign Key)
- `type`: String (Physical, Digital, Audio)
- `price`: Float
- `stock_quantity`: Integer
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Orders
- `_id`: ObjectID (Primary Key)
- `user_id`: ObjectID (Foreign Key)
- `order_date`: Timestamp
- `status`: String (Pending, Completed, Cancelled)
- `total_amount`: Float
- `created_at`: Timestamp
- `updated_at`: Timestamp

### OrderItems
- `_id`: ObjectID (Primary Key)
- `order_id`: ObjectID (Foreign Key)
- `format_id`: ObjectID (Foreign Key)
- `quantity`: Integer
- `price_at_purchase`: Float
- `created_at`: Timestamp

### DigitalAccess
- `_id`: ObjectID (Primary Key)
- `user_id`: ObjectID (Foreign Key)
- `format_id`: ObjectID (Foreign Key)
- `access_granted_date`: Timestamp
- `expiry_date`: Timestamp (Optional)
- `access_url`: String
- `created_at`: Timestamp

## Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Protected admin endpoints
- ✅ CORS support
- ✅ Input validation

## Error Handling

The API returns appropriate HTTP status codes:
- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `500 Internal Server Error`: Server error

## Future Enhancements

- [ ] Payment gateway integration
- [ ] Email notifications
- [ ] Book reviews and ratings
- [ ] Wishlist functionality
- [ ] Book recommendations
- [ ] Admin dashboard analytics
- [ ] API rate limiting
- [ ] Advanced search filters
- [ ] Book categories and tags
- [ ] User profile customization

## Troubleshooting

### Connection Issues
- Verify MongoDB Atlas connection string
- Check if IP address is whitelisted in MongoDB Atlas
- Ensure database credentials are correct

### JWT Token Issues
- Token must be in "Bearer <token>" format
- Token expires after 24 hours
- Generate a new token via login endpoint

### Admin Access
- Only users with "Admin" role can access admin endpoints
- Create admin user manually in MongoDB or use PUT /admin/users/:id/role

## Dependencies

- `github.com/gin-gonic/gin` - Web framework
- `go.mongodb.org/mongo-driver` - MongoDB driver
- `github.com/golang-jwt/jwt/v5` - JWT implementation
- `golang.org/x/crypto` - Password hashing
- `github.com/joho/godotenv` - Environment variables

## License

This project is provided as-is for educational and commercial use.

## Support

For issues or questions, please refer to the documentation or create an issue in the repository.
