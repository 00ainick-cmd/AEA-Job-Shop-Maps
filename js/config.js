/**
 * AEA Shop Map - Configuration
 */

const SHOP_TYPES = {
  MRO: { label: 'MRO', color: '#38a169' },
  'Repair Station': { label: 'Repair Station', color: '#3182ce' },
  OEM: { label: 'OEM', color: '#805ad5' },
  Dealer: { label: 'Dealer', color: '#dd6b20' }
};

// Map configuration - OpenStreetMap standard tiles (free, no API key).
// The earlier CARTO background began requiring a paid key.
const MAP_CONFIG = {
  center: [39.8283, -98.5795],
  zoom: 4,
  minZoom: 3,
  maxZoom: 18,
  tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  tileAttribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
};

// Link to the member form where a shop updates its profile.
// Leave empty until the form exists; the "Update this profile" link stays hidden.
const PROFILE_FORM_URL = '';

// Shown on the map and on every profile while data/shops.json is marked as sample data.
const SAMPLE_NOTICE = 'Sample listings. The hiring details and profiles shown here are examples and have not been confirmed by the shops.';

/**
 * Stable link name for a shop, built from its name and location,
 * so a profile link keeps working when the data file is regenerated.
 */
function shopSlug(shop) {
  return [shop.name, shop.city, shop.state]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function shopProfileUrl(shop) {
  return 'shop.html?shop=' + encodeURIComponent(shopSlug(shop));
}

const HOME_COUNTRIES = ['', 'united states', 'usa', 'us', 'canada'];

function isHomeCountry(shop) {
  return HOME_COUNTRIES.includes((shop.country || '').trim().toLowerCase());
}

/** "Lincoln, NE" for the US and Canada, "Sydney, NSW, Australia" elsewhere. */
function shopPlace(shop) {
  const parts = [shop.city, shop.state];
  if (!isHomeCountry(shop)) parts.push(shop.country);
  return parts.filter(Boolean).join(', ');
}

/** What the location filter groups by: state or province at home, country elsewhere. */
function shopRegion(shop) {
  return isHomeCountry(shop) ? (shop.state || '') : shop.country;
}

/** Photos may be files in the photos/ folder or full https links. Anything else is ignored. */
function safePhotoUrl(value) {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  if (/^https:\/\//i.test(v)) return v;
  if (/^photos\/[A-Za-z0-9 _.\-\/]+$/.test(v) && !v.includes('..')) return v;
  return null;
}

function safeWebUrl(value) {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  return /^https?:\/\//i.test(v) ? v : null;
}

const CLUSTER_CONFIG = {
  chunkedLoading: true,
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: false,
  maxClusterRadius: 50,
  disableClusteringAtZoom: 12
};

window.AEAConfig = {
  SHOP_TYPES, MAP_CONFIG, CLUSTER_CONFIG, PROFILE_FORM_URL, SAMPLE_NOTICE,
  shopSlug, shopProfileUrl, shopPlace, shopRegion, safePhotoUrl, safeWebUrl
};
