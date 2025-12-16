const API_KEY = "3b7bf83236e590c1f3ceaddbe1b6713f";


const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");

searchBtn.addEventListener("click", () => {
    const city = searchInput.value;
    if (city) {
        getWeather(city);
    }
});

function getWeather(city) {
    const currentURL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=imperial&appid=${API_KEY}`;

    fetch(currentURL)
        .then(res => res.json())
        .then(data => {
            console.log("CURRENT WEATHER:", data);

            document.getElementById("city").textContent = data.name;
            document.getElementById("temp").textContent = `${Math.round(data.main.temp)}°F`;
            document.getElementById("feelsLike").textContent =
                `Feels like: ${Math.round(data.main.feels_like)}°F`;
            document.getElementById("humidity").textContent =
                `Humidity: ${data.main.humidity}%`;
            document.getElementById("visibility").textContent =
                `Visibility: ${data.visibility}`;
        });

    getForecast(city);
}

function getForecast(city) {
    const forecastURL = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=imperial&appid=${API_KEY}`;

    fetch(forecastURL)
        .then(res => res.json())
        .then(data => {
            console.log("5 DAY FORECAST:", data);

            const forecastEl = document.getElementById("forecast");
            forecastEl.innerHTML = "";

            const dailyForecast = data.list.filter(item =>
                item.dt_txt.includes("12:00:00")
            );

            dailyForecast.slice(0, 5).forEach(day => {
                const col = document.createElement("div");
                col.className = "col";

                col.innerHTML = `
          <div class="forecast-card">
            <p>${new Date(day.dt_txt).toLocaleDateString("en-US", { weekday: "short" })}</p>
            <h5>${Math.round(day.main.temp)}°F</h5>
            <p>${day.weather[0].main}</p>
          </div>
        `;

                forecastEl.appendChild(col);
            });
        });
}