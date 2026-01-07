/**
 * AEA Shop Map - Configuration
 */

const SHOP_TYPES = {
  MRO: { label: 'MRO', color: '#38a169' },
  'Repair Station': { label: 'Repair Station', color: '#3182ce' },
  OEM: { label: 'OEM', color: '#805ad5' },
  Dealer: { label: 'Dealer', color: '#dd6b20' }
};

// Map configuration - using CartoDB Positron (clean, minimal style)
const MAP_CONFIG = {
  center: [39.8283, -98.5795],
  zoom: 4,
  minZoom: 3,
  maxZoom: 18,
  tileUrl: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  tileAttribution: '&copy; <a href="https://carto.com/">CARTO</a>'
};

const CLUSTER_CONFIG = {
  chunkedLoading: true,
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: false,
  maxClusterRadius: 50,
  disableClusteringAtZoom: 12
};

window.AEAConfig = { SHOP_TYPES, MAP_CONFIG, CLUSTER_CONFIG };
