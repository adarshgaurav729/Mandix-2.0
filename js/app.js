/**
 * MandiX - Main Application Controller
 * Coordinates UI views, navigation, state listeners, and service integrations.
 */

import { state, STORAGE_KEYS } from './state.js';
import { LANGUAGES, TRANSLATIONS, t } from './translations.js';
import { fetchWeather, INDIAN_LOCATIONS } from './weather-service.js';
import { FERTILIZER_CATALOG, FERTILIZER_CATEGORIES } from './fertilizer-service.js';
import { EQUIPMENT_CATALOG, EQUIPMENT_CATEGORIES } from './equipment-service.js';
import { DRONE_SERVICES, CERTIFIED_PILOTS } from './drone-service.js';
import { GOVERNMENT_SCHEMES, SCHEME_CATEGORIES } from './schemes-service.js';
import { BEGINNER_GUIDES, CROP_DATABASE } from './guides-service.js';
import { DISTRICT_BLOCK_DATA, generateToken } from './procurement-service.js';
import { VoiceAssistant } from './voice-assistant.js';
import { FAQS, getBotReply, createTicket } from './support-service.js';
import { MapService } from './map-service.js';
import { ADMIN_STATS, MOCK_FARMERS_LIST, updateOrderStatus, updateTicketStatus } from './admin-service.js';

class MandiXApp {
  constructor() {
    this.currentView = 'dashboard';
    this.voiceAssistant = new VoiceAssistant();
    this.mapService = new MapService('mapContainer');
    this.weatherData = null;
    this.selectedCropForGuide = 'wheat';
    this.activeFertFilter = 'All';
    this.activeEqFilter = 'All';
    this.activeSchemeFilter = 'All';
  }

  async init() {
    this.setupAccessibility();
    this.populateLanguageSelector();
    this.setupRoleSwitcher();
    this.setupNavigation();
    this.setupVoiceAssistant();
    this.setupModalClosers();
    
    // Load initial weather
    const profile = state.getProfile();
    this.weatherData = await fetchWeather(26.4258, 85.0506, profile.village || 'Chakia, East Champaran');
    
    // Render current view
    this.render();

    // Listen to state changes
    state.on(STORAGE_KEYS.LANG, () => this.onLanguageChange());
    state.on(STORAGE_KEYS.ROLE, () => this.onRoleChange());
    state.on(STORAGE_KEYS.NOTIFICATIONS, () => this.updateNotificationBadge());
    state.on(STORAGE_KEYS.ORDERS, () => {
      if (this.currentView === 'fertilizer' || this.currentView === 'dashboard' || this.currentView === 'admin') {
        this.render();
      }
    });
    state.on(STORAGE_KEYS.ACTIVE_TOKEN, () => {
      if (this.currentView === 'queue' || this.currentView === 'dashboard') {
        this.render();
      }
    });

    this.updateNotificationBadge();
  }

  setupAccessibility() {
    const acc = state.getAccessibility();
    if (acc.highContrast) {
      document.body.setAttribute('data-contrast', 'high');
    } else {
      document.body.removeAttribute('data-contrast');
    }
    if (acc.fontSize && acc.fontSize !== 'normal') {
      document.body.setAttribute('data-font-size', acc.fontSize);
    } else {
      document.body.removeAttribute('data-font-size');
    }

    const contrastBtn = document.getElementById('contrastToggleBtn');
    if (contrastBtn) {
      contrastBtn.addEventListener('click', () => {
        const current = state.getAccessibility();
        const nextState = !current.highContrast;
        state.setAccessibility({ ...current, highContrast: nextState });
        this.setupAccessibility();
      });
    }

    const fontBtn = document.getElementById('fontScaleBtn');
    if (fontBtn) {
      fontBtn.addEventListener('click', () => {
        const current = state.getAccessibility();
        const order = ['normal', 'large', 'xlarge'];
        const next = order[(order.indexOf(current.fontSize || 'normal') + 1) % order.length];
        state.setAccessibility({ ...current, fontSize: next });
        this.setupAccessibility();
      });
    }
  }

  populateLanguageSelector() {
    const selectors = document.querySelectorAll('.lang-select-elem');
    const currentLang = state.getLang();
    selectors.forEach(sel => {
      sel.innerHTML = '';
      LANGUAGES.forEach(l => {
        const opt = document.createElement('option');
        opt.value = l.code;
        opt.textContent = l.name;
        if (l.code === currentLang) opt.selected = true;
        sel.appendChild(opt);
      });
      sel.addEventListener('change', (e) => {
        state.setLang(e.target.value);
      });
    });
  }

  setupRoleSwitcher() {
    const roleElem = document.getElementById('roleSwitcher');
    if (roleElem) {
      roleElem.value = state.getRole();
      roleElem.addEventListener('change', (e) => {
        state.setRole(e.target.value);
      });
    }
  }

  onLanguageChange() {
    const currentLang = state.getLang();
    document.querySelectorAll('.lang-select-elem').forEach(sel => sel.value = currentLang);
    this.updateStaticTranslations();
    this.render();
  }

  onRoleChange() {
    const role = state.getRole();
    const adminNav = document.getElementById('navAdminLi');
    if (adminNav) {
      adminNav.style.display = (role === 'admin') ? 'block' : 'none';
    }
    this.render();
  }

  updateStaticTranslations() {
    const lang = state.getLang();
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        el.textContent = t(key, lang);
      }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) {
        el.setAttribute('placeholder', t(key, lang));
      }
    });
  }

  setupNavigation() {
    // Hash routing & link clicks
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '') || 'dashboard';
      this.navigate(hash);
    });

    const initialHash = window.location.hash.replace('#', '') || 'dashboard';
    this.navigate(initialHash);

    // Sidebar Mobile Toggle
    const sidebar = document.getElementById('appSidebar');
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    if (toggleBtn && sidebar) {
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
    }
  }

  navigate(viewName) {
    this.currentView = viewName;
    window.location.hash = viewName;

    // Update active navigation link
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-view') === viewName) {
        link.classList.add('active');
      }
    });

    document.querySelectorAll('.mobile-nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('data-view') === viewName) {
        item.classList.add('active');
      }
    });

    // Close mobile sidebar if open
    const sidebar = document.getElementById('appSidebar');
    if (sidebar) sidebar.classList.remove('open');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    this.render();

    if (viewName === 'map') {
      setTimeout(() => {
        this.mapService.init();
        this.mapService.resize();
      }, 100);
    }
  }

  updateNotificationBadge() {
    const notifications = state.getNotifications();
    const unread = notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notificationBadge');
    if (badge) {
      badge.style.display = unread > 0 ? 'block' : 'none';
    }
  }

  render() {
    const container = document.getElementById('mainViewContainer');
    if (!container) return;

    this.updateStaticTranslations();
    const lang = state.getLang();

    switch (this.currentView) {
      case 'dashboard':
        container.innerHTML = this.getDashboardHTML(lang);
        this.bindDashboardEvents();
        break;
      case 'weather':
        container.innerHTML = this.getWeatherHTML(lang);
        this.bindWeatherEvents();
        break;
      case 'fertilizer':
        container.innerHTML = this.getFertilizerHTML(lang);
        this.bindFertilizerEvents();
        break;
      case 'equipment':
        container.innerHTML = this.getEquipmentHTML(lang);
        this.bindEquipmentEvents();
        break;
      case 'drone':
        container.innerHTML = this.getDroneHTML(lang);
        this.bindDroneEvents();
        break;
      case 'schemes':
        container.innerHTML = this.getSchemesHTML(lang);
        this.bindSchemesEvents();
        break;
      case 'cropGuide':
        container.innerHTML = this.getCropGuideHTML(lang);
        this.bindCropGuideEvents();
        break;
      case 'beginnerGuide':
        container.innerHTML = this.getBeginnerGuideHTML(lang);
        break;
      case 'calendar':
        container.innerHTML = this.getCropCalendarHTML(lang);
        break;
      case 'queue':
        container.innerHTML = this.getQueueHTML(lang);
        this.bindQueueEvents();
        break;
      case 'map':
        container.innerHTML = this.getMapHTML(lang);
        break;
      case 'support':
        container.innerHTML = this.getSupportHTML(lang);
        this.bindSupportEvents();
        break;
      case 'profile':
        container.innerHTML = this.getProfileHTML(lang);
        this.bindProfileEvents();
        break;
      case 'admin':
        container.innerHTML = this.getAdminHTML(lang);
        this.bindAdminEvents();
        break;
      default:
        container.innerHTML = this.getDashboardHTML(lang);
        this.bindDashboardEvents();
    }
  }

  // ==========================================
  // VIEW RENDERERS
  // ==========================================

  getDashboardHTML(lang) {
    const profile = state.getProfile();
    const activeToken = state.getActiveToken();
    const orders = state.getOrders();
    const bookings = state.getBookings();
    const w = this.weatherData || { temp: 28, condition: 'साफ आसमान', rainProb: 15 };

    return `
      <div class="dashboard-hero">
        <div class="hero-text">
          <h1>${t('dash_welcome', lang)}, ${profile.name} 👋</h1>
          <p>${profile.village}, ${profile.district} | ${profile.farmSize} | ${profile.primaryCrop}</p>
        </div>
        <div class="hero-actions">
          <button class="btn-voice-hero" id="heroVoiceBtn">
            <i class="fa-solid fa-microphone"></i>
            <span>${t('btn_speak', lang)} (AI Voice)</span>
          </button>
        </div>
      </div>

      <!-- KPI Grid -->
      <div class="kpi-grid">
        <div class="kpi-card" onclick="window.mandixApp.navigate('weather')">
          <div class="kpi-icon-box kpi-icon-weather">
            <i class="fa-solid ${w.icon || 'fa-cloud-sun'}"></i>
          </div>
          <div class="kpi-body">
            <h5>${t('dash_stats_weather', lang)}</h5>
            <h3>${w.temp}°C</h3>
            <p>${w.condition} | 🌧️ ${w.rainProb}%</p>
          </div>
        </div>

        <div class="kpi-card" onclick="window.mandixApp.navigate('queue')">
          <div class="kpi-icon-box kpi-icon-token">
            <i class="fa-solid fa-ticket"></i>
          </div>
          <div class="kpi-body">
            <h5>${t('dash_stats_activeToken', lang)}</h5>
            <h3>${activeToken ? activeToken.tokenNumber : 'कोई नहीं'}</h3>
            <p>${activeToken ? `काउंटर: ${activeToken.counterNo} (~${activeToken.estimatedWaitMin}m)` : 'स्लॉट बुक करें'}</p>
          </div>
        </div>

        <div class="kpi-card" onclick="window.mandixApp.navigate('fertilizer')">
          <div class="kpi-icon-box kpi-icon-fert">
            <i class="fa-solid fa-truck-fast"></i>
          </div>
          <div class="kpi-body">
            <h5>${t('dash_stats_fertilizer', lang)}</h5>
            <h3>${orders.length > 0 ? orders[0].status : 'कोई ऑर्डर नहीं'}</h3>
            <p>${orders.length > 0 ? orders[0].productName.substring(0, 22) + '...' : 'डोरस्टेप डिलीवरी'}</p>
          </div>
        </div>

        <div class="kpi-card" onclick="window.mandixApp.navigate('equipment')">
          <div class="kpi-icon-box kpi-icon-rent">
            <i class="fa-solid fa-tractor"></i>
          </div>
          <div class="kpi-body">
            <h5>${t('dash_stats_rentals', lang)}</h5>
            <h3>${bookings.length > 0 ? bookings[0].status : 'उपलब्ध'}</h3>
            <p>${bookings.length > 0 ? bookings[0].equipmentName.substring(0, 22) + '...' : 'मशीनरी किराए पर लें'}</p>
          </div>
        </div>
      </div>

      <!-- Quick Services Launcher -->
      <div class="section-title-row">
        <h2><i class="fa-solid fa-shapes" style="color:var(--primary-600);"></i> ${t('dash_quickActions', lang)}</h2>
      </div>

      <div class="services-grid">
        <a class="service-card" onclick="window.mandixApp.navigate('weather')">
          <div class="service-icon"><i class="fa-solid fa-cloud-sun-rain"></i></div>
          <h4>${t('nav_weather', lang)}</h4>
          <span>7-दिन पूर्वानुमान व सलाह</span>
        </a>

        <a class="service-card" onclick="window.mandixApp.navigate('fertilizer')">
          <div class="service-icon"><i class="fa-solid fa-truck-ramp-box"></i></div>
          <h4>${t('nav_fertilizer', lang)}</h4>
          <span>सब्सिडी युक्त खाद डिलीवरी</span>
        </a>

        <a class="service-card" onclick="window.mandixApp.navigate('equipment')">
          <div class="service-icon"><i class="fa-solid fa-tractor"></i></div>
          <h4>${t('nav_equipment', lang)}</h4>
          <span>ट्रैक्टर व कृषि यंत्र</span>
        </a>

        <a class="service-card" onclick="window.mandixApp.navigate('drone')">
          <div class="service-icon"><i class="fa-solid fa-helicopter"></i></div>
          <h4>${t('nav_drone', lang)}</h4>
          <span>नैनो यूरिया व कीटनाशक स्प्रे</span>
        </a>

        <a class="service-card" onclick="window.mandixApp.navigate('schemes')">
          <div class="service-icon"><i class="fa-solid fa-landmark"></i></div>
          <h4>${t('nav_schemes', lang)}</h4>
          <span>PM-KISAN, PMFBY, KCC</span>
        </a>

        <a class="service-card" onclick="window.mandixApp.navigate('cropGuide')">
          <div class="service-icon"><i class="fa-solid fa-seedling"></i></div>
          <h4>${t('nav_cropGuide', lang)}</h4>
          <span>12-चरण वैज्ञानिक समयरेखा</span>
        </a>

        <a class="service-card" onclick="window.mandixApp.navigate('queue')">
          <div class="service-icon"><i class="fa-solid fa-users-line"></i></div>
          <h4>${t('nav_queue', lang)}</h4>
          <span>स्मार्ट खरीद कतार व टोकन</span>
        </a>

        <a class="service-card" onclick="window.mandixApp.navigate('map')">
          <div class="service-icon"><i class="fa-solid fa-map-location-dot"></i></div>
          <h4>${t('nav_map', lang)}</h4>
          <span>मंडी व कृषि केंद्र नक्शा</span>
        </a>

        <a class="service-card" onclick="window.mandixApp.navigate('support')">
          <div class="service-icon"><i class="fa-solid fa-headset"></i></div>
          <h4>${t('nav_support', lang)}</h4>
          <span>किसान सहायक 24x7</span>
        </a>
      </div>

      <!-- Live Mandi Queue & Agro Advisory Row -->
      <div class="dashboard-columns">
        <div class="dash-panel">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
            <h3><i class="fa-solid fa-ticket" style="color:var(--primary-600);"></i> सक्रिय खरीद टोकन स्थिति</h3>
            <span class="badge badge-success">Live Status</span>
          </div>

          ${activeToken ? `
            <div style="background:var(--primary-50);border:1px solid var(--primary-200);border-radius:var(--radius-md);padding:18px;">
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
                <div>
                  <span style="font-size:12px;color:var(--text-muted);">आपका टोकन नंबर:</span>
                  <div style="font-size:28px;font-weight:800;color:var(--primary-800);">${activeToken.tokenNumber}</div>
                </div>
                <div>
                  <span style="font-size:12px;color:var(--text-muted);">केंद्र:</span>
                  <div style="font-size:14px;font-weight:600;">${activeToken.centerName}</div>
                </div>
                <div>
                  <span style="font-size:12px;color:var(--text-muted);">वर्तमान सेवा:</span>
                  <div style="font-size:18px;font-weight:700;color:var(--accent-amber);">${activeToken.currentServing}</div>
                </div>
                <div>
                  <span style="font-size:12px;color:var(--text-muted);">प्रतीक्षा समय:</span>
                  <div style="font-size:16px;font-weight:700;color:var(--accent-blue);">~${activeToken.estimatedWaitMin} मिनट</div>
                </div>
              </div>

              <div style="margin-top:14px;display:flex;gap:10px;">
                <button class="btn btn-primary btn-sm" onclick="window.mandixApp.navigate('queue')">पूर्ण कतार विवरण देखें</button>
                <a href="bookSlot.html" class="btn btn-secondary btn-sm">नया स्लॉट बुक करें</a>
              </div>
            </div>
          ` : `
            <p>वर्तमान में कोई सक्रिय मंडी टोकन नहीं है।</p>
            <button class="btn btn-primary btn-sm" onclick="window.mandixApp.navigate('queue')" style="margin-top:10px;">अभी स्लॉट बुक करें</button>
          `}
        </div>

        <div class="dash-panel">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
            <h3><i class="fa-solid fa-triangle-exclamation" style="color:var(--accent-amber);"></i> कृषि मौसम अलर्ट</h3>
            <span class="demo-pill">Real-Time</span>
          </div>

          <div class="advisory-alert ${w.rainProb > 40 ? 'warning' : 'success'}" style="margin-bottom:10px;">
            <i class="fa-solid ${w.rainProb > 40 ? 'fa-cloud-showers-heavy' : 'fa-sun'}" style="font-size:20px;"></i>
            <div>
              <strong style="font-size:13px;">${w.rainProb > 40 ? 'बारिश की चेतावनी' : 'मौसम अनुकूल'}</strong>
              <p style="font-size:12px;margin:2px 0 0;">${w.rainProb > 40 ? 'संभावित बारिश के कारण सिंचाई व कीटनाशक छिड़काव स्थगित रखें।' : 'खेत में हल्की सिंचाई और खाद छिड़काव हेतु उपयुक्त समय।'}</p>
            </div>
          </div>

          <div style="font-size:11.5px;color:var(--text-muted);margin-top:10px;">
            <i class="fa-solid fa-circle-info"></i> ${t('weather_disclaimer', lang)}
          </div>
        </div>
      </div>
    `;
  }

  bindDashboardEvents() {
    const heroVoiceBtn = document.getElementById('heroVoiceBtn');
    if (heroVoiceBtn) {
      heroVoiceBtn.addEventListener('click', () => this.openVoiceModal());
    }
  }

  // ==========================================
  // WEATHER VIEW
  // ==========================================
  getWeatherHTML(lang) {
    const w = this.weatherData || { temp: 28, condition: 'साफ', rainProb: 15 };

    return `
      <div class="section-title-row">
        <h2><i class="fa-solid fa-cloud-sun-rain" style="color:var(--accent-blue);"></i> ${t('weather_title', lang)}</h2>
        <span class="demo-pill">${w.isDemo ? 'Verified Demo Data' : 'Live Open-Meteo API'}</span>
      </div>

      <div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;">
        <select id="weatherLocationSelect" class="role-select" style="flex:1;min-width:240px;padding:10px;font-size:14px;">
          ${INDIAN_LOCATIONS.map(loc => `
            <option value="${loc.lat},${loc.lon},${loc.name}" ${loc.name.includes('Chakia') ? 'selected' : ''}>
              📍 ${loc.name}
            </option>
          `).join('')}
        </select>
        <button id="btnGpsWeather" class="btn btn-secondary">
          <i class="fa-solid fa-location-crosshairs"></i> ${t('weather_gpsBtn', lang)}
        </button>
      </div>

      <!-- Main Current Weather Box -->
      <div class="weather-main-card">
        <div>
          <span style="font-size:14px;opacity:0.9;">स्थान / Location</span>
          <h2 style="font-size:24px;margin-bottom:8px;">${w.locationName}</h2>
          <div class="weather-temp-large">${w.temp}°C</div>
          <div class="weather-condition-text"><i class="fa-solid ${w.icon}"></i> ${w.condition}</div>
          <div style="font-size:13px;opacity:0.85;margin-top:6px;">महसूस हो रहा है (Feels like): ${w.feelsLike || w.temp}°C</div>
        </div>

        <div style="text-align:right;">
          <div style="font-size:14px;margin-bottom:4px;">🌅 सूर्योदय: <b>${w.sunrise || '05:42 AM'}</b></div>
          <div style="font-size:14px;margin-bottom:12px;">🌇 सूर्यास्त: <b>${w.sunset || '06:18 PM'}</b></div>
          <div style="background:rgba(255,255,255,0.2);padding:6px 14px;border-radius:var(--radius-full);font-size:13px;display:inline-block;">
            🌧️ वर्षा संभावना: <b>${w.rainProb}%</b>
          </div>
        </div>
      </div>

      <!-- 4 Key Weather Metrics -->
      <div class="weather-grid-metrics">
        <div class="metric-box">
          <i class="fa-solid fa-droplet"></i>
          <span>${t('weather_humidity', lang)}</span>
          <strong>${w.humidity}%</strong>
        </div>
        <div class="metric-box">
          <i class="fa-solid fa-wind"></i>
          <span>${t('weather_wind', lang)}</span>
          <strong>${w.windSpeed} km/h</strong>
        </div>
        <div class="metric-box">
          <i class="fa-solid fa-cloud-showers-heavy"></i>
          <span>${t('weather_rainProb', lang)}</span>
          <strong>${w.rainProb}%</strong>
        </div>
        <div class="metric-box">
          <i class="fa-solid fa-gauge"></i>
          <span>मौसम स्थिति</span>
          <strong>${w.condition.split(' ')[0]}</strong>
        </div>
      </div>

      <!-- 7-Day Forecast -->
      <h3 style="margin-bottom:12px;"><i class="fa-solid fa-calendar-days" style="color:var(--primary-600);"></i> 7-दिन का कृषि पूर्वानुमान</h3>
      <div class="forecast-days-row">
        ${(w.forecast || []).map(f => `
          <div class="forecast-day-card">
            <div class="day-name">${f.day}</div>
            <div style="font-size:11px;color:var(--text-muted);">${f.date}</div>
            <i class="fa-solid ${f.icon}" style="color:#0284c7;"></i>
            <div class="temp-range">${f.maxTemp}° / ${f.minTemp}°</div>
            <div style="font-size:11px;color:#0284c7;">🌧️ ${f.rainProb}%</div>
          </div>
        `).join('')}
      </div>

      <!-- Actionable Agro Advisory -->
      <h3 style="margin-bottom:12px;"><i class="fa-solid fa-seedling" style="color:var(--primary-600);"></i> ${t('weather_advisory', lang)}</h3>
      ${(w.advisory || []).map(adv => `
        <div class="advisory-alert ${adv.type}">
          <i class="fa-solid ${adv.suitable ? 'fa-circle-check' : 'fa-triangle-exclamation'}" style="font-size:20px;margin-top:2px;"></i>
          <div>
            <strong style="font-size:14px;">${adv.category}</strong>
            <p style="font-size:13px;margin:2px 0 0;">${adv.message}</p>
          </div>
        </div>
      `).join('')}

      <div style="margin-top:16px;background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-sm);padding:12px 16px;font-size:12px;color:var(--text-muted);">
        <i class="fa-solid fa-shield-halved" style="color:var(--primary-600);"></i> <b>महत्वपूर्ण अस्वीकरण (Disclaimer):</b> ${t('weather_disclaimer', lang)}
      </div>
    `;
  }

  bindWeatherEvents() {
    const locSelect = document.getElementById('weatherLocationSelect');
    if (locSelect) {
      locSelect.addEventListener('change', async (e) => {
        const [lat, lon, name] = e.target.value.split(',');
        this.weatherData = await fetchWeather(parseFloat(lat), parseFloat(lon), name);
        this.render();
      });
    }

    const gpsBtn = document.getElementById('btnGpsWeather');
    if (gpsBtn) {
      gpsBtn.addEventListener('click', () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              this.weatherData = await fetchWeather(pos.coords.latitude, pos.coords.longitude, 'आपका वर्तमान स्थान (Current GPS Location)');
              this.render();
            },
            (err) => {
              alert('स्थान की अनुमति नहीं मिली। कृपया सूची में से अपना जिला चुनें। (Location permission denied, please select from dropdown)');
            }
          );
        } else {
          alert('आपके डिवाइस में जीपीएस समर्थित नहीं है।');
        }
      });
    }
  }

  // ==========================================
  // FERTILIZER DELIVERY VIEW
  // ==========================================
  getFertilizerHTML(lang) {
    const orders = state.getOrders();
    const filteredProducts = FERTILIZER_CATALOG.filter(p => {
      if (this.activeFertFilter === 'All') return true;
      return p.category.toLowerCase().includes(this.activeFertFilter.toLowerCase());
    });

    return `
      <div class="section-title-row">
        <div>
          <h2><i class="fa-solid fa-truck-ramp-box" style="color:var(--primary-600);"></i> ${t('fert_title', lang)}</h2>
          <p style="font-size:13px;color:var(--text-secondary);">${t('fert_sub', lang)}</p>
        </div>
        <span class="demo-pill">Subsidized Delivery</span>
      </div>

      <!-- Category Filter Tabs -->
      <div class="filter-tabs">
        ${FERTILIZER_CATEGORIES.map(cat => `
          <button class="filter-tab-btn ${this.activeFertFilter === cat ? 'active' : ''}" data-cat="${cat}">
            ${cat === 'All' ? t('fert_all', lang) : cat}
          </button>
        `).join('')}
      </div>

      <!-- Product Catalog Grid -->
      <div class="product-grid">
        ${filteredProducts.map(p => `
          <div class="product-card">
            <div class="product-header">
              <div class="product-thumb"><i class="fa-solid ${p.imageIcon}"></i></div>
              <span class="badge badge-success">⭐ ${p.rating}</span>
            </div>
            <h4 style="font-size:16px;font-weight:700;margin-bottom:2px;">${p.name}</h4>
            <span style="font-size:12px;color:var(--text-muted);">${p.brand}</span>
            
            <div class="product-price">₹${p.price.toFixed(2)} <span style="font-size:13px;color:var(--text-muted);font-weight:400;">/ ${p.unit}</span></div>
            <span class="product-subsidy-badge"><i class="fa-solid fa-check"></i> ${p.subsidyNote}</span>

            <ul class="product-spec-list">
              <li><b>पोषक तत्व:</b> ${p.composition}</li>
              <li><b>उपयुक्त फसलें:</b> ${p.crops.join(', ')}</li>
              <li><b>अनुशंसित मात्रा:</b> ${p.dosage}</li>
            </ul>

            <div class="product-actions">
              <button class="btn btn-primary btn-sm" style="flex:1;" onclick="window.mandixApp.openFertilizerCheckout('${p.id}')">
                <i class="fa-solid fa-cart-shopping"></i> ${t('btn_orderNow', lang)}
              </button>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Active Orders & Tracking -->
      <div class="dash-panel">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h3><i class="fa-solid fa-clock-rotate-left" style="color:var(--primary-600);"></i> आपके उर्वरक ऑर्डर एवं ट्रैकिंग (Order History & Tracking)</h3>
          <span class="demo-pill">Simulated Doorstep Tracking</span>
        </div>

        ${orders.length > 0 ? orders.map(order => `
          <div style="background:var(--bg-main);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:18px;margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:12px;">
              <div>
                <strong>ऑर्डर #${order.id}</strong> - <span style="color:var(--primary-800);font-weight:600;">${order.productName}</span> (${order.quantity} थैले)
                <div style="font-size:12px;color:var(--text-muted);">ऑर्डर तिथि: ${order.orderDate} | डिलीवरी स्लॉट: ${order.deliverySlot}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:16px;font-weight:700;color:var(--primary-800);">कुल: ₹${order.totalPrice.toFixed(2)}</div>
                <span class="badge ${order.status === 'Delivered' ? 'badge-success' : 'badge-warning'}">${order.status}</span>
              </div>
            </div>

            <!-- Stepper Visualizer -->
            <div class="stepper-wrapper">
              <div class="step-item completed">
                <div class="step-icon"><i class="fa-solid fa-check"></i></div>
                <div class="step-title">ऑर्डर दर्ज (Placed)</div>
              </div>
              <div class="step-item ${order.status !== 'Ordered' ? 'completed' : 'active'}">
                <div class="step-icon">${order.status !== 'Ordered' ? '<i class="fa-solid fa-check"></i>' : '2'}</div>
                <div class="step-title">सहकारी केंद्र पुष्टि</div>
              </div>
              <div class="step-item ${order.status === 'Dispatched' || order.status === 'Delivered' ? 'completed' : ''}">
                <div class="step-icon">${order.status === 'Delivered' ? '<i class="fa-solid fa-check"></i>' : '3'}</div>
                <div class="step-title">डिलीवरी रवाना (Dispatched)</div>
              </div>
              <div class="step-item ${order.status === 'Delivered' ? 'completed' : ''}">
                <div class="step-icon">${order.status === 'Delivered' ? '<i class="fa-solid fa-check"></i>' : '4'}</div>
                <div class="step-title">खेत तक प्राप्त (Delivered)</div>
              </div>
            </div>

            <div style="font-size:12px;color:var(--text-secondary);display:flex;align-items:center;gap:6px;">
              <i class="fa-solid fa-location-dot" style="color:var(--primary-600);"></i> <b>डिलीवरी पता:</b> ${order.address}
            </div>
          </div>
        `).join('') : '<p>वर्तमान में कोई सक्रिय उर्वरक ऑर्डर नहीं है।</p>'}
      </div>
    `;
  }

  bindFertilizerEvents() {
    document.querySelectorAll('.filter-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.activeFertFilter = e.target.getAttribute('data-cat');
        this.render();
      });
    });
  }

  openFertilizerCheckout(productId) {
    const product = FERTILIZER_CATALOG.find(p => p.id === productId);
    if (!product) return;
    const profile = state.getProfile();

    const modal = document.getElementById('genericModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.textContent = `उर्वरक ऑर्डर: ${product.name}`;
    modalBody.innerHTML = `
      <form id="fertCheckoutForm">
        <div style="margin-bottom:14px;">
          <label style="font-size:13px;font-weight:600;">उत्पाद मूल्य:</label>
          <div style="font-size:18px;font-weight:700;color:var(--primary-800);">₹${product.price.toFixed(2)} / ${product.unit}</div>
        </div>

        <div style="margin-bottom:14px;">
          <label style="font-size:13px;font-weight:600;">मात्रा (थैलों की संख्या / Quantity):</label>
          <input type="number" id="fertQty" min="1" max="50" value="2" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:var(--radius-sm);margin-top:4px;" required>
        </div>

        <div style="margin-bottom:14px;">
          <label style="font-size:13px;font-weight:600;">डिलीवरी पता (Farm / Village Address):</label>
          <textarea id="fertAddress" rows="2" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:var(--radius-sm);margin-top:4px;" required>${profile.village}, Near Primary School, ${profile.district}, ${profile.state} - 845412</textarea>
        </div>

        <div style="margin-bottom:18px;">
          <label style="font-size:13px;font-weight:600;">पसंदीदा डिलीवरी समय (Delivery Slot):</label>
          <select id="fertSlot" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:var(--radius-sm);margin-top:4px;">
            <option>सुबह 09:00 AM - 12:00 PM</option>
            <option>दोपहर 01:00 PM - 04:00 PM</option>
            <option>शाम 04:00 PM - 07:00 PM</option>
          </select>
        </div>

        <div style="background:var(--primary-50);border:1px solid var(--primary-200);padding:12px;border-radius:var(--radius-sm);margin-bottom:18px;font-size:12.5px;">
          💡 <b>नोट:</b> भुगतान डिलीवरी के समय नकद या यूपीआई द्वारा किया जा सकता है। पीओएस मशीन पर आधार सत्यापन मान्य होगा।
        </div>

        <button type="submit" class="btn btn-primary" style="width:100%;padding:12px;">ऑर्डर कन्फर्म करें (Confirm Order)</button>
      </form>
    `;

    document.getElementById('fertCheckoutForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const qty = parseInt(document.getElementById('fertQty').value) || 1;
      const address = document.getElementById('fertAddress').value;
      const slot = document.getElementById('fertSlot').value;

      const newOrder = {
        id: `FD-${Math.floor(1000 + Math.random() * 9000)}`,
        productName: product.name,
        category: product.category,
        quantity: qty,
        unitPrice: product.price,
        totalPrice: product.price * qty,
        orderDate: new Date().toISOString().split('T')[0],
        deliverySlot: slot,
        address,
        status: 'Ordered',
        isDemo: true
      };

      state.addOrder(newOrder);

      // Notification
      const notifications = state.getNotifications();
      notifications.unshift({
        id: `notif_${Date.now()}`,
        type: 'order',
        title: `उर्वरक ऑर्डर स्वीकृत: #${newOrder.id}`,
        message: `${newOrder.productName} (${newOrder.quantity} बैग) का ऑर्डर दर्ज हो गया है।`,
        time: 'अभी-अभी (Just now)',
        read: false,
        icon: 'fa-truck-fast'
      });
      state.save('mandix_notifications', notifications);

      modal.classList.remove('active');
      alert(`धन्यवाद! आपका उर्वरक ऑर्डर #${newOrder.id} सफलतापूर्वक दर्ज कर लिया गया है।`);
      this.render();
    });

    modal.classList.add('active');
  }

  // ==========================================
  // EQUIPMENT RENTAL VIEW
  // ==========================================
  getEquipmentHTML(lang) {
    const bookings = state.getBookings();
    const filtered = EQUIPMENT_CATALOG.filter(e => {
      if (this.activeEqFilter === 'All') return true;
      return e.category.toLowerCase().includes(this.activeEqFilter.toLowerCase());
    });

    return `
      <div class="section-title-row">
        <div>
          <h2><i class="fa-solid fa-tractor" style="color:var(--accent-purple);"></i> ${t('eq_title', lang)}</h2>
          <p style="font-size:13px;color:var(--text-secondary);">${t('eq_sub', lang)}</p>
        </div>
        <span class="demo-pill">Verified CHC Machinery</span>
      </div>

      <!-- Filters -->
      <div class="filter-tabs">
        ${EQUIPMENT_CATEGORIES.map(cat => `
          <button class="filter-tab-btn ${this.activeEqFilter === cat ? 'active' : ''}" data-eqcat="${cat}">
            ${cat}
          </button>
        `).join('')}
      </div>

      <!-- Machinery Grid -->
      <div class="equipment-grid" style="margin-bottom:28px;">
        ${filtered.map(eq => `
          <div class="equipment-card">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
              <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:44px;height:44px;background:#f3e8ff;color:#7e22ce;border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;font-size:20px;">
                  <i class="fa-solid ${eq.icon}"></i>
                </div>
                <div>
                  <h4 style="font-size:16px;font-weight:700;">${eq.name}</h4>
                  <span style="font-size:12px;color:var(--text-muted);">${eq.category} | ⭐ ${eq.rating}</span>
                </div>
              </div>
            </div>

            <div style="display:flex;gap:8px;margin:10px 0;">
              <span class="eq-rate-badge">₹${eq.hourlyRate} / घंटा</span>
              <span class="eq-rate-badge" style="background:#e0f2fe;color:#0369a1;">₹${eq.dailyRate} / दिन</span>
            </div>

            <p style="font-size:12.5px;color:var(--text-secondary);margin-bottom:12px;">${eq.specs}</p>

            <div style="font-size:12px;color:var(--text-muted);margin-bottom:14px;background:var(--bg-main);padding:8px 12px;border-radius:var(--radius-sm);">
              <div>📍 <b>केंद्र:</b> ${eq.provider} (${eq.location})</div>
              <div>📞 <b>संपर्क:</b> ${eq.phone}</div>
              <div>✅ <b>उपलब्धता:</b> <span style="color:#15803d;font-weight:600;">${eq.availability}</span></div>
            </div>

            <button class="btn btn-primary btn-sm" style="margin-top:auto;" onclick="window.mandixApp.openEquipmentBooking('${eq.id}')">
              <i class="fa-solid fa-calendar-check"></i> ${t('btn_rentNow', lang)}
            </button>
          </div>
        `).join('')}
      </div>

      <!-- My Bookings History -->
      <div class="dash-panel">
        <h3 style="margin-bottom:14px;"><i class="fa-solid fa-clipboard-list" style="color:var(--primary-600);"></i> आपकी यंत्र बुकिंग सूची (My Equipment Bookings)</h3>
        ${bookings.length > 0 ? bookings.map(b => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--bg-main);border-radius:var(--radius-sm);margin-bottom:10px;flex-wrap:wrap;gap:10px;">
            <div>
              <strong>#${b.id}</strong> - <b>${b.equipmentName}</b>
              <div style="font-size:12px;color:var(--text-muted);">${b.provider} | दिनांक: ${b.startDate} (${b.duration})</div>
            </div>
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="font-size:14px;font-weight:700;color:var(--primary-800);">₹${b.total}</span>
              <span class="badge badge-success">${b.status}</span>
              <button class="btn btn-secondary btn-sm" onclick="alert('सहायता डेस्क से ऑपरेटर से संपर्क किया जा रहा है।')">कॉल ऑपरेटर</button>
            </div>
          </div>
        `).join('') : '<p>कोई सक्रिय उपकरण बुकिंग नहीं है।</p>'}
      </div>
    `;
  }

  bindEquipmentEvents() {
    document.querySelectorAll('[data-eqcat]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.activeEqFilter = e.target.getAttribute('data-eqcat');
        this.render();
      });
    });
  }

  openEquipmentBooking(eqId) {
    const eq = EQUIPMENT_CATALOG.find(e => e.id === eqId);
    if (!eq) return;

    const modal = document.getElementById('genericModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.textContent = `यंत्र बुकिंग: ${eq.name}`;
    modalBody.innerHTML = `
      <form id="eqBookingForm">
        <div style="margin-bottom:12px;">
          <label style="font-size:13px;font-weight:600;">किराया दर:</label>
          <div style="font-size:16px;font-weight:700;color:var(--primary-800);">₹${eq.hourlyRate}/घंटा या ₹${eq.dailyRate}/दिन</div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
          <div>
            <label style="font-size:13px;font-weight:600;">किराया प्रकार:</label>
            <select id="eqRateType" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:var(--radius-sm);margin-top:4px;">
              <option value="daily">प्रति दिन (₹${eq.dailyRate}/Day)</option>
              <option value="hourly">प्रति घंटा (₹${eq.hourlyRate}/Hour)</option>
            </select>
          </div>
          <div>
            <label style="font-size:13px;font-weight:600;">अवधि (संख्या):</label>
            <input type="number" id="eqDuration" min="1" max="30" value="1" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:var(--radius-sm);margin-top:4px;" required>
          </div>
        </div>

        <div style="margin-bottom:12px;">
          <label style="font-size:13px;font-weight:600;">आरंभ तिथि (Start Date):</label>
          <input type="date" id="eqDate" value="${new Date().toISOString().split('T')[0]}" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:var(--radius-sm);margin-top:4px;" required>
        </div>

        <div style="margin-bottom:14px;">
          <label style="font-size:13px;font-weight:600;display:flex;align-items:center;gap:8px;">
            <input type="checkbox" id="eqOperator" checked> अनुभवी ऑपरेटर / ड्राइवर सहित सेवा चाहिए (+₹400/Day)
          </label>
        </div>

        <div style="background:var(--bg-main);padding:12px;border-radius:var(--radius-sm);margin-bottom:16px;font-size:13px;">
          <div style="display:flex;justify-content:space-between;">
            <span>अनुमानित कुल किराया:</span>
            <strong id="eqTotalDisplay" style="color:var(--primary-800);font-size:16px;">₹${eq.dailyRate + 400}</strong>
          </div>
        </div>

        <button type="submit" class="btn btn-primary" style="width:100%;padding:12px;">बुकिंग पुष्टि करें (Confirm Booking)</button>
      </form>
    `;

    const calcTotal = () => {
      const type = document.getElementById('eqRateType').value;
      const dur = parseInt(document.getElementById('eqDuration').value) || 1;
      const op = document.getElementById('eqOperator').checked;
      const rate = type === 'daily' ? eq.dailyRate : eq.hourlyRate;
      const opCost = op ? (type === 'daily' ? 400 * dur : 50 * dur) : 0;
      const total = (rate * dur) + opCost;
      document.getElementById('eqTotalDisplay').textContent = `₹${total}`;
      return total;
    };

    document.getElementById('eqRateType').addEventListener('change', calcTotal);
    document.getElementById('eqDuration').addEventListener('input', calcTotal);
    document.getElementById('eqOperator').addEventListener('change', calcTotal);

    document.getElementById('eqBookingForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const total = calcTotal();
      const type = document.getElementById('eqRateType').value;
      const dur = document.getElementById('eqDuration').value;
      const date = document.getElementById('eqDate').value;
      const op = document.getElementById('eqOperator').checked;

      const newBooking = {
        id: `EQ-${Math.floor(1000 + Math.random() * 9000)}`,
        equipmentName: eq.name,
        category: eq.category,
        provider: eq.provider,
        startDate: date,
        duration: `${dur} ${type === 'daily' ? 'Days' : 'Hours'}`,
        rateType: type,
        rate: type === 'daily' ? eq.dailyRate : eq.hourlyRate,
        total,
        operatorRequired: op,
        status: 'Confirmed',
        isDemo: true
      };

      state.addBooking(newBooking);

      modal.classList.remove('active');
      alert(`सफलता! #${newBooking.id} के तहत उपकरण बुक हो गया है। ऑपरेटर संपर्क विवरण प्रोफाइल में सुरक्षित है।`);
      this.render();
    });

    modal.classList.add('active');
  }

  // ==========================================
  // DRONE SERVICES VIEW
  // ==========================================
  getDroneHTML(lang) {
    const requests = state.getDroneRequests();

    return `
      <div class="section-title-row">
        <div>
          <h2><i class="fa-solid fa-helicopter" style="color:var(--primary-600);"></i> ${t('drone_title', lang)}</h2>
          <p style="font-size:13px;color:var(--text-secondary);">${t('drone_sub', lang)}</p>
        </div>
        <span class="demo-pill">DGCA Certified Booking</span>
      </div>

      <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:12px 16px;border-radius:var(--radius-sm);margin-bottom:22px;font-size:13px;color:#1e40af;">
        <i class="fa-solid fa-circle-info"></i> <b>महत्वपूर्ण सूचना (Disclaimer):</b> ${t('drone_disclaimer', lang)}
      </div>

      <!-- Drone Services Cards -->
      <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:20px;margin-bottom:28px;">
        ${DRONE_SERVICES.map(ds => `
          <div class="drone-card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
              <span class="badge badge-success">${ds.badge}</span>
              <span style="font-size:12px;color:var(--text-muted);"><i class="fa-solid fa-clock"></i> ${ds.timePerAcre}</span>
            </div>

            <h4 style="font-size:16px;font-weight:700;margin-bottom:6px;">${ds.name}</h4>
            <div style="font-size:20px;font-weight:800;color:var(--primary-800);margin-bottom:8px;">
              ₹${ds.ratePerAcre} <span style="font-size:13px;font-weight:400;color:var(--text-muted);">/ एकड़ (Acre)</span>
            </div>

            <p style="font-size:12.5px;color:var(--text-secondary);margin-bottom:12px;">${ds.description}</p>
            <div style="font-size:11.5px;color:var(--text-muted);margin-bottom:16px;">
              <b>उपयुक्त:</b> ${ds.recommendedCrops.join(', ')}
            </div>

            <button class="btn btn-primary btn-sm" style="margin-top:auto;" onclick="window.mandixApp.openDroneBooking('${ds.id}')">
              <i class="fa-solid fa-helicopter"></i> ${t('btn_requestDrone', lang)}
            </button>
          </div>
        `).join('')}
      </div>

      <!-- Verified Pilots Cluster -->
      <div class="dash-panel">
        <h3 style="margin-bottom:14px;"><i class="fa-solid fa-user-check" style="color:var(--primary-600);"></i> प्रमाणित स्थानीय ड्रोन पायलट (Empaneled DGCA Operators)</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:14px;">
          ${CERTIFIED_PILOTS.map(p => `
            <div style="background:var(--bg-main);border:1px solid var(--border-color);border-radius:var(--radius-sm);padding:14px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <strong>${p.name}</strong>
                <span class="badge badge-purple">⭐ ${p.rating}</span>
              </div>
              <div style="font-size:12px;color:var(--text-muted);margin:4px 0;">ड्रोन: ${p.droneModel}</div>
              <div style="font-size:11.5px;color:var(--text-secondary);">लाइसेंस: <b>${p.licenseNo}</b> | क्लस्टर: ${p.hubLocation}</div>
              <div style="font-size:11px;color:#15803d;margin-top:4px;">सफल छिड़काव मिशन: ${p.missionsCompleted}+ खेत</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Active Requests -->
      <div class="dash-panel">
        <h3 style="margin-bottom:14px;"><i class="fa-solid fa-clock-rotate-left" style="color:var(--primary-600);"></i> ड्रोन सेवा अनुरोध ट्रैकिंग (My Drone Requests)</h3>
        ${requests.length > 0 ? requests.map(r => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:12px;background:var(--bg-main);border-radius:var(--radius-sm);margin-bottom:10px;flex-wrap:wrap;gap:10px;">
            <div>
              <strong>#${r.id}</strong> - <b>${r.serviceName}</b> (${r.acres} एकड़)
              <div style="font-size:12px;color:var(--text-muted);">${r.fieldLocation} | दिनांक: ${r.preferredDate} (${r.slot})</div>
              <div style="font-size:11.5px;color:#0284c7;">पायलट: ${r.pilotName}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:16px;font-weight:700;color:var(--primary-800);">₹${r.costEstimate}</div>
              <span class="badge badge-info">${r.status}</span>
            </div>
          </div>
        `).join('') : '<p>वर्तमान में कोई सक्रिय ड्रोन अनुरोध नहीं है।</p>'}
      </div>
    `;
  }

  bindDroneEvents() {}

  openDroneBooking(serviceId) {
    const s = DRONE_SERVICES.find(d => d.id === serviceId);
    if (!s) return;
    const profile = state.getProfile();

    const modal = document.getElementById('genericModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.textContent = `ड्रोन सेवा अनुरोध: ${s.name}`;
    modalBody.innerHTML = `
      <form id="droneBookingForm">
        <div style="margin-bottom:12px;">
          <label style="font-size:13px;font-weight:600;">सेवा दर:</label>
          <div style="font-size:16px;font-weight:700;color:var(--primary-800);">₹${s.ratePerAcre} / एकड़</div>
        </div>

        <div style="margin-bottom:12px;">
          <label style="font-size:13px;font-weight:600;">खेत का क्षेत्रफल (एकड़ में / Field Size):</label>
          <input type="number" id="droneAcres" min="1" max="100" value="4" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:var(--radius-sm);margin-top:4px;" required>
        </div>

        <div style="margin-bottom:12px;">
          <label style="font-size:13px;font-weight:600;">खेत का स्थान / प्लॉट विवरण:</label>
          <input type="text" id="droneLocation" value="Plot 4B, ${profile.village}, ${profile.district}" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:var(--radius-sm);margin-top:4px;" required>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
          <div>
            <label style="font-size:13px;font-weight:600;">पसंदीदा तारीख:</label>
            <input type="date" id="droneDate" value="${new Date().toISOString().split('T')[0]}" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:var(--radius-sm);margin-top:4px;" required>
          </div>
          <div>
            <label style="font-size:13px;font-weight:600;">समय स्लॉट:</label>
            <select id="droneSlot" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:var(--radius-sm);margin-top:4px;">
              <option>प्रातः काल 06:30 - 09:00 AM (सर्वोत्तम)</option>
              <option>सायंकाल 04:00 - 06:30 PM</option>
            </select>
          </div>
        </div>

        <div style="background:var(--bg-main);padding:12px;border-radius:var(--radius-sm);margin-bottom:16px;font-size:13px;">
          <div style="display:flex;justify-content:space-between;">
            <span>कुल अनुमानित शुल्क:</span>
            <strong id="droneTotalDisplay" style="color:var(--primary-800);font-size:16px;">₹${s.ratePerAcre * 4}</strong>
          </div>
        </div>

        <button type="submit" class="btn btn-primary" style="width:100%;padding:12px;">ड्रोन सेवा बुक करें (Request Service)</button>
      </form>
    `;

    document.getElementById('droneAcres').addEventListener('input', (e) => {
      const acres = parseFloat(e.target.value) || 1;
      document.getElementById('droneTotalDisplay').textContent = `₹${acres * s.ratePerAcre}`;
    });

    document.getElementById('droneBookingForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const acres = parseFloat(document.getElementById('droneAcres').value) || 1;
      const loc = document.getElementById('droneLocation').value;
      const date = document.getElementById('droneDate').value;
      const slot = document.getElementById('droneSlot').value;

      const newReq = {
        id: `DRN-${Math.floor(100 + Math.random() * 900)}`,
        serviceName: s.name,
        acres,
        fieldLocation: loc,
        preferredDate: date,
        slot,
        status: 'Pilot Assigned',
        pilotName: 'Aakash Kumar (DGCA Pilot #AG-881)',
        costEstimate: acres * s.ratePerAcre,
        isDemo: true
      };

      state.addDroneRequest(newReq);
      modal.classList.remove('active');
      alert(`सफलता! ड्रोन सेवा अनुरोध #${newReq.id} दर्ज कर लिया गया है। पायलट आकाश कुमार जल्द संपर्क करेंगे।`);
      this.render();
    });

    modal.classList.add('active');
  }

  // ==========================================
  // GOVERNMENT SCHEMES VIEW
  // ==========================================
  getSchemesHTML(lang) {
    const filtered = GOVERNMENT_SCHEMES.filter(sc => {
      if (this.activeSchemeFilter === 'All') return true;
      return sc.type.toLowerCase().includes(this.activeSchemeFilter.toLowerCase());
    });

    return `
      <div class="section-title-row">
        <div>
          <h2><i class="fa-solid fa-landmark" style="color:var(--accent-amber);"></i> ${t('schemes_title', lang)}</h2>
          <p style="font-size:13px;color:var(--text-secondary);">${t('schemes_sub', lang)}</p>
        </div>
        <span class="badge badge-success">100% Official Verified Portals</span>
      </div>

      <div style="background:#fef2f2;border-left:4px solid #ef4444;padding:12px 16px;border-radius:var(--radius-sm);margin-bottom:20px;font-size:13px;color:#991b1b;">
        <i class="fa-solid fa-shield-halved"></i> <b>महत्वपूर्ण सुरक्षा सूचना:</b> ${t('schemes_disclaimer', lang)}
      </div>

      <!-- Filter tabs -->
      <div class="filter-tabs">
        ${SCHEME_CATEGORIES.map(cat => `
          <button class="filter-tab-btn ${this.activeSchemeFilter === cat ? 'active' : ''}" data-schemecat="${cat}">
            ${cat}
          </button>
        `).join('')}
      </div>

      <!-- Schemes Directory -->
      <div>
        ${filtered.map(sc => `
          <div class="scheme-card">
            <div class="scheme-header">
              <div>
                <span class="badge badge-info" style="margin-bottom:6px;">${sc.level} | ${sc.type}</span>
                <h3 style="font-size:18px;font-weight:700;color:var(--primary-900);">${sc.name}</h3>
                <span class="scheme-dept">${sc.department}</span>
              </div>
              <div style="text-align:right;">
                <span style="font-size:11.5px;color:var(--text-muted);display:block;">सत्यापित: ${sc.lastVerified}</span>
                <a href="${sc.officialUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm" style="margin-top:6px;">
                  <i class="fa-solid fa-arrow-up-right-from-square"></i> ${t('btn_applyScheme', lang)}
                </a>
              </div>
            </div>

            <p style="font-size:13.5px;color:var(--text-secondary);margin-bottom:12px;">${sc.summary}</p>

            <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:16px;background:var(--bg-main);padding:14px;border-radius:var(--radius-sm);">
              <div>
                <strong style="font-size:13px;color:var(--primary-800);"><i class="fa-solid fa-gift"></i> ${t('schemes_benefits', lang)}:</strong>
                <ul style="font-size:12.5px;padding-left:18px;margin-top:4px;color:var(--text-secondary);">
                  ${sc.benefits.map(b => `<li>${b}</li>`).join('')}
                </ul>
              </div>

              <div>
                <strong style="font-size:13px;color:var(--primary-800);"><i class="fa-solid fa-user-check"></i> ${t('schemes_eligibility', lang)}:</strong>
                <ul style="font-size:12.5px;padding-left:18px;margin-top:4px;color:var(--text-secondary);">
                  ${sc.eligibility.map(e => `<li>${e}</li>`).join('')}
                </ul>
              </div>

              <div>
                <strong style="font-size:13px;color:var(--primary-800);"><i class="fa-solid fa-file-lines"></i> ${t('schemes_docs', lang)}:</strong>
                <ul style="font-size:12.5px;padding-left:18px;margin-top:4px;color:var(--text-secondary);">
                  ${sc.documents.map(d => `<li>${d}</li>`).join('')}
                </ul>
              </div>
            </div>

            <div style="margin-top:12px;font-size:12px;color:var(--text-muted);background:#f1f5f9;padding:8px 12px;border-radius:4px;">
              <b>आवेदन प्रक्रिया (Process):</b> ${sc.process}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  bindSchemesEvents() {
    document.querySelectorAll('[data-schemecat]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.activeSchemeFilter = e.target.getAttribute('data-schemecat');
        this.render();
      });
    });
  }

  // ==========================================
  // CROP FARMING GUIDE VIEW (12 STEPS)
  // ==========================================
  getCropGuideHTML(lang) {
    const crop = CROP_DATABASE[this.selectedCropForGuide] || CROP_DATABASE.wheat;

    return `
      <div class="section-title-row">
        <div>
          <h2><i class="fa-solid fa-seedling" style="color:var(--primary-600);"></i> ${t('guide_title', lang)}</h2>
          <p style="font-size:13px;color:var(--text-secondary);">बुवाई से लेकर मंडी विक्रय तक 12-चरणीय वैज्ञानिक समयरेखा एवं कृषि परामर्श।</p>
        </div>
      </div>

      <!-- Crop Selector & Parameters -->
      <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:18px;margin-bottom:24px;display:flex;gap:14px;flex-wrap:wrap;align-items:center;">
        <div style="flex:1;min-width:200px;">
          <label style="font-size:12px;font-weight:600;color:var(--text-muted);">${t('guide_selectCrop', lang)}:</label>
          <select id="guideCropSelect" class="role-select" style="width:100%;margin-top:4px;padding:8px 12px;font-size:14px;">
            <option value="wheat" ${this.selectedCropForGuide === 'wheat' ? 'selected' : ''}>गेहूं (Wheat)</option>
            <option value="paddy" ${this.selectedCropForGuide === 'paddy' ? 'selected' : ''}>धान (Paddy / Rice)</option>
            <option value="mustard" ${this.selectedCropForGuide === 'mustard' ? 'selected' : ''}>सरसों (Mustard)</option>
          </select>
        </div>

        <div style="flex:1;min-width:180px;">
          <label style="font-size:12px;font-weight:600;color:var(--text-muted);">${t('guide_selectSoil', lang)}:</label>
          <input type="text" value="${crop.optimalSoil}" readonly style="width:100%;margin-top:4px;padding:8px 12px;font-size:13px;background:var(--bg-main);border:1px solid var(--border-color);border-radius:var(--radius-sm);">
        </div>

        <div style="flex:1;min-width:140px;">
          <label style="font-size:12px;font-weight:600;color:var(--text-muted);">फसल अवधि:</label>
          <input type="text" value="${crop.durationDays}" readonly style="width:100%;margin-top:4px;padding:8px 12px;font-size:13px;background:var(--bg-main);border:1px solid var(--border-color);border-radius:var(--radius-sm);">
        </div>

        <div style="flex:1;min-width:140px;">
          <label style="font-size:12px;font-weight:600;color:var(--text-muted);">सरकारी MSP दर:</label>
          <input type="text" value="${crop.mspCurrent}" readonly style="width:100%;margin-top:4px;padding:8px 12px;font-size:13px;background:#dcfce7;border:1px solid #86efac;border-radius:var(--radius-sm);font-weight:700;color:#14532d;">
        </div>
      </div>

      <!-- 12-Step Timeline -->
      <div class="timeline-stepper">
        ${crop.stages.map(st => `
          <div class="timeline-step-card">
            <div class="timeline-marker">${st.step}</div>
            <div class="timeline-header">
              <h4><i class="fa-solid ${st.icon}" style="margin-right:6px;color:var(--primary-600);"></i> Step ${st.step} — ${st.name}</h4>
              <span class="timeline-timing">${st.timing}</span>
            </div>
            <p style="font-size:13.5px;color:var(--text-secondary);margin-top:6px;">${st.action}</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  bindCropGuideEvents() {
    const sel = document.getElementById('guideCropSelect');
    if (sel) {
      sel.addEventListener('change', (e) => {
        this.selectedCropForGuide = e.target.value;
        this.render();
      });
    }
  }

  // ==========================================
  // BEGINNER FARMER GUIDELINES VIEW
  // ==========================================
  getBeginnerGuideHTML(lang) {
    return `
      <div class="section-title-row">
        <div>
          <h2><i class="fa-solid fa-book-open-reader" style="color:var(--primary-600);"></i> ${t('nav_beginnerGuide', lang)} (16 Core Modules)</h2>
          <p style="font-size:13px;color:var(--text-secondary);">नए किसानों के लिए मिट्टी जांच से लेकर फसल बिक्री और वित्तीय प्रबंधन तक की संपूर्ण मार्गदर्शिका।</p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:20px;">
        ${BEGINNER_GUIDES.map(g => `
          <div class="dash-panel" style="margin-bottom:0;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
              <div style="width:40px;height:40px;background:var(--primary-100);color:var(--primary-700);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;font-size:18px;">
                <i class="fa-solid ${g.icon}"></i>
              </div>
              <h3 style="font-size:16px;font-weight:700;">${g.title}</h3>
            </div>

            <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px;">${g.summary}</p>

            <strong style="font-size:12px;color:var(--primary-800);">महत्वपूर्ण चरण (Steps):</strong>
            <ul style="font-size:12.5px;padding-left:18px;margin:6px 0 12px;color:var(--text-secondary);">
              ${g.steps.map(s => `<li style="margin-bottom:4px;">${s}</li>`).join('')}
            </ul>

            <div style="background:var(--bg-main);border:1px solid var(--border-color);padding:8px 12px;border-radius:var(--radius-sm);font-size:11.5px;">
              <b>चेकलिस्ट:</b>
              ${g.checklist.map(c => `<div>✔ ${c}</div>`).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ==========================================
  // CROP CALENDAR VIEW
  // ==========================================
  getCropCalendarHTML(lang) {
    return `
      <div class="section-title-row">
        <div>
          <h2><i class="fa-solid fa-calendar-check" style="color:var(--primary-600);"></i> ${t('nav_calendar', lang)}</h2>
          <p style="font-size:13px;color:var(--text-secondary);">मासिक फसल चक्र, सिंचाई अनुसूची और उर्वरक टॉप-ड्रेसिंग समय सारणी।</p>
        </div>
      </div>

      <div class="dash-panel">
        <div style="overflow-x:auto;">
          <table class="admin-table">
            <thead>
              <tr>
                <th>महीना / Month</th>
                <th>मुख्य कार्य (Activity)</th>
                <th>फसलें (Crops)</th>
                <th>पोषण एवं सिंचाई अनुसूची</th>
                <th>सावधानी एवं कीट निगरानी</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><b>अक्टूबर (Oct)</b></td>
                <td>सरसों व चने की बुवाई, धान कटाई प्रारंभ</td>
                <td>सरसों, चना, आलू, धान</td>
                <td>सरसों में बेसल डीएपी + बेंटोनाइट सल्फर</td>
                <td>दीमक रोकथाम हेतु क्लोरपायरीफास उपचार</td>
              </tr>
              <tr>
                <td><b>नवंबर (Nov)</b></td>
                <td>गेहूं की मुख्य बुवाई, आलू रोपाई</td>
                <td>गेहूं (HD-2967, DBW-187), आलू</td>
                <td>गेहूं में बुवाई के समय 1 बोरी डीएपी/एकड़</td>
                <td>गुल्ली डंडा खरपतवार निगरानी</td>
              </tr>
              <tr>
                <td><b>दिसंबर (Dec)</b></td>
                <td>गेहूं में प्रथम सिंचाई (CRI Stage), यूरिया टॉप ड्रेसिंग</td>
                <td>गेहूं, सरसों</td>
                <td>21वें दिन ताज मूल सिंचाई + 35kg यूरिया</td>
                <td>सरसों में माहू (Aphid) कीट का प्रारंभिक निरीक्षण</td>
              </tr>
              <tr>
                <td><b>जनवरी (Jan)</b></td>
                <td>पाला से सुरक्षा, द्वितीय सिंचाई, नैनो यूरिया स्प्रे</td>
                <td>गेहूं, आलू, टमाटर</td>
                <td>नैनो यूरिया 4ml/L पानी का पर्णीय छिड़काव</td>
                <td>आलू में पछेती झुलसा (Late Blight) रोकथाम</td>
              </tr>
              <tr>
                <td><b>फरवरी (Feb)</b></td>
                <td>गेहूं में बालियां निकलना, सरसों कटाई</td>
                <td>गेहूं, सरसों, मक्का</td>
                <td>पोटाश व बोरोन का स्प्रे (0.5%) दानों की चमक हेतु</td>
                <td>पीला रतुआ (Yellow Rust) की निगरानी</td>
              </tr>
              <tr>
                <td><b>मार्च - अप्रैल (Mar-Apr)</b></td>
                <td>गेहूं कटाई, जायद मूंग बुवाई, मंडी स्लॉट बुकिंग</td>
                <td>गेहूं, मूंग, ग्रीष्मकालीन सब्जियां</td>
                <td>कटाई से 12 दिन पहले अंतिम सिंचाई रोकें</td>
                <td>मंडी-X पर स्लॉट बुक कर टोकन प्राप्त करें</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // ==========================================
  // SMART PROCUREMENT QUEUE & SLOT VIEW (SIH CORE)
  // ==========================================
  getQueueHTML(lang) {
    const activeToken = state.getActiveToken();
    const profile = state.getProfile();

    return `
      <div class="section-title-row">
        <div>
          <h2><i class="fa-solid fa-users-line" style="color:var(--primary-600);"></i> ${t('queue_title', lang)}</h2>
          <p style="font-size:13px;color:var(--text-secondary);">${t('queue_sub', lang)}</p>
        </div>
        <span class="badge badge-success">SIH 2026 Procurement Engine</span>
      </div>

      <!-- Live Active Token Widget -->
      ${activeToken ? `
        <div class="mandi-token-display">
          <div style="font-size:14px;text-transform:uppercase;letter-spacing:1px;opacity:0.9;">डिजिटल खरीद टोकन (Live Procurement Token)</div>
          <div class="token-big-badge">${activeToken.tokenNumber}</div>
          <div style="font-size:18px;font-weight:600;">${activeToken.centerName}</div>
          <div style="font-size:14px;opacity:0.9;margin-top:4px;">किसान: ${activeToken.farmerName} (${activeToken.farmerId}) | फसल: ${activeToken.crop} (${activeToken.quantityQtl} क्विंटल)</div>

          <div style="display:flex;justify-content:center;gap:24px;margin-top:16px;flex-wrap:wrap;">
            <div style="background:rgba(255,255,255,0.15);padding:10px 18px;border-radius:var(--radius-sm);">
              <span style="font-size:12px;opacity:0.85;">वर्तमान सेवा टोकन:</span>
              <div style="font-size:22px;font-weight:800;">${activeToken.currentServing}</div>
            </div>
            <div style="background:rgba(255,255,255,0.15);padding:10px 18px;border-radius:var(--radius-sm);">
              <span style="font-size:12px;opacity:0.85;">अनुमानित प्रतीक्षा:</span>
              <div style="font-size:22px;font-weight:800;">~${activeToken.estimatedWaitMin} मिनट</div>
            </div>
            <div style="background:rgba(255,255,255,0.15);padding:10px 18px;border-radius:var(--radius-sm);">
              <span style="font-size:12px;opacity:0.85;">निर्धारित काउंटर:</span>
              <div style="font-size:22px;font-weight:800;">${activeToken.counterNo}</div>
            </div>
            <div style="background:rgba(255,255,255,0.15);padding:10px 18px;border-radius:var(--radius-sm);">
              <span style="font-size:12px;opacity:0.85;">तय समय विंडो:</span>
              <div style="font-size:16px;font-weight:700;margin-top:4px;">${activeToken.slotTime}</div>
            </div>
          </div>
        </div>

        <!-- 6-Stage Physical Procurement Progress -->
        <div class="dash-panel">
          <h3 style="margin-bottom:14px;"><i class="fa-solid fa-list-check" style="color:var(--primary-600);"></i> उपार्जन केंद्र चरणबद्ध स्थिति (Physical Mandi Process)</h3>
          <div class="queue-flow-progress">
            <div class="queue-stage-box current">1. गेट एंट्री व टोकन स्कैन</div>
            <div class="queue-stage-box">2. प्रथम तौल (वे-ब्रिज इन)</div>
            <div class="queue-stage-box">3. गुणवत्ता जांच (FAQ Assaying)</div>
            <div class="queue-stage-box">4. अनलोडिंग व बोरियों में भराई</div>
            <div class="queue-stage-box">5. अंतिम तौल (वे-ब्रिज आउट)</div>
            <div class="queue-stage-box">6. PFMS द्वारा सीधा भुगतान</div>
          </div>

          <div style="background:var(--bg-main);border:1px solid var(--border-color);padding:14px;border-radius:var(--radius-sm);margin-top:14px;">
            <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;">
              <div>
                <strong>भुगतान स्थिति (Payment Status):</strong> ${activeToken.paymentStatus}
                <div style="font-size:12px;color:var(--text-muted);">सरकारी MSP दर: ₹${activeToken.mspPerQtl}/क्विंटल | अनुमानित राशि: ₹${activeToken.totalExpectedAmt.toLocaleString('en-IN')}</div>
              </div>
              <button class="btn btn-secondary btn-sm" onclick="alert('SMS सूचना दोबारा भेजी गई है: Token #TK-142 Chakia Mandi Counter 3')">
                <i class="fa-solid fa-comment-sms"></i> SMS पुनः भेजें
              </button>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Slot Booking Form (Enhanced from bookSlot.html) -->
      <div class="dash-panel">
        <h3 style="margin-bottom:14px;"><i class="fa-solid fa-calendar-plus" style="color:var(--primary-600);"></i> नया उपार्जन स्लॉट बुक करें (Book Procurement Slot)</h3>
        
        <form id="mandiSlotForm" style="display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:16px;">
          <div>
            <label style="font-size:13px;font-weight:600;">किसान का पूरा नाम:</label>
            <input type="text" id="slotFarmerName" value="${profile.name}" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:var(--radius-sm);margin-top:4px;" required>
          </div>

          <div>
            <label style="font-size:13px;font-weight:600;">किसान आईडी / आधार:</label>
            <input type="text" id="slotFarmerId" value="${profile.aadhaarId}" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:var(--radius-sm);margin-top:4px;" required>
          </div>

          <div>
            <label style="font-size:13px;font-weight:600;">राज्य (State):</label>
            <select id="slotState" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:var(--radius-sm);margin-top:4px;">
              <option value="Bihar">Bihar (बिहार)</option>
              <option value="Punjab">Punjab (पंजाब)</option>
              <option value="Haryana">Haryana (हरियाणा)</option>
              <option value="Maharashtra">Maharashtra (महाराष्ट्र)</option>
            </select>
          </div>

          <div>
            <label style="font-size:13px;font-weight:600;">जिला (District):</label>
            <select id="slotDistrict" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:var(--radius-sm);margin-top:4px;">
              <option value="East Champaran">East Champaran</option>
              <option value="West Champaran">West Champaran</option>
              <option value="Muzaffarpur">Muzaffarpur</option>
              <option value="Samastipur">Samastipur</option>
              <option value="Saran">Saran</option>
              <option value="Patna">Patna</option>
            </select>
          </div>

          <div>
            <label style="font-size:13px;font-weight:600;">प्रखंड / ब्लॉक (Block):</label>
            <select id="slotBlock" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:var(--radius-sm);margin-top:4px;">
              <option value="Chakia">Chakia</option>
              <option value="Shahebganj">Shahebganj</option>
              <option value="Kalyanpur">Kalyanpur</option>
              <option value="Pipra">Pipra</option>
              <option value="Mehsi">Mehsi</option>
            </select>
          </div>

          <div>
            <label style="font-size:13px;font-weight:600;">उपज / फसल (Crop):</label>
            <select id="slotCrop" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:var(--radius-sm);margin-top:4px;">
              <option value="Wheat">गेहूं (Wheat Grade-A @ ₹2275/Qtl)</option>
              <option value="Paddy (Grade A)">धान (Paddy Grade-A @ ₹2203/Qtl)</option>
              <option value="Mustard">सरसों (Mustard @ ₹5650/Qtl)</option>
              <option value="Maize">मक्का (Maize @ ₹2090/Qtl)</option>
            </select>
          </div>

          <div>
            <label style="font-size:13px;font-weight:600;">अनुमानित मात्रा (क्विंटल में):</label>
            <input type="number" id="slotQty" min="1" max="500" value="40" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:var(--radius-sm);margin-top:4px;" required>
          </div>

          <div>
            <label style="font-size:13px;font-weight:600;">पसंदीदा तिथि:</label>
            <input type="date" id="slotDate" value="${new Date().toISOString().split('T')[0]}" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:var(--radius-sm);margin-top:4px;" required>
          </div>

          <div style="grid-column: 1 / -1;">
            <button type="submit" class="btn btn-primary" style="padding:12px 24px;font-size:15px;">
              <i class="fa-solid fa-ticket"></i> डिजिटल टोकन प्राप्त करें (Get Token)
            </button>
            <span style="font-size:12px;color:var(--text-muted);margin-left:12px;">आपको तत्काल SMS और ऐप नोटिफिकेशन प्राप्त होगा।</span>
          </div>
        </form>
      </div>
    `;
  }

  bindQueueEvents() {
    const stateSel = document.getElementById('slotState');
    const distSel = document.getElementById('slotDistrict');
    const blockSel = document.getElementById('slotBlock');

    if (stateSel && distSel && blockSel) {
      stateSel.addEventListener('change', () => {
        const stateName = stateSel.value;
        const dists = DISTRICT_BLOCK_DATA[stateName] || {};
        distSel.innerHTML = '';
        Object.keys(dists).forEach(d => {
          const opt = document.createElement('option');
          opt.value = d;
          opt.textContent = d;
          distSel.appendChild(opt);
        });
        distSel.dispatchEvent(new Event('change'));
      });

      distSel.addEventListener('change', () => {
        const stateName = stateSel.value;
        const d = distSel.value;
        const blocks = (DISTRICT_BLOCK_DATA[stateName] && DISTRICT_BLOCK_DATA[stateName][d]) || ['Center #1', 'Center #2'];
        blockSel.innerHTML = '';
        blocks.forEach(b => {
          const opt = document.createElement('option');
          opt.value = b;
          opt.textContent = b;
          blockSel.appendChild(opt);
        });
      });
    }

    const form = document.getElementById('mandiSlotForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('slotFarmerName').value;
        const id = document.getElementById('slotFarmerId').value;
        const st = document.getElementById('slotState').value;
        const dist = document.getElementById('slotDistrict').value;
        const block = document.getElementById('slotBlock').value;
        const crop = document.getElementById('slotCrop').value;
        const qty = document.getElementById('slotQty').value;
        const date = document.getElementById('slotDate').value;

        const token = generateToken(name, id, st, dist, block, crop, qty, date, '10:30 AM - 11:30 AM');
        alert(`बधाई! आपका टोकन ${token.tokenNumber} जारी हो गया है। SMS आपके मोबाइल पर भेजा गया है।`);
        this.render();
      });
    }
  }

  // ==========================================
  // MAP VIEW
  // ==========================================
  getMapHTML(lang) {
    return `
      <div class="section-title-row">
        <div>
          <h2><i class="fa-solid fa-map-location-dot" style="color:var(--primary-600);"></i> ${t('nav_map', lang)}</h2>
          <p style="font-size:13px;color:var(--text-secondary);">निकटतम मंडी, उर्वरक केंद्र, कृषि यंत्र हब एवं मौसम केंद्रों का इंटरैक्टिव मानचित्र।</p>
        </div>
        <span class="badge badge-success">OpenStreetMap GIS</span>
      </div>

      <div class="dash-panel" style="padding:16px;">
        <div id="mapContainer"></div>

        <div style="display:flex;gap:18px;margin-top:14px;flex-wrap:wrap;font-size:13px;">
          <div><i class="fa-solid fa-house" style="color:#15803d;"></i> आपका कृषि क्षेत्र (Village Centroid)</div>
          <div><i class="fa-solid fa-building-columns" style="color:#0284c7;"></i> मंडी खरीद केंद्र</div>
          <div><i class="fa-solid fa-truck-fast" style="color:#d97706;"></i> उर्वरक केंद्र (IFFCO)</div>
          <div><i class="fa-solid fa-tractor" style="color:#7c3aed;"></i> कृषि यंत्र केंद्र (CHC)</div>
          <div><i class="fa-solid fa-helicopter" style="color:#059669;"></i> ड्रोन सेवा हब</div>
        </div>
      </div>
    `;
  }

  // ==========================================
  // CUSTOMER SUPPORT VIEW
  // ==========================================
  getSupportHTML(lang) {
    const tickets = state.getTickets();

    return `
      <div class="section-title-row">
        <div>
          <h2><i class="fa-solid fa-headset" style="color:var(--primary-600);"></i> ${t('support_title', lang)}</h2>
          <p style="font-size:13px;color:var(--text-secondary);">लाइव चैट, टिकट प्रबंधन एवं अक्सर पूछे जाने वाले कृषि प्रश्न।</p>
        </div>
        <span class="badge badge-info">24x7 Help Desk</span>
      </div>

      <!-- Live Chat & Helpline Cards -->
      <div class="dashboard-columns">
        <div>
          <div class="chat-window">
            <div style="padding:12px 16px;background:var(--primary-700);color:#fff;font-weight:600;font-size:14px;border-top-left-radius:var(--radius-md);border-top-right-radius:var(--radius-md);display:flex;align-items:center;gap:8px;">
              <i class="fa-solid fa-robot"></i> ${t('support_chatTitle', lang)}
            </div>
            <div class="chat-messages" id="chatMessages">
              <div class="chat-bubble bot">
                नमस्ते किसान भाई! मैं आपका डिजिटल सहायक हूँ। टोकन स्थिति, खाद डिलीवरी, उपकरण किराया या योजना संबंधी कोई भी प्रश्न पूछें।
              </div>
            </div>
            <form class="chat-input-row" id="chatForm">
              <input type="text" id="chatInput" placeholder="अपना प्रश्न यहाँ टाइप करें..." required autocomplete="off">
              <button type="submit" class="btn btn-primary btn-sm"><i class="fa-solid fa-paper-plane"></i></button>
            </form>
          </div>
        </div>

        <div>
          <div class="dash-panel">
            <h3 style="margin-bottom:12px;"><i class="fa-solid fa-phone" style="color:var(--primary-600);"></i> संपर्क एवं हेल्पलाइन</h3>
            <div style="font-size:13px;line-height:1.8;">
              <div>📞 <b>किसान कॉल सेंटर:</b> <a href="tel:18001801551" style="color:var(--primary-700);font-weight:700;">1800-180-1551</a> (टोल-फ्री)</div>
              <div>🌾 <b>मंडी उपार्जन सहायता:</b> 1800-345-6789</div>
              <div>💬 <b>व्हाट्सएप कृषि डेस्क:</b> +91 94312 88411</div>
              <div>✉️ <b>ईमेल:</b> support@mandix-agri.gov.in</div>
            </div>

            <div style="margin-top:16px;background:var(--primary-50);border:1px solid var(--primary-200);padding:10px;border-radius:var(--radius-sm);font-size:12px;color:var(--primary-900);">
              <b>समय:</b> सुबह 06:00 बजे से रात्रि 10:00 बजे तक। सभी 13 भारतीय भाषाओं में सहायता।
            </div>
          </div>

          <div class="dash-panel">
            <h3 style="margin-bottom:10px;"><i class="fa-solid fa-ticket" style="color:var(--accent-amber);"></i> नई सहायता टिकट दर्ज करें</h3>
            <button class="btn btn-secondary btn-sm" style="width:100%;" onclick="window.mandixApp.openTicketModal()">
              + टिकट बनाएं (Create Support Ticket)
            </button>
          </div>
        </div>
      </div>

      <!-- Support Tickets Kanban / Tracker -->
      <div class="dash-panel">
        <h3 style="margin-bottom:16px;"><i class="fa-solid fa-folder-open" style="color:var(--primary-600);"></i> आपकी सहायता टिकटें (Track Tickets)</h3>
        
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(280px, 1fr));gap:16px;">
          <!-- Open Tickets -->
          <div style="background:var(--bg-main);padding:14px;border-radius:var(--radius-sm);border:1px solid var(--border-color);">
            <h4 style="font-size:14px;font-weight:700;color:#15803d;margin-bottom:10px;">🟢 ओपन टिकट (Open)</h4>
            ${tickets.filter(t => t.status === 'Open').map(t => `
              <div style="background:#fff;padding:10px;border-radius:4px;border:1px solid var(--border-color);margin-bottom:8px;font-size:12.5px;">
                <strong>${t.id}: ${t.subject}</strong>
                <div style="color:var(--text-muted);font-size:11.5px;">${t.category} | ${t.createdAt}</div>
              </div>
            `).join('') || '<p style="font-size:12px;color:var(--text-muted);">कोई ओपन टिकट नहीं</p>'}
          </div>

          <!-- In Progress -->
          <div style="background:var(--bg-main);padding:14px;border-radius:var(--radius-sm);border:1px solid var(--border-color);">
            <h4 style="font-size:14px;font-weight:700;color:#ca8a04;margin-bottom:10px;">🟡 प्रगति पर (In Progress)</h4>
            ${tickets.filter(t => t.status === 'In Progress').map(t => `
              <div style="background:#fff;padding:10px;border-radius:4px;border:1px solid var(--border-color);margin-bottom:8px;font-size:12.5px;">
                <strong>${t.id}: ${t.subject}</strong>
                <div style="color:var(--text-muted);font-size:11.5px;">${t.category} | ${t.createdAt}</div>
              </div>
            `).join('') || '<p style="font-size:12px;color:var(--text-muted);">कोई टिकट नहीं</p>'}
          </div>

          <!-- Resolved -->
          <div style="background:var(--bg-main);padding:14px;border-radius:var(--radius-sm);border:1px solid var(--border-color);">
            <h4 style="font-size:14px;font-weight:700;color:#0284c7;margin-bottom:10px;">🔵 हल हो चुकी (Resolved)</h4>
            ${tickets.filter(t => t.status === 'Resolved').map(t => `
              <div style="background:#fff;padding:10px;border-radius:4px;border:1px solid var(--border-color);margin-bottom:8px;font-size:12.5px;">
                <strong>${t.id}: ${t.subject}</strong>
                <div style="color:var(--text-muted);font-size:11.5px;">${t.category} | ${t.createdAt}</div>
              </div>
            `).join('') || '<p style="font-size:12px;color:var(--text-muted);">कोई टिकट नहीं</p>'}
          </div>
        </div>
      </div>

      <!-- FAQ Section -->
      <div class="dash-panel">
        <h3 style="margin-bottom:14px;"><i class="fa-solid fa-circle-question" style="color:var(--primary-600);"></i> अक्सर पूछे जाने वाले प्रश्न (FAQ)</h3>
        ${FAQS.map(faq => `
          <div style="border-bottom:1px solid var(--border-color);padding:12px 0;">
            <strong style="font-size:14px;color:var(--primary-900);display:block;margin-bottom:4px;">Q: ${faq.question}</strong>
            <p style="font-size:13px;color:var(--text-secondary);">${faq.answer}</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  bindSupportEvents() {
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const chatMessages = document.getElementById('chatMessages');

    if (chatForm && chatInput && chatMessages) {
      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const userText = chatInput.value.trim();
        if (!userText) return;

        // Append user bubble
        const userBubble = document.createElement('div');
        userBubble.className = 'chat-bubble user';
        userBubble.textContent = userText;
        chatMessages.appendChild(userBubble);
        chatInput.value = '';

        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Bot response
        setTimeout(() => {
          const reply = getBotReply(userText);
          const botBubble = document.createElement('div');
          botBubble.className = 'chat-bubble bot';
          botBubble.textContent = reply;
          chatMessages.appendChild(botBubble);
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 500);
      });
    }
  }

  openTicketModal() {
    const modal = document.getElementById('genericModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.textContent = 'नई सहायता टिकट दर्ज करें';
    modalBody.innerHTML = `
      <form id="newTicketForm">
        <div style="margin-bottom:12px;">
          <label style="font-size:13px;font-weight:600;">विषय (Subject):</label>
          <input type="text" id="tckSubject" placeholder="उदा. टोकन समय में बदलाव / यूरिया डिलीवरी देरी" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:var(--radius-sm);margin-top:4px;" required>
        </div>

        <div style="margin-bottom:12px;">
          <label style="font-size:13px;font-weight:600;">सहायता श्रेणी (Category):</label>
          <select id="tckCat" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:var(--radius-sm);margin-top:4px;">
            <option>Mandi Queue / Procurement</option>
            <option>Fertilizer Delivery</option>
            <option>Equipment Rental</option>
            <option>Drone Services</option>
            <option>Government Schemes</option>
            <option>Payment / MSP</option>
          </select>
        </div>

        <div style="margin-bottom:12px;">
          <label style="font-size:13px;font-weight:600;">प्राथमिकता (Urgency):</label>
          <select id="tckUrgency" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:var(--radius-sm);margin-top:4px;">
            <option>सामान्य (Normal)</option>
            <option>मध्यम (Medium)</option>
            <option>अत्यंत आवश्यक (Urgent)</option>
          </select>
        </div>

        <div style="margin-bottom:16px;">
          <label style="font-size:13px;font-weight:600;">विवरण (Description):</label>
          <textarea id="tckDesc" rows="3" placeholder="कृपया अपनी समस्या विस्तार से लिखें..." style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:var(--radius-sm);margin-top:4px;" required></textarea>
        </div>

        <button type="submit" class="btn btn-primary" style="width:100%;padding:12px;">टिकट जमा करें (Submit Ticket)</button>
      </form>
    `;

    document.getElementById('newTicketForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const sub = document.getElementById('tckSubject').value;
      const cat = document.getElementById('tckCat').value;
      const urg = document.getElementById('tckUrgency').value;
      const desc = document.getElementById('tckDesc').value;

      const tck = createTicket(sub, cat, urg, desc);
      modal.classList.remove('active');
      alert(`सहायता टिकट #${tck.id} दर्ज कर लिया गया है।`);
      this.render();
    });

    modal.classList.add('active');
  }

  // ==========================================
  // FARMER PROFILE VIEW
  // ==========================================
  getProfileHTML(lang) {
    const p = state.getProfile();

    return `
      <div class="section-title-row">
        <div>
          <h2><i class="fa-solid fa-user-gear" style="color:var(--primary-600);"></i> ${t('nav_profile', lang)}</h2>
          <p style="font-size:13px;color:var(--text-secondary);">अपनी व्यक्तिगत, कृषि भूमि एवं वरीयता संबंधी जानकारी प्रबंधित करें।</p>
        </div>
      </div>

      <div class="dash-panel" style="max-width:800px;">
        <form id="profileForm" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div style="grid-column: 1 / -1;display:flex;align-items:center;gap:16px;margin-bottom:10px;">
            <div style="width:64px;height:64px;border-radius:50%;background:#16a34a;color:#fff;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:bold;">
              ${p.name.charAt(0)}
            </div>
            <div>
              <h3 style="font-size:18px;font-weight:700;">${p.name}</h3>
              <span class="badge badge-success">सत्यापित किसान खाता (Verified)</span>
            </div>
          </div>

          <div>
            <label style="font-size:13px;font-weight:600;">पूरा नाम:</label>
            <input type="text" id="profName" value="${p.name}" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:var(--radius-sm);margin-top:4px;" required>
          </div>

          <div>
            <label style="font-size:13px;font-weight:600;">मोबाइल नंबर:</label>
            <input type="text" id="profPhone" value="${p.phone}" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:var(--radius-sm);margin-top:4px;" required>
          </div>

          <div>
            <label style="font-size:13px;font-weight:600;">किसान / आधार आईडी:</label>
            <input type="text" id="profAadhaar" value="${p.aadhaarId}" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:var(--radius-sm);margin-top:4px;" required>
          </div>

          <div>
            <label style="font-size:13px;font-weight:600;">गांव / नगर (Village):</label>
            <input type="text" id="profVillage" value="${p.village}" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:var(--radius-sm);margin-top:4px;" required>
          </div>

          <div>
            <label style="font-size:13px;font-weight:600;">जिला (District):</label>
            <input type="text" id="profDistrict" value="${p.district}" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:var(--radius-sm);margin-top:4px;" required>
          </div>

          <div>
            <label style="font-size:13px;font-weight:600;">राज्य (State):</label>
            <input type="text" id="profState" value="${p.state}" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:var(--radius-sm);margin-top:4px;" required>
          </div>

          <div>
            <label style="font-size:13px;font-weight:600;">खेत का आकार (Farm Size):</label>
            <input type="text" id="profSize" value="${p.farmSize}" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:var(--radius-sm);margin-top:4px;" required>
          </div>

          <div>
            <label style="font-size:13px;font-weight:600;">मिट्टी का प्रकार (Soil Type):</label>
            <input type="text" id="profSoil" value="${p.soilType}" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:var(--radius-sm);margin-top:4px;" required>
          </div>

          <div style="grid-column: 1 / -1;">
            <label style="font-size:13px;font-weight:600;">मुख्य उगाई जाने वाली फसलें:</label>
            <input type="text" id="profCrop" value="${p.primaryCrop}" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:var(--radius-sm);margin-top:4px;" required>
          </div>

          <div style="grid-column: 1 / -1;margin-top:10px;">
            <button type="submit" class="btn btn-primary" style="padding:12px 24px;">जानकारी सहेजें (Save Changes)</button>
          </div>
        </form>
      </div>
    `;
  }

  bindProfileEvents() {
    const form = document.getElementById('profileForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        state.updateProfile({
          name: document.getElementById('profName').value,
          phone: document.getElementById('profPhone').value,
          aadhaarId: document.getElementById('profAadhaar').value,
          village: document.getElementById('profVillage').value,
          district: document.getElementById('profDistrict').value,
          state: document.getElementById('profState').value,
          farmSize: document.getElementById('profSize').value,
          soilType: document.getElementById('profSoil').value,
          primaryCrop: document.getElementById('profCrop').value
        });
        alert('प्रोफाइल विवरण सफलतापूर्वक अपडेट हो गया!');
        this.render();
      });
    }
  }

  // ==========================================
  // ADMIN DASHBOARD VIEW
  // ==========================================
  getAdminHTML(lang) {
    const orders = state.getOrders();
    const tickets = state.getTickets();

    return `
      <div class="section-title-row">
        <div>
          <h2><i class="fa-solid fa-gauge-high" style="color:var(--primary-700);"></i> ${t('admin_title', lang)}</h2>
          <p style="font-size:13px;color:var(--text-secondary);">प्लेटफॉर्म सांख्यिकी, उर्वरक आदेश प्रबंधन, एवं किसान पंजीयन रिकॉर्ड।</p>
        </div>
        <span class="badge badge-purple">Admin Mode Active</span>
      </div>

      <!-- Admin Stat KPI Grid -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon-box kpi-icon-token"><i class="fa-solid fa-users"></i></div>
          <div class="kpi-body">
            <h5>कुल पंजीकृत किसान</h5>
            <h3>${ADMIN_STATS.totalFarmers.toLocaleString('en-IN')}</h3>
            <p>सत्यापित आधार एवं खतियान</p>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-box kpi-icon-fert"><i class="fa-solid fa-truck-fast"></i></div>
          <div class="kpi-body">
            <h5>खाद बैग आपूर्ति</h5>
            <h3>${ADMIN_STATS.fertilizerBagsDelivered.toLocaleString('en-IN')}</h3>
            <p>डोरस्टेप डिलीवरी पूरी</p>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-box kpi-icon-rent"><i class="fa-solid fa-tractor"></i></div>
          <div class="kpi-body">
            <h5>यंत्र बुकिंग्स</h5>
            <h3>${ADMIN_STATS.machineryBookingsMonth}</h3>
            <p>सीएचसी द्वारा इस माह</p>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon-box kpi-icon-weather"><i class="fa-solid fa-helicopter"></i></div>
          <div class="kpi-body">
            <h5>ड्रोन छिड़काव क्षेत्र</h5>
            <h3>${ADMIN_STATS.droneAcresSprayed} एकड़</h3>
            <p>DGCA प्रमाणित मिशन</p>
          </div>
        </div>
      </div>

      <!-- Fertilizer Order Status Updater Table -->
      <div class="dash-panel">
        <h3 style="margin-bottom:14px;"><i class="fa-solid fa-boxes-packing" style="color:var(--primary-600);"></i> उर्वरक आदेश प्रबंधन (Update Delivery Status)</h3>
        <div class="admin-table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>ऑर्डर ID</th>
                <th>उत्पाद का नाम</th>
                <th>मात्रा</th>
                <th>कुल राशि</th>
                <th>डिलीवरी पता</th>
                <th>वर्तमान स्थिति</th>
                <th>क्रिया (Action)</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map(o => `
                <tr>
                  <td><b>#${o.id}</b></td>
                  <td>${o.productName}</td>
                  <td>${o.quantity} बैग</td>
                  <td>₹${o.totalPrice.toFixed(2)}</td>
                  <td>${o.address.substring(0, 30)}...</td>
                  <td><span class="badge ${o.status === 'Delivered' ? 'badge-success' : 'badge-warning'}">${o.status}</span></td>
                  <td>
                    <select onchange="window.mandixApp.onAdminUpdateOrder('${o.id}', this.value)" class="role-select" style="font-size:12px;">
                      <option value="Ordered" ${o.status === 'Ordered' ? 'selected' : ''}>Ordered</option>
                      <option value="Confirmed" ${o.status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                      <option value="Dispatched" ${o.status === 'Dispatched' ? 'selected' : ''}>Dispatched</option>
                      <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                    </select>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Support Tickets Admin Resolution -->
      <div class="dash-panel">
        <h3 style="margin-bottom:14px;"><i class="fa-solid fa-headset" style="color:var(--accent-amber);"></i> सहायता टिकट समाधान (Ticket Management)</h3>
        <div class="admin-table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>टिकट ID</th>
                <th>विषय</th>
                <th>श्रेणी</th>
                <th>स्थिति</th>
                <th>स्थिति बदलें</th>
              </tr>
            </thead>
            <tbody>
              ${tickets.map(t => `
                <tr>
                  <td><b>#${t.id}</b></td>
                  <td>${t.subject}</td>
                  <td>${t.category}</td>
                  <td><span class="badge ${t.status === 'Resolved' ? 'badge-success' : (t.status === 'In Progress' ? 'badge-warning' : 'badge-danger')}">${t.status}</span></td>
                  <td>
                    <select onchange="window.mandixApp.onAdminUpdateTicket('${t.id}', this.value)" class="role-select" style="font-size:12px;">
                      <option value="Open" ${t.status === 'Open' ? 'selected' : ''}>Open</option>
                      <option value="In Progress" ${t.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                      <option value="Resolved" ${t.status === 'Resolved' ? 'selected' : ''}>Resolved</option>
                    </select>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Registered Farmers Sample -->
      <div class="dash-panel">
        <h3 style="margin-bottom:14px;"><i class="fa-solid fa-id-card" style="color:var(--primary-600);"></i> पंजीकृत किसान सूची (Registered Farmers)</h3>
        <div class="admin-table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>किसान आईडी</th>
                <th>नाम</th>
                <th>स्थान</th>
                <th>मोबाइल</th>
                <th>भूमि रकबा</th>
                <th>स्थिति</th>
              </tr>
            </thead>
            <tbody>
              ${MOCK_FARMERS_LIST.map(f => `
                <tr>
                  <td><b>${f.id}</b></td>
                  <td>${f.name}</td>
                  <td>${f.village}</td>
                  <td>${f.phone}</td>
                  <td>${f.land}</td>
                  <td><span class="badge badge-success">${f.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  bindAdminEvents() {}

  onAdminUpdateOrder(orderId, status) {
    updateOrderStatus(orderId, status);
    alert(`ऑर्डर #${orderId} की स्थिति बदलकर "${status}" कर दी गई है। किसान को सूचना भेजी गई।`);
    this.render();
  }

  onAdminUpdateTicket(ticketId, status) {
    updateTicketStatus(ticketId, status);
    alert(`टिकट #${ticketId} की स्थिति "${status}" अपडेट कर दी गई है।`);
    this.render();
  }

  // ==========================================
  // VOICE ASSISTANT MODAL & LOGIC
  // ==========================================
  setupVoiceAssistant() {
    const floatingBtn = document.getElementById('floatingVoiceBtn');
    if (floatingBtn) {
      floatingBtn.addEventListener('click', () => this.openVoiceModal());
    }

    this.voiceAssistant.onTranscriptCallback = (transcript) => {
      this.handleVoiceTranscript(transcript);
    };

    this.voiceAssistant.onStateChangeCallback = (isListening) => {
      const micBtn = document.getElementById('voiceMicBig');
      const statusText = document.getElementById('voiceStatusText');
      const floatingBtn = document.getElementById('floatingVoiceBtn');

      if (micBtn) {
        if (isListening) {
          micBtn.classList.add('active');
        } else {
          micBtn.classList.remove('active');
        }
      }

      if (floatingBtn) {
        if (isListening) {
          floatingBtn.classList.add('pulsing');
        } else {
          floatingBtn.classList.remove('pulsing');
        }
      }

      if (statusText) {
        statusText.textContent = isListening
          ? 'सुन रहे हैं... कृपया अपना प्रश्न बोलें... (Listening...)'
          : 'माइक बटन दबाएं और बोलें... (Tap to speak)';
      }
    };
  }

  openVoiceModal() {
    const modal = document.getElementById('genericModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.innerHTML = '<i class="fa-solid fa-microphone-lines" style="color:var(--primary-600);"></i> किसान वाणी (AI Voice Assistant)';
    modalBody.innerHTML = `
      <div class="voice-dialog-content">
        <button id="voiceMicBig" class="voice-mic-big" title="बोलने के लिए दबाएं">
          <i class="fa-solid fa-microphone"></i>
        </button>

        <div id="voiceStatusText" style="font-size:14px;font-weight:600;color:var(--text-secondary);margin-bottom:12px;">
          माइक बटन दबाएं और बोलें... (Tap microphone to speak)
        </div>

        <div class="voice-transcript-box" id="voiceTranscriptBox">
          « बोलें, जैसे: "गेहूं में पत्तियां पीली हो रही हैं" या "कल बारिश होगी क्या?" »
        </div>

        <div id="voiceResponseContainer" style="display:none;text-align:left;background:#f0fdf4;border:1px solid #86efac;border-radius:var(--radius-md);padding:16px;margin:16px 0;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <strong id="voiceRespTitle" style="color:#14532d;font-size:15px;"></strong>
            <button id="btnReplayVoice" class="btn btn-secondary btn-sm"><i class="fa-solid fa-volume-high"></i> दोबारा सुनें</button>
          </div>
          <div id="voiceRespSteps" style="font-size:13px;color:#166534;line-height:1.6;"></div>
          <div id="voiceRespDisclaimer" style="font-size:11px;color:#64748b;margin-top:8px;"></div>
        </div>

        <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-top:14px;">या इन प्रश्नों पर सीधे क्लिक करें (Sample Questions):</div>
        <div class="sample-queries">
          <span class="chip-query" onclick="window.mandixApp.handleVoiceTranscript('मेरे गेहूं की फसल में पत्तियां पीली हो रही हैं, क्या करूं?')">
            🌾 "गेहूं में पत्तियां पीली हो रही हैं"
          </span>
          <span class="chip-query" onclick="window.mandixApp.handleVoiceTranscript('कल मेरे गांव में बारिश होगी क्या?')">
            🌧️ "कल बारिश होगी क्या?"
          </span>
          <span class="chip-query" onclick="window.mandixApp.handleVoiceTranscript('मेरे पास ट्रैक्टर नहीं है, किराए पर कैसे मिलेगा?')">
            🚜 "ट्रैक्टर किराए पर कैसे मिलेगा?"
          </span>
          <span class="chip-query" onclick="window.mandixApp.handleVoiceTranscript('यूरिया खाद कैसे ऑर्डर करें?')">
            🧪 "यूरिया खाद कैसे ऑर्डर करें?"
          </span>
          <span class="chip-query" onclick="window.mandixApp.handleVoiceTranscript('पीएम किसान सम्मान निधि का पैसा कब आएगा?')">
            🏛️ "पीएम किसान सम्मान निधि"
          </span>
        </div>
      </div>
    `;

    const micBtn = document.getElementById('voiceMicBig');
    if (micBtn) {
      micBtn.addEventListener('click', () => {
        if (this.voiceAssistant.isListening) {
          this.voiceAssistant.stopListening();
        } else {
          this.voiceAssistant.startListening('hi-IN');
        }
      });
    }

    modal.classList.add('active');
  }

  handleVoiceTranscript(transcript) {
    const transcriptBox = document.getElementById('voiceTranscriptBox');
    if (transcriptBox) {
      transcriptBox.innerHTML = `<b>आपने पूछा:</b> "${transcript}"`;
    }

    const response = this.voiceAssistant.processQuery(transcript);

    const respBox = document.getElementById('voiceResponseContainer');
    const respTitle = document.getElementById('voiceRespTitle');
    const respSteps = document.getElementById('voiceRespSteps');
    const respDisc = document.getElementById('voiceRespDisclaimer');
    const btnReplay = document.getElementById('btnReplayVoice');

    if (respBox && respTitle && respSteps) {
      respTitle.textContent = response.title;
      respSteps.innerHTML = response.steps.map(s => `<div style="margin-bottom:4px;">• ${s}</div>`).join('');
      if (respDisc) respDisc.textContent = `⚠️ ${response.disclaimer}`;
      respBox.style.display = 'block';

      if (btnReplay) {
        btnReplay.onclick = () => this.voiceAssistant.replay();
      }
    }

    // Speak response in voice
    this.voiceAssistant.speak(response.voiceAnswer, 'hi-IN');
  }

  setupModalClosers() {
    const modal = document.getElementById('genericModal');
    const closeBtn = document.getElementById('modalCloseBtn');
    if (modal && closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.voiceAssistant.stopVoice();
        this.voiceAssistant.stopListening();
        modal.classList.remove('active');
      });
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.voiceAssistant.stopVoice();
          this.voiceAssistant.stopListening();
          modal.classList.remove('active');
        }
      });
    }

    // Notifications modal / drawer
    const notifBtn = document.getElementById('notificationBtn');
    if (notifBtn) {
      notifBtn.addEventListener('click', () => this.openNotificationsModal());
    }
  }

  openNotificationsModal() {
    const notifications = state.getNotifications();
    const modal = document.getElementById('genericModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.innerHTML = '<i class="fa-solid fa-bell" style="color:var(--primary-600);"></i> किसान सूचनाएं (Notifications)';
    modalBody.innerHTML = `
      <div>
        ${notifications.map(n => `
          <div style="display:flex;gap:12px;padding:12px;border-bottom:1px solid var(--border-color);align-items:flex-start;">
            <div style="width:36px;height:36px;border-radius:50%;background:var(--primary-100);color:var(--primary-800);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <i class="fa-solid ${n.icon}"></i>
            </div>
            <div style="flex:1;">
              <strong style="font-size:13.5px;color:var(--text-primary);">${n.title}</strong>
              <p style="font-size:12.5px;color:var(--text-secondary);margin:2px 0;">${n.message}</p>
              <span style="font-size:11px;color:var(--text-muted);">${n.time}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    modal.classList.add('active');
  }
}

// Global initialization
window.mandixApp = new MandiXApp();
window.addEventListener('DOMContentLoaded', () => {
  window.mandixApp.init();
});
