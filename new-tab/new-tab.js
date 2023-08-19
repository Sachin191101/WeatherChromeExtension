window.onload = function () {

    // retrieve saved weather data before sending requests
    chrome.storage.sync.get(['city', 'state', 'temp-current-value', 'temp-high-value', 'temp-unit', 'period', 'weather-description', 'wind-speed', 'wind-direction', 'hourly-data'], function (result) {
        document.getElementById("city").innerText = result['city'] || ''
        document.getElementById("temp-current-value").innerText = result['temp-current-value'] || ''
        document.getElementById("wind-direction").innerText = result['wind-direction'] || ''
        document.getElementById("wind-speed").innerText = result['wind-speed'] || ''
        document.getElementById("temp-high-value").innerText = result['temp-high-value'] || ''
        document.getElementById("temp-unit").innerText = result['temp-unit'] || ''
        document.getElementById("weather-description").innerText = result['weather-description'] || ''
        document.getElementById("hourly").innerHTML = result['hourly-data']
    });
    var startPos;

    var geoSuccess = async function (position) {
        Request.cache = 'no-store'
        var options = {
            method: 'GET',
            cache: 'no-store'
        }
        startPos = position;
        var response = await fetch(`https://api.weather.gov/points/${startPos.coords.latitude},${startPos.coords.longitude}`, options).then(response => response.json());
        var station = await fetch(`https://api.weather.gov/points/${startPos.coords.latitude},${startPos.coords.longitude}/stations`, options).then(response => response.json());
        console.log(station.features[0].id)
        var stationurl = `${station.features[0].id}/observations/latest`;
        console.log(stationurl)
        var stationdata = await fetch(stationurl, options).then(response => response.json());
        //console.log(stationdata.properties.temperature.value)
        var tempF = Math.round(((stationdata.properties.temperature.value / 5) * 9 + 32) * 10) / 10;
        document.getElementById("temp-current-value").innerText = tempF;
        document.getElementById("city").innerText = response.properties.relativeLocation.properties.city;
        //document.getElementById("state").innerText = response.properties.relativeLocation.properties.state;
        console.log(response);
        var weather = await fetch(response.properties.forecast, options).then(response => response.json());
        var hourly = await fetch(response.properties.forecastHourly, options).then(response => response.json());
        console.log(hourly);
        console.log(weather);
        var hourlyinner = '';
        for (var i = 0; i < 10; i++) {
            var hourlymeta = hourly.properties.periods[i]
            var time = new Date(hourlymeta.startTime)
            hourlyinner += `<span class="hourly-card"><h3 class="hourly-card-time">${time.toLocaleString('en-US', { hour: 'numeric', hour12: true })}</h3><p><strong><span class="hourly-card-temp">${hourlymeta.temperature}</span></strong> ${hourlymeta.temperatureUnit}</p></span>`;
        }
        document.getElementById("hourly").innerHTML = hourlyinner
        document.getElementById("wind-direction").innerText = weather.properties.periods[0].windDirection;
        document.getElementById("wind-speed").innerText = weather.properties.periods[0].windSpeed;
        document.getElementById("temp-high-value").innerText = weather.properties.periods[0].temperature;
        document.getElementById("temp-unit").innerText = weather.properties.periods[0].temperatureUnit;
        document.getElementById("weather-description").innerText = weather.properties.periods[0].detailedForecast;

        // after updating the dom, update saved weather data
        chrome.storage.sync.set({
            city: response.properties.relativeLocation.properties.city,
            state: response.properties.relativeLocation.properties.state,
            'wind-speed': weather.properties.periods[0].windSpeed,
            'wind-direction': weather.properties.periods[0].windDirection,
            'temp-current-value': tempF,
            'temp-high-value': weather.properties.periods[0].temperature,
            'temp-unit': weather.properties.periods[0].temperatureUnit,
            'period': weather.properties.periods[0].name,
            'weather-description': weather.properties.periods[0].detailedForecast,
            'hourly-data': hourlyinner
        }, function () {
            console.log('new weather data set!');
        });
    };

    // ask for location permissions
    navigator.geolocation.getCurrentPosition(geoSuccess);

    const ele = document.getElementById('hourly');
    ele.style.cursor = 'grab';

    let pos = {
        top: 0,
        left: 0,
        x: 0,
        y: 0
    };

    const mouseDownHandler = function (e) {
        ele.style.userSelect = 'none';

        pos = {
            left: ele.scrollLeft,
            top: ele.scrollTop,
            x: e.clientX,
            y: e.clientY,
        };

        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    };

    const mouseMoveHandler = function (e) {
        const dx = e.clientX - pos.x;
        const dy = e.clientY - pos.y;

        ele.scrollTop = pos.top - dy;
        ele.scrollLeft = pos.left - dx;
    };

    const mouseUpHandler = function () {
        ele.style.removeProperty('user-select');

        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
    };

    ele.addEventListener('mousedown', mouseDownHandler);
};