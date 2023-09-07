var searchHistory = [];
var weatherApiRootUrl = "https://api.openweathermap.org";
var weatherApiKey = "ed813450ca6314a3fae457122ec0f9d2";

var searchForm = document.querySelector("#search-form");
var searchInput = document.querySelector("#search-input");
var todayContainer = document.querySelector("#today");
var forecastContainer = document.querySelector("#forecast");
var searchHistoryContainer = document.querySelector("#history");

dayjs.extend(window.dayjs_plugin_utc);
dayjs.extend(window.dayjs_plugin_timezone);

function renderSearchHistory() {
  searchHistoryContainer.innerHTML = "";

  var historyList = document.createElement("ul");
  historyList.classList.add("search-history-list");

  for (var i = searchHistory.length - 1; i >= 0; i--) {
    var listItem = document.createElement("li");
    listItem.classList.add("search-history-item");

    var btn = document.createElement("button");
    btn.setAttribute("type", "button");
    btn.classList.add("history-btn", "btn-history");
    btn.setAttribute("data-search", searchHistory[i]);
    btn.textContent = searchHistory[i];

    listItem.appendChild(btn);

    historyList.appendChild(listItem);
  }

  searchHistoryContainer.appendChild(historyList);
}

function appendToHistory(search) {
  if (!searchHistory.includes(search)) {
    searchHistory.unshift(search);

    if (searchHistory.length > 10) {
      searchHistory.pop();
    }

    localStorage.setItem("search-history", JSON.stringify(searchHistory));

    renderSearchHistory();
  }
}

function initSearchHistory() {
  var storedHistory = localStorage.getItem("search-history");
  if (storedHistory) {
    searchHistory = JSON.parse(storedHistory);
  }
  renderSearchHistory();
}

function renderCurrentWeather(city, data) {
  var date = dayjs().format("M/D/YYYY");

  if (data && data.list && data.list.length > 0) {
    var tempF = data.list[0].main.temp;
    var windMph = data.list[0].wind.speed;
    var humidity = data.list[0].main.humidity;
    var iconUrl = `https://openweathermap.org/img/w/${data.list[0].weather[0].icon}.png`;
    var iconDescription = data.list[0].weather[0].description;

    var weatherCard = document.createElement("div");
    weatherCard.classList.add("weather-card");

    var cardHeader = document.createElement("div");
    cardHeader.classList.add("card-header");

    var cardTitle = document.createElement("h2");
    cardTitle.textContent = `${city} (${date})`;

    var cardBody = document.createElement("div");
    cardBody.classList.add("card-body");

    var iconImg = document.createElement("img");
    iconImg.setAttribute("src", iconUrl);
    iconImg.setAttribute("alt", iconDescription);
    iconImg.classList.add("weather-icon");

    var tempPara = document.createElement("p");
    tempPara.textContent = `Temperature: ${tempF}°F`;

    var windPara = document.createElement("p");
    windPara.textContent = `Wind: ${windMph} MPH`;

    var humidityPara = document.createElement("p");
    humidityPara.textContent = `Humidity: ${humidity} %`;

    cardHeader.appendChild(cardTitle);
    cardBody.appendChild(iconImg);
    cardBody.appendChild(tempPara);
    cardBody.appendChild(windPara);
    cardBody.appendChild(humidityPara);

    weatherCard.appendChild(cardHeader);
    weatherCard.appendChild(cardBody);

    todayContainer.innerHTML = "";
    todayContainer.appendChild(weatherCard);
  } else {
    todayContainer.innerHTML = "Weather data not available.";
  }
}

function renderForecastCard(forecast) {
  var iconUrl = `https://openweathermap.org/img/w/${forecast.weather[0].icon}.png`;
  var iconDescription = forecast.weather[0].description;
  var tempF = forecast.main.temp;
  var humidity = forecast.main.humidity;
  var windMph = forecast.wind.speed;

  var forecastCard = document.createElement("div");
  forecastCard.classList.add("forecast-card");

  var cardHeader = document.createElement("div");
  cardHeader.classList.add("card-header");

  var cardTitle = document.createElement("h5");
  cardTitle.textContent = dayjs(forecast.dt_txt).format("M/D/YYYY");

  var cardBody = document.createElement("div");
  cardBody.classList.add("card-body");

  var iconImg = document.createElement("img");
  iconImg.setAttribute("src", iconUrl);
  iconImg.setAttribute("alt", iconDescription);
  iconImg.classList.add("forecast-icon");

  var tempPara = document.createElement("p");
  tempPara.textContent = `Temperature: ${tempF} °F`;

  var windPara = document.createElement("p");
  windPara.textContent = `Wind: ${windMph} MPH`;

  var humidityPara = document.createElement("p");
  humidityPara.textContent = `Humidity: ${humidity} %`;

  cardHeader.appendChild(cardTitle);
  cardBody.appendChild(iconImg);
  cardBody.appendChild(tempPara);
  cardBody.appendChild(windPara);
  cardBody.appendChild(humidityPara);

  forecastCard.appendChild(cardHeader);
  forecastCard.appendChild(cardBody);

  forecastContainer.append(forecastCard);
}

function renderForecast(dailyForecast) {
  var startDt = dayjs().add(1, "day").startOf("day").unix();
  var endDt = dayjs().add(6, "day").startOf("day").unix();

  var headingCol = document.createElement("div");
  headingCol.classList.add("col-12");

  var heading = document.createElement("h4");
  heading.textContent = "5-Day Forecast:";

  headingCol.appendChild(heading);

  forecastContainer.innerHTML = "";
  forecastContainer.appendChild(headingCol);

  for (var i = 0; i < dailyForecast.length; i++) {
    if (dailyForecast[i].dt >= startDt && dailyForecast[i].dt < endDt) {
      if (dailyForecast[i].dt_txt.slice(11, 13) == "12") {
        renderForecastCard(dailyForecast[i]);
      }
    }
  }
}

function fetchWeather(location) {
  var { lat, lon, name: city } = location;
  var apiUrl = `${weatherApiRootUrl}/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${weatherApiKey}`;

  fetch(apiUrl)
    .then((res) => res.json())
    .then((data) => {
      console.log("API Response:", data);
      renderCurrentWeather(city, data);
      renderForecast(data.list);
    })
    .catch((err) => {
      console.error(err);
    });
}

function fetchCoords(search) {
  var apiUrl = `${weatherApiRootUrl}/geo/1.0/direct?q=${search}&limit=5&appid=${weatherApiKey}`;

  fetch(apiUrl)
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      if (!data[0]) {
        alert("Location not found");
      } else {
        appendToHistory(search);
        fetchWeather(data[0]);
      }
    })
    .catch(function (err) {
      console.error(err);
    });
}

function handleSearchFormSubmit(e) {
  if (!searchInput.value) {
    return;
  }

  e.preventDefault();
  var search = searchInput.value.trim();
  fetchCoords(search);
  searchInput.value = "";
}

function handleSearchHistoryClick(e) {
  if (!e.target.matches(".btn-history")) {
    return;
  }

  var btn = e.target;
  var search = btn.getAttribute("data-search");
  fetchCoords(search);
}

initSearchHistory();
searchForm.addEventListener("submit", handleSearchFormSubmit);
searchHistoryContainer.addEventListener("click", handleSearchHistoryClick);
