# Google Maps API Setup Guide

## How to Get a Google Maps API Key

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create a New Project (or select existing)**
   - Click on the project dropdown at the top
   - Click "New Project"
   - Enter project name (e.g., "Umurenge Wallet")
   - Click "Create"

3. **Enable Maps JavaScript API**
   - Go to "APIs & Services" > "Library"
   - Search for "Maps JavaScript API"
   - Click on it and click "Enable"

4. **Create API Key**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key

5. **Restrict API Key (Recommended for Production)**
   - Click on the created API key to edit it
   - Under "API restrictions", select "Restrict key"
   - Choose "Maps JavaScript API"
   - Under "Application restrictions", you can restrict by HTTP referrer
   - Add your domain (e.g., `localhost:3000/*` for development)

6. **Add API Key to Project**
   - Open `FrontEnd/.env` file
   - Replace `your_google_maps_api_key_here` with your actual API key:
     ```
     VITE_GOOGLE_MAPS_API_KEY=AIzaSyYourActualKeyHere
     ```

7. **Restart Development Server**
   - Stop the current server (Ctrl+C)
   - Run `npm run dev` again

## Free Tier Limits

Google Maps offers a free tier with:
- $200 free credit per month
- This covers approximately 28,000 map loads per month
- Sufficient for development and small to medium deployments

## Troubleshooting

### "API Key is Restricted" or "REQUEST_DENIED" Error

If you're getting a "restricted" or "REQUEST_DENIED" error even though you didn't set restrictions, follow these steps:

#### Step 1: Enable Required APIs

Your API key needs these APIs enabled in Google Cloud Console:

1. **Maps JavaScript API** (Required for displaying maps)
2. **Geocoding API** (Optional, for address lookups)
3. **Places API** (Optional, for place searches)

**How to enable:**
1. Go to [Google Cloud Console - APIs & Services](https://console.cloud.google.com/apis/library)
2. Search for each API name above
3. Click on it and press "Enable"

**Direct links:**
- [Enable Maps JavaScript API](https://console.cloud.google.com/apis/library/maps-backend.googleapis.com)
- [Enable Geocoding API](https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com)
- [Enable Places API](https://console.cloud.google.com/apis/library/places-backend.googleapis.com)

#### Step 2: Check API Key Restrictions

1. Go to [Google Cloud Console - Credentials](https://console.cloud.google.com/apis/credentials)
2. Click on your API key
3. Under "API restrictions":
   - If "Don't restrict key" is selected, make sure the APIs above are enabled
   - If "Restrict key" is selected, ensure "Maps JavaScript API" is in the allowed list
4. Under "Application restrictions":
   - For development: Select "None" or "HTTP referrers" and add:
     - `localhost:*`
     - `127.0.0.1:*`
     - `http://localhost:*`
     - `http://127.0.0.1:*`
   - For production: Add your domain (e.g., `https://yourdomain.com/*`)

#### Step 3: Enable Billing

Google Maps requires billing to be enabled (even for free tier):
1. Go to [Google Cloud Console - Billing](https://console.cloud.google.com/billing)
2. Link a billing account to your project
3. Note: You get $200 free credit per month, which covers most usage

#### Step 4: Wait a Few Minutes

After making changes, wait 2-5 minutes for Google's systems to update before testing again.

### Other Issues

If the map doesn't load:
1. Check browser console for errors
2. Verify API key is correct in `.env` file or System Config
3. Ensure "Maps JavaScript API" is enabled in Google Cloud Console
4. Check API key restrictions (make sure localhost is allowed for development)
5. Restart the development server after adding the key
6. Verify billing is enabled in Google Cloud Console

## Security Note

- Never commit your `.env` file to version control
- The `.env` file is already in `.gitignore`
- For production, use environment variables on your hosting platform

