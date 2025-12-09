# Crazy Draw Backend

TypeScript backend server for Crazy Draw application.

## Features

- WebRTC signaling server for real-time collaboration
- Room-based signaling support
- Ready for database integration

## Setup

1. Install dependencies:
```bash
npm install
```

Or from the root directory:
```bash
npm run backend:install
```

## Development

Run the server in development mode (with hot reload):
```bash
npm run dev
```

Or from the root directory:
```bash
npm run backend:dev
```

## Production

Build the TypeScript code:
```bash
npm run build
```

Start the production server:
```bash
npm run start
```

## Environment Variables

- `SIGNALING_PORT` - Port for the WebSocket signaling server (default: 4444)

## Project Structure

```
backend/
├── src/
│   └── server.ts          # Main signaling server
├── dist/                   # Compiled JavaScript (generated)
├── tsconfig.json           # TypeScript configuration
└── package.json            # Backend dependencies
```

## Future Expansion

This backend is structured to easily add:
- Database models and migrations
- REST API routes
- Authentication services
- Canvas persistence
- User management

