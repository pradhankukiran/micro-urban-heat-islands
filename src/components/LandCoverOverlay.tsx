import React, { useState } from 'react';
import {
  TreePine,
  Building,
  Eye,
  EyeOff,
  Settings,
  BarChart3,
  Layers,
  MapPin,
  Info,
  Thermometer,
  Target,
  Sliders,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

import type { LandCoverCategory } from '../services/dataset';

interface LandCoverCategoryState extends LandCoverCategory {
  visible: boolean;
  opacity: number;
}

interface LandCoverOverlayProps {
  selectedDate: string;
  isVisible: boolean;
  onToggleVisibility: () => void;
  onCategoryToggle?: (categoryId: string) => void;
  onOpacityChange?: (categoryId: string, opacity: number) => void;
  categories?: LandCoverCategory[];
}

const LandCoverOverlay: React.FC<LandCoverOverlayProps> = ({
  selectedDate,
  isVisible,
  onToggleVisibility,
  onCategoryToggle,
  onOpacityChange,
  categories = []
}) => {
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    statistics: true,
    analysis: false,
    controls: false
  });

  const [selectedCategory, setSelectedCategory] = useState<LandCoverCategoryState | null>(null);
  const [showCategoryDetails, setShowCategoryDetails] = useState(false);

  // Initialize state with real land cover data from props
  const [landCoverCategories, setLandCoverCategories] = useState<LandCoverCategoryState[]>(() =>
    categories.map(category => ({
      ...category,
      visible: true,
      opacity: 0.7
    }))
  );

  // Update state when categories prop changes
  React.useEffect(() => {
    setLandCoverCategories(categories.map(category => ({
      ...category,
      visible: true,
      opacity: 0.7
    })));
  }, [categories]);

  const totalArea = landCoverCategories.reduce((sum, category) => sum + category.area, 0);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleCategoryVisibility = (categoryId: string) => {
    setLandCoverCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId ? { ...cat, visible: !cat.visible } : cat
      )
    );
    onCategoryToggle?.(categoryId);
  };

  const updateOpacity = (categoryId: string, opacity: number) => {
    setLandCoverCategories(prev =>
      prev.map(cat =>
        cat.id === categoryId ? { ...cat, opacity } : cat
      )
    );
    onOpacityChange?.(categoryId, opacity);
  };

  const showCategoryInfo = (category: LandCoverCategory) => {
    setSelectedCategory(category);
    setShowCategoryDetails(true);
  };

  const getMuhiRiskLevel = (canopy40: number, top2percent: number): { level: string; color: string } => {
    if (canopy40 >= 5 || top2percent >= 15) return { level: 'High', color: 'text-red-600' };
    if (canopy40 >= 1 || top2percent >= 5) return { level: 'Medium', color: 'text-orange-600' };
    return { level: 'Low', color: 'text-green-600' };
  };

  return (
    <div className="bg-white shadow-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TreePine className="w-5 h-5 text-white" />
            <h3 className="text-lg font-semibold text-white">Land Cover Classification</h3>
          </div>
          <button
            onClick={onToggleVisibility}
            className="text-white hover:text-green-200 transition-colors"
          >
            {isVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
        </div>
        <div className="text-xs text-green-100 mt-1">
          OpenStreetMap-derived | 7 Categories | {totalArea.toFixed(0)} ha Total
        </div>
      </div>

      <div className="max-h-[700px] overflow-y-auto">
        <div className="p-4 space-y-4">

          {/* Land Cover Categories */}
          <div className="border border-slate-200">
            <button
              onClick={() => toggleSection('categories')}
              className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-semibold text-slate-700">Category Management</span>
              </div>
              {expandedSections.categories ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {expandedSections.categories && (
              <div className="p-3 space-y-3">
                {landCoverCategories.map((category) => {
                  const percentage = (category.area / totalArea) * 100;
                  const risk = getMuhiRiskLevel(category.muhiContribution.canopy40, category.muhiContribution.top2percent);

                  return (
                    <div key={category.id} className="border border-slate-200 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={category.visible}
                            onChange={() => toggleCategoryVisibility(category.id)}
                            className="w-4 h-4"
                          />
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: category.color, opacity: category.opacity }}
                          ></div>
                          <span className="text-sm font-medium text-slate-800">{category.name}</span>
                        </label>
                        <button
                          onClick={() => showCategoryInfo(category)}
                          className="text-slate-500 hover:text-slate-700"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">Area:</span>
                          <span className="font-medium">{category.area.toFixed(0)} ha ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">MUHI Risk:</span>
                          <span className={`font-medium ${risk.color}`}>{risk.level}</span>
                        </div>

                        {/* Opacity Control */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-600">Opacity:</span>
                            <span className="font-medium">{Math.round(category.opacity * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={category.opacity}
                            onChange={(e) => updateOpacity(category.id, parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Coverage Statistics */}
          <div className="border border-slate-200">
            <button
              onClick={() => toggleSection('statistics')}
              className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-semibold text-slate-700">Coverage Statistics</span>
              </div>
              {expandedSections.statistics ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {expandedSections.statistics && (
              <div className="p-3 space-y-3">
                <div className="bg-slate-50 p-3">
                  <div className="text-xs font-semibold text-slate-700 mb-2">Coverage Distribution</div>
                  {landCoverCategories
                    .sort((a, b) => b.area - a.area)
                    .map((category) => {
                      const percentage = (category.area / totalArea) * 100;
                      return (
                        <div key={category.id} className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: category.color }}
                            ></div>
                            <span className="text-xs text-slate-600">{category.name}</span>
                          </div>
                          <span className="text-xs font-medium">{percentage.toFixed(1)}%</span>
                        </div>
                      );
                    })}
                </div>

                <div className="bg-blue-50 p-3 border border-blue-200">
                  <div className="text-xs font-semibold text-blue-800 mb-2">Total Study Area</div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-600">Total Area:</span>
                      <span className="text-xs font-medium">{totalArea.toFixed(0)} ha</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-600">Square Kilometers:</span>
                      <span className="text-xs font-medium">{(totalArea / 100).toFixed(0)} km²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-600">Categories:</span>
                      <span className="text-xs font-medium">{landCoverCategories.length} types</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* MUHI Analysis */}
          <div className="border border-slate-200">
            <button
              onClick={() => toggleSection('analysis')}
              className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-semibold text-slate-700">MUHI Contribution Analysis</span>
              </div>
              {expandedSections.analysis ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {expandedSections.analysis && (
              <div className="p-3 space-y-3">
                {landCoverCategories
                  .sort((a, b) => b.muhiContribution.canopy40 - a.muhiContribution.canopy40)
                  .map((category) => {
                    const risk = getMuhiRiskLevel(category.muhiContribution.canopy40, category.muhiContribution.top2percent);
                    return (
                      <div key={category.id} className="bg-slate-50 p-3 border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: category.color }}
                            ></div>
                            <span className="text-xs font-medium text-slate-800">{category.name}</span>
                          </div>
                          <span className={`text-xs font-medium ${risk.color}`}>{risk.level} Risk</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="text-xs text-slate-600">≥40°C Threshold</div>
                            <div className="text-sm font-bold text-red-600">{category.muhiContribution.canopy40}%</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-600">≥39°C Threshold</div>
                            <div className="text-sm font-bold text-orange-600">{category.muhiContribution.top2percent}%</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Layer Controls */}
          <div className="border border-slate-200">
            <button
              onClick={() => toggleSection('controls')}
              className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-semibold text-slate-700">Global Controls</span>
              </div>
              {expandedSections.controls ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {expandedSections.controls && (
              <div className="p-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setLandCoverCategories(prev =>
                        prev.map(cat => ({ ...cat, visible: true }))
                      );
                    }}
                    className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-2 hover:bg-green-100"
                  >
                    Show All
                  </button>
                  <button
                    onClick={() => {
                      setLandCoverCategories(prev =>
                        prev.map(cat => ({ ...cat, visible: false }))
                      );
                    }}
                    className="text-xs bg-red-50 text-red-700 border border-red-200 px-3 py-2 hover:bg-red-100"
                  >
                    Hide All
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-medium text-slate-700">Global Opacity</div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    defaultValue="0.7"
                    onChange={(e) => {
                      const opacity = parseFloat(e.target.value);
                      setLandCoverCategories(prev =>
                        prev.map(cat => ({ ...cat, opacity }))
                      );
                    }}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Category Details Modal */}
      {showCategoryDetails && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white max-w-lg w-full mx-4 shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <div
              className="p-4"
              style={{
                background: `linear-gradient(to right, ${selectedCategory.color}80, ${selectedCategory.color}60)`
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: selectedCategory.color }}
                  ></div>
                  <h3 className="text-lg font-semibold text-white">{selectedCategory.name}</h3>
                </div>
                <button
                  onClick={() => setShowCategoryDetails(false)}
                  className="text-white hover:text-slate-200 transition-colors text-xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Description */}
              <div className="bg-slate-50 p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-semibold text-slate-700">Description</span>
                </div>
                <p className="text-xs text-slate-600">{selectedCategory.description}</p>
              </div>

              {/* Coverage Statistics */}
              <div className="bg-blue-50 p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-800">Coverage Statistics</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-600">Area Coverage:</span>
                    <span className="text-xs font-medium">{selectedCategory.area.toFixed(0)} hectares</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-600">Percentage:</span>
                    <span className="text-xs font-medium">{((selectedCategory.area / totalArea) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-600">Classification Code:</span>
                    <span className="text-xs font-medium">{selectedCategory.code}</span>
                  </div>
                </div>
              </div>

              {/* MUHI Contribution */}
              <div className="bg-gradient-to-br from-red-50 to-orange-50 p-4 border border-red-200">
                <div className="flex items-center gap-2 mb-3">
                  <Thermometer className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-semibold text-red-800">MUHI Contribution</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-700">{selectedCategory.muhiContribution.canopy40}%</div>
                    <div className="text-xs text-slate-600">≥40°C Threshold</div>
                    <div className="text-xs text-slate-500">Canopy Reference</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-orange-600">{selectedCategory.muhiContribution.top2percent}%</div>
                    <div className="text-xs text-slate-600">≥39°C Threshold</div>
                    <div className="text-xs text-slate-500">Top 2% Reference</div>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="pt-2">
                <button
                  onClick={() => setShowCategoryDetails(false)}
                  className="w-full text-white py-3 px-4 font-semibold hover:shadow-lg transition-shadow duration-200"
                  style={{
                    background: `linear-gradient(to right, ${selectedCategory.color}, ${selectedCategory.color}dd)`
                  }}
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandCoverOverlay;