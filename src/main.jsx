import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import BonsaiAlmanac from "./BonsaiAlmanac.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BonsaiAlmanac />
  </React.StrictMode>
);
