# LocalVibe - Hyperlocal Community Platform

## 🎯 Problem Statement
Modern communities suffer from disconnected neighborhoods where people don't know their neighbors, local businesses struggle to reach customers, and important local information gets lost. LocalVibe bridges this gap by creating a hyperlocal social platform that connects people within their immediate vicinity.

## 🚀 Core Features

### 1. Proximity-Based Feed
- **Dynamic Radius Control**: Users can set custom distances (100m to 50km) via slider
- **Multi-Level Posts**: Support for neighborhood, city, state, country, and global posts
- **Location Verification**: GPS-based posting with optional address verification
- **Real-time Updates**: Live feed updates using Server-Sent Events

### 2. Community Marketplace
- **Item Sharing**: Borrow/lend items within community
- **Skill Exchange**: Local service offerings (tutoring, repairs, etc.)
- **Waste Reduction**: Community recycling and upcycling initiatives

### 3. Local Business Hub
- **Daily Specials**: Real-time business updates and offers
- **Capacity Indicators**: Live seating availability, queue status
- **Flash Deals**: Time-sensitive perishable item promotions
- **Business Verification**: Authenticated business profiles

### 4. Emergency Alert System
- **Urgent Broadcasts**: Critical community alerts
- **Weather Warnings**: Local weather updates
- **Lost & Found**: Pets, items, emergency contacts
- **Medical Emergencies**: Community health alerts

## 🏗️ Technical Architecture

### Frontend Stack
- **Framework**: Next.js 13+ with App Router
- **Styling**: Tailwind CSS + Shadcn/ui components
- **State Management**: Zustand for client state
- **Maps**: Mapbox GL JS for interactive maps
- **Real-time**: Server-Sent Events for live updates
- **Authentication**: NextAuth.js with multiple providers

### Backend Stack
- **API**: Next.js API Routes (serverless)
- **Database**: MongoDB Atlas (free tier)
- **Geospatial**: MongoDB $geoNear queries
- **File Storage**: Cloudinary for images
- **Email**: Resend for notifications
- **Deployment**: Vercel (frontend + API routes)

### Database Schema

```javascript
// Users Collection
{
  _id: ObjectId,
  email: String,
  username: String,
  profile: {
    name: String,
    avatar: String,
    bio: String,
    interests: [String]
  },
  location: {
    type: "Point",
    coordinates: [longitude, latitude],
    address: String,
    city: String,
    state: String,
    country: String
  },
  preferences: {
    defaultRadius: Number, // in meters
    notifications: {
      emergency: Boolean,
      marketplace: Boolean,
      business: Boolean
    }
  },
  createdAt: Date,
  lastActive: Date
}

// Posts Collection
{
  _id: ObjectId,
  authorId: ObjectId,
  type: "community" | "business" | "emergency" | "marketplace",
  scope: "neighborhood" | "city" | "state" | "country" | "global",
  content: {
    title: String,
    body: String,
    images: [String],
    tags: [String]
  },
  location: {
    type: "Point",
    coordinates: [longitude, latitude],
    address: String,
    radius: Number // visibility radius in meters
  },
  metadata: {
    isUrgent: Boolean,
    expiresAt: Date,
    businessId: ObjectId, // for business posts
    itemDetails: Object // for marketplace posts
  },
  engagement: {
    likes: [ObjectId],
    comments: [ObjectId],
    shares: Number,
    views: Number
  },
  createdAt: Date,
  updatedAt: Date
}

// Businesses Collection
{
  _id: ObjectId,
  ownerId: ObjectId,
  name: String,
  description: String,
  category: String,
  location: {
    type: "Point",
    coordinates: [longitude, latitude],
    address: String
  },
  contact: {
    phone: String,
    email: String,
    website: String
  },
  hours: Object,
  capacity: {
    current: Number,
    max: Number,
    lastUpdated: Date
  },
  verification: {
    isVerified: Boolean,
    documents: [String],
    verifiedAt: Date
  },
  createdAt: Date
}
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Vercel account
- Mapbox API key
- Cloudinary account

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/localvibe.git
cd localvibe

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

### Environment Variables

```env
# Database
MONGODB_URI=your_mongodb_atlas_uri

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Maps
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token

# File Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email
RESEND_API_KEY=your_resend_key
```

## 📱 Key Features Implementation

### 1. Dynamic Radius Control
- Slider component for distance selection (100m - 50km)
- Preset buttons for common distances
- User preference persistence
- Real-time feed filtering

### 2. Geospatial Queries
```javascript
// Example: Get posts within user's radius
const nearbyPosts = await db.collection('posts').find({
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [userLng, userLat]
      },
      $maxDistance: userRadius
    }
  }
}).sort({ createdAt: -1 }).limit(50);
```

### 3. Real-time Updates
- Server-Sent Events for live feed updates
- WebSocket fallback for older browsers
- Optimistic UI updates for better UX

### 4. Business Verification System
- Document upload for business verification
- Admin dashboard for verification approval
- Verified badge system
- Business analytics dashboard

## 🎨 UI/UX Design

### Design System
- **Color Palette**: Community-focused warm colors
- **Typography**: Clean, readable fonts
- **Icons**: Custom icon set for local activities
- **Animations**: Smooth transitions and micro-interactions

### Key Components
- Interactive map with post markers
- Radius selector with visual feedback
- Post creation wizard
- Business dashboard
- Emergency alert system
- Community marketplace interface

## 🔒 Security & Privacy

### Data Protection
- Location data encryption
- User privacy controls
- GDPR compliance
- Secure API endpoints

### Content Moderation
- AI-powered content filtering
- Community reporting system
- Admin moderation tools
- Emergency content prioritization

## 📊 Analytics & Insights

### Community Metrics
- Active users per area
- Post engagement rates
- Business performance
- Emergency response times

### Business Intelligence
- Customer reach analytics
- Peak activity times
- Popular content types
- Geographic insights

## 🚀 Deployment

### Vercel Deployment
```bash
# Deploy to Vercel
vercel --prod
```

### Environment Setup
1. Configure MongoDB Atlas cluster
2. Set up Vercel environment variables
3. Configure custom domain
4. Set up monitoring and analytics

## 🧪 Testing Strategy

### Test Types
- Unit tests for utility functions
- Integration tests for API routes
- E2E tests for critical user flows
- Performance testing for geospatial queries

### Testing Tools
- Jest for unit testing
- Playwright for E2E testing
- MongoDB Memory Server for testing
- Vercel Analytics for performance monitoring

## 📈 Future Enhancements

### Phase 2 Features
- AI-powered content recommendations
- Advanced business analytics
- Community governance tools
- Integration with local government APIs
- Mobile app development

### Monetization Opportunities
- Business premium subscriptions
- Local advertising platform
- Emergency service partnerships
- Data insights for local governments

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- MongoDB for geospatial capabilities
- Vercel for seamless deployment
- Open source community for inspiration

---

**LocalVibe** - Connecting communities, one neighborhood at a time. 🌍🏘️
