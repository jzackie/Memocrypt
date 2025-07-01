# Memocrypt - Secure Encrypted Notes App

A modern, secure notes application with client-side encryption, and grouped/filterable notes.

## Features

- Secure user authentication with reset key system
- Create, edit, and delete encrypted notes (client-side encryption)
- Attach files to notes (images, videos, documents, etc.)
- File previews for images/videos, links for other files
- File uploads via Cloudinary
- Minimal, dark, green-accented glassmorphism UI
- Animated Cube background on login/signup
- Responsive, scrollable design with custom scrollbars
- Notes grouped by date, filterable in real-time
- Auto-save with robust error handling
- Delete notes and attachments with confirmation
- Download notes as .txt files
- Sticky header and filter bar for easy navigation

## Figma Design

You can view the Figma design [here](https://www.figma.com/proto/6t5bggnRMeHGWdsEPvbjQM/Memocrypt?page-id=27%3A146&node-id=27-3218&p=f&viewport=401%2C333%2C0.33&t=YgXLMvcj164v46T7-1&scaling=min-zoom&content-scaling=fixed&starting-point-node-id=27%3A3218)

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: bcryptjs for password hashing
- **File Storage**: Cloudinary (unsigned preset)
- **UI**: Custom CSS (glassmorphism, dark/green theme)
- **Forms**: React Hook Form with Zod validation

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory with the following variables:

```env
# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/memocrypt

# Cloudinary Credentials
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Example for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/memocrypt?retryWrites=true&w=majority
```

### 3. Database Setup

Make sure you have MongoDB running locally or use MongoDB Atlas:

- **Local MongoDB**: Install and start MongoDB service
- **MongoDB Atlas**: Create a free cluster and get your connection string

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### First Time Setup

1. **Sign Up**: Create a new account with username, email, and password
2. **Save Reset Key**: The app will show you a reset key - save this securely! You'll need it to reset your password
3. **Download Reset Key**: Click the download button to save the reset key as a JSON file

### Using the App

- **Create Notes**: Click the floating "+" button to create new notes
- **Edit Notes**: Click on any note to preview, then click the edit button
- **Filter Notes**: Use the sticky filter bar to search notes by title or content
- **Delete Notes**: Click the trash icon on any note card
- **Attach Files**: Add images, videos, or documents to your notes; preview or download them
- **Delete Attachments**: Remove files from notes with the trash icon next to each file
- **Download Notes**: Download any note as a .txt file

### Password Reset

If you forget your password:
1. Click "Forgot Password?" on the login screen
2. Upload your saved reset key file or paste the key manually
3. Enter your new password

## File Attachments & Previews

- Attach multiple files to each note (images, videos, PDFs, etc.)
- Images and videos show inline previews; other files show as clickable links
- Files are uploaded directly to Cloudinary from the browser
- Remove attachments with the trash icon before saving
- All attachments are listed at the bottom of each note card

## Security Features

- Passwords are hashed using bcryptjs
- Reset keys are hashed using SHA-256
- Client-side session management
- Secure API endpoints with proper validation
- Notes are encrypted client-side before being sent to the server

## UI/UX Highlights

- Minimal, modern, dark/green-accented design
- Animated Cube background on login/signup
- Sticky header and filter bar always visible
- Dense, responsive notes grid with left-aligned content
- Custom dark/green scrollbars
- All containers and cards are scrollable if content overflows

## Project Structure

```
my-app/
├── app/
│   ├── api/               # API routes
│   │   ├── login/         # Authentication
│   │   ├── signup/
│   │   ├── reset-password/
│   │   └── notes/         # Notes CRUD
│   ├── components/        # React components
│   │   ├── Cube/          # Animated background
│   │   └── LoginSignup/   # Auth forms
│   ├── note/              # Note pages
│   │   ├── new/           # Create note
│   │   └── [id]/edit/     # Edit note
│   └── page.tsx           # Main dashboard
├── lib/                   # Database & Cloudinary
├── models/                # Mongoose models
└── public/                # Static assets
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Features

1. Create new API routes in `app/api/`
2. Add new pages in `app/` directory
3. Create components in `app/components/`
4. Update models in `models/` if needed
