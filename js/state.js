/**
 * MandiX - Central State Manager
 * Handles persistent state via localStorage and event publishing for UI updates.
 */

const STORAGE_KEYS = {
  LANG: 'mandix_lang',
  ROLE: 'mandix_role',
  PROFILE: 'mandix_profile',
  CART: 'mandix_cart',
  ORDERS: 'mandix_fertilizer_orders',
  BOOKINGS: 'mandix_equipment_bookings',
  DRONE_REQUESTS: 'mandix_drone_requests',
  TICKETS: 'mandix_support_tickets',
  ACTIVE_TOKEN: 'mandix_active_token',
  ACCESSIBILITY: 'mandix_accessibility',
  NOTIFICATIONS: 'mandix_notifications'
};

const DEFAULT_PROFILE = {
  name: 'रामेश्वर प्रसाद (Rameshwar Prasad)',
  phone: '+91 98765 43210',
  aadhaarId: 'FARM-BR-2026-8942',
  village: 'Chakia (चकिया)',
  district: 'East Champaran (पूर्वी चंपारण)',
  state: 'Bihar (बिहार)',
  farmSize: '4.5 Acres',
  soilType: 'Alluvial Soil (जलोढ़ मिट्टी)',
  primaryCrop: 'Wheat & Paddy (गेहूं और धान)',
  irrigationType: 'Borewell & Canal (नलकूप व नहर)'
};

const DEFAULT_NOTIFICATIONS = [
  {
    id: 'n1',
    type: 'weather',
    title: 'बारिश का अलर्ट / Rain Alert',
    message: 'अगले 36 घंटों में पूर्वी चंपारण में हल्की से मध्यम बारिश की संभावना है। सिंचाई स्थगित रखें।',
    time: '10 मिनट पहले',
    read: false,
    icon: 'fa-cloud-showers-heavy'
  },
  {
    id: 'n2',
    type: 'order',
    title: 'उर्वरक डिलीवरी अपडेट / Fertilizer Dispatched',
    message: 'आपका IFFCO नीम कोटेड यूरिया ऑर्डर #FD-4092 वितरण केंद्र से रवाना हो चुका है।',
    time: '2 घंटे पहले',
    read: false,
    icon: 'fa-truck-fast'
  },
  {
    id: 'n3',
    type: 'scheme',
    title: 'PM-KISAN 17वीं किस्त / PM-KISAN 17th Installment',
    message: 'ई-केवाईसी (e-KYC) पूरा करने की अंतिम तिथि 30 दिनों में है। जल्द सत्यापित करें।',
    time: '1 दिन पहले',
    read: true,
    icon: 'fa-landmark'
  },
  {
    id: 'n4',
    type: 'queue',
    title: 'मंडी खरीद टोकन / Mandi Queue Update',
    message: 'चकिया उपार्जन केंद्र पर टोकन #TK-142 का सत्यापन प्रारंभ। आपकी अनुमानित प्रतीक्षा 25 मिनट है।',
    time: 'Just now',
    read: false,
    icon: 'fa-ticket'
  }
];

class StateManager {
  constructor() {
    this.subscribers = {};
    this.init();
  }

  init() {
    if (!localStorage.getItem(STORAGE_KEYS.PROFILE)) {
      this.save(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
    }
    if (!localStorage.getItem(STORAGE_KEYS.LANG)) {
      this.save(STORAGE_KEYS.LANG, 'hi'); // Default to Hindi
    }
    if (!localStorage.getItem(STORAGE_KEYS.ROLE)) {
      this.save(STORAGE_KEYS.ROLE, 'farmer');
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACCESSIBILITY)) {
      this.save(STORAGE_KEYS.ACCESSIBILITY, { highContrast: false, fontSize: 'normal' });
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      this.save(STORAGE_KEYS.NOTIFICATIONS, DEFAULT_NOTIFICATIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CART)) {
      this.save(STORAGE_KEYS.CART, []);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      this.save(STORAGE_KEYS.ORDERS, [
        {
          id: 'FD-4092',
          productName: 'IFFCO Neem Coated Urea (45kg)',
          category: 'Urea',
          quantity: 3,
          unitPrice: 266.5,
          totalPrice: 799.5,
          orderDate: '2026-09-16',
          deliverySlot: 'Morning (09:00 - 12:00)',
          address: 'Village Chakia, Near Primary School, East Champaran, Bihar - 845412',
          status: 'Dispatched', // Ordered -> Confirmed -> Dispatched -> Delivered
          isDemo: true
        }
      ]);
    }
    if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
      this.save(STORAGE_KEYS.BOOKINGS, [
        {
          id: 'EQ-8831',
          equipmentName: 'Mahindra 575 DI Tractor (45 HP)',
          category: 'Tractor',
          provider: 'Kisan Seva Kendra, Chakia',
          startDate: '2026-09-20',
          duration: '1 Day',
          rateType: 'daily',
          rate: 1800,
          total: 1800,
          operatorRequired: true,
          status: 'Confirmed',
          isDemo: true
        }
      ]);
    }
    if (!localStorage.getItem(STORAGE_KEYS.DRONE_REQUESTS)) {
      this.save(STORAGE_KEYS.DRONE_REQUESTS, [
        {
          id: 'DRN-104',
          serviceName: 'Nano Urea Aerial Spraying',
          acres: 4,
          fieldLocation: 'Plot 4B, Chakia North, Bihar',
          preferredDate: '2026-09-22',
          slot: 'Morning 07:00 AM',
          status: 'Pilot Assigned',
          pilotName: 'Aakash Kumar (DGCA Certified Pilot #AG-881)',
          costEstimate: 1400,
          isDemo: true
        }
      ]);
    }
    if (!localStorage.getItem(STORAGE_KEYS.TICKETS)) {
      this.save(STORAGE_KEYS.TICKETS, [
        {
          id: 'TCK-201',
          subject: 'मंडी स्लॉट समय में संशोधन (Reschedule Mandi Slot)',
          category: 'Mandi Queue / Procurement',
          status: 'In Progress', // Open, In Progress, Resolved
          createdAt: '2026-09-17 10:15 AM',
          description: 'भारी बारिश के कारण टोकन संख्या #TK-142 का समय दोपहर 2:00 बजे करने का अनुरोध।',
          responses: [
            { from: 'Support Agent (सुनील कुमार)', text: 'आपका अनुरोध दर्ज कर लिया गया है। चकिया केंद्र समन्वयक को सूचित किया गया है।', time: '11:00 AM' }
          ]
        },
        {
          id: 'TCK-198',
          subject: 'खाद सब्सिडी रसीद प्राप्त नहीं हुई (Subsidy Receipt Query)',
          category: 'Fertilizer Delivery',
          status: 'Resolved',
          createdAt: '2026-09-15 04:30 PM',
          description: 'IFFCO यूरिया ऑर्डर के लिए सब्सिडी रसीद एसएमएस पर चाहिए।',
          responses: [
            { from: 'System', text: 'सब्सिडी रसीद एसएमएस और किसान प्रोफाइल पर भेज दी गई है।', time: '2026-09-15 05:00 PM' }
          ]
        }
      ]);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_TOKEN)) {
      this.save(STORAGE_KEYS.ACTIVE_TOKEN, {
        tokenNumber: 'TK-142',
        farmerName: 'रामेश्वर प्रसाद',
        farmerId: 'FARM-BR-2026-8942',
        crop: 'गेहूं (Wheat Grade-A)',
        quantityQtl: 45,
        state: 'Bihar',
        district: 'East Champaran',
        block: 'Chakia',
        centerName: 'Chakia Central Procurement Hub #1',
        slotDate: '2026-09-18',
        slotTime: '10:30 AM - 11:30 AM',
        currentServing: 'TK-138',
        estimatedWaitMin: 25,
        counterNo: 'Counter 3',
        status: 'Active',
        paymentStatus: 'Aadhaar PFMS Verified - Ready for MSP transfer',
        mspPerQtl: 2275,
        totalExpectedAmt: 102375
      });
    }
  }

  get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error('Error reading localStorage key:', key, e);
      return null;
    }
  }

  save(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      this.emit(key, val);
    } catch (e) {
      console.error('Error writing to localStorage:', key, e);
    }
  }

  on(event, callback) {
    if (!this.subscribers[event]) {
      this.subscribers[event] = [];
    }
    this.subscribers[event].push(callback);
  }

  emit(event, data) {
    if (this.subscribers[event]) {
      this.subscribers[event].forEach(cb => cb(data));
    }
  }

  // Convenience Helpers
  getLang() { return this.get(STORAGE_KEYS.LANG) || 'hi'; }
  setLang(lang) { this.save(STORAGE_KEYS.LANG, lang); }

  getRole() { return this.get(STORAGE_KEYS.ROLE) || 'farmer'; }
  setRole(role) { this.save(STORAGE_KEYS.ROLE, role); }

  getProfile() { return this.get(STORAGE_KEYS.PROFILE) || DEFAULT_PROFILE; }
  updateProfile(profileData) {
    const current = this.getProfile();
    this.save(STORAGE_KEYS.PROFILE, { ...current, ...profileData });
  }

  getActiveToken() { return this.get(STORAGE_KEYS.ACTIVE_TOKEN); }
  setActiveToken(token) { this.save(STORAGE_KEYS.ACTIVE_TOKEN, token); }

  getCart() { return this.get(STORAGE_KEYS.CART) || []; }
  saveCart(cart) { this.save(STORAGE_KEYS.CART, cart); }

  getOrders() { return this.get(STORAGE_KEYS.ORDERS) || []; }
  addOrder(order) {
    const orders = this.getOrders();
    orders.unshift(order);
    this.save(STORAGE_KEYS.ORDERS, orders);
  }

  getBookings() { return this.get(STORAGE_KEYS.BOOKINGS) || []; }
  addBooking(booking) {
    const list = this.getBookings();
    list.unshift(booking);
    this.save(STORAGE_KEYS.BOOKINGS, list);
  }

  getDroneRequests() { return this.get(STORAGE_KEYS.DRONE_REQUESTS) || []; }
  addDroneRequest(req) {
    const list = this.getDroneRequests();
    list.unshift(req);
    this.save(STORAGE_KEYS.DRONE_REQUESTS, list);
  }

  getTickets() { return this.get(STORAGE_KEYS.TICKETS) || []; }
  addTicket(ticket) {
    const list = this.getTickets();
    list.unshift(ticket);
    this.save(STORAGE_KEYS.TICKETS, list);
  }

  getNotifications() { return this.get(STORAGE_KEYS.NOTIFICATIONS) || []; }
  markNotificationRead(id) {
    const list = this.getNotifications().map(n => n.id === id ? { ...n, read: true } : n);
    this.save(STORAGE_KEYS.NOTIFICATIONS, list);
  }

  getAccessibility() {
    return this.get(STORAGE_KEYS.ACCESSIBILITY) || { highContrast: false, fontSize: 'normal' };
  }
  setAccessibility(acc) {
    this.save(STORAGE_KEYS.ACCESSIBILITY, acc);
  }
}

export const state = new StateManager();
export { STORAGE_KEYS };
