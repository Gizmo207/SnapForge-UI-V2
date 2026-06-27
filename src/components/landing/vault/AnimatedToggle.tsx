'use client';

import { useState } from "react";
import styled from "styled-components";

// Vault component: "Animated Toggle" (primitives/toggles) — a clean, tactile
// pill switch. Interactive (click to flip), on by default, with a brand-gradient
// track + glow and a sliding knob. No fragile 3D perspective — renders reliably.
const Switch = () => {
  const [on, setOn] = useState(true);
  return (
    <StyledWrapper>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Toggle"
        className={`toggle${on ? " on" : ""}`}
        onClick={() => setOn((v) => !v)}
      >
        <span className="glow" />
        <span className="knob">
          <span className="knob-dot" />
        </span>
      </button>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .toggle {
    position: relative;
    width: 104px;
    height: 54px;
    padding: 0;
    border: none;
    border-radius: 999px;
    cursor: pointer;
    background: #15151f;
    box-shadow:
      inset 0 2px 8px rgba(0, 0, 0, 0.7),
      inset 0 0 0 1px rgba(255, 255, 255, 0.05);
    transition:
      background 0.45s ease,
      box-shadow 0.45s ease;
    -webkit-tap-highlight-color: transparent;
  }

  .toggle.on {
    background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%);
    box-shadow:
      inset 0 2px 6px rgba(0, 0, 0, 0.25),
      0 0 26px rgba(236, 72, 153, 0.5),
      0 0 0 1px rgba(255, 255, 255, 0.08);
  }

  /* soft inner light that fades in when on */
  .glow {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    opacity: 0;
    background: radial-gradient(
      120% 140% at 78% 50%,
      rgba(255, 255, 255, 0.35) 0%,
      transparent 55%
    );
    transition: opacity 0.45s ease;
    pointer-events: none;
  }
  .toggle.on .glow {
    opacity: 1;
  }

  .knob {
    position: absolute;
    top: 6px;
    left: 6px;
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: linear-gradient(180deg, #ffffff 0%, #d7d7e2 100%);
    box-shadow:
      0 4px 10px rgba(0, 0, 0, 0.5),
      inset 0 1px 1px rgba(255, 255, 255, 0.9);
    display: grid;
    place-items: center;
    transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .toggle.on .knob {
    transform: translateX(50px);
  }

  .knob-dot {
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: #c9c9d6;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
    transition: background 0.45s ease;
  }
  .toggle.on .knob-dot {
    background: #ec4899;
    box-shadow:
      0 0 8px rgba(236, 72, 153, 0.9),
      inset 0 0 2px rgba(0, 0, 0, 0.2);
  }

  .toggle:active .knob {
    width: 48px;
  }
`;

export default Switch;
