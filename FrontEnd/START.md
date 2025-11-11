# 🚀 Starting the Development Server

## Problem: Blank screen in browser

If you're seeing a blank screen, follow these steps:

## Solution Steps:

### 1. Stop any running server
Press `Ctrl + C` in the terminal where the server is running

### 2. Navigate to FrontEnd directory
```bash
cd FrontEnd
```

### 3. Clear cache and reinstall (if needed)
```bash
rm -rf node_modules
npm install
```

Or on Windows PowerShell:
```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

### 4. Start the development server
```bash
npm run dev
```

### 5. Look for this message in terminal:
```
  VITE v5.0.8  ready in XXX ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### 6. Open your browser
Go to: `http://localhost:3000`

## What You Should See

You should see the landing page with:
- UMURENGE WALLET logo
- "Empower Your Saving Group Digitally" heading
- Blue gradient background
- Login button

## Troubleshooting

### If still blank:
1. Open browser Developer Tools (F12)
2. Check the Console tab for errors
3. Share the error message with me

### Port already in use:
Change the port in `vite.config.js`:
```js
server: { port: 3001 }
```

### Still not working:
Run this command to see what's happening:
```bash
npm run dev -- --debug
```

## Expected Behavior

✅ Server starts without errors
✅ Terminal shows VITE is running
✅ Browser shows landing page
✅ Can click "Login" button
✅ Can navigate to other pages

## Common Issues

1. **"Cannot find module"** - Run `npm install`
2. **"Port in use"** - Change port number
3. **Blank screen** - Check browser console for errors
4. **Slow loading** - First time is normal, subsequent loads are fast

## Still having issues?

Share:
1. Any error messages from terminal
2. Browser console errors (F12 → Console tab)
3. What you see (even if it's just blank)

