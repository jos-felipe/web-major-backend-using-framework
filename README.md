# ft_transcendence Backend

This repo is for the Web section of ft_transcendence 42 School project (refer en.subject.txt for more info), Major module: Use a framework to build the backend.

In this major module, it is required to use a specific web framework for backend development: **Fastify with Node.js**.

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

Both commands will start the server on `http://localhost:3000`

## API Endpoints

- `GET /` - Returns a simple hello world response: `{"hello":"world"}`

## Testing

You can test the server is running correctly by making a request to the root endpoint:

```bash
curl http://localhost:3000
```

Expected response:
```json
{"hello":"world"}
```
