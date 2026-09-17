/**
 * MandiX - Weather & Agro-Meteorological Advisory Service
 * Integrates live Open-Meteo API with offline Indian regional fallbacks and agricultural intelligence.
 */

export const INDIAN_LOCATIONS = [
  { name: 'Chakia, East Champaran, Bihar', lat: 26.4258, lon: 85.0506 },
  { name: 'Motihari, East Champaran, Bihar', lat: 26.6534, lon: 84.9208 },
  { name: 'Patna, Bihar', lat: 25.5941, lon: 85.1376 },
  { name: 'Muzaffarpur, Bihar', lat: 26.1209, lon: 85.3647 },
  { name: 'Samastipur, Bihar', lat: 25.8628, lon: 85.7811 },
  { name: 'Ludhiana, Punjab', lat: 30.9010, lon: 75.8573 },
  { name: 'Karnal, Haryana', lat: 29.6857, lon: 76.9905 },
  { name: 'Nashik, Maharashtra', lat: 19.9975, lon: 73.7898 },
  { name: 'Nagpur, Maharashtra', lat: 21.1458, lon: 79.0882 },
  { name: 'Varanasi, Uttar Pradesh', lat: 25.3176, lon: 82.9739 },
  { name: 'Indore, Madhya Pradesh', lat: 22.7196, lon: 75.8577 },
  { name: 'Ahmedabad, Gujarat', lat: 23.0225, lon: 72.5714 },
  { name: 'Coimbatore, Tamil Nadu', lat: 11.0168, lon: 76.9558 },
  { name: 'Guntur, Andhra Pradesh', lat: 16.3067, lon: 80.4365 },
  { name: 'Bhubaneswar, Odisha', lat: 20.2961, lon: 85.8245 }
];

export async function fetchWeather(lat = 26.4258, lon = 85.0506, locationName = 'Chakia, East Champaran') {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset&timezone=Asia%2FKolkata`;
    
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return formatWeatherData(data, locationName, false);
  } catch (err) {
    console.warn('Weather API failed or offline. Using verified agricultural demo data:', err);
    return getFallbackWeatherData(locationName);
  }
}

function getWeatherCondition(code) {
  // WMO Weather interpretation codes
  if (code === 0) return { text: 'साफ आसमान (Clear Sky)', icon: 'fa-sun', color: '#eab308' };
  if (code <= 3) return { text: 'आंशिक बादल (Partly Cloudy)', icon: 'fa-cloud-sun', color: '#64748b' };
  if (code <= 48) return { text: 'कोहरा / धुंध (Foggy)', icon: 'fa-smog', color: '#94a3b8' };
  if (code <= 55) return { text: 'हल्की बूंदाबांदी (Drizzle)', icon: 'fa-cloud-rain', color: '#38bdf8' };
  if (code <= 65) return { text: 'मध्यम से तेज बारिश (Rainfall)', icon: 'fa-cloud-showers-heavy', color: '#0284c7' };
  if (code <= 82) return { text: 'गरज के साथ बौछारें (Showers)', icon: 'fa-cloud-bolt', color: '#6366f1' };
  return { text: 'मौसम सामान्य (Pleasant)', icon: 'fa-sun', color: '#eab308' };
}

function formatWeatherData(data, locationName, isDemo = false) {
  const current = data.current;
  const daily = data.daily;
  const condition = getWeatherCondition(current.weather_code);
  const rainProb = daily.precipitation_probability_max ? daily.precipitation_probability_max[0] : 15;
  const windSpeed = Math.round(current.wind_speed_10m || 8);
  const temp = Math.round(current.temperature_2m);
  const humidity = Math.round(current.relative_humidity_2m);

  // Generate actionable agro-advisory
  const advisory = generateAgroAdvisory(temp, rainProb, windSpeed, humidity);

  const forecast = (daily.time || []).slice(0, 7).map((date, idx) => {
    const d = new Date(date);
    const dayNames = ['रवि (Sun)', 'सोम (Mon)', 'मंगल (Tue)', 'बुध (Wed)', 'गुरु (Thu)', 'शुक्र (Fri)', 'शनि (Sat)'];
    const cond = getWeatherCondition(daily.weather_code[idx]);
    return {
      day: dayNames[d.getDay()],
      date: `${d.getDate()}/${d.getMonth() + 1}`,
      maxTemp: Math.round(daily.temperature_2m_max[idx]),
      minTemp: Math.round(daily.temperature_2m_min[idx]),
      rainProb: daily.precipitation_probability_max[idx] || 10,
      condition: cond.text,
      icon: cond.icon
    };
  });

  return {
    locationName,
    temp,
    feelsLike: Math.round(current.apparent_temperature || temp),
    condition: condition.text,
    icon: condition.icon,
    iconColor: condition.color,
    humidity,
    windSpeed,
    rainProb,
    sunrise: daily.sunrise ? daily.sunrise[0].split('T')[1] : '05:42 AM',
    sunset: daily.sunset ? daily.sunset[0].split('T')[1] : '06:18 PM',
    forecast,
    advisory,
    isDemo
  };
}

function generateAgroAdvisory(temp, rainProb, windSpeed, humidity) {
  const alerts = [];

  // Irrigation Advisory
  if (rainProb > 50) {
    alerts.push({
      type: 'warning',
      category: 'सिंचाई (Irrigation)',
      message: 'अगले 24-48 घंटों में बारिश की संभावना ' + rainProb + '% है। गेहूं और धान में सिंचाई स्थगित रखें, जिससे जलभराव न हो।',
      suitable: false
    });
  } else {
    alerts.push({
      type: 'success',
      category: 'सिंचाई (Irrigation)',
      message: 'बारिश की संभावना बहुत कम (' + rainProb + '%) है। यदि खेत में नमी कम है तो हल्की सिंचाई करना उपयुक्त रहेगा।',
      suitable: true
    });
  }

  // Spraying Advisory (Nano Urea / Pesticides)
  if (windSpeed > 15) {
    alerts.push({
      type: 'danger',
      category: 'छिड़काव (Spraying Advisory)',
      message: 'हवा की गति ' + windSpeed + ' किमी/घंटा है (15 किमी से अधिक)। कीटनाशक या नैनो यूरिया का छिड़काव न करें, बहाव से दवा व्यर्थ होगी।',
      suitable: false
    });
  } else if (rainProb > 40) {
    alerts.push({
      type: 'warning',
      category: 'छिड़काव (Spraying Advisory)',
      message: 'संभावित बारिश के कारण दवा धुलने का खतरा है। मौसम साफ होने की प्रतीक्षा करें।',
      suitable: false
    });
  } else {
    alerts.push({
      type: 'success',
      category: 'छिड़काव (Spraying Advisory)',
      message: 'शांत हवा (' + windSpeed + ' किमी/घंटा) एवं खुला मौसम। नैनो यूरिया व कीटनाशक छिड़काव हेतु सर्वोत्तम समय।',
      suitable: true
    });
  }

  // Temperature / Heat / Frost Alert
  if (temp > 38) {
    alerts.push({
      type: 'danger',
      category: 'तापमान चेतावनी (Heat Advisory)',
      message: 'अत्यधिक तापमान (' + temp + '°C)। सब्जियों एवं दलहनी फसलों में शाम के समय हल्की सिंचाई करें।',
      suitable: false
    });
  } else if (temp < 8) {
    alerts.push({
      type: 'warning',
      category: 'पाला/शीत लहर (Frost Advisory)',
      message: 'कम तापमान (' + temp + '°C)। पाला पड़ने की आशंका, रात में खेत की मेड़ों पर हल्का धुआं करें।',
      suitable: false
    });
  }

  return alerts;
}

function getFallbackWeatherData(locationName) {
  return {
    locationName: locationName || 'Chakia, East Champaran, Bihar',
    temp: 29,
    feelsLike: 31,
    condition: 'आंशिक बादल (Partly Cloudy)',
    icon: 'fa-cloud-sun',
    iconColor: '#eab308',
    humidity: 68,
    windSpeed: 9,
    rainProb: 20,
    sunrise: '05:44 AM',
    sunset: '06:12 PM',
    isDemo: true,
    advisory: [
      {
        type: 'success',
        category: 'सिंचाई (Irrigation)',
        message: 'खेत में पर्याप्त नमी न होने पर शाम के समय हल्की सिंचाई करें।',
        suitable: true
      },
      {
        type: 'success',
        category: 'छिड़काव (Spraying)',
        message: 'हवा की गति सामान्य (9 km/h)। जिंक व नैनो डीएपी के छिड़काव के लिए उपयुक्त समय।',
        suitable: true
      }
    ],
    forecast: [
      { day: 'आज (Today)', date: '18/09', maxTemp: 31, minTemp: 23, rainProb: 20, condition: 'आंशिक बादल', icon: 'fa-cloud-sun' },
      { day: 'कल (Tomorrow)', date: '19/09', maxTemp: 30, minTemp: 22, rainProb: 35, condition: 'हल्की बारिश', icon: 'fa-cloud-rain' },
      { day: 'शनि (Sat)', date: '20/09', maxTemp: 29, minTemp: 22, rainProb: 60, condition: 'बारिश', icon: 'fa-cloud-showers-heavy' },
      { day: 'रवि (Sun)', date: '21/09', maxTemp: 31, minTemp: 24, rainProb: 15, condition: 'धूप', icon: 'fa-sun' },
      { day: 'सोम (Mon)', date: '22/09', maxTemp: 32, minTemp: 24, rainProb: 10, condition: 'धूप', icon: 'fa-sun' },
      { day: 'मंगल (Tue)', date: '23/09', maxTemp: 32, minTemp: 23, rainProb: 15, condition: 'आंशिक बादल', icon: 'fa-cloud-sun' },
      { day: 'बुध (Wed)', date: '24/09', maxTemp: 33, minTemp: 25, rainProb: 20, condition: 'धूप', icon: 'fa-sun' }
    ]
  };
}
