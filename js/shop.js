/**
 * AEA Career Finder - Shop profile page
 *
 * Opens one shop from data/shops.json, chosen by the link:
 *   shop.html?shop=<name-city-state>   (preferred, survives data rebuilds)
 *   shop.html?id=<number>              (fallback)
 */

(function() {
  'use strict';

  const {
    SHOP_TYPES, MAP_CONFIG, PROFILE_FORM_URL, SAMPLE_NOTICE,
    shopSlug, shopProfileUrl, shopPlace, safePhotoUrl, safeWebUrl
  } = window.AEAConfig;

  const EARTH_RADIUS_MILES = 3958.8;

  function esc(value) {
    if (value === null || value === undefined) return '';
    const div = document.createElement('div');
    div.textContent = value;
    return div.innerHTML;
  }

  function milesBetween(a, b) {
    const toRad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * toRad;
    const dLng = (b.lng - a.lng) * toRad;
    const h = Math.sin(dLat / 2) ** 2 +
      Math.cos(a.lat * toRad) * Math.cos(b.lat * toRad) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
  }

  function formatSalary(range) {
    if (!range) return null;
    const parts = String(range).split('-').map(p => parseInt(p.trim(), 10));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return `$${Math.round(parts[0] / 1000)}k to $${Math.round(parts[1] / 1000)}k a year`;
    }
    return String(range);
  }

  function tags(list, className) {
    return `<ul class="tags ${className || ''}">${list.map(item => `<li>${esc(item)}</li>`).join('')}</ul>`;
  }

  function section(title, body, id) {
    return `<section class="block"${id ? ` id="${id}"` : ''}><h2>${esc(title)}</h2>${body}</section>`;
  }

  function findShop(shops) {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('shop');
    if (slug) {
      const match = shops.find(s => shopSlug(s) === slug);
      if (match) return match;
    }
    const id = parseInt(params.get('id'), 10);
    if (!isNaN(id)) return shops.find(s => s.id === id) || null;
    return null;
  }

  /* ---------- Sections ---------- */

  function galleryHtml(shop) {
    const photos = (shop.photos || []).map(safePhotoUrl).filter(Boolean);
    if (!photos.length) {
      return `<div class="gallery gallery-empty">
        <div class="gallery-empty-box">
          <p class="gallery-empty-title">No photos yet</p>
          <p>This shop has not added photos of its hangar, bench or team.</p>
        </div>
      </div>`;
    }
    const thumbs = photos.length > 1
      ? `<div class="thumbs" role="group" aria-label="Shop photos">${photos.map((src, i) =>
          `<button type="button" class="thumb${i === 0 ? ' is-on' : ''}" data-src="${esc(src)}" aria-label="Show photo ${i + 1} of ${photos.length}" aria-pressed="${i === 0}">
            <img src="${esc(src)}" alt="" loading="lazy">
          </button>`).join('')}</div>`
      : '';
    return `<div class="gallery">
      <img class="gallery-main" id="gallery-main" src="${esc(photos[0])}" alt="Photo from ${esc(shop.name)}">
      ${thumbs}
    </div>`;
  }

  function identHtml(shop) {
    const type = SHOP_TYPES[shop.type] || SHOP_TYPES['Repair Station'];
    const where = shopPlace(shop);
    const airport = shop.airport
      ? ` <a class="airport" href="https://www.iflightplanner.com/Airports/${encodeURIComponent(shop.airport)}" target="_blank" rel="noopener">${esc(shop.airport)}</a>`
      : '';

    let hiring;
    if (shop.hiring) {
      const n = shop.openingsCount;
      const line = n ? `${n} open position${n > 1 ? 's' : ''}` : 'Open positions';
      hiring = `<div class="status status-hiring"><span class="status-dot"></span><div><strong>Hiring now</strong><span>${esc(line)}</span></div></div>`;
    } else if (shop.hiring === null || shop.hiring === undefined) {
      // The shop has not answered the member form, so nothing is claimed either way.
      hiring = `<div class="status"><span class="status-dot"></span><div><strong>Hiring status not listed yet</strong><span>Contact the shop to ask about open positions.</span></div></div>`;
    } else {
      hiring = `<div class="status"><span class="status-dot"></span><div><strong>Not hiring right now</strong><span>The shop may still offer work-based learning.</span></div></div>`;
    }

    const facts = [];
    if (shop.employeeCount) facts.push(['People employed', String(shop.employeeCount)]);
    else if (shop.companySize) facts.push(['Shop size', shop.companySize]);
    if (shop.memberSince) facts.push(['AEA member since', String(shop.memberSince)]);
    if (shop.shifts && shop.shifts.length) facts.push(['Shifts', shop.shifts.join(', ')]);
    const factsHtml = facts.length
      ? `<dl class="facts">${facts.map(f => `<div><dt>${esc(f[0])}</dt><dd>${esc(f[1])}</dd></div>`).join('')}</dl>`
      : '';

    const actions = [];
    if (shop.email) actions.push(`<a class="btn btn-primary" href="mailto:${esc(shop.email)}">Email the shop</a>`);
    if (shop.phone) actions.push(`<a class="btn" href="tel:${esc(String(shop.phone).replace(/\D/g, ''))}">${esc(shop.phone)}</a>`);
    const web = safeWebUrl(shop.website);
    if (web) actions.push(`<a class="btn" href="${esc(web)}" target="_blank" rel="noopener">Website</a>`);
    actions.push(`<button type="button" class="btn btn-quiet" id="copy-link">Copy link to this profile</button>`);

    return `<div class="ident">
      <span class="type" style="background:${type.color}">${esc(type.label)}</span>
      <h1>${esc(shop.name)}</h1>
      <p class="where">${esc(where)}${airport}</p>
      ${hiring}
      ${factsHtml}
      <div class="actions">${actions.join('')}</div>
      <p class="copied" id="copied" role="status"></p>
      ${shop.contact ? `<p class="contact-name">Contact: ${esc(shop.contact)}</p>` : ''}
    </div>`;
  }

  function mainHtml(shop) {
    const out = [];

    if (shop.about) {
      out.push(section('About the shop', `<p class="about">${esc(shop.about)}</p>`));
    }

    const work = [];
    if (shop.services && shop.services.length) {
      work.push(`<h3>Kinds of work</h3>${tags(shop.services)}`);
    }
    if (shop.specializations && shop.specializations.length) {
      work.push(`<h3>Equipment and aircraft</h3>${tags(shop.specializations, 'tags-plain')}`);
    }
    if (work.length) out.push(section('What the shop does', work.join('')));

    if (shop.hiring) {
      const rows = [];
      if (shop.positionTypes && shop.positionTypes.length) rows.push(['Positions', shop.positionTypes.join(', ')]);
      if (shop.experienceLevel) rows.push(['Experience', shop.experienceLevel]);
      const pay = formatSalary(shop.salaryRange);
      if (pay) rows.push(['Pay', pay]);
      if (shop.shifts && shop.shifts.length) rows.push(['Shifts', shop.shifts.join(', ')]);
      const table = rows.length
        ? `<dl class="rows">${rows.map(r => `<div><dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd></div>`).join('')}</dl>`
        : '<p>The shop is hiring. Contact it for the open positions.</p>';
      out.push(section('Open positions', table));
    }

    if (shop.benefits && shop.benefits.length) {
      out.push(section('Benefits', tags(shop.benefits, 'tags-benefit')));
    }

    const schools = shop.schoolPrograms && shop.schoolPrograms.length
      ? tags(shop.schoolPrograms, 'tags-school') +
        (shop.schoolNote ? `<p class="about">${esc(shop.schoolNote)}</p>` : '')
      : '<p class="quiet">This shop has not listed its work-based learning opportunities yet. Instructors can still contact it about tours, job shadows and internships.</p>';
    out.push(section('Work-based learning for students', schools, 'schools'));

    return out.join('');
  }

  function sideHtml(shop, nearby) {
    const address = [shop.address, shopPlace(shop), shop.zip]
      .filter(Boolean).join(' · ');

    const nearbyHtml = nearby.length
      ? `<ul class="nearby">${nearby.map(n => `
          <li>
            <a href="${shopProfileUrl(n.shop)}">
              <span class="nearby-name">${esc(n.shop.name)}</span>
              <span class="nearby-meta">${esc(shopPlace(n.shop))}${n.shop.hiring ? ' · hiring' : ''}</span>
            </a>
            <span class="nearby-miles">${Math.round(n.miles)} mi</span>
          </li>`).join('')}</ul>`
      : '<p class="quiet">No other listed shops yet.</p>';

    return `
      <section class="block">
        <h2>Location</h2>
        <div class="mini-map" id="mini-map" role="application" aria-label="Map showing where ${esc(shop.name)} is"></div>
        <p class="address">${esc(address)}</p>
      </section>
      <section class="block">
        <h2>Nearest member shops</h2>
        ${nearbyHtml}
      </section>`;
  }

  /* ---------- Behavior ---------- */

  function wireGallery() {
    const main = document.getElementById('gallery-main');
    if (!main) return;
    document.querySelectorAll('.thumb').forEach(btn => {
      btn.addEventListener('click', () => {
        main.src = btn.dataset.src;
        document.querySelectorAll('.thumb').forEach(b => {
          const on = b === btn;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', String(on));
        });
      });
    });
  }

  function wireCopy() {
    const btn = document.getElementById('copy-link');
    const note = document.getElementById('copied');
    if (!btn || !note) return;
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(window.location.href);
        note.textContent = 'Link copied.';
      } catch (err) {
        note.textContent = 'Copy the address from the top of your browser.';
      }
    });
  }

  function drawMiniMap(shop) {
    const el = document.getElementById('mini-map');
    if (!el || typeof L === 'undefined') return;
    const type = SHOP_TYPES[shop.type] || SHOP_TYPES['Repair Station'];
    const map = L.map(el, {
      center: [shop.lat, shop.lng],
      zoom: 9,
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: true
    });
    L.tileLayer(MAP_CONFIG.tileUrl, { attribution: MAP_CONFIG.tileAttribution, maxZoom: 18 }).addTo(map);
    L.circleMarker([shop.lat, shop.lng], {
      radius: 9, color: '#ffffff', weight: 3, fillColor: type.color, fillOpacity: 1
    }).addTo(map);
  }

  function showNotFound() {
    document.getElementById('profile').innerHTML = `
      <div class="notfound">
        <h1>That shop profile was not found</h1>
        <p>The link may be old, or the shop may have been renamed.</p>
        <a class="btn btn-primary" href="index.html">Find the shop on the map</a>
      </div>`;
  }

  function showError() {
    document.getElementById('profile').innerHTML = `
      <div class="notfound">
        <h1>The shop list did not load</h1>
        <p>Check your connection and reload the page.</p>
        <a class="btn" href="index.html">Back to the map</a>
      </div>`;
  }

  async function init() {
    let data;
    try {
      const response = await fetch('./data/shops.json');
      if (!response.ok) throw new Error(String(response.status));
      data = await response.json();
    } catch (err) {
      console.error('Failed to load shop data:', err);
      showError();
      return;
    }

    if (data.metadata && data.metadata.sample) {
      const banner = document.getElementById('sample-banner');
      banner.textContent = SAMPLE_NOTICE;
      banner.hidden = false;
    }

    const shops = data.shops || [];
    const shop = findShop(shops);
    if (!shop) {
      showNotFound();
      return;
    }

    document.title = `${shop.name} | AEA Career Finder`;

    const nearby = shops
      .filter(s => s !== shop && typeof s.lat === 'number' && typeof s.lng === 'number')
      .map(s => ({ shop: s, miles: milesBetween(shop, s) }))
      .sort((a, b) => a.miles - b.miles)
      .slice(0, 5);

    document.getElementById('profile').innerHTML = `
      <div class="hero">
        ${galleryHtml(shop)}
        ${identHtml(shop)}
      </div>
      <div class="cols">
        <div class="col-main">${mainHtml(shop)}</div>
        <aside class="col-side">${sideHtml(shop, nearby)}</aside>
      </div>`;

    const foot = document.getElementById('foot');
    const formUrl = safeWebUrl(PROFILE_FORM_URL);
    if (formUrl) {
      document.getElementById('foot-update').innerHTML =
        `Is this your shop? <a href="${esc(formUrl)}" target="_blank" rel="noopener">Update this profile</a>.`;
    }
    foot.hidden = false;

    wireGallery();
    wireCopy();
    drawMiniMap(shop);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
