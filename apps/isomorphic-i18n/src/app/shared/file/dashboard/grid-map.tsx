import React, { useState, useMemo, useCallback, memo, ReactNode } from 'react';
import { DeckGL } from '@deck.gl/react';
import { Map as MapGL } from 'react-map-gl';
import { GridLayer } from '@deck.gl/aggregation-layers';
import {
  TIME_BREAKS,
  COLOR_RANGE,
  INITIAL_VIEW_STATE,
  GRID_LAYER_SETTINGS,
  SHARED_STYLES,
} from '@/app/constants/mapConfig';
import { api } from '@/trpc/react';
import { IconSatellite, IconMap } from '@tabler/icons-react';
import { useTheme } from 'next-themes';
import { useTranslation } from '@/app/i18n/client';

// Types
export type Theme = 'light' | 'dark';
export interface TimeBreak {
  min: number;
  max: number;
  label: string;
}
export interface DataPoint {
  position: [number, number];
  avgTimeHours: number;
  totalVisits: number;
  avgSpeed: number;
  originalCells: number;
}

interface TimeRangeButtonProps {
  range: TimeBreak;
  index: number;
  isSelected: boolean;
  colorRange: number[][];
  theme: Theme;
  onToggle: (range: TimeBreak) => void;
}

interface InfoPanelProps {
  theme: Theme;
  data: DataPoint[];
  colorRange: number[][];
  selectedRanges: TimeBreak[];
  onRangeToggle: (range: TimeBreak) => void;
}

// No props needed

// Utility functions
type Stats = {
  totalVisits: string;
  avgTime: string;
  maxTime: string;
  gridCells: string;
  avgSpeed: string;
};
const calculateStats = (data: DataPoint[]): Stats => {
  const totalVisits = data.reduce((sum, d) => sum + (d.totalVisits || 0), 0);
  const avgTime = data.reduce((sum, d) => sum + (d.avgTimeHours || 0), 0) / (data.length || 1);
  const maxTime = Math.max(...data.map(d => d.avgTimeHours || 0), 0);
  const avgSpeed = data.reduce((sum, d) => sum + (d.avgSpeed || 0), 0) / (data.length || 1);
  return {
    totalVisits: totalVisits.toLocaleString(),
    avgTime: avgTime.toFixed(1),
    maxTime: maxTime.toFixed(1),
    gridCells: data.length.toLocaleString(),
    avgSpeed: avgSpeed.toFixed(1),
  };
};

const getColorForValue = (value: number): number => {
  for (let i = TIME_BREAKS.length - 1; i >= 0; i--) {
    const range = TIME_BREAKS[i];
    if (value >= range.min && (range.max === Infinity ? true : value < range.max)) {
      return i;
    }
  }
  return 0;
};

const TimeRangeButton = memo(function TimeRangeButton({
  range,
  index,
  isSelected,
  colorRange,
  theme,
  onToggle,
}: TimeRangeButtonProps) {
  return (
    <div
      onClick={() => onToggle(range)}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '4px 8px',
        cursor: 'pointer',
        backgroundColor: isSelected
          ? theme === 'dark'
            ? 'rgba(59, 130, 246, 0.15)'
            : 'rgba(59, 130, 246, 0.1)'
          : 'transparent',
        borderRadius: '4px',
        opacity: isSelected ? 1 : 0.6,
        transition: SHARED_STYLES.transitions.default,
      }}
    >
      <div
        style={{
          width: '10px',
          height: '10px',
          backgroundColor: `rgb(${colorRange[index].join(',')})`,
          marginRight: '6px',
          borderRadius: '2px',
        }}
      />
      <span
        style={{
          fontSize: '12px',
          color: theme === 'dark' ? '#ffffff' : '#000000',
        }}
      >
        {range.label}
      </span>
    </div>
  );
});

const InfoPanel = memo(function InfoPanel({
  theme,
  data,
  colorRange,
  selectedRanges,
  onRangeToggle,
}: InfoPanelProps) {
  const { t } = useTranslation('common');
  const stats = useMemo(() => calculateStats(data), [data]);
  return (
    <div
      style={{
        position: 'absolute',
        top: 20,
        left: 20,
        padding: '16px',
        width: '380px',
        zIndex: 1,
        ...SHARED_STYLES.glassPanel(theme),
      }}
    >
      <h3
        style={{
          margin: '0 0 16px 0',
          ...(SHARED_STYLES.text.heading(theme) as React.CSSProperties),
        }}
      >
        {t('info-fishing-effort-title')}
      </h3>
      <div
        style={{
          marginBottom: '20px',
          padding: '8px 12px',
          backgroundColor:
            theme === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.05)',
          borderRadius: '4px',
          fontSize: '13px',
        }}
      >
        <div style={{ marginBottom: '4px' }}>
          <strong>{t('info-grid-resolution')}</strong> {t('info-grid-resolution-value')}
        </div>
        <div
          style={{
            color:
              theme === 'dark'
                ? 'rgba(255, 255, 255, 0.7)'
                : 'rgba(0, 0, 0, 0.7)',
            fontSize: '12px',
            lineHeight: '1.4',
          }}
        >
          {t('info-each-cell')}
        </div>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            marginBottom: '8px',
            ...(SHARED_STYLES.text.label(theme) as React.CSSProperties),
          }}
        >
          {t('info-average-time-spent')}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
          }}
        >
          <div
            style={{
              height: '8px',
              flex: 1,
              background: `linear-gradient(to right, ${colorRange
                .map((c: number[]) => `rgb(${c.join(',')})`)
                .join(', ')})`,
              borderRadius: '4px',
            }}
          />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            ...(SHARED_STYLES.text.label(theme) as React.CSSProperties),
          }}
        >
          <span>{t('info-fewer-hours')}</span>
          <span>{t('info-more-hours')}</span>
        </div>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            marginBottom: '8px',
            ...(SHARED_STYLES.text.label(theme) as React.CSSProperties),
          }}
        >
          {t('info-time-ranges')}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '4px',
          }}
        >
          {TIME_BREAKS.map((range: TimeBreak, i: number) => (
            <TimeRangeButton
              key={range.label}
              range={range}
              index={i}
              isSelected={selectedRanges.some(
                (r: TimeBreak) => r.min === range.min && r.max === range.max
              )}
              colorRange={colorRange}
              theme={theme}
              onToggle={onRangeToggle}
            />
          ))}
        </div>
      </div>
      <div
        style={{
          fontSize: '14px',
          lineHeight: '1.6',
          display: 'grid',
          gap: '12px',
        }}
      >
        <div>
          <div
            style={{
              marginBottom: '4px',
              ...(SHARED_STYLES.text.label(theme) as React.CSSProperties),
            }}
          >
            {t('info-activity')}
          </div>
          <div>
            <strong>{t('info-total-visits', { count: Number(stats.totalVisits) })}</strong>
          </div>
          <div>
            <strong>{t('info-active-cells', { count: Number(stats.gridCells) })}</strong>
          </div>
        </div>
        <div>
          <div
            style={{
              marginBottom: '4px',
              ...(SHARED_STYLES.text.label(theme) as React.CSSProperties),
            }}
          >
            {t('info-time-speed')}
          </div>
          <div>
            <strong>{t('info-avg-time', { value: stats.avgTime })}</strong>
          </div>
          <div>
            <strong>{t('info-max-time', { value: stats.maxTime })}</strong>
          </div>
          <div>
            <strong>{t('info-avg-speed', { value: stats.avgSpeed })}</strong>
          </div>
        </div>
        <div
          style={{
            marginTop: '8px',
            paddingTop: '12px',
            borderTop:
              theme === 'dark'
                ? '1px solid rgba(156, 163, 175, 0.2)'
                : '1px solid rgba(107, 114, 128, 0.2)',
            ...(SHARED_STYLES.text.label(theme) as React.CSSProperties),
          }}
        >
          {t('info-rotate-hint')}
        </div>
      </div>
    </div>
  );
});

const MAP_STYLES = {
  light: 'mapbox://styles/mapbox/light-v11',
  dark: 'mapbox://styles/mapbox/dark-v11',
  satellite: 'mapbox://styles/mapbox/satellite-v9',
};

const GridMap = memo(function GridMap() {
  const { theme: rawTheme = 'light' } = useTheme();
  const theme = (rawTheme === 'dark' ? 'dark' : 'light') as Theme;
  const { data = [] } = api.gridSummary.all.useQuery();
  const FILTERED_DATA: DataPoint[] = useMemo(
    () =>
      (data as any[])
        .filter((d) => !d.type?.includes('metadata'))
        .map((d) => ({
          position: [d.lng_grid_1km, d.lat_grid_1km] as [number, number],
          avgTimeHours: d.avg_time_hours || 0,
          totalVisits: parseInt(d.total_visits) || 0,
          avgSpeed: parseFloat(d.avg_speed) || 0,
          originalCells: parseInt(d.original_cells) || 0,
        })),
    [data]
  );
  const [viewState, setViewState] = useState<typeof INITIAL_VIEW_STATE>(INITIAL_VIEW_STATE);
  const [selectedRanges, setSelectedRanges] = useState<TimeBreak[]>(TIME_BREAKS);
  const transformedData: DataPoint[] = useMemo(
    () =>
      FILTERED_DATA.filter((d) =>
        selectedRanges.some(
          (range) =>
            d.avgTimeHours >= range.min &&
            (range.max === Infinity ? true : d.avgTimeHours < range.max)
        )
      ),
    [FILTERED_DATA, selectedRanges]
  );
  const handleRangeToggle = useCallback((range: TimeBreak) => {
    setSelectedRanges((current: TimeBreak[]) => {
      const isSelected = current.some(
        (r) => r.min === range.min && r.max === range.max
      );
      if (isSelected) {
        return current.length === 1
          ? current
          : current.filter((r) => r.min !== range.min || r.max !== range.max);
      }
      return [...current, range];
    });
  }, []);
  const handleViewStateChange = useCallback((args: { viewState: typeof INITIAL_VIEW_STATE }) => {
    setViewState(args.viewState);
  }, []);
  const getTooltip = useCallback(
    (info: {
      object?: {
        points: { source: DataPoint }[];
      };
    }) => {
      const object = info.object;
      if (!object) return null;
      const avgTime =
        object.points.reduce((sum, p) => sum + p.source.avgTimeHours, 0) /
        object.points.length;
      const breakIndex = TIME_BREAKS.findIndex(
        (range) =>
          avgTime >= range.min && (range.max === Infinity ? true : avgTime < range.max)
      );
      const cellColor = COLOR_RANGE[breakIndex >= 0 ? breakIndex : 0];
      const totalVisits = object.points.reduce(
        (sum, p) => sum + p.source.totalVisits,
        0
      );
      return {
        html: `
          <div style="padding: 8px">
            <div><strong>Time spent</strong></div>
            <div>Average time: ${avgTime.toFixed(2)} hours</div>
            <div><strong>Activity</strong></div>
            <div>Total visits: ${totalVisits}</div>
          </div>
        `,
        style: {
          backgroundColor: `rgba(${cellColor.join(',')}, 0.95)`,
          color: breakIndex > COLOR_RANGE.length / 2 ? '#ffffff' : '#000000',
          fontSize: '12px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        },
      };
    },
    []
  );
  const layers = useMemo(
    () => [
      new GridLayer({
        ...GRID_LAYER_SETTINGS,
        id: 'grid-layer',
        data: transformedData,
        pickable: true,
        extruded: true,
        getPosition: (d: DataPoint) => d.position,
        getElevationWeight: (d: DataPoint) => d.avgTimeHours,
        colorRange: COLOR_RANGE as any,
        colorScaleType: 'ordinal',
        getColorWeight: (d: DataPoint) => (d ? getColorForValue(d.avgTimeHours) : 0),
        updateTriggers: {
          getColorWeight: [selectedRanges],
        },
      }),
    ],
    [transformedData, selectedRanges]
  );
  // Only two states: 'satellite' and 'map'
  const [viewMode, setViewMode] = useState<'satellite' | 'map'>('satellite');
  const iconColor = theme === 'dark' ? '#fff' : '#222';

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Single Icon Map Style Switcher, now theme-aware */}
      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
        <button
          onClick={() => setViewMode(viewMode === 'satellite' ? 'map' : 'satellite')}
          style={{
            background: theme === 'dark' ? 'rgba(30,41,59,0.85)' : 'rgba(255,255,255,0.85)',
            border: theme === 'dark' ? '1px solid #334155' : '1px solid #d1d5db',
            borderRadius: 8,
            padding: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s, border 0.2s',
          }}
          title={viewMode === 'satellite' ? 'Switch to Map View' : 'Switch to Satellite View'}
          aria-label={viewMode === 'satellite' ? 'Switch to Map View' : 'Switch to Satellite View'}
        >
          {viewMode === 'satellite' ? (
            <IconMap size={28} color={iconColor} />
          ) : (
            <IconSatellite size={28} color={iconColor} />
          )}
        </button>
      </div>
      <DeckGL
        initialViewState={viewState}
        controller={true}
        layers={layers}
        onViewStateChange={(params) => setViewState(params.viewState as typeof INITIAL_VIEW_STATE)}
        getTooltip={getTooltip as any}
        style={{ width: '100%', height: '100%' }}
      >
        <MapGL
          mapStyle={
            viewMode === 'satellite'
              ? MAP_STYLES.satellite
              : theme === 'dark'
                ? MAP_STYLES.dark
                : MAP_STYLES.light
          }
          mapboxAccessToken={import.meta.env?.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoibGFuZ2JhcnQiLCJhIjoiY2xkcGN0b3lhMDhmODNvbzQzNGlqbXI0OSJ9.JhvnRPg7hwJ5rPc5M5NChQ'}
          reuseMaps
          attributionControl={false}
          renderWorldCopies={false}
          antialias
          style={{ width: '100%', height: '100%' }}
        />
      </DeckGL>
      <InfoPanel
        theme={theme}
        data={transformedData}
        colorRange={COLOR_RANGE}
        selectedRanges={selectedRanges}
        onRangeToggle={handleRangeToggle}
      />
    </div>
  );
});

export default GridMap; 