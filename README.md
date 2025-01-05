# LED Matrix Server

A web interface for controlling LED matrices on RP2040-based microcontrollers. This server provides a visual grid interface where users can click cells to cycle through different colors (off, red, green, blue), with the state being tracked and made available via a REST API.

## Features

- 5x3 LED matrix visual interface
- Click to cycle through colors (off/gray, red, green, blue)
- Real-time state updates via API
- Built with React + Vite
- Ready for RP2040 integration

## API Endpoints

- `GET /api/matrix/get` - Get current matrix state
- `POST /api/matrix/update` - Update matrix state (expects 5x3 2D array of integers 0-3)

## Installation

Install dependencies:

```bash
bun install
```

## Running the Server

Start the development server:

```bash
bun run start
```

The web interface will be available at `http://localhost:5173`

## Development

This project uses:
- React for the frontend
- Vite as the development server
- Tailwind CSS for styling
- TypeScript for type safety
- [Bun](https://bun.sh) as the JavaScript runtime

## Hardware Integration

The API endpoints are designed to work with RP2040-based LED matrix controllers. The matrix state is represented as integers:
- 0: Off
- 1: Red
- 2: Green
- 3: Blue
