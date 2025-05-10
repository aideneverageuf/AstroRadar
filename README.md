# AstroRadar 3D 🌍🌕

**AstroRadar 3D** is a web application that visualizes Near-Earth Objects (NEOs) in 3D space using real-time NASA NEO API data.  
It provides a dynamic orbit map of Earth, the Moon, and nearby asteroids, helping users understand relative distances, velocities, and risks from potential impacts.

Built with:
- **React** + **Vite**
- **@react-three/fiber** (Three.js for React)
- **@react-three/drei** (helpers for 3D objects)
- **NASA NEO Feed API**

---

## ✨ Features

- 3D rotating Earth with realistic textures and city lights
- Accurate Moon orbiting around Earth
- Live mapping of Near-Earth Objects with real orbital motion
- Click a NEO to highlight, zoom, and view detailed information
- Sort NEOs by diameter, velocity, miss distance, approach date, or name
- Smooth animations: orbiting, scaling, pulsing selected NEOs

---

## 🚀 Getting Started

To set up and run AstroRadar locally:

1. **Clone the Repository**

    ```bash
    git clone https://github.com/your-username/astroradar.git
    cd astroradar
    ```

2. **Install Dependencies**

    ```bash
    npm install
    ```

3. **Create a `.env` File for API Key**

    Create a `.env` file in the root of the project and add your NASA API key:

    ```
    VITE_NASA_API_KEY=your_actual_nasa_api_key_here
    ```

    You can obtain a free API key from [NASA's API Portal](https://api.nasa.gov/).

4. **Start the Development Server**

    ```bash
    npm run dev
    ```

    Then open your browser and navigate to:

    ```
    http://localhost:5173/
    ```

