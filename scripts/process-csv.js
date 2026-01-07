/**
 * AEA Shop Map - CSV Processing Script
 * Converts CSV data to JSON with geocoded coordinates
 *
 * Usage: node scripts/process-csv.js [--no-geocode]
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { geocodeAddress, getStateCentroid, sleep } = require('./geocode');

const INPUT_CSV = path.join(__dirname, '..', 'data', 'raw', 'aea_members.csv');
const OUTPUT_JSON = path.join(__dirname, '..', 'data', 'shops.json');
const CACHE_FILE = path.join(__dirname, '..', 'data', 'geocode_cache.json');

const skipGeocode = process.argv.includes('--no-geocode');

function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    }
  } catch (error) {
    console.warn('Could not load geocode cache:', error.message);
  }
  return {};
}

function saveCache(cache) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.warn('Could not save geocode cache:', error.message);
  }
}

function normalizeShopType(type) {
  if (!type) return 'Repair Station';
  const normalized = type.trim().toLowerCase();
  if (normalized.includes('mro')) return 'MRO';
  if (normalized.includes('oem')) return 'OEM';
  if (normalized.includes('dealer') || normalized.includes('distributor')) return 'Dealer';
  return 'Repair Station';
}

function normalizeWebsite(url) {
  if (!url) return null;
  url = url.trim();
  if (!url) return null;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }
  return url;
}

function formatPhone(phone) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone.trim() || null;
}

function parseHiring(value) {
  if (!value) return false;
  const v = value.toString().trim().toLowerCase();
  return v === 'true' || v === 'yes' || v === '1' || v === 'y';
}

function parseNumber(value) {
  if (!value) return null;
  const num = parseInt(value.toString().trim(), 10);
  return isNaN(num) ? null : num;
}

function parseList(value) {
  if (!value) return [];
  return value.toString()
    .split(/[,;]/)
    .map(item => item.trim())
    .filter(item => item.length > 0);
}

function normalizeExperienceLevel(level) {
  if (!level) return null;
  const normalized = level.toString().trim().toLowerCase();
  if (normalized.includes('entry') || normalized.includes('0') || normalized.includes('none')) {
    return 'Entry-level';
  }
  if (normalized.includes('1') || normalized.includes('2')) {
    return '1-2 years';
  }
  if (normalized.includes('3') || normalized.includes('4') || normalized.includes('5')) {
    return '3-5 years';
  }
  if (normalized.includes('5+') || normalized.includes('senior') || normalized.includes('experienced')) {
    return '5+ years';
  }
  return level.trim();
}

function normalizeCompanySize(size) {
  if (!size) return null;
  const normalized = size.toString().trim().toLowerCase();
  if (normalized.includes('small') || normalized.includes('1-10') || normalized.includes('< 10')) {
    return 'Small (1-10)';
  }
  if (normalized.includes('medium') || normalized.includes('11-50') || normalized.includes('10-50')) {
    return 'Medium (11-50)';
  }
  if (normalized.includes('large') || normalized.includes('50+') || normalized.includes('51+')) {
    return 'Large (50+)';
  }
  return size.trim();
}

async function processCSV() {
  console.log('AEA Shop Map - CSV Processor');
  console.log('============================\n');

  if (!fs.existsSync(INPUT_CSV)) {
    console.error(`Error: Input file not found: ${INPUT_CSV}`);
    process.exit(1);
  }

  console.log(`Reading CSV from: ${INPUT_CSV}`);
  const csvContent = fs.readFileSync(INPUT_CSV, 'utf-8');

  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true
  });

  console.log(`Found ${records.length} records\n`);

  const cache = loadCache();
  const shops = [];

  console.log(skipGeocode
    ? 'Skipping geocoding (using state centroids)...\n'
    : 'Processing and geocoding addresses...\n');

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const fullAddress = `${record.address}, ${record.city}, ${record.state} ${record.zip || ''}`.trim();
    const cacheKey = fullAddress.toLowerCase();

    let coords = null;

    if (skipGeocode) {
      coords = getStateCentroid(record.state);
    } else if (cache[cacheKey]) {
      coords = cache[cacheKey];
    } else {
      coords = await geocodeAddress(fullAddress);
      if (coords) {
        cache[cacheKey] = coords;
      } else {
        coords = await geocodeAddress(`${record.city}, ${record.state}`);
        if (coords) {
          cache[cacheKey] = coords;
        } else {
          coords = getStateCentroid(record.state);
        }
        await sleep(1100);
      }
      await sleep(1100);
    }

    shops.push({
      id: i + 1,
      name: record.name || 'Unknown',
      type: normalizeShopType(record.type),
      address: record.address || '',
      city: record.city || '',
      state: record.state || '',
      zip: record.zip || '',
      phone: formatPhone(record.phone),
      email: record.email ? record.email.trim() : null,
      website: normalizeWebsite(record.website),
      contact: record.contact ? record.contact.trim() : null,
      airport: record.airport ? record.airport.trim().toUpperCase() : null,
      memberSince: parseNumber(record.memberSince),
      hiring: parseHiring(record.hiring),
      // New job-seeker fields
      openingsCount: parseNumber(record.openingsCount),
      positionTypes: parseList(record.positionTypes),
      experienceLevel: normalizeExperienceLevel(record.experienceLevel),
      benefits: parseList(record.benefits),
      companySize: normalizeCompanySize(record.companySize),
      specializations: parseList(record.specializations),
      shifts: parseList(record.shifts),
      salaryRange: record.salaryRange ? record.salaryRange.trim() : null,
      // Coordinates
      lat: coords.lat,
      lng: coords.lng
    });

    if ((i + 1) % 10 === 0 || i === records.length - 1) {
      process.stdout.write(`\rProcessed ${i + 1}/${records.length}`);
    }
  }

  console.log('\n');

  if (!skipGeocode) {
    saveCache(cache);
  }

  const uniqueStates = [...new Set(shops.map(s => s.state))];
  const hiringCount = shops.filter(s => s.hiring).length;
  const totalOpenings = shops.reduce((sum, s) => sum + (s.openingsCount || 0), 0);

  const output = {
    shops,
    metadata: {
      totalShops: shops.length,
      uniqueStates: uniqueStates.length,
      hiringCount: hiringCount,
      totalOpenings: totalOpenings,
      lastUpdated: new Date().toISOString()
    }
  };

  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(output, null, 2));

  console.log('============================');
  console.log('Processing Complete!');
  console.log('============================\n');
  console.log(`Total shops: ${shops.length}`);
  console.log(`States/Provinces: ${uniqueStates.length}`);
  console.log(`Currently Hiring: ${hiringCount}`);
  console.log(`Total Job Openings: ${totalOpenings}`);
}

processCSV().catch(error => {
  console.error('\nFatal error:', error);
  process.exit(1);
});
