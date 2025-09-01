import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './debug-config'

createRoot(document.getElementById("root")!).render(<App />);
