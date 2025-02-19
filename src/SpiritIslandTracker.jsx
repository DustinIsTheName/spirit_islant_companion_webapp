import React, { useState } from "react";

const elements = [
  { name: "Fire", emoji: "🔥" },
  { name: "Water", emoji: "💧" },
  { name: "Earth", emoji: "🪨" },
  { name: "Air", emoji: "🌪️" },
  { name: "Sun", emoji: "☀️" },
  { name: "Moon", emoji: "🌙" },
  { name: "Plant", emoji: "🌿" },
  { name: "Animal", emoji: "🐾" },
  { name: "Energy", emoji: "⚡" }
];

export default function SpiritIslandTracker() {
  const [counts, setCounts] = useState(
    elements.reduce((acc, el) => ({ ...acc, [el.name]: 0 }), {})
  );

  const updateCount = (element, delta) => {
    setCounts((prev) => ({
      ...prev,
      [element]: Math.max(0, prev[element] + delta)
    }));
  };

  return (
    <div style={{ textAlign: "center", margin: "20px" }}>
      <div style={{ display: "flex", justifyContent: "center" }}>
        {elements.map((el) => (
          <div key={el.name} style={{ margin: "0 10px", fontSize: "2em" }}>
            {el.emoji}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "center", fontSize: "1.5em" }}>
        {elements.map((el) => (
          <div key={el.name} style={{ margin: "0 10px" }}>
            {counts[el.name]}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        {elements.map((el) => (
          <div key={el.name} style={{ margin: "0 10px" }}>
            <button onClick={() => updateCount(el.name, 1)}>+</button>
            <button onClick={() => updateCount(el.name, -1)}>-</button>
          </div>
        ))}
      </div>
    </div>
  );
}
