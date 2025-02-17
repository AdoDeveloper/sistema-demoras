"use client";

import React, { useEffect, useState, useCallback } from "react";
import { MdAir } from "react-icons/md";
import {
  WiThermometer,
  WiHumidity,
  WiRain,
  WiBarometer,
  WiFog,
  WiDaySunny,
} from "react-icons/wi";
import { FaArrowUp, FaSun } from "react-icons/fa";
import WeatherLoader from './WeatherLoader'

/** Formatea la hora a "HH:mm" (24h). */
function formatTimeHHMM(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/** Calcula la duración del día (sunrise -> sunset) en horas y minutos. */
function getDayLength(sunriseStr, sunsetStr) {
  const today = new Date();
  const sunriseDate = new Date(`${today.toDateString()} ${sunriseStr}`);
  const sunsetDate = new Date(`${today.toDateString()} ${sunsetStr}`);
  const diffMs = sunsetDate - sunriseDate;
  if (diffMs < 0) return "--";
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  const diffM = Math.floor((diffMs / (1000 * 60)) % 60);
  return `${diffH}h ${diffM}m`;
}

/** Interpreta el índice UV en texto. */
function getUvLabel(uv) {
  if (uv < 3) return "Bajo";
  if (uv < 6) return "Moderado";
  if (uv < 8) return "Alto";
  if (uv < 11) return "Muy alto";
  return "Extremo";
}

/** Sugerencia de FPS (ejemplo). */
function getFpsSuggestion(uv) {
  if (uv < 3) return "FPS: no";
  if (uv < 8) return "FPS: 30";
  return "FPS: 50";
}

/** Mapea el índice US EPA a descripción y color. */
function getAirQualityInfo(index) {
  switch (index) {
    case 1:
      return {
        label: "Buena",
        description: "La calidad del aire es satisfactoria.",
        color: "#22c55e",
      };
    case 2:
      return {
        label: "Moderada",
        description:
          "La calidad es aceptable, aunque para algunos contaminantes puede haber riesgo moderado.",
        color: "#eab308",
      };
    case 3:
      return {
        label: "Insalubre para grupos sensibles",
        description:
          "Los grupos sensibles pueden experimentar efectos; el público en general probablemente no se verá afectado.",
        color: "#f97316",
      };
    case 4:
      return {
        label: "Insalubre",
        description:
          "La salud de toda la población puede verse afectada; se recomienda precaución.",
        color: "#ef4444",
      };
    case 5:
      return {
        label: "Muy insalubre",
        description:
          "Advertencia: toda la población podría experimentar efectos en la salud.",
        color: "#a855f7",
      };
    case 6:
      return {
        label: "Peligrosa",
        description:
          "Condiciones de alta contaminación; evite la exposición y tome medidas extremas.",
        color: "#b91c1c",
      };
    default:
      return {
        label: "--",
        description: "",
        color: "#6b7280",
      };
  }
}

const WeatherWidget = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [rotateIcon, setRotateIcon] = useState(false);

  // API key y endpoint (coordenadas de Acajutla – Planta Almapac)
  const API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=13.571590310635003,-89.83056926998199&days=7&aqi=yes&alerts=yes&lang=es`;

  const fetchWeather = useCallback(async () => {
    try {
      const response = await fetch(url);
      const data = await response.json();
      setWeatherData(data);
    } catch (error) {
      console.error("Error al obtener los datos del clima:", error);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 60000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  // Establece la hora local usando localtime_epoch
  useEffect(() => {
    if (weatherData?.location?.localtime_epoch) {
      setCurrentTime(new Date(weatherData.location.localtime_epoch * 1000));
    }
  }, [weatherData]);

  // Actualiza la hora local cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime((prev) => new Date(prev.getTime() + 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <WeatherLoader/>;
  } 
  if (!weatherData) {
    return <div className="text-center text-red-500">Error al cargar los datos.</div>;
  }

  const { location, current, forecast, alerts } = weatherData;
  const hour = currentTime.getHours();
  const saludo =
    hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  const conditionIconUrl = `https:${current.condition.icon}`;
  const handleIconClick = () => {
    setRotateIcon(true);
    setTimeout(() => setRotateIcon(false), 500);
  };

  // Seleccionamos el pronóstico para el día actual
  const localDateStr = currentTime.toISOString().split("T")[0];
  const todayData =
    forecast.forecastday.find((d) => d.date === localDateStr) || forecast.forecastday[0];
  const todayForecast = todayData.day;
  const minTemp = todayForecast?.mintemp_c ?? "--";
  const maxTemp = todayForecast?.maxtemp_c ?? "--";
  const rainChance = todayForecast?.daily_chance_of_rain ?? "--";

  // Datos adicionales
  const uv = current.uv;
  const pressure = current.pressure_mb ? `${current.pressure_mb} mb` : "--";
  const visibility = current.vis_km ? `${current.vis_km} km` : "--";

  let sunscreenRecommendation = "";
  if (uv < 3) {
    sunscreenRecommendation = "Bajo. No es necesario usar protector solar.";
  } else if (uv < 6) {
    sunscreenRecommendation = "Moderado. Se recomienda el uso moderado de protector solar.";
  } else if (uv < 8) {
    sunscreenRecommendation = "Alto. Se recomienda usar protector solar y evitar exposición prolongada.";
  } else if (uv < 11) {
    sunscreenRecommendation = "Muy alto. Es obligatorio el uso de protector solar, gafas y sombrero.";
  } else {
    sunscreenRecommendation = "Extremo. Evita la exposición solar y usa protector solar de alto SPF.";
  }

  // Calidad del aire (US EPA)
  const airQualityIndex =
    current.air_quality && current.air_quality["us-epa-index"]
      ? current.air_quality["us-epa-index"]
      : null;
  const airQualityData = getAirQualityInfo(airQualityIndex);

  // Datos astronómicos
  const { astro } = todayData;
  const dayLength = getDayLength(astro.sunrise, astro.sunset);

  // Cálculo de temperaturas aparentes: usamos la propiedad "feelslike_c" de cada hora
  const hourlyData = todayData.hour || [];
  const apparentTemps = hourlyData.map((h) => h.feelslike_c);
  const apparentMin = apparentTemps.length ? Math.min(...apparentTemps) : "--";
  const apparentMax = apparentTemps.length ? Math.max(...apparentTemps) : "--";

  // Para mostrar la fecha (nombre del día)
  const [year, month, day] = forecast.forecastday[0].date.split("-");
  const forecastDate = new Date(year, month - 1, day);
  const dayName = forecastDate.toLocaleDateString(["es-SV", "es-ES"], {
    timeZone: "America/El_Salvador",
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="bg-white w-full rounded-xl shadow-lg">
      {/* Sección principal: widget */}
      <div className="max-w-4xl w-full rounded-lg p-4 mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {saludo}, {location.name}
            </h2>
            <p className="text-sm text-gray-600">
              {location.region}, {location.country}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Planta Almapac: {currentTime.toLocaleTimeString()}
            </p>
            <p className="text-xs text-gray-400">
              Últ. actualización: {current.last_updated}
            </p>
          </div>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <div
              onClick={handleIconClick}
              className={`cursor-pointer transform transition-transform duration-500 ${
                rotateIcon ? "rotate-y-180" : ""
              }`}
            >
              <img
                src={conditionIconUrl}
                alt={current.condition.text}
                className="w-16 h-16"
              />
            </div>
            <div className="text-center">
              <p className="text-3xl font-semibold text-gray-700">
                {current.temp_c}°C
              </p>
              <p className="text-sm text-gray-500">{current.condition.text}</p>
            </div>
          </div>
        </div>

        {/* Detalles del día actual */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 text-sm">
          {/* Celda de Temperatura Aparente (con min y max aparente calculadas) */}
          <div className="flex flex-col items-center bg-blue-50 p-2 rounded-md">
            <WiThermometer className="text-xl mb-1" />
            <span className="font-semibold">Aparente</span>
            <span>{current.feelslike_c}°C</span>
            <span className="text-xs">Min: {apparentMin}° / Max: {apparentMax}°</span>
          </div>
          <div className="flex flex-col items-center bg-blue-50 p-2 rounded-md">
            <WiHumidity className="text-xl mb-1" />
            <span className="font-semibold">Humedad</span>
            <span>{current.humidity}%</span>
          </div>
          <div className="flex flex-col items-center bg-blue-50 p-2 rounded-md">
            <FaArrowUp
              style={{ transform: `rotate(${current.wind_degree}deg)` }}
              className="text-xl mb-1 text-blue-600"
            />
            <span className="font-semibold">Viento</span>
            <span>{current.wind_kph} km/h</span>
          </div>
          <div className="flex flex-col items-center bg-blue-50 p-2 rounded-md">
            <WiRain className="text-xl mb-1" />
            <span className="font-semibold">Precip.</span>
            <span>{current.precip_mm} mm</span>
          </div>
          <div className="flex flex-col items-center bg-blue-50 p-2 rounded-md">
            <WiRain className="text-xl mb-1" />
            <span className="font-semibold">Prob. lluvia</span>
            <span>{rainChance}%</span>
          </div>
          <div className="flex flex-col items-center bg-blue-50 p-2 rounded-md">
            <WiThermometer className="text-xl mb-1" />
            <span className="font-semibold">Mín./Máx.</span>
            <span>
              {minTemp}°C / {maxTemp}°C
            </span>
          </div>
          <div className="flex flex-col items-center bg-blue-50 p-2 rounded-md">
            <WiDaySunny className="text-xl mb-1" />
            <span className="font-semibold">UV</span>
            <span>{uv}</span>
          </div>
          <div className="flex flex-col items-center bg-blue-50 p-2 rounded-md">
            <FaSun className="text-xl mb-1 text-yellow-500" />
            <span className="font-semibold">Protector</span>
            <span className="text-xs text-center">{sunscreenRecommendation}</span>
          </div>
          <div className="flex flex-col items-center bg-blue-50 p-2 rounded-md">
            <WiBarometer className="text-xl mb-1" />
            <span className="font-semibold">Presión</span>
            <span>{pressure}</span>
          </div>
          <div className="flex flex-col items-center bg-blue-50 p-2 rounded-md">
            <WiFog className="text-xl mb-1" />
            <span className="font-semibold">Visib.</span>
            <span>{visibility}</span>
          </div>
        </div>

        {/* Calidad del aire */}
        <div className="mt-6">
          <h3 className="text-xl font-bold text-gray-800">Calidad del Aire</h3>
          <div className="flex items-center bg-blue-50 p-4 rounded-md mt-2">
            <MdAir size={40} style={{ color: airQualityData.color }} className="mr-4" />
            <div>
              <p className="text-lg font-semibold" style={{ color: airQualityData.color }}>
                {airQualityData.label}
              </p>
              <p className="text-xs text-gray-600">{airQualityData.description}</p>
            </div>
          </div>
        </div>

        {/* Alertas meteorológicas */}
        {alerts && alerts.alert && alerts.alert.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xl font-bold text-red-600">Alertas Meteorológicas</h3>
            {alerts.alert.map((alert, index) => (
              <div key={index} className="bg-red-100 p-2 rounded-md mt-2 text-xs text-red-800">
                <p className="font-semibold">{alert.headline}</p>
                <p>{alert.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .rotate-y-180 {
          transform: perspective(500px) rotateY(180deg);
        }
      `}</style>
    </div>
  );
};

export default WeatherWidget;
