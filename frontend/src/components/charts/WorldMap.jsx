import React, { memo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json";

// Default color scale (from light green to dark green for positive, light red to dark red for negative)
// We'll just use a generic cool-to-warm scale for macro indicators
const colorScale = scaleLinear()
  .domain([-4, 0, 4])
  .range(["#EF4444", "#F8FAFC", "#12B981"]);

const WorldMap = ({ data = [], dataKey = "value", tooltipContent = "", setTooltipContent }) => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ComposableMap
        projectionConfig={{ scale: 140 }}
        style={{ width: "100%", height: "100%", outline: 'none' }}
      >
        <ZoomableGroup center={[0, 20]} zoom={1} minZoom={1} maxZoom={4}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const d = data.find((s) => s.code === geo.id || (s.country || s.name) === geo.properties.name);
                const val = d ? d[dataKey] : null;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={val !== null ? colorScale(val) : "#E2E8F0"}
                    stroke="#ffffff"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none", transition: "all 250ms" },
                      hover: { fill: "#6D5DFC", outline: "none", cursor: "pointer" },
                      pressed: { fill: "#4B42B3", outline: "none" },
                    }}
                    onMouseEnter={() => {
                      if (setTooltipContent && d) {
                        setTooltipContent(`${geo.properties.name}: ${val}%`);
                      } else if (setTooltipContent) {
                        setTooltipContent(`${geo.properties.name}: No data`);
                      }
                    }}
                    onMouseLeave={() => {
                      if (setTooltipContent) {
                        setTooltipContent("");
                      }
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
};

export default memo(WorldMap);
