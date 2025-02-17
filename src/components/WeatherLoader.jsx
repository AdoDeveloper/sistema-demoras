"use client";

import React from "react";
import styled from "styled-components";

const WeatherLoader = () => {
  return (
    <StyledWrapper>
      <div className="text-center text-lg font-semibold text-gray-700">
        Cargando datos meteorológicos...
      </div>
      <div className="loader">
        <div className="cloud front">
          <span className="left-front" />
          <span className="right-front" />
        </div>
        <span className="sun sunshine" />
        <span className="sun" />
        <div className="cloud back">
          <span className="left-back" />
          <span className="right-back" />
        </div>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;

  .text-center {
    margin-bottom: 20px;
  }

  .loader {
    position: relative;
    width: 150px;
    height: 150px;
  }

  .cloud {
    position: absolute;
    background: #d1e0f0;
    border-radius: 50%;
    box-shadow: inset 0 -4px 10px rgba(0, 0, 0, 0.1);
  }

  .front {
    width: 100px;
    height: 50px;
    top: 50px;
    left: 10px;
    animation: float 4s infinite ease-in-out;
  }

  .left-front {
    width: 50px;
    height: 50px;
    background: #b0c4de;
    position: absolute;
    border-radius: 50%;
    left: -20px;
    top: -15px;
  }

  .right-front {
    width: 60px;
    height: 60px;
    background: #b0c4de;
    position: absolute;
    border-radius: 50%;
    right: -10px;
    top: -20px;
  }

  .back {
    width: 80px;
    height: 40px;
    top: 60px;
    left: 30px;
    animation: float 6s infinite ease-in-out;
  }

  .left-back {
    width: 40px;
    height: 40px;
    background: #a0b8d8;
    position: absolute;
    border-radius: 50%;
    left: -10px;
    top: -10px;
  }

  .right-back {
    width: 45px;
    height: 45px;
    background: #a0b8d8;
    position: absolute;
    border-radius: 50%;
    right: -5px;
    top: -15px;
  }

  .sun {
    position: absolute;
    width: 50px;
    height: 50px;
    background: radial-gradient(circle, #ffdd57, #ffbb33);
    border-radius: 50%;
    top: 20px;
    left: 50px;
  }

  .sunshine {
    position: absolute;
    width: 60px;
    height: 60px;
    background: rgba(255, 221, 87, 0.5);
    border-radius: 50%;
    top: 15px;
    left: 45px;
    animation: pulse 2s infinite ease-in-out;
  }

  @keyframes float {
    0%,
    100% {
      transform: translateY(5px);
    }
    50% {
      transform: translateY(-5px);
    }
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 0.6;
    }
    100% {
      transform: scale(1.4);
      opacity: 0;
    }
  }
`;

export default WeatherLoader;
