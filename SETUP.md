# Setup Instructions

## Prerequisites

- Node.js 18+ and npm
- Git

## Installation

### 1. Install Digital Phylactery Dependencies

```bash
cd digital-phylactery
npm install
```

### 2. Install Necronomicon MCP Server Dependencies

```bash
cd ../necronomicon-mcp
npm install
```

## Running the Application

### Development Mode

From the `digital-phylactery` directory:

```bash
npm run dev
```

This will start:
- Backend server on http://localhost:3001
- Frontend dev server on http://localhost:3000

### Production Build

```bash
# Build both frontend and backend
npm run build

# Preview the production build
npm run preview
```

## Project Structure Verification

After setup, you should have:

```
✓ digital-phylactery/
  ✓ src/backend/     (Backend server code)
  ✓ src/frontend/    (React application)
  ✓ src/shared/      (Shared TypeScript types)
  ✓ data/            (SQLite database location)
  ✓ node_modules/    (Dependencies)

✓ necronomicon-mcp/
  ✓ src/             (MCP server code)
  ✓ node_modules/    (Dependencies)
```

## Next Steps

1. Install dependencies as shown above
2. Review the implementation tasks in `.kiro/specs/digital-phylactery/tasks.md`
3. Start implementing features according to the task list
4. Run `npm run dev` to test your changes

## Troubleshooting

**TypeScript errors before installation**: This is expected. Run `npm install` in both project directories to resolve.

**Port conflicts**: If ports 3000 or 3001 are in use, you can modify them in:
- Frontend: `digital-phylactery/vite.config.ts` (server.port)
- Backend: Will be configurable in `src/backend/server.ts` (implemented in later tasks)
