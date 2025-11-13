# 🚀 QUICK START - Digital Phylactery Demo

## Start the Demo (3 Steps)

### Step 0: Seed Sample Data (First Time Only)
```bash
cd digital-phylactery
npm run seed
```

**Expected output:**
```
🌱 Seeding database with sample data...
✓ AI Ethics
✓ Gopher Protocol
... (10 nodes total)
✅ Database seeded successfully!
```

### Step 1: Start Backend (Terminal 1)
```bash
cd digital-phylactery
npm run dev:backend
```

**Expected output:**
```
Database initialized successfully
Digital Phylactery backend server running on port 3001
```

### Step 2: Start Frontend (Terminal 2)
```bash
cd digital-phylactery
npm run dev:frontend
```

**Expected output:**
```
VITE ready in XXX ms
Local: http://localhost:3000/
```

### Step 3: Open Browser
Navigate to: **http://localhost:3000**

---

## What You'll See

1. **Orange Demo Banner** - Explains the self-evolving UI concept
2. **Red Evolution Button** - Big "🧪 TRIGGER UI EVOLUTION" button in header
3. **Generation Counter** - Shows current UI generation number

## Demo the Evolution

1. Click the red "🧪 TRIGGER UI EVOLUTION" button
2. Watch the entire UI change colors (header, sidebar, background)
3. See the generation counter increase
4. Click again to cycle through different color schemes
5. Notice the success notification that appears

## Troubleshooting

### Backend won't start?
```bash
# Make sure you're in the right directory
cd digital-phylactery

# Install dependencies
npm install

# Try again
npm run dev:backend
```

### Frontend won't start?
```bash
# Make sure backend is running first on port 3001
# Then start frontend
npm run dev:frontend
```

### Port already in use?
- Backend uses port **3001**
- Frontend uses port **3000**
- Make sure nothing else is using these ports

### Database errors?
The database will be created automatically on first run. If you see errors:
```bash
# Delete the database and let it recreate
rm phylactery.db
npm run dev:backend
```

---

## API Endpoints (for reference)

Backend runs on `http://localhost:3001`

- `GET /api/nodes` - List knowledge nodes
- `GET /api/ui-mutations` - Get UI mutation history
- `GET /api/connections` - Get node connections
- `POST /api/search` - Search knowledge base
- `GET /health` - Health check

---

**Ready to demo! 🎃🧬**
