const API_KEY = "3b7bf83236e590c1f3ceaddbe1b6713f";

const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
let highLowChartInstance = null;

function getGeolocationWeather() {
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
    const currentURL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=imperial&appid=${API_KEY}`;

    fetch(currentURL)
        .then(res => res.json())
        .then(data => {
            updateCurrentWeather(data);
        });

    getForecast(city);
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

searchBtn.addEventListener("click", () => {
    const city = searchInput.value;
    if (city) {
        getWeather(city);
    }
});

getGeolocationWeather();
