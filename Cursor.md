expo-supabase-starter/
├── app/                  # Main application code using Expo Router
│   ├── (protected)/      # Protected routes (require auth)
│   │   ├── (tabs)/       # Tab-based navigation
│   │   ├── _layout.tsx   # Layout for protected routes
│   │   └── modal.tsx     # Example modal component
│   ├── _layout.tsx       # Root layout with auth provider
│   ├── sign-in.tsx       # Sign in screen
│   ├── sign-up.tsx       # Sign up screen
│   └── welcome.tsx       # Welcome/landing screen
├── components/           # Reusable UI components
│   └── ui/               # Base UI components
├── config/               # Application configuration
├── constants/            # App-wide constants
├── context/              # React context providers
│   └── supabase-provider.tsx  # Supabase auth context
├── docs/                 # Documentation
├── lib/                  # Utility functions and hooks
├── scripts/              # Build and utility scripts
├── .env.example          # Example environment variables
├── app.json             # Expo configuration
├── package.json         # Project dependencies
└── tailwind.config.js   # Tailwind CSS configuration

Key Files and Their Purposes
Core Application
app/_layout.tsx: Root layout with AuthProvider and navigation setup
app/(protected)/_layout.tsx: Layout wrapper for authenticated routes
app/(protected)/modal.tsx: Example modal component in protected area
app/sign-in.tsx: User sign-in screen
app/sign-up.tsx: User registration screen
app/welcome.tsx: Initial landing page
Configuration
config/: Application configuration files
constants/colors.ts: Color scheme definitions
tailwind.config.js: Tailwind CSS configuration
app.json: Expo configuration
Authentication
context/supabase-provider.tsx: Supabase authentication context
lib/supabase/: Supabase client configuration
Styling
global.css: Global styles
components/ui/: Reusable UI components with Tailwind
Navigation Structure
Public Routes:
/welcome - Landing page
/sign-in - Authentication modal
/sign-up - Registration modal
Protected Routes (/(protected)/*):
Accessible only to authenticated users
Contains tab-based navigation structure
Development Setup
Install dependencies: yarn or npm install
Copy .env.example to .env and configure your Supabase credentials
Start development server: yarn start or npm start
Key Dependencies
Expo Router: File-based routing
@supabase/supabase-js: Supabase client
nativewind/tailwindcss: Styling
react-hook-form + zod: Form handling and validation
expo-secure-store: Secure storage for auth tokens
Common Patterns
Uses React Context for global state (especially auth)
Follows Expo Router file-based routing
Implements protected routes with layout-based authentication
Uses Tailwind CSS for styling with nativewind
Follows TypeScript best practices
This guide provides a high-level overview of the project structure. For detailed implementation, refer to the specific files and the comprehensive documentation in the docs/ directory