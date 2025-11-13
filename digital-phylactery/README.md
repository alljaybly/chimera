# Digital Phylactery

A self-evolving knowledge management system that automatically discovers connections between your content and adapts its interface to your usage patterns.

## Project Structure

```
digital-phylactery/
├── src/
│   ├── backend/          # Node.js backend server
│   │   ├── ingestion/    # Content ingestion engine
│   │   ├── discovery/    # Connection discovery system
│   │   ├── analytics/    # Behavioral analytics engine
│   │   └── api/          # REST API endpoints
│   ├── frontend/         # React frontend application
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom React hooks
│   │   └── adaptive-ui/  # Adaptive UI engine
│   └── shared/           # Shared types and utilities
│       └── types/        # TypeScript type definitions
├── data/                 # SQLite database and content storage
└── dist/                 # Build output
```

## Development

```bash
# Install dependencies
npm install

# Run development servers (backend + frontend)
npm run dev

# Build for production
npm run build
```

## Tech Stack

- **Frontend**: React 18, D3.js, Zustand
- **Backend**: Node.js, Express, SQLite
- **Build Tools**: Vite, TypeScript
