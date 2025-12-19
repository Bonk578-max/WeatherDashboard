const API_KEY = "eb1c4bda4384855215d07d22985d368f";
let chartInstance = null;
let currentCity = "";

function getFavorites() {
    const f = localStorage.getItem('weather_favs');
    return f ? JSON.parse(f) : [];
}

function getRecents() {
    const r = localStorage.getItem('weather_last');
    return r ? JSON.parse(r) : [];
}

function updateDropdown() {
    const menu = document.getElementById("recentSearchesDropdown");
    const favs = getFavorites().slice(0, 3);
    const recents = getRecents().filter(c => !favs.includes(c)).slice(0, 5);
    menu.innerHTML = "";
    const list = [...favs.map(c => ({ n: c, f: true })), ...recents.map(c => ({ n: c, f: false }))];
    if (list.length > 0) {
        list.forEach(item => {
            const div = document.createElement("div");
            div.className = "dropdown-item d-flex justify-content-between align-items-center";
            div.innerHTML = `<span>${item.n}</span> ${item.f ? '<span class="fav-tag">FAV</span>' : ''}`;
            div.onclick = () => {
                getWeather(item.n);
                menu.classList.remove("show");
            };
            menu.appendChild(div);
        });
    }
}

function saveToHistory(city) {
    let r = getRecents().filter(c => c !== city);
    r.unshift(city);
    localStorage.setItem('weather_last', JSON.stringify(r.slice(0, 10)));
}

function getWeather(city) {
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=imperial&appid=${API_KEY}`)
        .then(res => res.json())
        .then(data => {
            if (data.cod !== 200) return;
            currentCity = data.name;
            document.getElementById("city").textContent = data.name;
            document.getElementById("temp").textContent = Math.round(data.main.temp) + "°F";
            document.getElementById("feelsLike").textContent = "Feels like " + Math.round(data.main.feels_like) + "°F";
            document.getElementById("visibility").textContent = (data.visibility / 1000).toFixed(1) + "km";
            document.getElementById("humidity").textContent = data.main.humidity + "%";
            const icon = document.getElementById("currentIcon");
            if (icon) icon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
            if (getFavorites().includes(data.name)) {
                document.getElementById("favoriteIcon").classList.add("is-favorite");
            } else {
                document.getElementById("favoriteIcon").classList.remove("is-favorite");
            }
            saveToHistory(data.name);
            getForecast(data.name);
            updateDropdown();
        });
}

document.getElementById("favoriteIcon").onclick = () => {
    if (!currentCity) return;
    let f = getFavorites();
    if (f.includes(currentCity)) {
        f = f.filter(c => c !== currentCity);
        document.getElementById("favoriteIcon").classList.remove("is-favorite");
    } else {
        f.unshift(currentCity);
        document.getElementById("favoriteIcon").classList.add("is-favorite");
    }
    localStorage.setItem('weather_favs', JSON.stringify(f));
    updateDropdown();
};

document.getElementById("searchInput").onfocus = () => {
    updateDropdown();
    document.getElementById("recentSearchesDropdown").classList.add("show");
};

document.addEventListener("click", (e) => {
    if (!e.target.closest(".col-md-4")) {
        document.getElementById("recentSearchesDropdown").classList.remove("show");
    }
});

function getForecast(city) {
    fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=imperial&appid=${API_KEY}`)
        .then(res => res.json())
        .then(data => {
            const daily = data.list.filter((f, i) => i % 8 === 0).slice(0, 5);
            const labels = daily.map(d => new Date(d.dt * 1000).toLocaleDateString("en-US", { weekday: "short" }));
            const highs = daily.map(d => Math.round(d.main.temp_max));
            const lows = daily.map(d => Math.round(d.main.temp_min));
            if (chartInstance) chartInstance.destroy();
            chartInstance = new Chart(document.getElementById('highLowChart'), {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        { data: highs, backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 5 },
                        { data: lows, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 5 }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { display: false }, x: { ticks: { color: "#999" }, grid: { display: false } } }
                }
            });
            const container = document.getElementById("forecast");
            container.innerHTML = "";
            daily.forEach(d => {
                const div = document.createElement("div");
                div.className = "col";
                div.innerHTML = `<div class="forecast-card">
                    <p class="mb-0 small">${new Date(d.dt * 1000).toLocaleDateString("en-US", {weekday: 'short'}).toUpperCase()}</p>
                    <img src="https://openweathermap.org/img/wn/${d.weather[0].icon}.png">
                    <p class="mb-0 small fw-bold">${Math.round(d.main.temp)}°F</p>
                </div>`;
                container.appendChild(div);
            });
        });
}

document.getElementById("searchBtn").onclick = () => {
    getWeather(document.getElementById("searchInput").value);
};

function init() {
    const f = getFavorites();
    if (f.length > 0) {
        getWeather(f[0]);
    } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            p => {
                fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${p.coords.latitude}&lon=${p.coords.longitude}&units=imperial&appid=${API_KEY}`)
                    .then(r => r.json()).then(d => getWeather(d.name));
            },
            () => getWeather("Tokyo")
        );
    } else {
        getWeather("Tokyo");
    }
}

init();