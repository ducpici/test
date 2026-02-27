import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router";
import { MainLayout } from "./layout/components/MainLayout";
import { HomePage } from "./page/HomePage";

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index path="/" element={<HomePage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
