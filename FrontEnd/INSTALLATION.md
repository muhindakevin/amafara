# UMURENGE WALLET - Installation Guide

## Quick Start

### Prerequisites
- Node.js (v18 or higher) - [Download](https://nodejs.org/)
- npm or yarn package manager

### Installation Steps

1. **Navigate to the FrontEnd directory**
```bash
cd FrontEnd
```

2. **Install all dependencies**
```bash
npm install
```

This will install all required packages including:
- React 18
- React Router DOM
- Vite
- Tailwind CSS
- Lucide Icons
- Recharts

3. **Start the development server**
```bash
npm run dev
```

4. **Open your browser**
Navigate to: `http://localhost:3000`

### Build for Production

```bash
npm run build
```

Production files will be in the `dist` directory.

### Project Structure

```
FrontEnd/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── cards/         # Card components
│   │   ├── charts/        # Chart components
│   │   └── modals/        # Modal dialogs
│   ├── contexts/          # React contexts
│   │   └── LanguageContext.jsx
│   ├── pages/            # Page components
│   │   ├── Login.jsx
│   │   ├── MemberDashboard.jsx
│   │   ├── GroupAdminDashboard.jsx
│   │   └── ...
│   ├── utils/            # Utility functions
│   │   └── translations.js
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── index.html           # HTML template
├── package.json         # Dependencies
├── tailwind.config.js   # Tailwind configuration
└── vite.config.js       # Vite configuration
```

## Features Implemented

✅ **Multilingual Support** - English, Kinyarwanda, French
✅ **Authentication** - OTP-based login
✅ **Member Dashboard** - Savings, loans, transactions
✅ **Group Admin Dashboard** - Member & loan management
✅ **Cashier Dashboard** - Contribution tracking
✅ **Secretary Dashboard** - Record management
✅ **Agent Dashboard** - Group oversight
✅ **System Admin Dashboard** - Full system control
✅ **Chat Interface** - Real-time messaging
✅ **Analytics Dashboard** - AI-powered insights
✅ **Loan Management** - AI recommendations
✅ **Responsive Design** - Mobile, tablet, desktop

## Technology Stack

- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Lucide Icons** - Icons
- **Recharts** - Data visualization

## Color Scheme

- Primary: #0A84FF (Bright Blue)
- Secondary: White
- Accent: Various blue shades

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Troubleshooting

### Port Already in Use
```bash
# Change port in vite.config.js
server: { port: 3001 }
```

### Dependency Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Support

For issues or questions, please contact the development team.

