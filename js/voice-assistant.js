/**
 * MandiX - Kisan Vani AI Voice Assistant
 * Supports Speech-to-Text (STT) via Web Speech API and Text-to-Speech (TTS) voice synthesis.
 */

export class VoiceAssistant {
  constructor() {
    this.isListening = false;
    this.recognition = null;
    this.synth = window.speechSynthesis || null;
    this.lastResponseText = '';
    this.initSpeechRecognition();
  }

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'hi-IN'; // Default Hindi (India)

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (this.onTranscriptCallback) {
          this.onTranscriptCallback(transcript);
        }
      };

      this.recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        this.isListening = false;
        if (this.onErrorCallback) {
          this.onErrorCallback(event.error);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (this.onStateChangeCallback) {
          this.onStateChangeCallback(false);
        }
      };
    }
  }

  startListening(langCode = 'hi-IN') {
    if (!this.recognition) {
      alert('आपके ब्राउज़र में वॉइस इनपुट उपलब्ध नहीं है। कृपया टाइप करें या Chrome का उपयोग करें। (Voice recognition not supported in this browser; please use text input)');
      return false;
    }
    try {
      this.recognition.lang = langCode;
      this.recognition.start();
      this.isListening = true;
      if (this.onStateChangeCallback) {
        this.onStateChangeCallback(true);
      }
      return true;
    } catch (e) {
      console.error('Error starting recognition:', e);
      return false;
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      if (this.onStateChangeCallback) {
        this.onStateChangeCallback(false);
      }
    }
  }

  speak(text, lang = 'hi-IN') {
    if (!this.synth) return;
    this.synth.cancel(); // Cancel any ongoing speech
    this.lastResponseText = text;

    const cleanText = text.replace(/[*_#`[\]()]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang;
    utterance.rate = 0.95; // Slightly slower for clarity
    utterance.pitch = 1.0;

    // Pick an appropriate Indian voice if available
    const voices = this.synth.getVoices();
    const match = voices.find(v => v.lang.startsWith(lang.split('-')[0]) || v.name.includes('India') || v.name.includes('Hindi'));
    if (match) {
      utterance.voice = match;
    }

    this.synth.speak(utterance);
  }

  replay() {
    if (this.lastResponseText) {
      this.speak(this.lastResponseText);
    }
  }

  stopVoice() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  processQuery(query) {
    const q = query.toLowerCase();

    // 1. Yellow leaves in wheat / crop disease
    if (q.includes('पीली') || q.includes('पत्ती') || q.includes('yellow') || q.includes('leaf') || q.includes('रोग') || q.includes('पत्तियां')) {
      return {
        title: 'गेहूं में पत्तियां पीली होने का समाधान (Yellowing of Wheat Leaves)',
        steps: [
          'कारण 1 - नाइट्रोजन की कमी: यदि पुरानी निचली पत्तियां पीली पड़ रही हैं, तो प्रति एकड़ 30-35 किग्रा नीम कोटेड यूरिया की टॉप ड्रेसिंग करें या नैनो यूरिया (4 मिली/लीटर) का स्प्रे करें।',
          'कारण 2 - जिंक की कमी: यदि नई पत्तियों के बीच में पीलापन है, तो 0.5% जिंक सल्फेट (5 ग्राम जिंक + 2.5 ग्राम बुझा चूना प्रति लीटर पानी) का छिड़काव करें।',
          'कारण 3 - पीला रतुआ (Yellow Rust): यदि पत्तियों पर हल्दी जैसा पीला पाउडर लगे, तो तुरंत प्रोपिकोनाजोल 25 EC (1 मिली/लीटर) का छिड़काव करें।',
          'कारण 4 - अधिक जलभराव: यदि खेत में पानी भरा है तो तुरंत जल निकासी करें।'
        ],
        voiceAnswer: 'गेहूं में पत्तियां पीली होने के तीन मुख्य कारण हो सकते हैं - पहला नाइट्रोजन की कमी, दूसरा जिंक की कमी, और तीसरा पीला रतुआ रोग। यदि पाउडर जैसा पीलापन है तो प्रोपिकोनाजोल का स्प्रे करें और हल्की सिंचाई के बाद नैनो यूरिया डालें। गंभीर स्थिति में स्थानीय कृषि अधिकारी से संपर्क करें।',
        disclaimer: 'यह सलाह प्राथमिक लक्षणों पर आधारित है। सटीक निदान के लिए पौधे का नमूना निकटतम कृषि विज्ञान केंद्र (KVK) को दिखाएं।'
      };
    }

    // 2. Weather / Rain query
    if (q.includes('बारिश') || q.includes('मौसम') || q.includes('rain') || q.includes('weather') || q.includes('पानी गिरेगा')) {
      return {
        title: 'मौसम और बारिश की स्थिति (Weather Advisory)',
        steps: [
          'पूर्वी चंपारण और आसपास के क्षेत्रों में आज और कल आंशिक बादल छाए रहेंगे।',
          'बारिश की संभावना 20% से 35% के बीच है। भारी बारिश की कोई चेतावनी नहीं है।',
          'सिंचाई परामर्श: खेत में नमी की स्थिति देखकर शाम को हल्की सिंचाई की जा सकती है।',
          'छिड़काव परामर्श: हवा की गति 9 किमी/घंटा है, नैनो यूरिया छिड़काव के लिए मौसम अनुकूल है।'
        ],
        voiceAnswer: 'आपके क्षेत्र में अगले 48 घंटों में हल्की बूंदाबांदी की संभावना लगभग 25 प्रतिशत है। भारी बारिश की संभावना नहीं है। आप खेत में आवश्यकतानुसार हल्की सिंचाई और खाद छिड़काव कर सकते हैं।',
        disclaimer: 'मौसम संबंधी डेटा उपग्रह पूर्वानुमान पर आधारित है।'
      };
    }

    // 3. Tractor / Equipment rental query
    if (q.includes('ट्रैक्टर') || q.includes('किराए') || q.includes('किराया') || q.includes('मशीन') || q.includes('tractor') || q.includes('rent') || q.includes('रोटावेटर')) {
      return {
        title: 'कृषि यंत्र व ट्रैक्टर किराए पर लेने की प्रक्रिया',
        steps: [
          'मंडी-X के "कृषि यंत्र किराया" (Equipment Rental) अनुभाग पर जाएं।',
          'महिंद्रा 575 DI (₹350/घंटा या ₹2200/दिन) या जॉन डीयर 5050D उपलब्ध हैं।',
          'अपने नजदीकी कस्टम हायरिंग सेंटर (जैसे चकिया किसान केंद्र) का चयन करें।',
          'तारीख और समय चुनें, तथा "किराए पर लें" बटन दबाकर तुरंत बुकिंग पुष्टि पाएं। ड्राइवर सहित विकल्प भी उपलब्ध है।'
        ],
        voiceAnswer: 'आप मंडी-एक्स के कृषि यंत्र किराया विकल्प से आसानी से ट्रैक्टर, रोटावेटर और हार्वेस्टर बुक कर सकते हैं। महिंद्रा ट्रैक्टर मात्र 350 रुपये प्रति घंटा या 2200 रुपये प्रति दिन की दर पर उपलब्ध है। आप अभी ऐप में जाकर बुक कर सकते हैं।',
        disclaimer: 'बुकिंग की पुष्टि स्थानीय उपकरण मालिक द्वारा की जाती है।'
      };
    }

    // 4. Fertilizer order query
    if (q.includes('खाद') || q.includes('यूरिया') || q.includes('डीएपी') || q.includes('fertilizer') || q.includes('urea') || q.includes('dap') || q.includes('ऑर्डर')) {
      return {
        title: 'घर-घर उर्वरक होम डिलीवरी प्रक्रिया',
        steps: [
          'डैशबोर्ड पर "उर्वरक होम डिलीवरी" (Fertilizer Delivery) कार्ड पर क्लिक करें।',
          'नीम कोटेड यूरिया (₹266.50), नैनो यूरिया (₹225), या डीएपी (₹1350) चुनें।',
          'मात्रा (थैलों की संख्या) दर्ज करें और अपना गांव/पता चुनें।',
          'ऑर्डर कन्फर्म करें। अधिकृत सहकारी समिति 24 से 48 घंटे में सीधे आपके खेत के द्वार तक खाद पहुंचाएगी।'
        ],
        voiceAnswer: 'आप मंडी-एक्स से सीधे सब्सिडी दर पर यूरिया और डीएपी ऑर्डर कर सकते हैं। नीम कोटेड यूरिया 266 रुपये 50 पैसे में उपलब्ध है। ऑर्डर करने के लिए उर्वरक डिलीवरी विकल्प पर जाएं और अपना पता दर्ज करें।',
        disclaimer: 'उर्वरक की बिक्री आधार सत्यापन और पीओएस नियमों के अनुसार होती है।'
      };
    }

    // 5. PM-KISAN / Government scheme query
    if (q.includes('पीएम किसान') || q.includes('योजना') || q.includes('किस्त') || q.includes('पैसा') || q.includes('scheme') || q.includes('pm kisan') || q.includes('kisan credit card') || q.includes('केसीसी')) {
      return {
        title: 'प्रधानमंत्री किसान सम्मान निधि (PM-KISAN) सूचना',
        steps: [
          'PM-KISAN के तहत किसानों को प्रतिवर्ष ₹6,000 तीन किस्तों (₹2,000 प्रत्येक) में सीधे बैंक खाते में मिलते हैं।',
          'अगली किस्त प्राप्त करने के लिए ई-केवाईसी (e-KYC) और आधार बैंक सीडिंग अनिवार्य है।',
          'अपनी पात्रता और स्थिति जांचने के लिए "सरकारी योजनाएं" अनुभाग में जाएं और "आधिकारिक पोर्टल पर आवेदन करें" पर क्लिक करें जो आपको सीधे pmkisan.gov.in पर ले जाएगा।'
        ],
        voiceAnswer: 'प्रधानमंत्री किसान सम्मान निधि के 6000 रुपये सीधे आपके बैंक खाते में आते हैं। यदि आपकी किस्त रुकी है, तो कृपया अपना आधार ई-केवाईसी पूरा करें। आप मंडी-एक्स के सरकारी योजनाएं सेक्शन से सीधे आधिकारिक पोर्टल पर जा सकते हैं।',
        disclaimer: 'मंडी-X आधिकारिक सरकारी लिंक प्रदान करता है और कोई अनधिकृत दावा नहीं करता।'
      };
    }

    // 6. Drone query
    if (q.includes('ड्रोन') || q.includes('drone') || q.includes('छिड़काव')) {
      return {
        title: 'कृषि ड्रोन छिड़काव सेवा बुकिंग',
        steps: [
          'मंडी-X के "ड्रोन सेवाएं" अनुभाग पर जाएं।',
          'नैनो यूरिया छिड़काव (₹350/एकड़) या कीटनाशक छिड़काव (₹380/एकड़) चुनें।',
          'खेत का आकार (एकड़) और मनपसंद तारीख चुनें।',
          'DGCA प्रमाणित ड्रोन पायलट निर्धारित समय पर आपके खेत पर आकर 10 मिनट में 1 एकड़ में छिड़काव संपन्न करेगा।'
        ],
        voiceAnswer: 'आप मात्र 350 रुपये प्रति एकड़ की दर से ड्रोन द्वारा नैनो यूरिया या कीटनाशक छिड़काव बुक कर सकते हैं। डीजीसीए प्रमाणित पायलट आपके खेत पर आकर कुछ ही मिनटों में छिड़काव पूरा कर देगा।',
        disclaimer: 'ड्रोन सेवाएं केवल नागरिक उड्डयन महानिदेशालय (DGCA) अधिकृत ऑपरेटरों द्वारा दी जाती हैं।'
      };
    }

    // 7. Mandi Queue / Slot query
    if (q.includes('मंडी') || q.includes('स्लॉट') || q.includes('टोकन') || q.includes('कतार') || q.includes('line') || q.includes('queue') || q.includes('mandi') || q.includes('token')) {
      return {
        title: 'मंडी खरीद स्लॉट और लाइव कतार',
        steps: [
          'उपार्जन केंद्र पर कतार से बचने के लिए "मंडी स्लॉट व कतार" पर क्लिक करें।',
          'अपना राज्य, जिला और ब्लॉक चुनें और "Get Token" पर क्लिक करें।',
          'आपको तत्काल टोकन नंबर (जैसे #TK-142) प्राप्त होगा और आपका अनुमानित प्रतीक्षा समय दिखाई देगा।',
          'जब आपकी बारी आने वाली हो, तभी केंद्र पर पहुंचे।'
        ],
        voiceAnswer: 'मंडी में लंबी लाइनों में लगने से बचने के लिए आप घर बैठे ऑनलाइन स्लॉट बुक करके डिजिटल टोकन पा सकते हैं। इससे आपका समय बचेगा और बारी आने पर आपको एसएमएस सूचना मिलेगी।',
        disclaimer: 'उपार्जन केंद्र पर फसल के FAQ गुणवत्ता मानकों के आधार पर ही तौल की जाती है।'
      };
    }

    // Default general response
    return {
      title: 'किसान वाणी सामान्य परामर्श',
      steps: [
        'नमस्ते किसान भाई! मैं आपकी क्या सहायता कर सकता हूँ?',
        'आप मुझसे पूछ सकते हैं: फसलों के रोग, आज का मौसम, खाद की डिलीवरी, ट्रैक्टर किराया, ड्रोन छिड़काव, या पीएम किसान योजना के बारे में।',
        'उदाहरण के लिए बोलें: "गेहूं में पत्तियां पीली हो रही हैं" या "कल बारिश होगी क्या?"'
      ],
      voiceAnswer: 'नमस्ते! मैं आपका डिजिटल कृषि साथी किसान वाणी हूँ। आप मुझसे मौसम, खाद, ट्रैक्टर किराए, या फसल रोगों के बारे में पूछ सकते हैं।',
      disclaimer: 'कृषि संबंधी विशिष्ट समस्याओं के लिए विशेषज्ञ की राय अवश्य लें।'
    };
  }
}
