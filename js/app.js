/**
 * AEA Shop Map - Main Application
 */

(function() {
  'use strict';

  const { SHOP_TYPES, MAP_CONFIG, CLUSTER_CONFIG } = window.AEAConfig;

  let map = null;
  let markerCluster = null;
  let allShops = [];
  let shopMarkers = new Map();

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function formatSalary(range) {
    if (!range) return null;
    const parts = range.split('-').map(p => p.trim());
    if (parts.length === 2) {
      const low = parseInt(parts[0], 10);
      const high = parseInt(parts[1], 10);
      if (!isNaN(low) && !isNaN(high)) {
        return `$${(low/1000).toFixed(0)}k - $${(high/1000).toFixed(0)}k`;
      }
    }
    return range;
  }

  function initMap() {
    map = L.map('map', {
      center: MAP_CONFIG.center,
      zoom: MAP_CONFIG.zoom,
      minZoom: MAP_CONFIG.minZoom,
      maxZoom: MAP_CONFIG.maxZoom,
      zoomControl: true,
      preferCanvas: true,
      fadeAnimation: true,
      zoomAnimation: true
    });

    L.tileLayer(MAP_CONFIG.tileUrl, {
      attribution: MAP_CONFIG.tileAttribution,
      maxZoom: 19,
      updateWhenZooming: false,
      updateWhenIdle: true,
      keepBuffer: 4
    }).addTo(map);

    window.addEventListener('resize', () => {
      setTimeout(() => map.invalidateSize(), 100);
    });

    return map;
  }

  function createClusterIcon(cluster) {
    const count = cluster.getChildCount();
    let size = 'small';
    if (count > 50) size = 'large';
    else if (count > 10) size = 'medium';

    return L.divIcon({
      html: `<div class="cluster-icon cluster-${size}"><span>${count}</span></div>`,
      className: 'marker-cluster',
      iconSize: L.point(40, 40)
    });
  }

  function createMarkerCluster() {
    markerCluster = L.markerClusterGroup({
      ...CLUSTER_CONFIG,
      iconCreateFunction: createClusterIcon,
      animate: true,
      animateAddingMarkers: false,
      removeOutsideVisibleBounds: true,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true
    });
    map.addLayer(markerCluster);
    return markerCluster;
  }

  /**
   * Create popup content for job seekers
   */
  function createPopupContent(shop) {
    const typeClass = shop.type.toLowerCase().replace(/\s+/g, '-');

    // Hiring badge with openings count
    let hiringHtml = '';
    if (shop.hiring) {
      const openingsText = shop.openingsCount ? `${shop.openingsCount} Opening${shop.openingsCount > 1 ? 's' : ''}` : 'Now Hiring';
      hiringHtml = `<span class="popup-hiring">${openingsText}</span>`;
    }

    // Location with airport code
    const locationParts = [`${escapeHtml(shop.city)}, ${escapeHtml(shop.state)}`];
    if (shop.airport) {
      locationParts.push(`<span class="popup-airport">${escapeHtml(shop.airport)}</span>`);
    }
    const locationHtml = locationParts.join(' ');

    // Job details section (new fields)
    let jobDetailsHtml = '';
    if (shop.hiring && (shop.positionTypes?.length || shop.experienceLevel || shop.salaryRange)) {
      jobDetailsHtml = '<div class="popup-job-section">';

      if (shop.positionTypes?.length) {
        jobDetailsHtml += `<div class="popup-row"><span class="popup-label">Positions:</span> ${shop.positionTypes.map(p => escapeHtml(p)).join(', ')}</div>`;
      }

      if (shop.experienceLevel) {
        jobDetailsHtml += `<div class="popup-row"><span class="popup-label">Experience:</span> ${escapeHtml(shop.experienceLevel)}</div>`;
      }

      const formattedSalary = formatSalary(shop.salaryRange);
      if (formattedSalary) {
        jobDetailsHtml += `<div class="popup-row"><span class="popup-label">Salary:</span> ${escapeHtml(formattedSalary)}</div>`;
      }

      if (shop.shifts?.length) {
        jobDetailsHtml += `<div class="popup-row"><span class="popup-label">Shifts:</span> ${shop.shifts.map(s => escapeHtml(s)).join(', ')}</div>`;
      }

      jobDetailsHtml += '</div>';
    }

    // Benefits section
    let benefitsHtml = '';
    if (shop.benefits?.length) {
      benefitsHtml = `<div class="popup-benefits">
        <div class="popup-tags">
          ${shop.benefits.map(b => `<span class="popup-tag benefit">${escapeHtml(b)}</span>`).join('')}
        </div>
      </div>`;
    }

    // Company info section
    let companyInfoHtml = '<div class="popup-company-section">';

    if (shop.companySize) {
      companyInfoHtml += `<div class="popup-row"><span class="popup-label">Size:</span> ${escapeHtml(shop.companySize)}</div>`;
    }

    if (shop.specializations?.length) {
      companyInfoHtml += `<div class="popup-row"><span class="popup-label">Works on:</span> ${shop.specializations.slice(0, 4).map(s => escapeHtml(s)).join(', ')}${shop.specializations.length > 4 ? '...' : ''}</div>`;
    }

    companyInfoHtml += '</div>';

    // Contact section
    let contactHtml = '<div class="popup-contact-section">';

    if (shop.contact) {
      contactHtml += `<div class="popup-row"><span class="popup-label">Contact:</span> ${escapeHtml(shop.contact)}</div>`;
    }

    if (shop.phone) {
      contactHtml += `<div class="popup-row"><span class="popup-label">Phone:</span> <a href="tel:${shop.phone.replace(/\D/g, '')}">${escapeHtml(shop.phone)}</a></div>`;
    }

    if (shop.email) {
      contactHtml += `<div class="popup-row"><span class="popup-label">Email:</span> <a href="mailto:${escapeHtml(shop.email)}">${escapeHtml(shop.email)}</a></div>`;
    }

    if (shop.website) {
      contactHtml += `<div class="popup-row"><a href="${escapeHtml(shop.website)}" target="_blank" rel="noopener" class="popup-website-btn">Visit Website</a></div>`;
    }

    contactHtml += '</div>';

    // Member since
    const memberSinceHtml = shop.memberSince
      ? `<div class="popup-member-since">AEA Member since ${shop.memberSince}</div>`
      : '';

    return `
      <div class="popup-content">
        <div class="popup-header">
          <h3 class="popup-name">${escapeHtml(shop.name)}</h3>
          ${hiringHtml}
        </div>
        <div class="popup-meta">
          <span class="popup-type ${typeClass}">${escapeHtml(shop.type)}</span>
          <span class="popup-location">${locationHtml}</span>
        </div>
        ${jobDetailsHtml}
        ${benefitsHtml}
        ${companyInfoHtml}
        ${contactHtml}
        ${memberSinceHtml}
      </div>
    `;
  }

  function createShopMarker(shop) {
    const typeConfig = SHOP_TYPES[shop.type] || SHOP_TYPES['Repair Station'];

    // Use custom div icon for better styling and hiring indicator
    const markerSize = 24;
    const hiringClass = shop.hiring ? 'hiring' : '';
    const typeClass = shop.type.toLowerCase().replace(/\s+/g, '-');

    const icon = L.divIcon({
      className: 'shop-marker',
      html: `<div class="marker-pin ${typeClass} ${hiringClass}" style="background-color: ${typeConfig.color}">
        ${shop.hiring ? '<div class="hiring-ring"></div>' : ''}
      </div>`,
      iconSize: [markerSize, markerSize],
      iconAnchor: [markerSize / 2, markerSize / 2],
      popupAnchor: [0, -markerSize / 2]
    });

    const marker = L.marker([shop.lat, shop.lng], { icon });

    marker.bindPopup(() => createPopupContent(shop), {
      maxWidth: 320,
      minWidth: 260,
      className: 'shop-popup',
      closeButton: true,
      autoClose: true
    });

    marker.shopId = shop.id;

    return marker;
  }

  function addMarkers(shops) {
    markerCluster.clearLayers();
    shopMarkers.clear();

    const markers = shops.map(shop => {
      const marker = createShopMarker(shop);
      shopMarkers.set(shop.id, marker);
      return marker;
    });

    markerCluster.addLayers(markers);
  }

  function updateStats(shops, filteredShops) {
    const shopCountEl = document.getElementById('shop-count');
    const hiringCountEl = document.getElementById('hiring-count');

    const hiringCount = filteredShops.filter(s => s.hiring).length;

    if (shopCountEl) shopCountEl.textContent = filteredShops.length;
    if (hiringCountEl) hiringCountEl.textContent = hiringCount;
  }

  function populateStateFilter(shops) {
    const stateFilter = document.getElementById('state-filter');
    if (!stateFilter) return;

    const states = [...new Set(shops.map(s => s.state))].sort();

    stateFilter.innerHTML = '<option value="all">All States</option>';

    states.forEach(state => {
      const option = document.createElement('option');
      option.value = state;
      option.textContent = state;
      stateFilter.appendChild(option);
    });
  }

  /**
   * Create shop card HTML for sidebar list
   */
  function createShopCard(shop) {
    const typeClass = shop.type.toLowerCase().replace(/\s+/g, '-');

    // Hiring badge with count
    let hiringBadge = '';
    if (shop.hiring) {
      const text = shop.openingsCount ? `${shop.openingsCount} Opening${shop.openingsCount > 1 ? 's' : ''}` : 'Hiring';
      hiringBadge = `<span class="shop-card-hiring">${text}</span>`;
    }

    const airportBadge = shop.airport
      ? `<span class="shop-card-airport">${escapeHtml(shop.airport)}</span>`
      : '';

    // Position types preview
    let positionsHtml = '';
    if (shop.positionTypes?.length) {
      positionsHtml = `<div class="shop-card-positions">${shop.positionTypes.slice(0, 2).map(p => escapeHtml(p)).join(', ')}${shop.positionTypes.length > 2 ? '...' : ''}</div>`;
    }

    // Experience + salary preview
    let detailsHtml = '';
    const details = [];
    if (shop.experienceLevel) details.push(shop.experienceLevel);
    const salary = formatSalary(shop.salaryRange);
    if (salary) details.push(salary);
    if (details.length) {
      detailsHtml = `<div class="shop-card-details">${details.map(d => escapeHtml(d)).join(' | ')}</div>`;
    }

    return `
      <div class="shop-card" data-shop-id="${shop.id}">
        <div class="shop-card-header">
          <span class="shop-card-name">${escapeHtml(shop.name)}</span>
          ${hiringBadge}
        </div>
        <div class="shop-card-meta">
          <span class="shop-card-type ${typeClass}">${escapeHtml(shop.type)}</span>
          ${airportBadge}
        </div>
        <div class="shop-card-location">${escapeHtml(shop.city)}, ${escapeHtml(shop.state)}</div>
        ${positionsHtml}
        ${detailsHtml}
      </div>
    `;
  }

  function renderShopList(shops) {
    const shopList = document.getElementById('shop-list');
    if (!shopList) return;

    if (shops.length === 0) {
      shopList.innerHTML = '<div class="no-results">No shops match your filters</div>';
      return;
    }

    // Sort: hiring first, then by openings count, then by name
    const sortedShops = [...shops].sort((a, b) => {
      if (a.hiring !== b.hiring) return b.hiring - a.hiring;
      if (a.openingsCount !== b.openingsCount) return (b.openingsCount || 0) - (a.openingsCount || 0);
      return a.name.localeCompare(b.name);
    });

    shopList.innerHTML = sortedShops.map(shop => createShopCard(shop)).join('');

    shopList.querySelectorAll('.shop-card').forEach(card => {
      card.addEventListener('click', () => {
        const shopId = parseInt(card.dataset.shopId, 10);
        zoomToShop(shopId);
      });
    });
  }

  function zoomToShop(shopId) {
    const marker = shopMarkers.get(shopId);
    if (!marker) return;

    const shop = allShops.find(s => s.id === shopId);
    if (!shop) return;

    map.setView([shop.lat, shop.lng], 12, { animate: true });

    setTimeout(() => {
      markerCluster.zoomToShowLayer(marker, () => {
        marker.openPopup();
      });
    }, 300);
  }

  function getFilteredShops() {
    const stateFilter = document.getElementById('state-filter');
    const hiringFilter = document.getElementById('hiring-filter');

    const selectedState = stateFilter ? stateFilter.value : 'all';
    const hiringOnly = hiringFilter ? hiringFilter.checked : false;

    return allShops.filter(shop => {
      if (selectedState !== 'all' && shop.state !== selectedState) {
        return false;
      }

      if (hiringOnly && !shop.hiring) {
        return false;
      }

      return true;
    });
  }

  function applyFilters() {
    const filteredShops = getFilteredShops();

    addMarkers(filteredShops);
    renderShopList(filteredShops);
    updateStats(allShops, filteredShops);

    if (filteredShops.length > 0 && filteredShops.length < allShops.length) {
      const bounds = L.latLngBounds(filteredShops.map(s => [s.lat, s.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
    }
  }

  function initFilters() {
    const stateFilter = document.getElementById('state-filter');
    const hiringFilter = document.getElementById('hiring-filter');

    if (stateFilter) {
      stateFilter.addEventListener('change', applyFilters);
    }

    if (hiringFilter) {
      hiringFilter.addEventListener('change', applyFilters);
    }
  }

  function showLoading(message) {
    const overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
      <div class="loading-spinner"></div>
      <div class="loading-text">${escapeHtml(message)}</div>
    `;
    document.body.appendChild(overlay);
  }

  function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.remove();
  }

  async function loadShopData() {
    const response = await fetch('./data/shops.json');
    if (!response.ok) {
      throw new Error(`Failed to load data: ${response.status}`);
    }
    return response.json();
  }

  async function init() {
    try {
      showLoading('Loading...');

      initMap();
      createMarkerCluster();

      const data = await loadShopData();
      allShops = data.shops;

      populateStateFilter(allShops);
      initFilters();

      addMarkers(allShops);
      renderShopList(allShops);
      updateStats(allShops, allShops);

      hideLoading();

    } catch (error) {
      console.error('Failed to initialize:', error);
      hideLoading();
      alert('Unable to load shop data. Please refresh the page.');
    }
  }

  document.addEventListener('DOMContentLoaded', init);

})();
