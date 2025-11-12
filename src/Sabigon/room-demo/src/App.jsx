// src/App.jsx

import React, { useState } from "react";
import StartScreen from "./components/StartScreen";
import Game from "./components/Game";
import ResultScreen from "./components/ResultScreen";

function App() {
  const [screen, setScreen] = useState("start");
  const [time, setTime] = useState(0);
  const [roomConfig, setRoomConfig] = useState(null); // { mode: "host" | "join", roomId?: string }

  const handleStart = (config) => {
    setRoomConfig(config);
    setScreen("game");
  };
  
  const handleClear = (elapsedTime) => {
    setTime(elapsedTime);
    setScreen("result");
  };
  
  const handleRestart = () => {
    setRoomConfig(null);
    setScreen("start");
  };

  return (
    <>
      {screen === "start" && <StartScreen onStart={handleStart} />}
      {screen === "game" && <Game onClear={handleClear} roomConfig={roomConfig} />}
      {screen === "result" && (
        <ResultScreen time={time} onRestart={handleRestart} />
      )}
    </>
  );
}

export default App;
