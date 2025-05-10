import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

const MAX_ALLOWED_DISTANCE_AU = 0.1;

const NeoList = ({ neos, onSelectNeo, selectedNeo, showOnlyHazardous }) => {
  const [sortMode, setSortMode] = useState('approach');

  const filteredNeos = neos ? Object.entries(neos).flatMap(([date, neosForDate]) => 
    neosForDate.filter(neo => {
      const missAU = parseFloat(neo.close_approach_data[0]?.miss_distance?.astronomical || "1");
      return (!showOnlyHazardous || neo.is_potentially_hazardous_asteroid) && missAU <= MAX_ALLOWED_DISTANCE_AU;
    })
  ) : [];

  const sortedNeos = [...filteredNeos].sort((a, b) => {
    switch (sortMode) {
      case 'diameter':
        return (b.estimated_diameter.meters.estimated_diameter_max - a.estimated_diameter.meters.estimated_diameter_max);
      case 'velocity':
        return (b.close_approach_data[0].relative_velocity.kilometers_per_second - a.close_approach_data[0].relative_velocity.kilometers_per_second);
      case 'missDistance':
        return (a.close_approach_data[0].miss_distance.lunar - b.close_approach_data[0].miss_distance.lunar);
      case 'name':
        return a.name.localeCompare(b.name);
      case 'approach':
      default:
        return new Date(a.close_approach_data[0].close_approach_date) - new Date(b.close_approach_data[0].close_approach_date);
    }
  });

  if (sortedNeos.length === 0) {
    return (
      <div className="empty-neos">
        <p>No {showOnlyHazardous ? 'hazardous ' : ''}NEOs available for selected dates</p>
      </div>
    );
  }

  return (
    <div className="neo-grid-container">
      <div className="sort-menu">
        <label htmlFor="sortSelect">Sort by:</label>
        <select
          id="sortSelect"
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value)}
        >
          <option value="approach">Approach Date (Soonest)</option>
          <option value="diameter">Diameter (Largest)</option>
          <option value="velocity">Velocity (Fastest)</option>
          <option value="missDistance">Miss Distance (Closest)</option>
          <option value="name">Name (A-Z)</option>
        </select>
      </div>

      <div className="neo-grid">
        {sortedNeos.map(neo => (
          <div 
            key={neo.id}
            className={`neo-card ${selectedNeo?.id === neo.id ? 'selected' : ''} ${neo.is_potentially_hazardous_asteroid ? 'hazardous' : ''}`}
            onClick={() => onSelectNeo(neo)}
          >
            <h4>{neo.name}</h4>
            <p>Diameter: {Math.round(neo.estimated_diameter.meters.estimated_diameter_max)}m</p>
            <p>Velocity: {Math.round(neo.close_approach_data[0].relative_velocity.kilometers_per_second)} km/s</p>
            <p>Miss distance: {Math.round(neo.close_approach_data[0].miss_distance.lunar)} lunar distances</p>
            <p>Approach: {formatDistanceToNow(new Date(neo.close_approach_data[0].close_approach_date))}</p>
            {neo.is_potentially_hazardous_asteroid && (
              <div className="warning-label">Potentially Hazardous</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NeoList;
