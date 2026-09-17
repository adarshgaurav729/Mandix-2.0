/**
 * MandiX - Interactive Agricultural Map Service
 * Leverages Leaflet.js with OpenStreetMap to display mandis, fertilizer hubs, equipment centers, and weather stations.
 */

export class MapService {
  constructor(mapContainerId) {
    this.containerId = mapContainerId;
    this.map = null;
    this.markersLayer = null;
    this.defaultCenter = [26.4258, 85.0506]; // Chakia, East Champaran, Bihar
    this.defaultZoom = 11;
  }

  init() {
    const container = document.getElementById(this.containerId);
    if (!container || !window.L) return;

    if (this.map) {
      this.map.remove();
    }

    this.map = window.L.map(this.containerId).setView(this.defaultCenter, this.defaultZoom);

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '© OpenStreetMap contributors | MandiX Agricultural GIS'
    }).addTo(this.map);

    this.markersLayer = window.L.layerGroup().addTo(this.map);
    this.renderDefaultLayers();
  }

  renderDefaultLayers() {
    if (!this.markersLayer || !window.L) return;
    this.markersLayer.clearLayers();

    // 1. Farmer Approximate Village Location (Centroid only, privacy preserved)
    const farmerIcon = window.L.divIcon({
      className: 'custom-map-icon',
      html: '<div style="background:#15803d;color:#fff;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid #fff;"><i class="fa-solid fa-house" style="font-size:16px;"></i></div>',
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });
    window.L.marker([26.4258, 85.0506], { icon: farmerIcon })
      .addTo(this.markersLayer)
      .bindPopup(`
        <div style="font-family:sans-serif;padding:4px;">
          <strong style="color:#15803d;font-size:14px;">📍 आपका कृषि क्षेत्र / Farm Area</strong>
          <p style="margin:4px 0 2px;font-size:12px;color:#333;">चकिया, पूर्वी चंपारण (Chakia Village Centroid)</p>
          <span style="display:inline-block;background:#dcfce7;color:#166534;font-size:11px;padding:2px 6px;border-radius:4px;">सुरक्षित गोपनीयता / Approximate Location</span>
        </div>
      `);

    // 2. Mandi / Procurement Center
    const mandiIcon = window.L.divIcon({
      className: 'custom-map-icon',
      html: '<div style="background:#0284c7;color:#fff;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid #fff;"><i class="fa-solid fa-building-columns" style="font-size:16px;"></i></div>',
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });
    window.L.marker([26.4420, 85.0680], { icon: mandiIcon })
      .addTo(this.markersLayer)
      .bindPopup(`
        <div style="font-family:sans-serif;padding:4px;">
          <strong style="color:#0284c7;font-size:14px;">🏛️ चकिया मुख्य उपार्जन केंद्र</strong>
          <p style="margin:4px 0 2px;font-size:12px;color:#333;">Chakia Procurement Hub #1 (Grain Mandi)</p>
          <p style="margin:2px 0;font-size:11px;color:#666;">लाइव कतार: <b style="color:#15803d;">सामान्य (12 किसान प्रतीक्षारत)</b></p>
          <a href="#queue" onclick="window.mandixApp.navigate('queue')" style="display:inline-block;margin-top:6px;background:#0284c7;color:#fff;text-decoration:none;padding:4px 8px;border-radius:4px;font-size:11px;">स्लॉट व टोकन देखें</a>
        </div>
      `);

    // 3. Fertilizer Cooperative Hub
    const fertIcon = window.L.divIcon({
      className: 'custom-map-icon',
      html: '<div style="background:#d97706;color:#fff;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid #fff;"><i class="fa-solid fa-truck-fast" style="font-size:16px;"></i></div>',
      iconSize: [34, 34],
      iconAnchor: [26.4180, 85.0350],
      iconAnchor: [17, 17]
    });
    window.L.marker([26.4180, 85.0350], { icon: fertIcon })
      .addTo(this.markersLayer)
      .bindPopup(`
        <div style="font-family:sans-serif;padding:4px;">
          <strong style="color:#d97706;font-size:14px;">🧪 IFFCO किसान सेवा केंद्र (खाद डिपो)</strong>
          <p style="margin:4px 0 2px;font-size:12px;color:#333;">Cooperative Fertilizer Hub, Pipra Road</p>
          <p style="margin:2px 0;font-size:11px;color:#15803d;">उपलब्धता: यूरिया, डीएपी, नैनो यूरिया उपलब्ध</p>
          <a href="#fertilizer" onclick="window.mandixApp.navigate('fertilizer')" style="display:inline-block;margin-top:6px;background:#d97706;color:#fff;text-decoration:none;padding:4px 8px;border-radius:4px;font-size:11px;">खाद ऑर्डर करें</a>
        </div>
      `);

    // 4. Equipment Rental Center
    const eqIcon = window.L.divIcon({
      className: 'custom-map-icon',
      html: '<div style="background:#7c3aed;color:#fff;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid #fff;"><i class="fa-solid fa-tractor" style="font-size:16px;"></i></div>',
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });
    window.L.marker([26.4380, 85.0210], { icon: eqIcon })
      .addTo(this.markersLayer)
      .bindPopup(`
        <div style="font-family:sans-serif;padding:4px;">
          <strong style="color:#7c3aed;font-size:14px;">🚜 कस्टम हायरिंग सेंटर (CHC Machinery Hub)</strong>
          <p style="margin:4px 0 2px;font-size:12px;color:#333;">Kisan Agro Rentals, Chakia Bypass</p>
          <p style="margin:2px 0;font-size:11px;color:#333;">मशीनरी: ट्रैक्टर, रोटावेटर, थ्रेशर</p>
          <a href="#equipment" onclick="window.mandixApp.navigate('equipment')" style="display:inline-block;margin-top:6px;background:#7c3aed;color:#fff;text-decoration:none;padding:4px 8px;border-radius:4px;font-size:11px;">यंत्र किराए पर लें</a>
        </div>
      `);

    // 5. Drone Service Center
    const droneIcon = window.L.divIcon({
      className: 'custom-map-icon',
      html: '<div style="background:#059669;color:#fff;border-radius:50%;width:34px;height:34px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid #fff;"><i class="fa-solid fa-helicopter" style="font-size:16px;"></i></div>',
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });
    window.L.marker([26.4520, 85.0450], { icon: droneIcon })
      .addTo(this.markersLayer)
      .bindPopup(`
        <div style="font-family:sans-serif;padding:4px;">
          <strong style="color:#059669;font-size:14px;">🚁 चंपारण कृषि ड्रोन सेवा क्लस्टर</strong>
          <p style="margin:4px 0 2px;font-size:12px;color:#333;">DGCA Certified Drone Hub #4</p>
          <p style="margin:2px 0;font-size:11px;color:#15803d;">सेवाएं: नैनो यूरिया व कीटनाशक छिड़काव</p>
          <a href="#drone" onclick="window.mandixApp.navigate('drone')" style="display:inline-block;margin-top:6px;background:#059669;color:#fff;text-decoration:none;padding:4px 8px;border-radius:4px;font-size:11px;">ड्रोन बुक करें</a>
        </div>
      `);
  }

  resize() {
    if (this.map) {
      setTimeout(() => this.map.invalidateSize(), 200);
    }
  }
}
