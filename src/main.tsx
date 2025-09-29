import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { performanceOptimizer } from "./lib/performance-optimizer";

// Initialize performance optimizations immediately
console.log('🚀 Initializing performance optimizations...');
performanceOptimizer.initialize();
performanceOptimizer.measurePerformance();

createRoot(document.getElementById("root")!).render(<App />);
