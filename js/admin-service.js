/**
 * MandiX - Administrator Management & Analytics Service
 * Admin control dashboard, order status toggles, ticket manager, and platform KPIs.
 * Connected to MySQL REST backend.
 */

import { state } from './state.js';
import { api } from './api.js';

export const ADMIN_STATS = {
  totalFarmers: 12480,
  activeToday: 1840,
  fertilizerBagsDelivered: 4520,
  machineryBookingsMonth: 382,
  droneAcresSprayed: 1240,
  activeMandiTokens: 96,
  satisfactionRate: '98.2%'
};

export const MOCK_FARMERS_LIST = [
  { id: 'FARM-BR-8942', name: 'रामेश्वर प्रसाद (Rameshwar Prasad)', village: 'Chakia, Bihar', phone: '+91 98765 43210', land: '4.5 Acres', status: 'Active (सत्यापित)' },
  { id: 'FARM-BR-8943', name: 'सुरेंद्र कुमार यादव (Surendra Yadav)', village: 'Pipra, Bihar', phone: '+91 98351 11204', land: '6.2 Acres', status: 'Active (सत्यापित)' },
  { id: 'FARM-BR-8944', name: 'अनिता देवी (Anita Devi)', village: 'Kalyanpur, Bihar', phone: '+91 94712 99012', land: '2.8 Acres', status: 'Active (सत्यापित)' },
  { id: 'FARM-PB-3310', name: 'गुरप्रीत सिंह (Gurpreet Singh)', village: 'Jagraon, Punjab', phone: '+91 98140 55123', land: '12.0 Acres', status: 'Active (सत्यापित)' },
  { id: 'FARM-MH-7719', name: 'दत्तात्रेय पाटिल (Dattatray Patil)', village: 'Niphad, Maharashtra', phone: '+91 94222 41098', land: '8.5 Acres', status: 'Active (सत्यापित)' }
];

export function updateOrderStatus(orderId, newStatus) {
  let dbId = null;
  const orders = state.getOrders().map(o => {
    if (o.id === orderId) {
      dbId = o.dbId || parseInt(orderId.replace('FD-', ''), 10);
      return { ...o, status: newStatus };
    }
    return o;
  });
  state.save('mandix_fertilizer_orders', orders);

  // Sync with MySQL backend
  if (dbId) {
    api.updateFertilizerOrderStatus(dbId, newStatus);
  }

  // Notification for farmer
  const notifications = state.getNotifications();
  notifications.unshift({
    id: `notif_${Date.now()}`,
    type: 'order',
    title: `ऑर्डर स्थिति अपडेट: #${orderId}`,
    message: `आपके उर्वरक ऑर्डर की स्थिति अब "${newStatus}" हो गई है।`,
    time: 'अभी-अभी (Just now)',
    read: false,
    icon: 'fa-truck-fast'
  });
  state.save('mandix_notifications', notifications);
}

export function updateTicketStatus(ticketId, newStatus) {
  let dbId = null;
  const tickets = state.getTickets().map(t => {
    if (t.id === ticketId) {
      dbId = t.dbId || parseInt(ticketId.replace('TCK-', ''), 10);
      return { ...t, status: newStatus };
    }
    return t;
  });
  state.save('mandix_support_tickets', tickets);

  // Sync with MySQL backend
  if (dbId) {
    api.updateSupportTicketStatus(dbId, newStatus);
  }
}
