# Ethiopian Airlines AI Chatbot — Frontend

Production-grade AI flight booking chat interface for Ethiopian Airlines, connected to an n8n webhook backend (Sabre GDS).

## Stack

- React 19 + Vite
- Tailwind CSS v4
- Framer Motion
- Lucide React
- Axios

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Environment

| Variable | Description |
|----------|-------------|
| `VITE_WEBHOOK_URL` | n8n webhook endpoint for chat API |

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run preview` — preview production build

## Flight list backend note

For booking to work, `flight_list` responses should include `cookie` inside `ui_data`:

```json
{
  "ui_component": "flight_list",
  "ui_data": {
    "cookie": { "sabreCookies": [...] },
    "legs": [...]
  }
}
```

The frontend also supports a flat `legs` array without a wrapper.
