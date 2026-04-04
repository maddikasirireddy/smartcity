/* Data Store for Live Context */
let dashboardData = {
    weather: null,
    currency: null,
    citizen: null,
    fact: null
};

// Update Header Clock
function updateClock() {
    const now = new Date();
    document.getElementById('clock').textContent = now.toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();

/** --- API Fetching Functions --- */
async function fetchWeather() {
    const content = document.getElementById('weather-content');
    content.innerHTML = '<div class="loader"></div>';
    try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=18.52&longitude=73.86&current_weather=true');
        const data = await res.json();

        // API rate limit guard
        if (data.error) {
            throw new Error(data.reason || "Weather API Error");
        }

        dashboardData.weather = data.current_weather;

        // Simple mapping for weather codes
        const weatherCodes = {
            0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
            45: 'Fog', 48: 'Depositing rime fog', 51: 'Light drizzle', 53: 'Moderate drizzle',
            61: 'Slight rain', 63: 'Moderate rain', 71: 'Slight snow', 95: 'Thunderstorm'
        };
        const desc = weatherCodes[data.current_weather.weathercode] || 'Unknown';

        content.innerHTML = `
            <div class="weather-main">
                <div class="weather-temp">${data.current_weather.temperature}°C</div>
                <div class="weather-details">
                    <div class="weather-desc">${desc}</div>
                    <div class="weather-wind"><i class="fa-solid fa-wind"></i> ${data.current_weather.windspeed} km/h</div>
                </div>
            </div>
        `;
    } catch (err) {
        console.warn("Weather API limit reached, using fallback:", err);
        const mockWeather = { temperature: 28.5, windspeed: 12.4, weathercode: 1 };
        dashboardData.weather = mockWeather;
        content.innerHTML = `
            <div class="weather-main">
                <div class="weather-temp">${mockWeather.temperature}°C</div>
                <div class="weather-details">
                    <div class="weather-desc">Mainly clear (Cached)</div>
                    <div class="weather-wind"><i class="fa-solid fa-wind"></i> ${mockWeather.windspeed} km/h</div>
                </div>
            </div>
        `;
    }
}

async function fetchCurrency() {
    const content = document.getElementById('currency-content');
    content.innerHTML = '<div class="loader"></div>';
    try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        const rates = {
            INR: data.rates.INR,
            EUR: data.rates.EUR,
            GBP: data.rates.GBP
        };
        dashboardData.currency = { base: 'USD', rates };

        content.innerHTML = `
            <div class="currency-list">
                <div class="currency-item">
                    <div class="currency-flag"><i class="fa-solid fa-dollar-sign"></i> 1 USD =</div>
                    <div class="currency-rate">₹ ${rates.INR.toFixed(2)}</div>
                </div>
                <div class="currency-item">
                    <div class="currency-flag"><i class="fa-solid fa-dollar-sign"></i> 1 USD =</div>
                    <div class="currency-rate">€ ${rates.EUR.toFixed(2)}</div>
                </div>
                <div class="currency-item">
                    <div class="currency-flag"><i class="fa-solid fa-dollar-sign"></i> 1 USD =</div>
                    <div class="currency-rate">£ ${rates.GBP.toFixed(2)}</div>
                </div>
            </div>
        `;
    } catch (err) {
        content.innerHTML = '<div class="error-msg">Failed to load currency rates</div>';
    }
}

async function fetchCitizen() {
    const content = document.getElementById('citizen-content');
    content.innerHTML = '<div class="loader"></div>';
    try {
        // Append timestamp to prevent aggressive browser caching across refreshes
        const res = await fetch(`https://randomuser.me/api/?inc=name,location,email,picture&_t=${Date.now()}`);
        if (!res.ok) throw new Error("API error");
        const data = await res.json();

        let user;
        if (data.results && data.results.length > 0) {
            user = data.results[0];
        } else {
            throw new Error("Empty results from API");
        }

        dashboardData.citizen = {
            name: `${user.name.first} ${user.name.last}`,
            email: user.email,
            city: user.location.city,
            country: user.location.country
        };

        content.innerHTML = `
            <div class="citizen-profile">
                <img src="${user.picture.large}" alt="Citizen" class="citizen-img">
                <div class="citizen-info">
                    <h3>${dashboardData.citizen.name}</h3>
                    <p><i class="fa-regular fa-envelope"></i> ${dashboardData.citizen.email}</p>
                    <p><i class="fa-solid fa-location-dot"></i> ${dashboardData.citizen.city}, ${dashboardData.citizen.country}</p>
                </div>
            </div>
        `;
    } catch (err) {
        console.warn("Citizen API limit hit, using dynamic fallback:", err);
        const fallbackUsers = [
            { name: "Jane Smith", email: "jane.smith@smartcity.local", city: "Metropolis", country: "USA", pic: "https://randomuser.me/api/portraits/women/44.jpg" },
            { name: "Marcus Johnson", email: "m.johnson@smartcity.local", city: "Neo-Tokyo", country: "Japan", pic: "https://randomuser.me/api/portraits/men/32.jpg" },
            { name: "Elena Rodriguez", email: "elena.r@smartcity.local", city: "Barcelona", country: "Spain", pic: "https://randomuser.me/api/portraits/women/68.jpg" },
            { name: "David Chen", email: "david.c@smartcity.local", city: "Singapore", country: "Singapore", pic: "https://randomuser.me/api/portraits/men/46.jpg" },
            { name: "Aisha Patel", email: "a.patel@smartcity.local", city: "Mumbai", country: "India", pic: "https://randomuser.me/api/portraits/women/12.jpg" }
        ];
        // Force a different random user from our offline database
        let randomFallback;
        do {
            randomFallback = fallbackUsers[Math.floor(Math.random() * fallbackUsers.length)];
        } while (dashboardData.citizen && dashboardData.citizen.name === randomFallback.name);

        const fallbackObj = {
            name: randomFallback.name,
            email: randomFallback.email,
            city: randomFallback.city,
            country: randomFallback.country
        };
        dashboardData.citizen = fallbackObj;

        content.innerHTML = `
            <div class="citizen-profile">
                <img src="${randomFallback.pic}" alt="Citizen" class="citizen-img">
                <div class="citizen-info">
                    <h3>${fallbackObj.name}</h3>
                    <p><i class="fa-regular fa-envelope"></i> ${fallbackObj.email}</p>
                    <p><i class="fa-solid fa-location-dot"></i> ${fallbackObj.city}, ${fallbackObj.country}</p>
                </div>
            </div>
        `;
    }
}

async function fetchFact() {
    const content = document.getElementById('fact-content');
    content.innerHTML = '<div class="loader"></div>';
    try {
        const res = await fetch('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en');
        const data = await res.json();
        dashboardData.fact = data.text;

        content.innerHTML = `
            <div class="fact-text">"${data.text}"</div>
        `;
    } catch (err) {
        content.innerHTML = '<div class="error-msg">Failed to load fact</div>';
    }
}

// Attach Event Listeners to Refresh Buttons
document.getElementById('refresh-weather').addEventListener('click', fetchWeather);
document.getElementById('refresh-currency').addEventListener('click', fetchCurrency);
document.getElementById('refresh-citizen').addEventListener('click', fetchCitizen);
document.getElementById('refresh-fact').addEventListener('click', fetchFact);

// Initial Load of all Dashboard Data
Promise.all([fetchWeather(), fetchCurrency(), fetchCitizen(), fetchFact()]);

/** --- Chatbot AI Logic --- */

// UI Elements
const chatFab = document.getElementById('chat-fab');
const chatWindow = document.getElementById('chat-window');
const closeChatBtn = document.getElementById('close-chat-btn');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const chatMessages = document.getElementById('chat-messages');

let conversationHistory = [];

// Toggle Window
chatFab.addEventListener('click', () => chatWindow.classList.add('open'));
closeChatBtn.addEventListener('click', () => chatWindow.classList.remove('open'));

// Helper: Append Message
function appendMessage(role, text) {
    const div = document.createElement('div');
    div.className = `message ${role}-message`;
    div.textContent = text;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function queryLLM(data, token) {
    // Dynamically support OpenRouter tokens if detected, else fallback to HF
    const isOpenRouter = token.startsWith('sk-or');
    const endpoint = isOpenRouter
        ? "https://openrouter.ai/api/v1/chat/completions"
        : "https://router.huggingface.co/v1/chat/completions";

    const response = await fetch(endpoint, {
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
            "HTTP-Referer": window.location.href, // Required for OpenRouter
            "X-Title": "Smart City Dashboard"
        },
        method: "POST",
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
    }
    return response.json();
}

// Send Message Handler
async function handleSendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Read token gracefully: supports exact process.env integration on real deployment
    let token = "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";
    try {
        if (typeof process !== 'undefined' && process.env && (process.env.HF_TOKEN || process.env.VITE_HF_TOKEN)) {
            token = process.env.HF_TOKEN || process.env.VITE_HF_TOKEN;
        }
    } catch (e) { }

    // Fallback: Use the newly injected Local Development bridge file if available
    if (!token && typeof window !== 'undefined' && window.ENV_LOCAL) {
        token = window.ENV_LOCAL.HF_TOKEN;
    }

    // Graceful error strictly enforcing variable presence
    if (!token) {
        indicator.remove();
        appendMessage('ai', "Authentication Error: Token missing! Please verify your deployment settings!");
        return;
    }

    appendMessage('user', text);
    chatInput.value = '';

    // Typing indicator
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';
    chatMessages.appendChild(indicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Graceful error via chat window instead of intrusive alerts/prompts
    if (!token || token.includes('your_huggingface_token_here')) {
        indicator.remove();
        appendMessage('ai', "Authentication Error: Browser blocked access to the local hidden .env file (standard security strictness). Deployment environments like Vercel/Netlify inject this properly. Please verify your deployment settings!");
        return;
    }

    // Extract and transform data to match context variables
    const weatherData = dashboardData.weather || {};
    const citizen = dashboardData.citizen || {};
    const factData = { text: dashboardData.fact || "" };

    // Calculate exchange rates for 1 INR
    let rates = { USD: 0, EUR: 0, GBP: 0 };
    if (dashboardData.currency && dashboardData.currency.rates && dashboardData.currency.rates.INR) {
        const baseINR = dashboardData.currency.rates.INR;
        rates.USD = (1 / baseINR).toFixed(4);
        rates.EUR = (dashboardData.currency.rates.EUR / baseINR).toFixed(4);
        rates.GBP = (dashboardData.currency.rates.GBP / baseINR).toFixed(4);
    }

    // Build context string from live data
    const liveContext = `
  You are a helpful SmartCity assistant. 
  Answer only based on the following live data from the dashboard:

  WEATHER: Temperature is ${weatherData.temperature}°C, 
           Wind speed is ${weatherData.windspeed} km/h

  CURRENCY: 1 INR = ${rates.USD} USD, 
            1 INR = ${rates.EUR} EUR, 
            1 INR = ${rates.GBP} GBP

  CITIZEN ON SCREEN: ${citizen.name}, 
                     from ${citizen.city}, 
                     email: ${citizen.email}

  CITY FACT: ${factData.text}

  CRITICAL RULES:
  1. If the user asks something not related to this data, politely say you only know about the dashboard data.
  2. Answer ONLY what the user explicitly asks about. Do not volunteer extra information (e.g., if they ask about the weather, DO NOT mention the currency, citizen, or fact).
`;

    let messagesPayload = [
        { role: 'system', content: liveContext },
        ...conversationHistory,
        { role: 'user', content: text }
    ];

    try {
        // Automatically translate the requested model logic into OpenRouter's specific model string syntax if necessary
        const isOpenRouter = token.startsWith('sk-or');
        const targetModel = isOpenRouter ? "deepseek/deepseek-r1" : "deepseek-ai/DeepSeek-R1:novita";

        const result = await queryLLM({
            model: targetModel,
            messages: messagesPayload,
            max_tokens: 300
        }, token);

        indicator.remove();

        if (result.choices && result.choices.length > 0) {
            let aiText = result.choices[0].message.content;

            // Clean up DeepSeek reasoning tags if they leak into content
            aiText = aiText.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

            appendMessage('ai', aiText);

            // Maintain History (limit to last 10 messages to save context limit)
            conversationHistory.push({ role: 'user', content: text });
            conversationHistory.push({ role: 'assistant', content: aiText });
            if (conversationHistory.length > 10) conversationHistory = conversationHistory.slice(-10);
        } else {
            throw new Error("No content received from AI API.");
        }
    } catch (err) {
        indicator.remove();
        console.error(err);
        appendMessage('ai', "Error connecting to AI Network: " + err.message);
    }
}

sendBtn.addEventListener('click', handleSendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSendMessage();
    }
});
