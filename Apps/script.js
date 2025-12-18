const LAST_CITIES_KEY = 'weatherAppLastCities';
const FAVORITE_CITY_KEY = 'weatherAppFavoriteCity';
const MAX_CITIES = 5;

function getRecentCities() {
    const citiesJson = localStorage.getItem(LAST_CITIES_KEY);
    return citiesJson ? JSON.parse(citiesJson) : [];
}

function saveCityToRecents(city) {
    if (!city) return;

    let cities = getRecentCities();

    cities = cities.filter(c => c.toLowerCase() !== city.toLowerCase());

    cities.unshift(city);

    if (cities.length > MAX_CITIES) {
        cities = cities.slice(0, MAX_CITIES);
    }

    localStorage.setItem(LAST_CITIES_KEY, JSON.stringify(cities));
}

function getFavoriteCity() {
    return localStorage.getItem(FAVORITE_CITY_KEY);
}

function toggleFavorite(city, isFavorite) {
    if (isFavorite) {
        localStorage.setItem(FAVORITE_CITY_KEY, city);
    } else {
        if (getFavoriteCity() === city) {
            localStorage.removeItem(FAVORITE_CITY_KEY);
        }
    }
}

const API_KEY = "eb1c4bda4384855215d07d22985d368f";

const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const favoriteIcon = document.getElementById("favoriteIcon");
const recentDropdown = document.getElementById("recentSearchesDropdown");

let highLowChartInstance = null;
let currentCity = "";

function updateFavoriteIcon(city) {
    const favorite = getFavoriteCity();
    if (favorite && favorite.toLowerCase() === city.toLowerCase()) {
        favoriteIcon.classList.add('is-favorite');
    } else {
        favoriteIcon.classList.remove('is-favorite');
    }
}

function renderRecentCities() {
    const cities = getRecentCities();
    recentDropdown.innerHTML = '';

    if (cities.length === 0) {
        recentDropdown.style.display = 'none';
        return;
    }

    cities.forEach(city => {
        const favorite = getFavoriteCity();
        const isFavorite = favorite && favorite.toLowerCase() === city.toLowerCase();

        const item = document.createElement('div');
        item.classList.add('recent-search-item');
        item.classList.add('p-2');

        const cityText = document.createElement('span');
        cityText.classList.add('dropdown-city-text');
        cityText.textContent = city;
        cityText.addEventListener('click', () => {
            searchInput.value = city;
            getWeather(city);
            recentDropdown.style.display = 'none';
        });

        const favIcon = document.createElement('span');
        favIcon.classList.add('dropdown-favorite-icon', 'fas', 'fa-heart');
        if (isFavorite) {
            favIcon.classList.add('is-favorite');
        }

        favIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            const currentlyFavorite = favIcon.classList.toggle('is-favorite');
            toggleFavorite(city, currentlyFavorite);

            renderRecentCities();
            updateFavoriteIcon(city);
        });

        item.appendChild(cityText);
        item.appendChild(favIcon);
        recentDropdown.appendChild(item);
    });

    if (document.activeElement === searchInput || searchInput.value.length > 0) {
        recentDropdown.style.display = 'block';
    }
}

function getGeolocationWeather() {
    const favoriteCity = getFavoriteCity();
    if (favoriteCity) {
        getWeather(favoriteCity);
        return;
    }

    if (!navigator.geolocation) {
        getWeather("London");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            const currentURL = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${API_KEY}`;

            fetch(currentURL)
                .then(res => res.json())
                .then(data => {
                    updateCurrentWeather(data);
                    getForecast(data.name);

                    saveCityToRecents(data.name);
                    currentCity = data.name;
                    updateFavoriteIcon(currentCity);
                    renderRecentCities();
                })
                .catch(err => {
                    getWeather("London");
                });
        },
        (error) => {
            document.getElementById("city").textContent = "Location Denied or Unavailable";
            getWeather("London");
        }
    );
}

function getWeather(city) {
    if (!city) return;

    const currentURL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=imperial&appid=${API_KEY}`;

    fetch(currentURL)
        .then(res => res.json())
        .then(data => {
            if (data.cod === "404") {
                alert("City not found. Please try again.");
                return;
            }

            updateCurrentWeather(data);
            getForecast(city);

            saveCityToRecents(city);
            currentCity = data.name;
            updateFavoriteIcon(currentCity);
            renderRecentCities();

        })
        .catch(error => {
            alert("Could not fetch weather data.");
        });
}

function updateCurrentWeather(data) {
    document.getElementById("city").textContent = data.name;
    document.getElementById("temp").textContent = `${Math.round(data.main.temp)}°F`;
    document.getElementById("feelsLike").textContent =
        `Feels like: ${Math.round(data.main.feels_like)}°F`;
    document.getElementById("humidity").textContent =
        `Humidity: ${data.main.humidity}%`;
    document.getElementById("visibility").textContent =
        `Visibility: ${data.visibility / 1000} km`;
    document.getElementById("description").textContent =
        `${data.weather[0].description.replace(/\b\w/g, l => l.toUpperCase())}`;
    document.getElementById("currentIcon").src =
        `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
}

function createHighLowChart(labels, highs, lows) {
    const chartContainer = document.querySelector('.chart-container');

    const oldCanvas = document.getElementById('highLowChart');
    if (oldCanvas) {
        oldCanvas.remove();
    }

    const newCanvas = document.createElement('canvas');
    newCanvas.id = 'highLowChart';
    chartContainer.appendChild(newCanvas);

    const ctx = newCanvas.getContext('2d');

    highLowChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                    label: 'High Temp (°F)',
                    data: highs,
                    backgroundColor: 'rgba(255, 99, 132, 0.8)',
                },
                {
                    label: 'Low Temp (°F)',
                    data: lows,
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                },
            },
            plugins: {
                tooltip: {
                    enabled: false
                },
                hover: {
                    mode: null
                }
            }
        }
    });
}

function getForecast(city) {
    const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=imperial&appid=${API_KEY}`;

    fetch(forecastURL)
        .then(res => res.json())
        .then(data => {
            const forecastEl = document.getElementById("forecast");
            forecastEl.innerHTML = "";

            const processedForecasts = [];
            const uniqueDates = new Set();

            for (const item of data.list) {
                const dateText = item.dt_txt.split(" ")[0];

                if (!uniqueDates.has(dateText) && processedForecasts.length < 5) {
                    uniqueDates.add(dateText);
                    processedForecasts.push(item);
                }
                if (processedForecasts.length >= 5) {
                    break;
                }
            }

            const chartData = processedForecasts;

            const labels = chartData.map(day =>
                new Date(day.dt * 1000).toLocaleDateString("en-US", { weekday: "short" })
            );

            const highs = chartData.map(day => Math.round(day.main.temp_max));
            const lows = chartData.map(day => Math.round(day.main.temp_min));

            createHighLowChart(labels, highs, lows);

            chartData.forEach(day => {
                const col = document.createElement("div");
                col.className = "col";

                col.innerHTML = `
                    <div class="forecast-day-card p-3 shadow">
                        <p class="mb-1 fw-bold">${new Date(day.dt * 1000).toLocaleDateString("en-US", { weekday: "short" })}</p>
                        <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" alt="${day.weather[0].description}" class="weather-icon">
                        <p class="mb-1">${day.weather[0].main}</p>
                        <p class="small mb-0">High: <span class="text-danger">${Math.round(day.main.temp_max)}°F</span></p>
                        <p class="small mb-0">Low: <span class="text-primary">${Math.round(day.main.temp_min)}°F</span></p>
                    </div>
                `;

                forecastEl.appendChild(col);
            });
        });
}


favoriteIcon.addEventListener("click", () => {
    if (!currentCity) return;

    const isCurrentlyFavorite = favoriteIcon.classList.contains('is-favorite');

    if (isCurrentlyFavorite) {
        toggleFavorite(currentCity, false);
        favoriteIcon.classList.remove('is-favorite');
    } else {
        toggleFavorite(currentCity, true);
        favoriteIcon.classList.add('is-favorite');
    }

    renderRecentCities();
});


searchBtn.addEventListener("click", () => {
    const city = searchInput.value.trim();
    if (city) {
        getWeather(city);
    }
});

searchInput.addEventListener("input", () => {
    if (searchInput.value.length > 0) {
        renderRecentCities();
        recentDropdown.style.display = 'block';
    } else {
        renderRecentCities();
    }
});

searchInput.addEventListener("focus", renderRecentCities);
searchInput.addEventListener("blur", () => {
    setTimeout(() => {
        recentDropdown.style.display = 'none';
    }, 200);
});

getGeolocationWeather();