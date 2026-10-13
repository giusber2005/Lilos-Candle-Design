import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Always start at the top on reload instead of restoring the previous scroll position
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.scrollTo({ top: 0, left: 0, behavior: "instant" });

createRoot(document.getElementById("root")!).render(<App />);
