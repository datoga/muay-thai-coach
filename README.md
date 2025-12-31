# MuayThai Coach 🥊

A web-based Muay Thai training application with AI-powered technique analysis. Train like a champion with interactive demonstrations, webcam recording, and real-time pose estimation feedback.

![Node.js Version](https://img.shields.io/badge/node-%3E%3D24.0.0-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

- **📖 Learn**: Watch animated stickman demonstrations of Muay Thai combinations
- **🎥 Practice**: Record yourself training with webcam
- **📊 Review**: Get AI-powered analysis with pose estimation and technique scoring
- **🌐 Bilingual**: Full English and Spanish support
- **🌙 Themes**: Light, dark, and system theme options
- **☁️ Cloud Storage**: Save recordings to your Google Drive
- **🎵 Music**: Built-in metronome and Spotify integration

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Auth.js / NextAuth v5
- **Internationalization**: next-intl
- **Pose Estimation**: MediaPipe Tasks Vision
- **Analytics**: Google Analytics 4
- **State**: localStorage + React state

## Requirements

- **Node.js 24+** (see `.nvmrc`)
- **pnpm** (latest version)
- Google Cloud Console project (for OAuth)

## Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd muay-thai-coach-2

# Use correct Node version
nvm use

# Install dependencies
pnpm install
```

### 2. Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Fill in the required values:

```env
# Required
AUTH_SECRET=<generate with: openssl rand -base64 32>
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
NEXTAUTH_URL=http://localhost:3000

# Optional - Google Analytics 4
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Select "Web application"
6. Add authorized origins:
   - `http://localhost:3000` (development)
   - `https://your-app.vercel.app` (production)
7. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://your-app.vercel.app/api/auth/callback/google`
8. Enable the Google Drive API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Drive API"
   - Click "Enable"

**Required OAuth Scopes:**
- `openid`
- `email`
- `profile`
- `https://www.googleapis.com/auth/drive.file` (for saving videos)

### 4. Google Analytics (Optional)

To enable Google Analytics tracking:

1. Go to [Google Analytics](https://analytics.google.com/)
2. Create a GA4 property for your app
3. Get your Measurement ID (format: `G-XXXXXXXXXX`)
4. Add it to your `.env.local`:
   ```
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

**Custom Events**: You can track custom events using the `trackEvent` helper:

```tsx
import { trackEvent } from '@/components/GoogleAnalytics';

// Track a training session started
trackEvent('session_started', 'training', 'combo_1');
```

### 5. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── [locale]/           # Locale-prefixed routes
│   │   ├── page.tsx        # Landing page
│   │   ├── dashboard/      # Training dashboard
│   │   ├── session/        # Training session wizard
│   │   └── settings/       # User settings
│   ├── api/
│   │   └── auth/           # NextAuth API routes
│   └── globals.css         # Global styles
├── components/
│   ├── CalibrationPhase.tsx    # Camera calibration
│   ├── LearnPhase.tsx          # Combo demonstration
│   ├── PracticePhase.tsx       # Recording phase
│   ├── ReviewPhase.tsx         # Analysis & feedback
│   ├── SessionWizard.tsx       # Training flow controller
│   ├── StickAvatar.tsx         # Animated stickman
│   ├── MusicPanel.tsx          # Music controls
│   └── ...                     # UI components
├── lib/
│   ├── auth.ts             # NextAuth configuration
│   ├── combos.ts           # Combo/move definitions
│   ├── drive.ts            # Google Drive API helpers
│   ├── recorder.ts         # MediaRecorder helpers
│   ├── settings.ts         # localStorage management
│   ├── types.ts            # TypeScript types
│   ├── stickAvatarKeyframes.ts  # Animation data
│   └── pose/
│       ├── pose.ts         # MediaPipe initialization
│       ├── metrics.ts      # Pose calculations
│       └── scoring.ts      # Score generation
├── i18n/
│   ├── request.ts          # next-intl server config
│   └── navigation.ts       # Locale-aware navigation
└── middleware.ts           # i18n routing middleware

messages/
├── en.json                 # English translations
└── es.json                 # Spanish translations
```

## Internationalization (i18n)

The app supports English (en) and Spanish (es) with next-intl:

- All UI text is stored in `messages/{locale}.json`
- URLs are locale-prefixed: `/en/dashboard`, `/es/dashboard`
- Language can be switched via the Navbar dropdown
- Selection is persisted in a cookie

To add a new locale:
1. Create `messages/{locale}.json` with all keys
2. Add locale to `src/i18n/request.ts`

## Theme System

Three theme options using next-themes:

- **Light**: Clean, bright interface
- **Dark**: Easy on the eyes for training
- **System**: Follows OS preference

Theme is persisted in localStorage and applied via CSS class strategy.

## Settings

All settings are persisted in localStorage and accessible via the Settings page.

### Calibration

First-time calibration captures:

- **View angle**: Front, 3/4, or side (auto-detected)
- **Stance**: Orthodox or Southpaw (changeable in Settings)
- **Gloves**: Whether wearing boxing gloves (affects feedback text and thresholds)
- **Baseline measurements**: Shoulder width, guard height

Calibration data can be re-run or cleared from Settings.

### Training Settings

Configurable round durations per difficulty level:

| Level | Default | Range |
|-------|---------|-------|
| Level 1 (Beginner) | 1 min | 30s - 3 min |
| Level 2 (Intermediate) | 2 min | 1 - 4 min |
| Level 3 (Advanced) | 3 min | 2 - 5 min |
| Rest between rounds | 1 min | 15s - 2 min |

### Analysis Quality

Three quality presets for pose analysis:

| Preset | Model | FPS | Max Duration | Best For |
|--------|-------|-----|--------------|----------|
| ⚡ Fast | Lite | 10 | 60s | Quick feedback, older devices |
| ⚖️ Balanced | Full | 15 | 180s | **Recommended** - good accuracy |
| 🎯 Maximum | Heavy | 30 | 300s | Detailed analysis, powerful devices |

### Video Storage

- Videos are stored locally in IndexedDB (not uploaded)
- Configurable max videos: 1-30 (default: 10)
- Oldest videos auto-deleted when limit reached
- Current storage usage displayed in Settings

### Music Features

- **Background loops**: Add your own royalty-free tracks to `/public/audio/`
- **Spotify Embed**: Paste any Spotify track/album/playlist URL
- **Volume control**: Adjustable default volume (0-100%)

## Pose Analysis

Uses MediaPipe PoseLandmarker for on-device analysis:

- Model selection based on quality preset (lite/full/heavy)
- Calculates joint angles, guard position, stability
- Generates scores (0-100) with subscores:
  - Guard (0-25)
  - Stability (0-20)
  - Execution (0-40)
  - Timing (0-15)
- Provides actionable feedback and warnings

**Privacy**: All analysis runs locally in the browser. Video is never uploaded to our servers.

## Google Drive Integration

After signing in with Google:

1. Videos can be uploaded to Google Drive
2. Creates/uses a "MuayThaiCoach" folder
3. Files are named: `{comboId}_{timestamp}.webm`
4. Web links are stored with session history

The app only requests `drive.file` scope (access only to files it creates).

## Deployment to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables (same as `.env.local`)

### 3. Configure Node.js Version

In Vercel project settings:
- Go to Settings > General
- Set Node.js Version to 24.x

Or add to `vercel.json`:
```json
{
  "build": {
    "env": {
      "NODE_VERSION": "24"
    }
  }
}
```

### 4. Update OAuth Redirect URIs

Add your Vercel deployment URL to Google OAuth authorized origins and redirect URIs.

## Limitations & Future Improvements

### Current Limitations

- **Browser support**: Requires modern browser with MediaRecorder API
- **Video analysis**: Basic heuristics, not full action recognition
- **Audio files**: Placeholder only, need royalty-free loops for production
- **Mobile**: Works but optimized for desktop/tablet
- **Offline**: Requires internet for pose model and auth

### Planned Improvements

- [ ] Advanced Spotify Connect (OAuth + Playback SDK)
- [ ] More sophisticated action segmentation
- [ ] Training program / progression tracking
- [ ] Rep counting
- [ ] Multiplayer/social features
- [ ] PWA support for offline use
- [ ] More combo levels and moves

## Development

```bash
# Run dev server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint
pnpm lint
```

## License

MIT License - feel free to use this project for learning and personal training.

## Credits

- **MediaPipe**: Google's ML framework for pose estimation
- **Next.js**: The React framework for production
- **Tailwind CSS**: Utility-first CSS framework
- **Auth.js**: Authentication for Next.js

---

Train hard, fight easy! 🥊

