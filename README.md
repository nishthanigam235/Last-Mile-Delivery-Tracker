# Last-Mile Delivery Tracker (Full-Stack Management Platform)

A complete, production-ready full-stack delivery management and tracking platform built with the MERN stack (Node.js, Express, MongoDB, and React with Vite + Tailwind CSS). 

The application facilitates zone-based logistics routing, volumetric pricing, manual/automated geodesic agent assignments, tracking, SMS/Email notification alerts, and customer rescheduling flows.

---

##  Project Structure

```text
d:/Last_Mile_Delivery/
├── client/                      # Frontend Client (React.js + Vite + Tailwind CSS v3)
│   ├── src/
│   │   ├── components/          # Reusable UI widgets
│   │   ├── context/             # React Session Auth State (AuthContext)
│   │   ├── layouts/             # Core UI Shells (DashboardLayout, GuestLayout)
│   │   ├── pages/               # Views (Customer, Admin, and Agent workflows)
│   │   ├── routes/              # Client guards (ProtectedRoute)
│   │   ├── services/            # Axios API client (api.js with JWT headers)
│   │   ├── index.css            # Tailwind styles + Custom Glassmorphism UI tokens
│   │   └── App.jsx              # Client navigation routes
│   └── package.json
│
├── server/                      # Backend API Server (Node.js + Express.js + Mongoose)
│   ├── config/                  # DB Connection Manager (db.js)
│   ├── controllers/             # Request handlers (Auth, Orders, Zones, Rates, Agents)
│   ├── middleware/              # JWT verification, Role authorization, Validation, Error caught
│   ├── models/                  # Mongoose MongoDB schemas
│   ├── routes/                  # Express Router routes
│   ├── services/                # Business services (Pricing engine, Agent assignment, Notifications)
│   └── utils/                   # Seeding script, geodesic calculators
│
├── .env.example                 # Environment configuration template
└── README.md                    # System documentation
```

---

##  Local Installation & Running Guide

### Prerequisites
1. **Node.js** (v18+ recommended)
2. **MongoDB** (Local Community Edition or MongoDB Atlas instance URI)

### Backend Setup
1. Open a terminal and navigate to the backend server directory:
   ```bash
   cd server
   ```
2. Install node package dependencies:
   ```bash
   npm install
   ```
3. Set up environment configurations:
   - Create a copy of `.env.example` named `.env`
   - Fill in your local/Atlas `MONGO_URI` and define a custom `JWT_SECRET` key:
     ```env
     PORT=5000
     MONGO_URI=mongodb://localhost:27017/last_mile_delivery
     JWT_SECRET=your_secret_signing_key_here
     ```
4. Run the database seed script to populate default zones, pricing rate cards, and role accounts (admin, customer, riders):
   ```bash
   npm run seed
   ```
5. Launch the backend API server (runs in development watcher mode via Nodemon):
   ```bash
   npm run dev
   ```

### Frontend Client Setup
1. Open a separate terminal and navigate to the client folder:
   ```bash
   cd client
   ```
2. Install node dependencies:
   ```bash
   npm install
   ```
3. Run the Vite development server (port 3000):
   ```bash
   npm run dev
   ```
4. Open your web browser and navigate to `http://localhost:3000`

---

##  Default Seed Accounts

The database seed command generates the following default credentials for testing all roles:

| Role | Username / Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@lastmile.com` | `Password123` | Direct access to zones, rate cards, and agent manual overrides. |
| **Customer** | `customer@lastmile.com` | `Password123` | Direct access to book orders and reschedule failed deliveries. |
| **Agent 1** | `agent1@lastmile.com` | `Password123` | North Zone delivery agent. |
| **Agent 2** | `agent2@lastmile.com` | `Password123` | West Zone delivery agent. |
| **Agent 3** | `agent3@lastmile.com` | `Password123` | South Zone delivery agent. |

---

## Rate Calculation Logic

The pricing engine runs in `server/services/pricingService.js` and implements the following logic:

1. **Zone Detection**:
   The system queries all zones in MongoDB to match the `pickupPincode` and `dropPincode` against mapped zone pincode lists. If zones are detected, they are assigned to the order; otherwise, a routing error is returned.
2. **Volumetric Weight Calculation**:
   Calculated using standard logistics volumetric measurements:
   $$\text{Volumetric Weight (kg)} = \frac{\text{Length (cm)} \times \text{Breadth (cm)} \times \text{Height (cm)}}{5000}$$
3. **Billable Weight**:
   The billable weight is set as the higher value between the package's actual weight and its volumetric weight:
   $$\text{Billable Weight} = \max(\text{Actual Weight}, \text{Volumetric Weight})$$
4. **Intra-Zone vs. Inter-Zone Routing**:
   If the pickup zone ID and drop zone ID are identical, the route type is classified as `intra`, else it is classified as `inter`.
5. **Rate Card Selection**:
   The system fetches the `RateCard` matching the trip type (`intra` / `inter`) and order client type (`B2B` / `B2C`).
6. **Total Delivery Charge**:
   $$\text{Base Cost} = \text{Billable Weight} \times \text{RateCard.pricePerKg}$$
   $$\text{Total Charge} = \text{Base Cost} + \text{COD Surcharge (if COD Selected)}$$

---

##  Geodesic Auto-Assignment Logic

When auto-assignment is triggered (`server/services/assignmentService.js`):
1. The system queries all users with `role: 'delivery_agent'` and `isAvailable: true`.
2. Geodesic distance (Haversine formula) is calculated between the pickup pincode coordinates and each agent's reported `currentLocation` (lat/lng):
   $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \text{lat}}{2}\right) + \cos(\text{lat}_1)\cos(\text{lat}_2)\sin^2\left(\frac{\Delta \text{lng}}{2}\right)}\right)$$
3. If GPS is unavailable on agents (coordinates are `0,0`), the service falls back to **Zone-based matching** (agents registered with their home `zone` equal to the pickup zone).
4. If zone matching yields multiple agents, it performs **Load-based balancing**, selecting the agent with the lowest number of active/pending deliveries.

---

##  API Documentation

All request bodies and responses are standard JSON format. Access to protected routes requires a `Bearer <token>` HTTP Header.

### Auth Endpoints
- `POST /api/auth/register` - Create user. Request body: `{ name, email, password, phone, role, zone }`
- `POST /api/auth/login` - Verify user. Request body: `{ email, password }`
- `GET /api/auth/me` - Load logged in profile.

### Zones (Admin only)
- `GET /api/zones` - Get active zones.
- `POST /api/zones` - Create zone. Request: `{ zoneName, city, pincodes }`
- `PUT /api/zones/:id` - Update zone pincodes list.
- `DELETE /api/zones/:id` - Delete zone.

### Rate Cards (Admin only)
- `GET /api/rate-cards` - Get rate cards list.
- `POST /api/rate-cards` - Create rate card. Request: `{ zoneType, orderType, pricePerKg, codCharge }`
- `PUT /api/rate-cards/:id` - Update pricing metrics.
- `DELETE /api/rate-cards/:id` - Delete rate configuration.

### Orders
- `POST /api/orders/calculate` - Pricing engine preview. Request: `{ pickupPincode, dropPincode, length, breadth, height, actualWeight, orderType, paymentType }`
- `POST /api/orders` - Confirm and book order. Request body: Same as calculate preview.
- `GET /api/orders` - Retrieve list of orders (Filtered automatically based on user roles).
- `GET /api/orders/:id` - Get details and immutable tracking history.
- `PUT /api/orders/:id/status` - Transition status. Request: `{ status, remarks }`
- `PUT /api/orders/:id/assign-agent` - (Admin only) Assign agent. Request: `{ agentId }` or `{ autoAssign: true }`
- `PUT /api/orders/:id/reschedule` - Reschedule failed attempt. Request: `{ rescheduleDate }`
