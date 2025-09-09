import cn from "@utils/class-names";
import React, { useState } from "react";
import { VscSettings, VscChromeClose } from "react-icons/vsc";

interface InfoPanelProps {
  count: number;
  radius: number;
  onRadiusChange: (value: number) => void;
  radiusMin: number;
  radiusMax: number;
  radiusStep: number;
  selectedSites: string[];
  onSiteChange: (site: string) => void;
  sites: string[];
}

const InfoPanel: React.FC<InfoPanelProps> = ({
  count,
  radius,
  onRadiusChange,
  radiusMin,
  radiusMax,
  radiusStep,
  selectedSites,
  onSiteChange,
  sites
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg w-72">
      <h2 className="text-xl font-bold mb-2">Mozambique Landing Sites</h2>
      <p className="mb-2">Distribution of landing sites in Mozambique</p>
      <p className="mb-4">The layer aggregates data within the boundary of each hexagon cell</p>
      
      <div className="flex items-center mb-2">
        <div className="w-full bg-gradient-to-r from-blue-300 via-green-300 to-red-300 h-4 rounded"></div>
      </div>
      <p className="mb-4 text-sm">Fewer Points <span className="float-right">More Points</span></p>
      
      <h3 className="text-2xl font-bold mb-4">POINTS: {count.toLocaleString()}</h3>
            
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Landing Sites</label>
        <div className="max-h-48 overflow-y-auto">
          {sites.map(site => (
            <div key={site} className="flex items-center mr-4 mb-2">
              <input 
                type="checkbox" 
                value={site} 
                checked={selectedSites.includes(site)} 
                onChange={() => onSiteChange(site)} 
                className="mr-2" 
              />
              <label>{site}</label>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Radius (meters)
        </label>
        <input
          type="range"
          min={radiusMin}
          max={radiusMax}
          step={radiusStep}
          value={radius}
          onChange={(e) => onRadiusChange(parseInt(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-600">
          {Array.from(
            { length: (radiusMax - radiusMin) / radiusStep + 1 },
            (_, i) => radiusMin + i * radiusStep
          ).map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InfoPanel;