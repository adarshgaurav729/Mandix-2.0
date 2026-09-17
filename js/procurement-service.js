/**
 * MandiX - Smart Procurement Queue & Slot Booking Engine (Original SIH Feature Enhanced)
 * Integrates slot booking, token issuance, queue progression, assaying & PFMS MSP payment tracking.
 */

import { state } from './state.js';

export const DISTRICT_BLOCK_DATA = {
  'Bihar': {
    'East Champaran': ['Chakia', 'Shahebganj', 'Kalyanpur', 'Pipra', 'Mehsi', 'Motihari Sadar', 'Raxaul'],
    'West Champaran': ['Bettiah', 'Bagaha', 'Narkatiaganj', 'Chanpatia', 'Majhaulia'],
    'Muzaffarpur': ['Kanti', 'Motipur', 'Marwan', 'Mushahari', 'Sakra'],
    'Samastipur': ['Kalyanpur', 'Warishnagar', 'Rosera', 'Dalsinghsarai', 'Pusa'],
    'Saran': ['Chapra', 'Marhaura', 'Garkha', 'Revelganj'],
    'Patna': ['Phulwari Sharif', 'Danapur', 'Bakhtiarpur', 'Fatuha', 'Bihta']
  },
  'Punjab': {
    'Ludhiana': ['Ludhiana East', 'Ludhiana West', 'Jagraon', 'Samrala', 'Khanna'],
    'Patiala': ['Patiala', 'Nabha', 'Rajpura', 'Samana']
  },
  'Haryana': {
    'Karnal': ['Karnal', 'Indri', 'Gharaunda', 'Nilokheri'],
    'Kurukshetra': ['Thanesar', 'Pehowa', 'Shahbad', 'Ladwa']
  },
  'Maharashtra': {
    'Nashik': ['Niphad', 'Yeola', 'Dindori', 'Sinnar', 'Chandwad'],
    'Nagpur': ['Nagpur Rural', 'Katol', 'Saoner', 'Umred']
  }
};

export function generateToken(farmerName, farmerId, stateName, district, block, crop, quantityQtl, slotDate, slotTime) {
  const randomId = Math.floor(100 + Math.random() * 900);
  const tokenNumber = `TK-${randomId}`;
  const currentServingNum = randomId > 105 ? randomId - 4 : 101;
  const currentServing = `TK-${currentServingNum}`;
  const estimatedWaitMin = Math.max(15, (randomId - currentServingNum) * 6);
  
  const mspRates = {
    'Wheat': 2275,
    'Paddy (Grade A)': 2203,
    'Mustard': 5650,
    'Maize': 2090
  };
  const rate = mspRates[crop] || 2275;
  const totalAmt = quantityQtl * rate;

  const tokenObj = {
    tokenNumber,
    farmerName: farmerName || 'रामेश्वर प्रसाद',
    farmerId: farmerId || 'FARM-BR-2026-8942',
    crop: crop || 'Wheat Grade-A',
    quantityQtl: Number(quantityQtl) || 40,
    state: stateName,
    district,
    block,
    centerName: `${block || 'Chakia'} Central Procurement Hub #1`,
    slotDate: slotDate || new Date().toISOString().split('T')[0],
    slotTime: slotTime || '10:30 AM - 11:30 AM',
    currentServing,
    estimatedWaitMin,
    counterNo: `Counter ${Math.floor(1 + Math.random() * 5)}`,
    status: 'Active',
    paymentStatus: 'Aadhaar PFMS Verified - Ready for MSP transfer',
    mspPerQtl: rate,
    totalExpectedAmt: totalAmt,
    createdAt: new Date().toLocaleString()
  };

  state.setActiveToken(tokenObj);
  
  // Add notification
  const notifications = state.getNotifications();
  notifications.unshift({
    id: `notif_${Date.now()}`,
    type: 'queue',
    title: `नया टोकन जारी: ${tokenNumber}`,
    message: `${tokenObj.centerName} पर स्लॉट बुक हो गया है। SMS सूचना आपके मोबाइल पर भेजी गई है।`,
    time: 'अभी-अभी (Just now)',
    read: false,
    icon: 'fa-ticket'
  });
  state.save('mandix_notifications', notifications);

  return tokenObj;
}
