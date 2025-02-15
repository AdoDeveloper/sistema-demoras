"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  WiDaySunny,
  WiNightClear,
  WiDayCloudy,
  WiNightAltCloudy,
  WiRain,
  WiStrongWind,
} from "react-icons/wi";

const WeatherWidget = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // La API de WeatherAPI: la API key se toma de las variables de entorno
  const API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY;
  const url = `http://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=Acajutla&aqi=no`;

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

  // Actualiza el clima cada 60 segundos
  useEffect(() => {
    fetchWeather();
    const weatherInterval = setInterval(fetchWeather, 60000);
    return () => clearInterval(weatherInterval);
  }, [fetchWeather]);

  // Actualiza la hora en tiempo real cada segundo
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timeInterval);
  }, []);

  if (loading) {
    return <div className="p-4 text-center">Cargando datos meteorológicos...</div>;
  }

  if (!weatherData) {
    return (
      <div className="p-4 text-center text-red-500">
        Error al cargar los datos meteorológicos.
      </div>
    );
  }

  // Extraer datos de la respuesta
  const { location, current } = weatherData;

  // Generar saludo según la hora actual local
  const localHour = currentTime.getHours();
  let saludo = "";
  if (localHour < 12) {
    saludo = "Buenos días";
  } else if (localHour < 19) {
    saludo = "Buenas tardes";
  } else {
    saludo = "Buenas noches";
  }

  // Selección de icono según la condición climática
  let WeatherIcon;
  const conditionText = current.condition.text.toLowerCase();
  if (current.precip_mm > 0 || conditionText.includes("rain")) {
    WeatherIcon = WiRain;
  } else if (conditionText.includes("cloud") || current.cloud > 50) {
    WeatherIcon = current.is_day ? WiDayCloudy : WiNightAltCloudy;
  } else if (conditionText.includes("sunny") || conditionText.includes("clear")) {
    WeatherIcon = current.is_day ? WiDaySunny : WiNightClear;
  } else {
    WeatherIcon = WiDaySunny;
  }

  return (
    <div className="p-4 bg-white rounded-xl shadow-md">
      {/* Cabecera: saludo, hora e ícono */}
      <div className="flex items-center justify-between">
        <div className="mb-3 sm:mb-0">
          <h2 className="text-xl font-bold text-gray-800">{saludo}</h2>
          <p className="text-sm text-gray-600">{currentTime.toLocaleTimeString()}</p>
        </div>
        <WeatherIcon size={48} className="text-yellow-500" />
      </div>

      {/* Información meteorológica en dos columnas */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
        {/* Columna izquierda */}
        <div className="space-y-1">
          <p>
            <span className="font-semibold">Ciudad:</span> {location.name}, {location.region}
          </p>
          <p>
            <span className="font-semibold">País:</span> {location.country}
          </p>
          <p>
            <span className="font-semibold">Última actualización:</span> {current.last_updated}
          </p>
          <p>
            <span className="font-semibold">Temperatura:</span> {current.temp_c}°C
          </p>
          <p>
            <span className="font-semibold">Humedad:</span> {current.humidity}%
          </p>
        </div>

        {/* Columna derecha */}
        <div className="space-y-1">
          <p className="flex items-center">
            <span className="font-semibold">Viento:</span> {current.wind_kph} km/h
            <WiStrongWind size={18} className="ml-1 text-blue-600" />
          </p>
          <p>
            <span className="font-semibold">Dirección:</span> {current.wind_dir} ({current.wind_degree}°)
          </p>
          <p>
            <span className="font-semibold">Nubosidad:</span> {current.cloud}%
          </p>
          <p>
            <span className="font-semibold">Precipitación:</span> {current.precip_mm} mm
          </p>
          <p>
            <span className="font-semibold">Condición:</span> {current.condition.text}
          </p>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
