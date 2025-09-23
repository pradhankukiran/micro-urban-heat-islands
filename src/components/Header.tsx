import React from 'react';
import { Thermometer, Satellite, MapPin, Github, Download } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-lg border-b border-slate-200">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent">
                Micro-Urban Heat Islands Dashboard
              </h1>
              <p className="text-slate-600 text-sm md:text-base mt-1">
                Research-driven temperature analysis for Los Angeles using Landsat 8 satellite imagery
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50">
              <Satellite className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-800 font-medium">Landsat 8</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-orange-50">
              <MapPin className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-orange-800 font-medium">Los Angeles</span>
            </div>
            
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 transition-colors duration-200">
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Export Data</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white transition-colors duration-200">
                <Github className="w-4 h-4" />
                <span className="text-sm font-medium">View on GitHub</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;