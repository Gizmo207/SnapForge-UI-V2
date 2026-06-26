'use client';

import styled from "styled-components";

// Vault component: "Animated Checkbox" (primitives/checkboxes) — power-pad device
const Checkbox = () => {
  return (
    <StyledWrapper>
      <div>
        <input type="checkbox" id="power-toggle" className="toggle-input" />
        <div className="device">
          <div className="bumper top-bumper" />
          <div className="bumper bot-bumper" />
          <div className="d-pad-top">
            <div className="btn btn-top">
              <div className="icon-power" />
            </div>
            <div className="btn btn-left">
              <div className="icon-arrow" />
            </div>
            <div className="btn btn-right">
              <div className="icon-trident green" />
            </div>
            <div className="btn btn-bottom">
              <div className="icon-bars" />
            </div>
          </div>
          <div className="mid-controls">
            <div className="left-icons">
              <div className="bt-btn" />
              <div className="icon-trident gray" />
            </div>
            <div className="right-icons">
              <span className="start-label">START</span>
              <div className="start-btn" />
            </div>
          </div>
          <label htmlFor="power-toggle" className="big-pad">
            <div className="status-text">OFF</div>
            <div className="notch n-top" />
            <div className="notch n-right" />
            <div className="notch n-bottom" />
            <div className="notch n-left" />
          </label>
        </div>
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .toggle-input {
    display: none;
  }
  .device {
    width: 120px;
    height: 250px;
    background: linear-gradient(145deg, #d8d3d3, #b6b1b1);
    border-radius: 90px;
    position: relative;
    box-shadow:
      10px 10px 25px rgba(0, 0, 0, 0.15),
      -10px -10px 25px rgba(255, 255, 255, 0.05),
      inset 2px 2px 6px rgba(255, 255, 255, 0.6),
      inset -2px -2px 6px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 30px;
  }

  .device::before {
    content: "Click Big Pad to Turn On";
    position: absolute;
    top: 22%;
    transform: translateX(-50%) rotate(180deg);
    right: -30px;
    font-size: 10px;
    color: #888;
    opacity: 0.7;
    writing-mode: vertical-rl;
    letter-spacing: 1px;
  }
  .bumper {
    position: absolute;
    left: -6px;
    width: 9px;
    height: 30px;
    background: linear-gradient(145deg, #9a9595, #7a7676);
    border-top-left-radius: 3px;
    border-bottom-left-radius: 3px;
    z-index: -1;
    box-shadow: inset 1px 1px 2px rgba(255, 255, 255, 0.2);
  }

  .top-bumper {
    top: 70px;
  }
  .bot-bumper {
    top: 150px;
  }
  .d-pad-top {
    position: relative;
    width: 112px;
    height: 112px;
    margin-bottom: 20px;
    top: 5px;
  }

  .btn {
    position: absolute;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: linear-gradient(145deg, #e3dfdf, #bfbcbc);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow:
      3px 3px 6px rgba(0, 0, 0, 0.1),
      -3px -3px 6px rgba(255, 255, 255, 0.7);
    transition: all 0.2s ease-in-out;
    cursor: pointer;
  }

  .btn:hover {
    transform: scale(1.05);
  }
  .btn-top:hover {
    transform: translateX(-50%) scale(1.05);
  }
  .btn-bottom:hover {
    transform: translateX(-50%) scale(1.05);
  }
  .btn-left:hover {
    transform: translateY(-50%) scale(1.05);
  }
  .btn-right:hover {
    transform: translateY(-50%) scale(1.05);
  }

  .btn:active {
    box-shadow:
      inset 2px 2px 4px rgba(0, 0, 0, 0.15),
      inset -2px -2px 4px rgba(255, 255, 255, 0.7);
  }

  .btn-top {
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
  }
  .btn-bottom {
    bottom: -30px;
    left: 50%;
    transform: translateX(-50%);
  }
  .btn-left {
    top: 60%;
    left: 10px;
    transform: translateY(-50%);
  }
  .btn-right {
    top: 60%;
    right: 10px;
    transform: translateY(-50%);
  }
  .icon-power {
    width: 14px;
    height: 14px;
    border: 2px solid #ff4d4d;
    border-radius: 50%;
    border-top-color: transparent;
    position: relative;
    transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  .icon-power::after {
    content: "";
    position: absolute;
    top: -3px;
    left: 50%;
    transform: translateX(-50%);
    width: 2px;
    height: 8px;
    background: #ff4d4d;
  }

  .icon-arrow {
    width: 9px;
    height: 9px;
    border-bottom: 2px solid #ffcc00;
    border-left: 2px solid #ffcc00;
    transform: rotate(45deg);
    margin-left: 3px;
    transition: 0.4s;
  }

  .icon-trident {
    position: relative;
    width: 14px;
    height: 12px;
    transition: 0.4s;
  }
  .icon-trident.green {
    color: #00e676;
  }
  .icon-trident.gray {
    color: #888;
    transform: scale(0.9);
  }
  .icon-trident::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 0;
    transform: translateY(-50%);
    width: 100%;
    height: 2px;
    background: currentColor;
  }
  .icon-trident::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 6px;
    height: 100%;
    border: 2px solid currentColor;
    border-right: none;
    border-radius: 4px 0 0 4px;
  }

  .icon-bars {
    display: flex;
    gap: 3px;
    height: 10px;
    transition: 0.4s;
  }
  .icon-bars::before,
  .icon-bars::after {
    content: "";
    width: 2px;
    height: 100%;
    background: #2979ff;
    border-radius: 1px;
  }
  .mid-controls {
    display: flex;
    width: 100%;
    justify-content: space-between;
    padding: 0 15px;
    align-items: center;
    position: relative;
    top: 10px;
  }

  .bt-btn {
    width: 12px;
    height: 12px;
    background: #00b0ff;
    border-radius: 50%;
    transition: 0.4s;
    margin-bottom: 5px;
    box-shadow: inset 1px 1px 2px rgba(255, 255, 255, 0.4);
  }

  .start-label {
    font-size: 6px;
    font-weight: bold;
    color: #555;
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    letter-spacing: 1px;
  }

  .start-btn {
    width: 5px;
    height: 20px;
    position: relative;
    left: 2px;
    background: linear-gradient(to bottom, #777, #555);
    border-radius: 3px;
    transition: 0.3s;
    box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
  }
  .big-pad {
    width: 92px;
    height: 262px;
    border-radius: 50%;
    background: linear-gradient(145deg, #e6e0e0, #c2bcbc);
    margin-top: 22px;
    position: relative;
    bottom: 10px;
    border: 1px solid #d1cdcd;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow:
      5px 5px 15px rgba(0, 0, 0, 0.1),
      -5px -5px 15px rgba(255, 255, 255, 0.6),
      inset 2px 2px 5px rgba(255, 255, 255, 0.8);
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    user-select: none;
  }

  .status-text {
    font-weight: 800;
    font-size: 14px;
    color: #9d9696;
    letter-spacing: 1.5px;
    transition: 0.4s;
  }
  .big-pad:active {
    transform: scale(0.96);
    box-shadow:
      2px 2px 5px rgba(0, 0, 0, 0.1),
      inset 4px 4px 10px rgba(0, 0, 0, 0.15),
      inset -4px -4px 10px rgba(255, 255, 255, 0.5);
  }
  .notch {
    position: absolute;
    background: #a8a3a3;
    border-radius: 1.5px;
  }
  .n-top {
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    width: 3px;
    height: 8px;
  }
  .n-bottom {
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    width: 3px;
    height: 8px;
  }
  .n-left {
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    width: 8px;
    height: 3px;
  }
  .n-right {
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    width: 8px;
    height: 3px;
  }

  .toggle-input:checked + .device .status-text {
    color: #00e676;
    text-shadow:
      0 0 10px rgba(0, 230, 118, 0.6),
      0 0 20px rgba(0, 230, 118, 0.4);
  }

  .toggle-input:checked + .device .status-text::after {
    content: "ON";
  }
  .toggle-input:not(:checked) + .device .status-text::after {
    content: "OFF";
  }

  .status-text {
    font-size: 0;
  }
  .status-text::after {
    font-size: 14px;
  }

  .toggle-input:checked + .device .icon-power {
    filter: drop-shadow(0 0 6px #ff4d4d) drop-shadow(0 0 12px #ff4d4d);
  }

  .toggle-input:checked + .device .icon-arrow {
    filter: drop-shadow(0 0 6px #ffcc00) drop-shadow(0 0 12px #ffcc00);
  }

  .toggle-input:checked + .device .icon-trident.green {
    filter: drop-shadow(0 0 6px #00e676) drop-shadow(0 0 12px #00e676);
  }

  .toggle-input:checked + .device .icon-bars {
    filter: drop-shadow(0 0 6px #2979ff) drop-shadow(0 0 12px #2979ff);
  }

  .toggle-input:checked + .device .bt-btn {
    background: #00e5ff;
    filter: drop-shadow(0 0 6px #00e5ff) drop-shadow(0 0 12px #00b0ff);
  }

  .toggle-input:checked + .device .start-btn {
    background: #222;
    box-shadow: inset 0 0 5px #000;
  }

  @keyframes pulse-off {
    0% {
      opacity: 0.5;
      text-shadow: 0 0 0px rgba(157, 150, 150, 0);
    }
    50% {
      opacity: 1;
      text-shadow: 0 0 8px rgba(157, 150, 150, 0.6);
    }
    100% {
      opacity: 0.5;
      text-shadow: 0 0 0px rgba(157, 150, 150, 0);
    }
  }
  .toggle-input:not(:checked) + .device .status-text {
    animation: pulse-off 2s infinite ease-in-out;
  }
`;

export default Checkbox;
