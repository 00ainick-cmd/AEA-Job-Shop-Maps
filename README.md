# AEA Career Finder

Interactive map to help aviation technicians and job seekers find AEA member avionics shops across North America. Especially useful for military members transitioning to civilian careers in avionics.

## Features

- Interactive map with clustered markers for 100+ shops
- Filter by state and hiring status
- Visual indicators for shops currently hiring (pulsing green ring)
- Detailed job information: positions, experience level, salary range, benefits
- A profile page for every shop (`shop.html`) with photos, a description, kinds of work, open positions, benefits, a section for schools, a location map, and the nearest member shops
- Each profile has its own link that the shop or a school can share
- "Works with schools" filter for instructors looking for tours, internships and apprenticeships
- Sidebar with sortable shop list (hiring shops shown first)
- Click-to-zoom from sidebar to map
- Mobile-responsive design

## Quick Start

1. Open `index.html` in a browser, or serve with any static file server:

```bash
npx serve
```

2. The map loads shop data from `data/shops.json`

## Data Management

### Option 1: Admin Page (Simple)
1. Open `admin.html`
2. Upload a CSV file exported from Google Sheets
3. Download the generated `shops.json`
4. Replace `data/shops.json` with the new file

### Option 2: Command Line (With Geocoding)
```bash
# Install dependencies
npm install

# Process CSV with geocoding
node scripts/process-csv.js

# Or skip geocoding (uses state centroids)
node scripts/process-csv.js --no-geocode
```

## Collecting Member Data

See `docs/google-form-template.md` for a ready-to-use Google Form template. The workflow:

1. Create Google Form using the template
2. Send to AEA members
3. Export responses as CSV from Google Sheets
4. Upload to admin page or process via command line

## Project Structure

```
aea-shop-map/
├── index.html          # Main application
├── shop.html           # Shop profile page
├── admin.html          # Admin page for data management
├── photos/             # Shop photos, one folder per shop
├── css/
│   └── styles.css      # All styling
├── js/
│   ├── config.js       # Map configuration
│   └── app.js          # Main application logic
├── data/
│   └── shops.json      # Shop data (generated)
├── scripts/
│   └── process-csv.js  # CSV to JSON processor
└── docs/
    └── google-form-template.md  # Form questions for data collection
```

## Data Fields

Each shop record supports:

| Field | Description |
|-------|-------------|
| name | Company name |
| type | MRO, Repair Station, OEM, or Dealer |
| city, state, zip | Location |
| airport | Nearest airport code (e.g., LNK) |
| phone, email, website | Contact info |
| hiring | Currently hiring (true/false) |
| openingsCount | Number of open positions |
| positionTypes | Array of position types |
| experienceLevel | Entry-level, 1-2 years, etc. |
| salaryRange | e.g., "55000-85000" |
| benefits | Array of benefits offered |
| companySize | Small, Medium, or Large |
| specializations | Equipment/aircraft types |
| memberSince | Year joined AEA |

### Shop profile fields

| Field | Description |
|-------|-------------|
| about | Two or three sentences the shop writes about itself |
| employeeCount | Number of people at this location |
| services | Kinds of work (installations, bench repair, and so on) |
| schoolPrograms | How the shop works with schools (tours, interns, apprentices) |
| schoolNote | One sentence for instructors before they call |
| photos | Files in `photos/` or full https links |

All profile fields are optional. A profile shows only the sections a shop has filled in.

## Sample data

`data/shops.json` is currently marked `"sample": true` in its metadata, which shows a yellow notice on the map and on every profile. The hiring details in it have not been confirmed by the shops, and "Example Avionics (sample profile)" is not a real company. Data produced by the admin page or the processing script is marked `"sample": false`, so the notice disappears once real member responses replace the sample file.

## Technology

- [Leaflet.js](https://leafletjs.com/) - Interactive maps
- [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) - Marker clustering
- [OpenStreetMap](https://www.openstreetmap.org/) - Map background (free, no key required)
- Vanilla JavaScript - No framework dependencies

## License

Copyright Aircraft Electronics Association. All rights reserved.
