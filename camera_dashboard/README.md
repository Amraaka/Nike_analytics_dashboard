# AI Camera Dashboard - Teller Activity Monitor

A modern, real-time dashboard for monitoring AI camera data in teller areas. Built with React, TypeScript, and Tailwind CSS.

## Features

- **Real-time Monitoring**: Live updates every 3 seconds with simulated camera data
- **Teller Tracking**: Monitor individual teller performance, status, and metrics
- **Customer Analytics**: Track customer flow, service times, and hall occupancy
- **Performance Metrics**: Visualize utilization rates, service time distributions
- **Peak Hour Detection**: Heatmap showing busy periods throughout the week
- **Time Filtering**: View data for 1 hour, 1 day, or 1 week periods
- **Data Export**: Export detailed metrics to CSV
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Chart.js** - Data visualization
- **Zustand** - State management
- **Lucide React** - Icons
- **date-fns** - Date formatting

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── ui/              # Base UI components (shadcn/ui)
│   ├── layout/          # Layout components (Header, TimeFilter)
│   ├── cards/           # Stat and Teller cards
│   ├── charts/          # Chart components
│   └── tables/          # Metrics table
├── hooks/               # Custom React hooks
├── services/            # Mock data service
├── store/               # Zustand state management
├── types/               # TypeScript type definitions
└── lib/                 # Utility functions
```

## Key Components

### Dashboard Overview
- **Overview Cards**: Key metrics (active tellers, customers served, hall count, avg time)
- **Live Teller Status**: Real-time status cards for each teller
- **Performance Charts**: Service time distribution and utilization rates
- **Analytics**: Customer flow timeline and peak hours heatmap
- **Metrics Table**: Detailed, sortable data with CSV export

### Mock Data
Currently uses client-side mock data that simulates realistic teller activity:
- 5-6 tellers with varying performance
- Dynamic customer service cycles
- Time-based patterns (higher activity during peak hours)
- Randomized metrics within realistic ranges

## Backend Integration

This is currently a frontend-only MVP. To integrate with a real backend:

1. Replace `mockDataService.ts` with `apiService.ts`
2. Implement WebSocket connection for real-time updates
3. Add API endpoints:
   - `GET /api/tellers` - Current teller data
   - `GET /api/metrics?filter=1h|1d|1w` - Historical metrics
   - `WS /api/realtime` - WebSocket for live updates

The data structure and TypeScript interfaces are already designed for easy backend integration.

## Future Enhancements

- Backend integration (NestJS + WebSocket)
- Alert system for utilization thresholds
- Historical data persistence
- Camera feed integration
- AI predictions for peak hours
- Multi-location support
- User authentication

## License

MIT
