import React, { useState, useEffect } from 'react';
import { fetchNeoFeed } from './services/nasa';
import { format, subDays } from 'date-fns';
import OrbitVisualizer3D from './components/OrbitVisualizer3D';
import NeoList from './components/NeoList';
import './App.css';

function App() {
  const [neoData, setNeoData] = useState(null);
  const [selectedNeoId, setSelectedNeoId] = useState(null);
  const [selectedNeo, setSelectedNeo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState(7);
  const [error, setError] = useState(null);
  const [showOnlyHazardous, setShowOnlyHazardous] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const startDate = format(subDays(new Date(), dateRange), 'yyyy-MM-dd');
        const endDate = format(new Date(), 'yyyy-MM-dd');
        const data = await fetchNeoFeed(startDate, endDate);
        setNeoData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  const handleSelectNeo = (neo) => {
    setSelectedNeoId(neo.id);
    setSelectedNeo(neo);
  };

  return (
    <div className="app">
      <header>
        <h1>AstroRadar 3D</h1>
        <p>Near-Earth Object (NEO) Visualizer</p>
      </header>

      <div className="controls">
        <div className="control-group">
          <label>
            Date Range (days):
            <input 
              type="range" 
              min="1" 
              max="7"
              value={dateRange} 
              onChange={(e) => setDateRange(parseInt(e.target.value))} 
            />
            {dateRange}
          </label>
        </div>

        <div className="control-group">
          <label className="toggle">
            <input 
              type="checkbox" 
              checked={showOnlyHazardous}
              onChange={() => setShowOnlyHazardous(!showOnlyHazardous)}
            />
            Show only hazardous objects
          </label>
        </div>

        <div className="control-group">
          <button onClick={() => setPaused(prev => !prev)}>
            {paused ? 'Resume Orbit' : 'Pause Orbit'}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="main-content">
        <OrbitVisualizer3D 
          neoData={neoData} 
          selectedNeoId={selectedNeoId} 
          onSelectNeo={handleSelectNeo}
          showOnlyHazardous={showOnlyHazardous}
          paused={paused}
        />

        <div className="neo-list-container">
          <h3>Near-Earth Objects {showOnlyHazardous && '(Hazardous Only)'}</h3>
          {loading ? (
            <div className="loading-neos">
              <div className="loading-spinner"></div>
              <p>Updating NEO data...</p>
            </div>
          ) : (
            <NeoList 
              neos={neoData} 
              onSelectNeo={handleSelectNeo} 
              selectedNeo={selectedNeo}
              showOnlyHazardous={showOnlyHazardous}
            />
          )}
        </div>

        {selectedNeo ? (
          <div className="neo-details">
            <h2>{selectedNeo.name}</h2>
            <p>Absolute Magnitude: {selectedNeo.absolute_magnitude_h}</p>
            <p>Estimated Diameter: {Math.round(selectedNeo.estimated_diameter.meters.estimated_diameter_max)} meters</p>
            <p>Orbital Period: {selectedNeo.orbital_data ? Math.round(selectedNeo.orbital_data.orbital_period) : 'N/A'} days</p>
            <p>First Observation: {selectedNeo.orbital_data ? selectedNeo.orbital_data.first_observation_date : 'N/A'}</p>
            {selectedNeo.is_potentially_hazardous_asteroid && (
              <div className="hazardous-details">
                <h3>⚠️ Potentially Hazardous</h3>
                <p>Minimum orbit intersection: {selectedNeo.close_approach_data?.[0]?.miss_distance?.astronomical || 'N/A'} AU</p>
              </div>
            )}
          </div>
        ) : (
          <div className="neo-details">
            <h2>No NEO Selected</h2>
            <p>Click a NEO from the list to view its details.</p>
          </div>
        )}
      </div>
      
    </div>
  );
}

export default App;
