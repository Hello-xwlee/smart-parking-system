# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Smart Parking Management System (智能停车管理系统)** - a frontend-only web application that demonstrates a modern parking solution with AI and IoT integration. The project uses pure HTML5, CSS3, and JavaScript without any build system or backend integration.

## Development Commands

### Local Development Server
```bash
# Start local development server (Python 3)
python -m http.server 8000

# Alternative: Node.js http-server (if available)
npx http-server -p 8000
```

Access the application at: `http://localhost:8000`

## Architecture

### Technology Stack
- **Frontend**: Vanilla HTML5, CSS3, JavaScript ES6+
- **CSS Framework**: Tailwind CSS (via CDN)
- **Animation**: Anime.js v3.2.1
- **Charts**: ECharts.js v5.4.3
- **Typography**: Google Fonts (Noto Sans SC)
- **Icons**: Heroicons (via CDN)

### Project Structure
```
/
├── index.html                   # Homepage with hero section and system overview
├── search.html                  # Parking lot search with AI recommendation
├── navigation.html              # Indoor navigation and vehicle finding
├── booking.html                 # Reservation management system
├── payment.html                 # Payment center with dynamic pricing
├── admin.html                   # Admin dashboard with full management console
├── login.html                   # User authentication
├── dashboard-big-screen.html    # Full-screen data dashboard
├── main.js                      # Core JavaScript functionality
├── task4-navigation.js          # Indoor navigation system
├── mockData.js                  # Mock data and database simulation
└── resources/                   # Static assets (background images)
```

### Key Implementation Details

1. **Mock Data System**: All data is simulated in JavaScript with no backend APIs
2. **Real-time Updates**: Data refreshes every 3 seconds using `setInterval()`
3. **Particle Animation**: Background particle effects using canvas animation
4. **Chart Visualizations**: ECharts.js for dashboard statistics and data visualization
5. **Responsive Design**: Mobile-first approach with Tailwind CSS breakpoints

### ✨ New Features (Frontend Mock Version)

#### 1. **Unified API Layer** (`api` object in main.js)
- Complete API simulation using MockDB + Promise
- Organized by resource type: `api.auth`, `api.parking`, `api.booking`, `api.payment`, `api.notification`
- Future backend integration: Simply replace MockDB calls with `fetch('/api/...')`
- No changes required in calling code

**Usage Example:**
```javascript
// Login
const user = await api.auth.login({ username, password });

// Get parking lots
const parkingLots = await api.parking.getList({ location: '北京' });

// Create booking
const booking = await api.booking.create({ userId, parkingLotId, ... });
```

#### 2. **Authentication System** (`AuthManager` in main.js)
- Login page: `login.html` with form validation and loading states
- Token-based auth using localStorage (`smartparking_token`, `smartparking_user`)
- Role-based access control (user/admin)
- Frontend route guards protect pages: `booking.html`, `payment.html`, `admin.html`
- Automatic navigation updates based on login state

**Test Accounts:**
- Admin: username=`admin`, password=`admin123`
- User: username=`user1`, password=`user123`

#### 3. **Notification System** (`NotificationManager` in main.js)
- Notification bell icon with unread count badge
- Slide-out notification drawer
- Notification types: success, warning, error, info
- Actions: mark single notification as read, mark all as read
- Frontend-simulated data, ready for WebSocket or polling integration

**Features:**
- Real-time unread count updates
- Different styling for read/unread notifications
- Click notification to mark as read
- "Mark all as read" functionality

#### 4. **File Upload Preview** (in admin.html system settings)
- Three upload examples: parking images, device images, banner carousel images
- Uses `<input type="file">` with `URL.createObjectURL()` for local preview
- **Important**: Images are NOT persisted, disappear on page refresh
- Seamless extension to real storage (Aliyun OSS, Qiniu, etc.) when backend is ready

**Implementation Notes:**
- Single file upload (parking/device images)
- Multiple file upload (banner carousel)
- Preview release: Call `URL.revokeObjectURL()` when done
- Future backend integration: Replace with `FormData` + `fetch('/api/upload')`

#### 5. **AI-Powered Parking Recommendation** (in search.html)
- **Algorithm**: Multi-dimensional scoring model (distance, price, availability)
- **Weight Configuration**: Customizable weights in admin panel
- **UI Features**: Recommendation score badge (0-100%), reason tags
- **Formula**: Score = w1×distance + w2×price + w3×availability

**Implementation Details:**
- `calculateParkingScore()` function in search.html:351
- Weights stored in localStorage (`smartparking_recommend_weights`)
- Visual indicators: Green badge (≥80%), Blue (≥60%), Yellow (<60%)
- Reason generation: "距离近", "价格低", "空位多"

#### 6. **Dynamic Pricing Engine** (admin.html & payment.html)
- **Configuration**: Base price + time-based multipliers
  - Peak hours (7:00-9:00, 17:00-19:00): ×1.5
  - Off-peak (22:00-6:00): ×0.8
  - Holidays/weekends: ×1.2
- **Formula**: Real-time price = base × time_factor × holiday_factor
- **UI Features**: Pricing configuration panel, 24-hour trend chart

**Implementation Details:**
- Configuration inputs in admin.html pricing section
- Formula display: "基础价5元 × 高峰1.5 × 节假日1.2 = 9元/小时"
- Real-time price updates in payment.html fee details
- Visual price trend chart using ECharts.js

#### 7. **IoT Device Monitoring & Alert System** (admin.html)
- **Device Topology**: Card-based visualization of cameras, sensors, barriers
- **Status Indicators**: Green (online), Yellow (warning), Red (offline)
- **Alert Generation**: Random device failures every 3 seconds
- **Alert Flow**: Device failure → Top notification → Work order creation
- **Work Order Integration**: Automatic ticket generation in alerts section

**Implementation Details:**
- Device cards with status colors in admin.html devices section
- `setInterval()` simulation of IoT device status changes
- NotificationManager integration for real-time alerts
- Work order auto-generation in alerts-list

#### 8. **Indoor Navigation & Vehicle Finding** (navigation.html + task4-navigation.js)
- **Technology**: Leaflet.js + simplified A* algorithm
- **Features**: Multi-floor navigation, elevator/stair routing, voice guidance
- **Path Animation**: Animated polyline with arrow markers
- **Reverse Finding**: Input license plate → locate vehicle → generate route
- **Visual Map**: Canvas-based parking lot map with spot occupancy

**Implementation Details:**
- `findNavigationPath()` in task4-navigation.js:13
- Simplified A* with preset path arrays
- Canvas map rendering with spot status (green/red)
- Voice navigation using Web Speech API
- Floor switcher (1F/2F/3F) with different views

#### 9. **Big-Screen Dashboard Mode** (dashboard-big-screen.html)
- **Layout**: Full-screen data visualization (F11 for best experience)
- **Components**: Real-time metrics, heatmap, traffic flow, pie charts
- **Key Metrics**: Large animated numbers for parking lots, spots, revenue
- **Visualization Types**:
  - Heatmap: Parking lot utilization by hour/day
  - Line chart: 24-hour traffic flow trend
  - Pie chart: Spot usage distribution
- **Alert Feed**: Real-time scrolling alerts (IoT simulation)

**Implementation Details:**
- Responsive grid layout (12-column)
- Large number animations with CSS transitions
- ECharts.js for all visualizations
- Real-time data updates every 5 seconds using `setInterval()`
- Dark theme optimized for display screens

### Page-Specific Features

- **index.html**: Hero animations, feature cards, real-time system stats, notification drawer, navigation links to all features
- **search.html**: Interactive map (simulated), parking lot filtering, list/map view toggle, AI recommendation scores
- **navigation.html**: Indoor navigation with canvas map, vehicle finding by license plate, multi-floor routing
- **booking.html**: Calendar widget, time slot selection, vehicle management (requires login)
- **payment.html**: Payment method selection, fee calculation with dynamic pricing, invoice generation (requires login)
- **admin.html**: Data dashboard with charts, user/parking/device management, dynamic pricing config, system monitoring
- **login.html**: User authentication page with form validation, loading states, test accounts
- **dashboard-big-screen.html**: Full-screen dashboard optimized for display/TV screens, real-time metrics and visualizations

### Development Considerations

1. **No Build Process**: Direct file editing, no compilation required
2. **CDN Dependencies**: All external libraries loaded via CDN links
3. **Static Hosting**: Can be deployed to any static file server
4. **Browser Support**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
5. **Authentication**: Token-based auth using localStorage, frontend route guards
6. **File Upload Preview**: Local preview only, no server upload (URL.createObjectURL)
7. **Backend Integration**: API layer ready for fetch() replacement, minimal code changes needed
8. **Data Persistence**: Mock data stored in localStorage, resets when cleared

### Common Tasks

- **Adding new pages**: Create HTML file, link in navigation, add route guard if needed
- **Modifying charts**: Update ECharts configuration in chart-specific functions
- **Changing mock data**: Edit data generation functions in main.js or mockData.js
- **Adding animations**: Use Anime.js syntax in animation functions
- **Updating styles**: Modify Tailwind CSS classes or add custom CSS
- **Adding API endpoints**: Extend `api` object in main.js (mock version), later replace with fetch()
- **Creating notifications**: Use `NotificationManager.add({ title, message, type })`
- **Checking permissions**: Use `AuthManager.isAuthenticated()`, `AuthManager.isAdmin()`
- **File upload**: Add `<input type="file">` with `URL.createObjectURL()` preview
- **AI recommendation**: Adjust weights in `calculateParkingScore()` in search.html
- **Dynamic pricing**: Modify time factors in pricing config panel (admin.html)
- **IoT simulation**: Update `setInterval()` intervals for device status changes
- **Navigation paths**: Edit predefined path arrays in task4-navigation.js
- **Big-screen dashboard**: Modify grid layout and ECharts options in dashboard-big-screen.html

### Important Notes

- This is a **demo/prototype** application without real backend integration
- All data persistence is simulated and will reset on page refresh
- No actual payment processing - payment flow is simulated
- Map functionality is mocked with placeholder data
- File uploads are preview-only, not persisted to any storage
- Authentication is frontend-only, no real security measures