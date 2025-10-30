# DOB Performance Tracker

## Overview
A secure performance tracking application for DOB team members with monthly rankings and analytics. The application allows teams to track content performance, manage employee data, and monitor workflow progress.

## Tech Stack
- **Frontend**: React 18 with TypeScript, Vite
- **Backend**: Express.js with TypeScript
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **Data Storage**: LocalStorage (client-side)
- **External APIs**: YouTube Data API v3 (via googleapis)

## Project Structure
```
.
├── client/               # Frontend React application
│   ├── public/          # Static assets
│   ├── src/
│   │   ├── components/  # UI components (shadcn/ui)
│   │   ├── contexts/    # React contexts (Auth)
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utility functions
│   │   └── pages/       # Application pages/routes
│   └── index.html       # HTML entry point
├── server/              # Backend Express server
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API routes
│   ├── vite.ts          # Vite dev server setup
│   ├── youtube.ts       # YouTube API integration
│   └── storage.ts       # Storage interface
└── shared/              # Shared TypeScript types/schemas
    └── schema.ts        # Zod validation schemas

```

## Features
- **Authentication System**: Login with user ID and password, IP-based access restrictions
- **Performance Dashboard**: Track content performance with views, reach, and engagement
- **Voice Artist Portal**: Dedicated section for voice artists
- **Attendance Tracking**: Monitor team attendance with auto-late detection, manual time adjustment, and comprehensive summary reports
- **Work Flow Management**: Track content production workflow with assignee ("For") field
- **Video Upload Time Tracking**: Monitor upload schedules
- **Employee Data Management**: Admin-only employee information
- **Jela Reporter Data**: Admin-only reporter data
- **Rankings**: Admin-only performance rankings
- **Admin Panel**: Administrative settings with Super Moderator creation and IP Access Control
- **YouTube Integration**: Fetch video information via YouTube API
- **Chat Box Page**: Dedicated full-page chat interface accessible from navigation menu (positioned after Dashboard)

## Development Setup
1. Dependencies are managed via npm
2. TypeScript configuration is in `tsconfig.json`
3. Vite configuration is in `vite.config.ts`
4. Tailwind CSS configuration is in `tailwind.config.js`

## Running the Application
- **Development**: `npm run dev` (runs on port 5000)
- **Build**: `npm run build`
- **Preview**: `npm run preview`

## Deployment
- Configured for Replit Autoscale deployment
- Build step: `npm run build`
- Run command: `tsx server/index.ts`
- Serves both API and frontend on port 5000

## Environment Variables
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment (development/production)
- YouTube API credentials are managed via Replit connectors

## Key Dependencies
- React, React DOM, React Router (wouter)
- Express.js
- TypeScript, tsx
- Vite, @vitejs/plugin-react
- Tailwind CSS, PostCSS, Autoprefixer
- Radix UI components
- TanStack Query
- Zod for validation
- googleapis for YouTube API
- xlsx for Excel export functionality

## License Activation System (October 30, 2025)

### Production-Ready License & Tamper Detection
Implemented comprehensive license activation and tamper-detection system:

**Core Features:**
- **Pre-login Activation**: License key required before login screen appears
- **Server-side Validation**: JWT tokens (HS256) with master key hash verification
- **File Integrity**: SHA-256 manifest with HMAC signature for tamper detection
- **Decoy Files**: Monitored files trigger security alerts if modified/removed
- **Kill-Switch**: Disables Chat, Export, Admin, Upload, Rankings on invalid license
- **Audit Logging**: All activations, failures, and tamper incidents logged
- **Rate Limiting**: Max 5 activation attempts per IP per 15 minutes
- **Admin Management**: Full license management UI at `/license-admin`

**Security Hardening:**
- Mandatory environment variables (no defaults) - see LICENSE_SETUP.md
- Timing-safe hash comparisons
- Atomic file writes with restrictive permissions (0o600)
- Base64-encoded token storage (clearly labeled, not encryption)
- File-based storage ready for PostgreSQL migration

**Files Added:**
- `server/license/*` - License validation, storage, manifest generation
- `client/src/contexts/LicenseContext.tsx` - Client license management
- `client/src/pages/activation.tsx` - Activation screen
- `client/src/pages/license-admin.tsx` - Admin license panel
- `LICENSE_SETUP.md` - Complete setup and deployment guide
- `scripts/generate-secrets.ts` - Secure secret generator
- Decoy files: LICENSE_FAKE.md, README_KEY_HINT.txt, docs/KEYS_NOT_HERE.md, keys/NOT_THIS_ONE.key

**⚠️ CRITICAL - Environment Variables Required:**
The system will NOT start without these variables. Generate them with:
```bash
tsx scripts/generate-secrets.ts
```
Then add to Replit Secrets:
- LICENSE_JWT_SECRET (required)
- MANIFEST_SECRET (required)  
- MASTER_KEY_HASHES (required)
- TOKEN_EXPIRY (optional, default: 1y)

**Default Master Key**: `ava-I-can-never-tell-you`
Hash: `2391895c2abb3e5aba73deaa8a8b7f4a35fef18d6320166ca8cd82c98052b03d`

See LICENSE_SETUP.md for complete setup instructions.

## Recent Changes (October 30, 2025)

### Chat Duplicate Message Fix - Enhanced (October 30, 2025)
- **Issue**: Messages appearing 2+ times when sent in chat
- **Root Cause**: Sender was receiving their own message back from server despite broadcastToOthers
- **Solution**: Added client-side filter in ChatContext.tsx
  - Line 124: Check if incoming message userId matches current user
  - Only add messages from OTHER users when received via WebSocket
  - Sender still sees message immediately via optimistic update (line 281)
  - Other users receive via server broadcast without duplication
- **Technical Details**:
  - Server correctly uses broadcastToOthers(message, ws) to exclude sender
  - Added safety check: `if (message.data.userId !== user?.userId)` before adding to messages
  - Prevents edge cases where sender might receive own message
  
### Chat Duplicate Message Fix (October 30, 2025 - Initial)
- **Bug Fixed**: Resolved duplicate message issue in chat
  - Messages were appearing twice because server was broadcasting to ALL clients including the sender
  - Created `broadcastToOthers` function in server/routes.ts to exclude sender from broadcasts
  - Updated chat_message handler to use broadcastToOthers instead of broadcastToAll
  - Implemented optimistic updates in ChatContext.tsx - messages are added to local state immediately when sent
  - Sender sees their message instantly, other clients receive via WebSocket, no duplicates occur

### Chat Reply and Mention Features (October 30, 2025)
- **Reply Functionality**: Users can reply to specific messages
  - Reply button appears on all messages (except own messages)
  - Reply preview shows when composing a reply with option to cancel
  - Original message context displayed in replied messages
  - Reply data (messageId, userName, message) stored with each message
- **Mention Functionality**: Users can mention other online users
  - Type `@[` to trigger mention autocomplete dropdown
  - Dropdown filters online users as you type
  - Mentions stored in format `@[Full Name]` to support multi-word usernames
  - Mentioned usernames highlighted with special styling in messages
  - Mention data extracted and stored with each message
  - Fixed mention parsing regex to properly capture multi-word usernames using bracket notation

### HMR Disabled to Fix Auto-Reload Issue (October 30, 2025)
- **Issue Fixed**: Resolved automatic page reloading and logout problem
  - Disabled Vite Hot Module Replacement (HMR) in both `vite.config.ts` and `server/vite.ts`
  - HMR WebSocket was conflicting with chat WebSocket on `/ws` path, causing constant reconnection attempts
  - Authentication state persists correctly in localStorage without HMR interference
  - Note: Code changes during development now require manual page refresh
  - Production builds remain unaffected (HMR only active in development)

### Chat Box Dedicated Page (October 30, 2025)
- **New Chat Box Page**: Created dedicated full-page chat interface at client/src/pages/chat-box.tsx
  - Full-page layout similar to other application pages (uses DashboardHeader and Footer)
  - Displays all real-time chat features in dedicated page view
  - Shows online users list with role badges in sidebar
  - Pinned messages section displayed separately at top
  - Message list with all chat functionality (send, read receipts, file sharing, etc.)
  - Admin moderation controls (pin/unpin messages, block/mute users)
  - Navigation integrated: "Chat Box" menu item added after Dashboard in DashboardHeader
  - Route configured: /chat-box path added to App.tsx routing
  - Full integration with ChatContext for all chat functionality
  - Confirmation dialogs for blocking and muting users with proper userName parameters

### Replit Environment Setup - Fresh Import (October 30, 2025)
- **GitHub Import Completed**: Successfully cloned and set up the project in Replit environment
- **Dependencies Installed**: All npm packages installed (448 packages)
- **Workflow Configuration**: 
  - Development workflow configured running `npm run dev` on port 5000
  - Server binds to 0.0.0.0:5000 (frontend + backend on same port)
  - Webview output type configured for frontend preview
  - Application running successfully
- **Environment Configuration**:
  - Server configured with host: 0.0.0.0 and port: 5000
  - Vite config updated with allowedHosts: true for Replit proxy support
  - HMR disabled to prevent WebSocket conflicts with chat feature
  - WebSocket server running on /ws path for real-time chat
- **Deployment Setup**:
  - Configured for Autoscale deployment (stateless web application)
  - Build command: `npm run build`
  - Run command: `tsx server/index.ts`
  - Production serves static files from dist/public
- **Git Configuration**: Created .gitignore for Node.js project with standard exclusions
- **Verification**: Login page loads correctly, application fully functional
- **Integration Notes**: YouTube API uses Replit connector integration (not API key)

### 💬 Real-Time Chat Box Feature
- **Complete Chat System**: Added real-time chat functionality with WebSocket support
  - Real-time messaging using WebSocket (ws library) on path `/ws`
  - Online/Offline status indicators with green/gray dots
  - File & image sharing (up to 5MB, admin can toggle on/off)
  - Pinned messages feature (admin can pin important messages to top)
  - Message timestamps and read receipts (✔️ = sent, ✔️✔️ = read)
  - User typing indicators
  - Floating chat button with unread message badge
  - Responsive chat UI with message history scrolling
  
- **Admin Controls in Settings**:
  - ON/OFF toggle to enable/disable entire chat system
  - File sharing toggle (enable/disable file attachments)
  - Moderator-only mode (restrict chat to moderators and admins only)
  - Clear all chat data button with confirmation
  - Block/unblock users from chat
  - Mute/unmute users from sending messages
  - View lists of blocked and muted users
  
- **Technical Implementation**:
  - WebSocket server integrated with Express on `/ws` path
  - ChatProvider context for state management
  - ChatBox component with full-featured UI
  - LocalStorage persistence for messages, settings, blocked/muted users
  - User list showing online users with their roles
  - Automatic reconnection on disconnect
  - Heartbeat mechanism for connection health

- **⚠️ Security Limitations**:
  - **Internal Use Only**: This chat feature is designed for internal team use among trusted users
  - **Client-Side Auth**: Due to the localStorage-based architecture with no backend database, WebSocket connections cannot be cryptographically authenticated
  - **Trust-Based Model**: User roles are self-reported and validated client-side
  - **Production Recommendation**: For production deployment or untrusted environments, implement:
    - Server-side database for user credentials and roles
    - JWT or session-based authentication
    - Proper token validation for WebSocket connections
    - Server-side authorization for all privileged actions
  - **Current Mitigation**: Server performs role checks, but roles are client-provided
  - **Acceptable For**: Internal tools where all team members are trusted

## Recent Changes (October 29, 2025)

### Voice Artist Bill Privacy Enhancement
- **Admin-Only Bill Visibility**: Bill amounts are now restricted to admin users only
  - "Bill" column in Voice Artist Work Records table hidden from non-admin users
  - Estimated bill preview when adding work entries visible only to admins
  - Voice Artist Bill tab already restricted to admin users
  - Non-admin users can still view and enter work records but without seeing billing amounts

### Voice Artist Setup Privacy Enhancement
- **Admin-Only Artist Details**: Voice artist list now restricted to admin users only
  - Voice Artists table (showing names, phones, rates, notes) visible only to admins
  - Non-admin users see "Only administrators can view voice artist details" message
  - Add New Voice Artist form already restricted to admin users
  - Non-admin users can still add work entries by selecting from artist dropdown in Work Entry tab

### Work Flow Notes Enhancement
- **Team Notes Update**: Added both "To:" and "For:" fields in note creation
  - Notes now support separate "To" and "For" person fields
  - Updated Note interface to include both fields
  - Create form includes both "To:" and "For:" input fields
  - Note display shows both fields prominently
  - Edit dialog updated to allow editing both fields
  - Validation requires all three fields (To, For, Message)

### Fresh GitHub Import - Replit Setup Completed
- **GitHub Import**: Successfully cloned and configured fresh project for Replit environment
- **Dependencies**: Installed all npm dependencies (446 packages)
- **Workflow Configuration**: Set up Server workflow running `npm run dev` on port 5000
- **Development Server**: Express + Vite dev server running successfully
- **Frontend Verification**: React application loads properly with login page visible
- **Deployment Configuration**: Configured Autoscale deployment
  - Build command: `npm run build`
  - Run command: `tsx server/index.ts`
- **Git Configuration**: Created .gitignore file for Node.js project
- **Server Configuration**: Pre-configured for Replit environment:
  - Host: 0.0.0.0 (frontend accessible via proxy)
  - Port: 5000 (required for Replit)
  - Vite allowedHosts: true (proxy support enabled)
  - HMR configured for WSS on port 443
- **LSP Status**: All TypeScript errors resolved after dependency installation

## Notes
- The application uses localStorage for client-side data persistence
- YouTube API integration requires proper Replit connector setup
- Admin features require admin role authentication
- Super Moderators have granular permissions defined per module
- IP Access Control uses ipapi.co API for real-time IP verification
- Permission system supports both new granular permissions and legacy permission strings
- Hot Module Replacement (HMR) is enabled for development

## User Roles & Permissions
- **Admin**: Full access to all features and settings
- **Super Moderator**: Granular permissions per module (configurable by admin)
- **Moderator**: Can add and edit content (no delete or admin access)
- **User**: Basic viewing permissions
