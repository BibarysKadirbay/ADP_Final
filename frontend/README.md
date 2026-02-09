# Bookstore Frontend Application

A modern React-based frontend for the Bookstore application, built with Vite and featuring a complete e-commerce experience for book shopping with support for physical, digital, and audio formats.

## Features

### Customer Features
- ✅ User authentication (Login/Register)
- ✅ Browse and search book catalog
- ✅ View detailed book information with available formats
- ✅ Shopping cart management
- ✅ Secure checkout and order placement
- ✅ Order history and management
- ✅ Personal Digital Library for audio and ebook access
- ✅ Beautiful responsive UI

### Admin Features
- ✅ Admin Dashboard with statistics
- ✅ Book management (add, edit, delete)
- ✅ Order management and status updates
- ✅ User management
- ✅ System analytics

## Tech Stack

- **React 18** - UI framework
- **React Router v6** - Navigation and routing
- **Axios** - HTTP client for API calls
- **Vite** - Build tool and development server
- **CSS3** - Styling with responsive design

## Project Structure

```
frontend/
├── src/
│   ├── components/         # Reusable components
│   │   ├── Header.jsx     # Navigation header
│   │   └── ProtectedRoute.jsx  # Auth-protected routes
│   ├── context/           # React Context providers
│   │   ├── AuthContext.jsx    # Authentication state
│   │   └── CartContext.jsx    # Shopping cart state
│   ├── pages/             # Page components
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Books.jsx
│   │   ├── BookDetail.jsx
│   │   ├── Cart.jsx
│   │   ├── Orders.jsx
│   │   ├── Library.jsx
│   │   └── AdminDashboard.jsx
│   ├── api.js            # API service layer
│   ├── styles.css        # Global styles
│   ├── App.jsx           # Main app component
│   └── main.jsx          # Entry point
├── index.html            # HTML template
├── vite.config.js        # Vite configuration
└── package.json          # Dependencies
```

## Installation & Setup

### Prerequisites
- Node.js 16+ (with npm or yarn)
- Backend API running on `http://localhost:8080`

### Installation Steps

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file (optional, for custom API URL)
echo "VITE_API_URL=http://localhost:8080" > .env

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

## Running the Application

### Development Mode
```bash
npm run dev
```
Starts Vite development server with hot module replacement (HMR)

### Production Build
```bash
npm run build
```
Creates an optimized production build in the `dist/` folder

### Preview Production Build
```bash
npm run preview
```
Serves the production build locally for testing

## API Integration

The frontend communicates with the Go backend API. The API service layer in `src/api.js` provides:

### Authentication
- `authAPI.register(username, email, password)`
- `authAPI.login(email, password)`
- `authAPI.getProfile()`

### Books
- `bookAPI.getBooks(search)`
- `bookAPI.getBook(id)`
- `bookAPI.createBook(data)`
- `bookAPI.updateBook(id, data)`
- `bookAPI.deleteBook(id)`

### Orders
- `orderAPI.createOrder(items)`
- `orderAPI.getUserOrders()`
- `orderAPI.getAllOrders()`
- `orderAPI.updateOrderStatus(id, status)`
- `orderAPI.cancelOrder(id)`

### Digital Access
- `digitalAPI.getLibrary()`
- `digitalAPI.getAccess(formatId)`
- `digitalAPI.listDigitalBooks()`

### User Management (Admin)
- `userAPI.getUsers()`
- `userAPI.getUser(id)`
- `userAPI.updateUserRole(id, role)`
- `userAPI.deleteUser(id)`
- `userAPI.getStats()`

## State Management

### Authentication Context (`AuthContext`)
Manages:
- Current user information
- JWT token storage in localStorage
- Login/logout/register functions
- Admin role checking

### Shopping Cart Context (`CartContext`)
Manages:
- Cart items with quantities
- Cart persistence to localStorage
- Add/remove/update cart items
- Total price and item count calculations

## Routing Structure

| Path | Component | Protected | Admin Only |
|------|-----------|-----------|-----------|
| `/` | Home | No | - |
| `/login` | Login | No | - |
| `/register` | Register | No | - |
| `/books` | Books Catalog | No | - |
| `/books/:id` | Book Details | No | - |
| `/cart` | Shopping Cart | No | - |
| `/orders` | Orders | Yes | No |
| `/library` | Digital Library | Yes | No |
| `/admin` | Admin Dashboard | Yes | Yes |

## User Flows

### Customer Registration & Shopping
1. User visits home page
2. Clicks "Register" and creates account
3. Logs in with credentials
4. Browses book catalog and searches
5. Views book details and available formats
6. Adds items to shopping cart
7. Proceeds to checkout and creates order
8. Views order history
9. Accesses digital books in personal library

### Admin Operations
1. Admin logs in
2. Navigates to Admin Dashboard
3. Views system statistics (users, orders)
4. Manages books (add/edit/delete)
5. Updates order statuses
6. Manages user accounts and roles

## Styling

The application uses custom CSS with:
- **Responsive Grid Layout** - Works on mobile, tablet, and desktop
- **Card-based Design** - Clean, organized content presentation
- **Color Scheme** - Professional blues and greens (#2c3e50, #3498db, #27ae60)
- **Interactive Elements** - Buttons, forms, and tables with hover effects
- **Mobile-First Approach** - Optimized for all screen sizes

## Key Components

### Header Component
- Logo and navigation links
- User menu with profile info and logout
- Cart badge with item count
- Admin link (visible only to admins)

### ProtectedRoute Component
- Ensures only authenticated users can access protected pages
- Shows admin-only pages only to admins
- Redirects unauthorized users to login

### Authentication Flow
- Token stored in localStorage
- Token automatically added to all API requests
- Token validated on app startup
- Automatic logout if token is invalid

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### CORS Issues
- Ensure backend has CORS middleware enabled
- Check backend runs on `http://localhost:8080`
- Frontend automatically proxies API requests

### Token/Authentication Issues
- Clear localStorage: `localStorage.clear()`
- Log in again
- Check browser developer tools for token in localStorage

### Cart Not Persisting
- Check browser allows localStorage
- Verify localStorage isn't full
- Clear browser cache and try again

### API Connection Issues
- Verify backend is running on port 8080
- Check `/health` endpoint: `http://localhost:8080/health`
- Check browser console for network errors

## Environment Variables

Create a `.env` file in the frontend directory (optional):

```env
VITE_API_URL=http://localhost:8080
VITE_API_TIMEOUT=10000
```

## Performance Optimizations

- Code splitting with React Router
- Lazy loading of pages
- Local storage for cart and auth token
- Efficient state management with Context API
- CSS minimization in production builds

## Future Enhancements

- [ ] Book reviews and ratings display
- [ ] Wishlist functionality
- [ ] Advanced filters (genre, price range, etc.)
- [ ] Book recommendations
- [ ] Payment gateway integration
- [ ] Email notifications
- [ ] User profile customization
- [ ] Dark mode theme
- [ ] Multiple language support

## Deployment

### Vercel Deployment
```bash
npm install -g vercel
vercel
```

### Other Platforms
1. Build the project: `npm run build`
2. Upload `dist/` folder to your hosting
3. Configure API URL in environment variables
4. Ensure CORS is properly configured on backend

## License

This project is provided as-is for educational and commercial use.

## Support

For issues, feature requests, or questions:
1. Check the API documentation in the backend README
2. Review browser console for error messages
3. Check network tab in DevTools for API response status
