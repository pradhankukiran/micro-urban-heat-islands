import React from 'react';
import { BookOpen, Database, Satellite, Users } from 'lucide-react';

const ResearchInfo: React.FC = () => {
  return (
    <div className="bg-white shadow-xl border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-700 to-slate-900 p-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-white" />
          <h3 className="text-lg font-semibold text-white">Research Information</h3>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Methodology */}
        <div>
          <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600" />
            Methodology
          </h4>
          <p className="text-sm text-slate-600 leading-relaxed">
            This research analyzes Micro-Urban Heat Islands using Landsat 8 satellite imagery processed through Google Earth Engine. Land Surface Temperature (LST) data is derived from thermal infrared bands and cross-referenced with land-use classifications.
          </p>
        </div>

        {/* Data Sources */}
        <div>
          <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Satellite className="w-4 h-4 text-blue-600" />
            Data Sources
          </h4>
          <ul className="text-sm text-slate-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>Landsat 8 OLI/TIRS Collection 2 Level-2</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>USGS Land Cover Database</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>NOAA Climate Data Online</span>
            </li>
          </ul>
        </div>

        {/* Target Audience */}
        <div>
          <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            Target Audience
          </h4>
          <div className="space-y-2">
            {['Urban Planners', 'Environmental Policy Makers', 'Climate Researchers', 'Community Organizations'].map((audience, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-orange-500"></div>
                <span className="text-slate-600">{audience}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Key Findings */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4">
          <h4 className="font-semibold text-slate-800 mb-3">Key Findings</h4>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <div className="text-lg font-bold text-blue-600">8.5°C</div>
              <div className="text-xs text-slate-600">Avg. temperature difference</div>
            </div>
            <div>
              <div className="text-lg font-bold text-orange-600">67%</div>
              <div className="text-xs text-slate-600">Urban areas affected</div>
            </div>
          </div>
        </div>

        {/* Citation */}
        <div className="pt-4 border-t border-slate-200">
          <div className="text-xs text-slate-500 mb-2">Cite this research:</div>
          <div className="bg-slate-50 p-3 text-xs text-slate-600">
            "Micro-Urban Heat Islands in Los Angeles: A Satellite-Based Analysis" (2024)
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearchInfo;