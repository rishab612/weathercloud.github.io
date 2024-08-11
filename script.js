const apiKey = '14b845b128104bc29af112141241108'; // WeatherAPI key
const radarUrl = 'https://embed.windy.com/embed2.html'; // Radar URL
const geocodingApiKey = '66b8acd37517c194151135mul947733'; // Geocoding API key

document.getElementById('searchButton').addEventListener('click', fetchWeather);
document.getElementById('search').addEventListener('input', handleInput);
document.getElementById('search').addEventListener('keydown', handleKeyDown);

let suggestions = [];
let selectedIndex = -1;

window.onload = () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            fetchWeatherByLocation(lat, lon);
        }, () => {
            alert('Geolocation is not enabled. Default location will be shown.');
            fetchWeatherByCity('Kolkata'); // Default city if geolocation is denied
        });
    } else {
        alert('Geolocation is not supported by this browser.');
        fetchWeatherByCity('Kolkata'); // Default city if geolocation is not supported
    }
};

function handleInput() {
    const query = document.getElementById('search').value;
    if (query.length >= 2) {
        fetchSuggestions(query);
    } else {
        clearSuggestions();
    }
}

function handleKeyDown(event) {
    if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (selectedIndex < suggestions.length - 1) {
            selectedIndex++;
            updateSuggestionSelection();
        }
    } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (selectedIndex > 0) {
            selectedIndex--;
            updateSuggestionSelection();
        }
    } else if (event.key === 'Enter') {
        event.preventDefault();
        if (selectedIndex > -1) {
            const selectedSuggestion = suggestions[selectedIndex];
            document.getElementById('search').value = selectedSuggestion.display_name;
            fetchWeatherByCity(selectedSuggestion.display_name);
            clearSuggestions();
        }
    }
}

function fetchSuggestions(query) {
    const url = `https://geocode.maps.co/search?q=${query}&api_key=${geocodingApiKey}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                suggestions = data;
                displaySuggestions(data);
            } else {
                clearSuggestions();
            }
        })
        .catch(error => console.error('Error fetching location suggestions:', error));
}

function displaySuggestions(suggestionsData) {
    const suggestionsList = document.getElementById('suggestions');
    suggestionsList.innerHTML = '';

    suggestionsData.forEach((suggestion, index) => {
        const li = document.createElement('li');
        li.textContent = suggestion.display_name;
        li.addEventListener('click', () => {
            document.getElementById('search').value = suggestion.display_name;
            fetchWeatherByCity(suggestion.display_name);
            clearSuggestions();
        });
        li.addEventListener('mouseover', () => {
            selectedIndex = index;
            updateSuggestionSelection();
        });
        suggestionsList.appendChild(li);
    });

    suggestionsList.style.display = 'block'; // Ensure suggestions are visible
}

function updateSuggestionSelection() {
    const suggestionsList = document.getElementById('suggestions');
    const items = suggestionsList.querySelectorAll('li');
    items.forEach((item, index) => {
        item.classList.toggle('selected', index === selectedIndex);
    });
}

function clearSuggestions() {
    const suggestionsList = document.getElementById('suggestions');
    suggestionsList.innerHTML = '';
    suggestionsList.style.display = 'none'; // Hide suggestions
    selectedIndex = -1; // Reset selected index
}

function fetchWeather() {
    const city = document.getElementById('search').value;
    fetchWeatherByCity(city);
}

function fetchWeatherByCity(city) {
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${city}&days=7`;

    fetch(url)
        .then(response => response.json())
        .then(data => updateWeather(data))
        .catch(error => console.error('Error fetching the weather data:', error));
}

function fetchWeatherByLocation(lat, lon) {
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lon}&days=7`;

    fetch(url)
        .then(response => response.json())
        .then(data => updateWeather(data))
        .catch(error => console.error('Error fetching the weather data:', error));
}

function updateWeather(data) {
    document.getElementById('city-name').textContent = data.location.name;
    document.getElementById('country-name').textContent = data.location.country;
    document.getElementById('date').textContent = data.location.localtime.split(' ')[0];
    document.getElementById('temperature').textContent = `${data.current.temp_c} °C`;
    document.getElementById('weather-description').textContent = data.current.condition.text;
    document.getElementById('weather-icon').src = data.current.condition.icon;

    // Update detailed weather information
    document.getElementById('feels-like').textContent = `${data.current.feelslike_c} °C`;
    document.getElementById('humidity').textContent = `${data.current.humidity}%`;
    document.getElementById('wind-speed').textContent = `${data.current.wind_kph} kph ${data.current.wind_dir}`;
    document.getElementById('pressure').textContent = `${data.current.pressure_mb} mb`;
    document.getElementById('visibility').textContent = `${data.current.vis_km} km`;
    document.getElementById('uv').textContent = data.current.uv;
    document.getElementById('sunrise').textContent = data.forecast.forecastday[0].astro.sunrise;
    document.getElementById('sunset').textContent = data.forecast.forecastday[0].astro.sunset;
    document.getElementById('air-quality').textContent = 'N/A'; // WeatherAPI does not provide air quality data

    // Generate lifestyle tips
    document.getElementById('lifestyle-tips').textContent = generateLifestyleTips(data.current);

    // Update forecast
    const forecastCards = document.getElementById('forecast-cards');
    forecastCards.innerHTML = ''; // Clear previous forecast cards

    data.forecast.forecastday.forEach((day) => {
        const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' });
        const card = `
            <div class="forecast-card">
                <h4>${dayName}</h4>
                <p>${day.day.avgtemp_c} °C</p>
                <p>${day.day.condition.text}</p>
            </div>
        `;
        forecastCards.innerHTML += card;
    });

    // Update radar
    updateRadar(data.location.lat, data.location.lon);
}

function updateRadar(lat, lon) {
    document.getElementById('radarFrame').src = `${radarUrl}?lat=${lat}&lon=${lon}&zoom=5`;
}

function generateLifestyleTips(data) {
    let tips = '';

    if (data.temp_c < 10) {
        tips += 'It’s cold outside, wear warm clothes. ';
    } else if (data.temp_c > 30) {
        tips += 'It’s hot outside, stay hydrated! ';
    }

    if (data.uv > 6) {
        tips += 'High UV index, wear sunscreen. ';
    }

    if (data.humidity > 70) {
        tips += 'High humidity, you might feel sticky. ';
    }

    return tips;
}
