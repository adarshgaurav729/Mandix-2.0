/**
 * MandiX - Customer Support Center & Live Help Desk
 * Live interactive chat, searchable agricultural FAQs, and ticket tracker (Open -> In Progress -> Resolved).
 */

import { state } from './state.js';

export const FAQS = [
  {
    category: 'Mandi Queue / Procurement',
    question: 'मंडी में स्लॉट बुक करने के बाद मुझे क्या करना होगा?',
    answer: 'स्लॉट बुक होने पर आपको एसएमएस द्वारा डिजिटल टोकन प्राप्त होगा। अपने टोकन का लाइव स्टेटस ऐप में ट्रैक करें और जब 2-3 टोकन पहले का समय हो, तभी अपनी उपज लेकर निर्धारित काउंटर पर पहुंचें।'
  },
  {
    category: 'Mandi Queue / Procurement',
    question: 'उपार्जन केंद्र पर फसल की जांच में क्या देखा जाता है?',
    answer: 'सरकार द्वारा निर्धारित एफएक्यू (FAQ) मानकों के अनुसार गेहूं में नमी 12-14% से कम, कंकड़-मिट्टी 0.75% से कम और क्षतिग्रस्त दाने न्यूनतम होने चाहिए। नमी अधिक होने पर धूप में सुखाकर लाएं।'
  },
  {
    category: 'Fertilizer Delivery',
    question: 'उर्वरक डिलीवरी का भुगतान कैसे होता है और क्या सब्सिडी मिलेगी?',
    answer: 'सभी उर्वरक सब्सिडी युक्त सरकारी एमआरपी पर उपलब्ध हैं। भुगतान डिलीवरी के समय नकद (Cash on Delivery) या यूपीआई द्वारा किया जा सकता है। डिलीवरी एजेंट पीओएस मशीन पर किसान का अंगूठा/ओटीपी सत्यापन कराएगा।'
  },
  {
    category: 'Equipment Rental',
    question: 'किराए पर लिए गए ट्रैक्टर या हार्वेस्टर में खराबी आने पर क्या होगा?',
    answer: 'कस्टम हायरिंग सेंटर (सीएचसी) संचालक मशीन के रखरखाव का जिम्मेदार होता है। ऑपरेटर सहित सेवा में तकनीकी खराबी आने पर संचालक तुरंत दूसरी मशीन अथवा रिफंड प्रदान करेगा।'
  },
  {
    category: 'Drone Services',
    question: 'ड्रोन से नैनो यूरिया छिड़काव के क्या फायदे हैं?',
    answer: 'पारंपरिक स्प्रे की तुलना में ड्रोन केवल 10 लीटर पानी प्रति एकड़ में समान रूप से छिड़काव कर देता है। 1 एकड़ में 8-10 मिनट लगते हैं और पत्तियों पर पोषक तत्व का 90% से अधिक अवशोषण होता है।'
  },
  {
    category: 'Government Schemes',
    question: 'PM-KISAN की किस्त रुकने पर क्या समाधान है?',
    answer: 'सबसे पहले अपने बैंक खाते की NPCI डीबीटी मैपिंग जांचें, दूसरा pmkisan.gov.in पर जाकर e-KYC पूरा करें, और तीसरा अपने राज्य के कृषि विभाग में जमीन के दस्तावेज (Land Seeding) सत्यापित कराएं।'
  }
];

export function getBotReply(userMessage) {
  const msg = userMessage.toLowerCase();

  if (msg.includes('टोकन') || msg.includes('token') || msg.includes('स्लॉट') || msg.includes('slot') || msg.includes('नंबर')) {
    return 'आपके सक्रिय टोकन #TK-142 का वर्तमान स्टेटस चकिया केंद्र पर सुचारू रूप से चल रहा है। अभी टोकन #TK-138 काउंटर पर है। आपकी अनुमानित बारी 25 मिनट में आएगी।';
  }
  if (msg.includes('खाद') || msg.includes('यूरिया') || msg.includes('fertilizer') || msg.includes('delivery')) {
    return 'आपका उर्वरक ऑर्डर #FD-4092 चकिया सहकारी केंद्र से डिस्पैच हो चुका है। डिलीवरी प्रतिनिधि आज दोपहर तक आपके गांव पहुंचेगा। डिलीवरी हेल्पलाइन: 1800-180-1551.';
  }
  if (msg.includes('पैसा') || msg.includes('payment') || msg.includes('msp') || msg.includes('खाते')) {
    return 'उपार्जन केंद्र पर तौल होने के 48 से 72 घंटे के भीतर एमएसपी (MSP) की राशि सीधे आपके आधार से जुड़े बैंक खाते (PFMS) में डीबीटी के माध्यम से अंतरित की जाती है।';
  }
  if (msg.includes('ट्रैक्टर') || msg.includes('किराया') || msg.includes('equipment')) {
    return 'उपकरण बुकिंग की पुष्टि के लिए आप सीधे हमारे ऑपरेटर कॉल सेंटर +91 94312 88411 पर संपर्क कर सकते हैं या ऐप में "कृषि यंत्र किराया" में जाकर बुकिंग स्थिति देख सकते हैं।';
  }
  return 'नमस्ते! आपकी समस्या दर्ज कर ली गई है। यदि आपको तत्काल सहायता चाहिए, तो आप टोल-फ्री किसान हेल्पलाइन 1800-180-1551 पर कॉल कर सकते हैं या नीचे एक सहायता टिकट दर्ज कर सकते हैं।';
}

export function createTicket(subject, category, urgency, description) {
  const newId = `TCK-${Math.floor(100 + Math.random() * 900)}`;
  const ticket = {
    id: newId,
    subject,
    category,
    urgency,
    status: 'Open', // Open -> In Progress -> Resolved
    createdAt: new Date().toLocaleString(),
    description,
    responses: [
      { from: 'System', text: 'सहायता टिकट सफलतापूर्वक दर्ज कर लिया गया है। कृषि विशेषज्ञ जल्द समीक्षा करेंगे।', time: new Date().toLocaleTimeString() }
    ]
  };
  state.addTicket(ticket);
  return ticket;
}
