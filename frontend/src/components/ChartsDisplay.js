import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const ChartsDisplay = ({ timeSeries }) => {
  const [activeChart, setActiveChart] = useState('heartRate');

  if (!timeSeries || !timeSeries.timestamps || timeSeries.timestamps.length === 0) {
    return (
      <div className="chart-container">
        <div className="alert alert-info">
          <i className="bi bi-info-circle me-2"></i>
          没有可用的时间序列数据。
        </div>
      </div>
    );
  }

  // 准备图表数据
  const chartData = timeSeries.timestamps.map((timestamp, index) => ({
    time: timestamp,
    heartRate: timeSeries.heart_rates[index],
    pace: timeSeries.paces[index],
    distance: timeSeries.distances[index],
    altitude: timeSeries.altitudes[index]
  })).filter(item => item.heartRate !== null || item.pace !== null);

  // 心率图表数据
  const heartRateData = chartData
    .filter(item => item.heartRate !== null)
    .map(item => ({
      time: item.time,
      心率: item.heartRate
    }));

  // 配速图表数据
  const paceData = chartData
    .filter(item => item.pace !== null)
    .map(item => ({
      time: item.time,
      配速: item.pace
    }));

  // 距离图表数据
  const distanceData = chartData
    .filter(item => item.distance !== null)
    .map(item => ({
      time: item.time,
      距离: item.distance
    }));

  // 海拔图表数据
  const altitudeData = chartData
    .filter(item => item.altitude !== null)
    .map(item => ({
      time: item.time,
      海拔: item.altitude
    }));

  const renderHeartRateChart = () => (
    <div className="chart-container">
      <h5 className="mb-3">🏃 心率变化曲线</h5>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={heartRateData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="time"
            angle={-45}
            textAnchor="end"
            height={60}
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis
            label={{ value: '心率 (bpm)', angle: -90, position: 'insideLeft' }}
            domain={['auto', 'auto']}
          />
          <Tooltip
            formatter={(value) => [`${value} bpm`, '心率']}
            labelFormatter={(label) => `时间: ${label}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="心率"
            stroke="#e63946"
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 6 }}
            name="心率"
          />
          {/* 添加心率区间参考线 */}
          <Line
            type="monotone"
            dataKey={() => 120}
            stroke="#a8e6cf"
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
            name="Z1上限"
          />
          <Line
            type="monotone"
            dataKey={() => 140}
            stroke="#ffd3b6"
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
            name="Z2上限"
          />
          <Line
            type="monotone"
            dataKey={() => 160}
            stroke="#ff8b94"
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
            name="Z3上限"
          />
          <Line
            type="monotone"
            dataKey={() => 180}
            stroke="#a283c4"
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
            name="Z4上限"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  const renderPaceChart = () => (
    <div className="chart-container">
      <h5 className="mb-3">⚡ 配速变化曲线</h5>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={paceData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="time"
            angle={-45}
            textAnchor="end"
            height={60}
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis
            label={{ value: '配速 (min/km)', angle: -90, position: 'insideLeft' }}
            reversed
            domain={['auto', 'auto']}
          />
          <Tooltip
            formatter={(value) => [`${value.toFixed(2)} min/km`, '配速']}
            labelFormatter={(label) => `时间: ${label}`}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="配速"
            stroke="#3a86ff"
            fill="#3a86ff"
            fillOpacity={0.3}
            strokeWidth={2}
            name="配速"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );

  const renderDistanceChart = () => (
    <div className="chart-container">
      <h5 className="mb-3">📏 累积距离</h5>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={distanceData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="time"
            angle={-45}
            textAnchor="end"
            height={60}
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis
            label={{ value: '距离 (km)', angle: -90, position: 'insideLeft' }}
            domain={[0, 'auto']}
          />
          <Tooltip
            formatter={(value) => [`${value.toFixed(2)} km`, '距离']}
            labelFormatter={(label) => `时间: ${label}`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="距离"
            stroke="#118ab2"
            strokeWidth={3}
            dot={{ r: 2 }}
            activeDot={{ r: 6 }}
            name="累积距离"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );

  const renderAltitudeChart = () => {
    if (altitudeData.length === 0) return null;

    return (
      <div className="chart-container">
        <h5 className="mb-3">⛰️ 海拔变化</h5>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={altitudeData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="time"
              angle={-45}
              textAnchor="end"
              height={60}
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              label={{ value: '海拔 (m)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              formatter={(value) => [`${value.toFixed(0)} m`, '海拔']}
              labelFormatter={(label) => `时间: ${label}`}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="海拔"
              stroke="#2a9d8f"
              fill="#2a9d8f"
              fillOpacity={0.3}
              strokeWidth={2}
              name="海拔"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const chartComponents = {
    heartRate: renderHeartRateChart,
    pace: renderPaceChart,
    distance: renderDistanceChart,
    altitude: renderAltitudeChart
  };

  const chartTabs = [
    { id: 'heartRate', label: '心率', icon: 'bi-heart' },
    { id: 'pace', label: '配速', icon: 'bi-speedometer' },
    { id: 'distance', label: '距离', icon: 'bi-signpost' },
  ];

  if (altitudeData.length > 0) {
    chartTabs.push({ id: 'altitude', label: '海拔', icon: 'bi-mountain' });
  }

  return (
    <div className="charts-display">
      <div className="chart-tabs mb-3">
        <div className="nav nav-tabs">
          {chartTabs.map((tab) => (
            <button
              key={tab.id}
              className={`nav-link ${activeChart === tab.id ? 'active' : ''}`}
              onClick={() => setActiveChart(tab.id)}
            >
              <i className={`bi ${tab.icon} me-2`}></i>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {chartComponents[activeChart] ? chartComponents[activeChart]() : renderHeartRateChart()}

      <div className="mt-3">
        <p className="text-muted small">
          <i className="bi bi-info-circle me-1"></i>
          图表显示了随时间变化的关键指标。使用鼠标悬停查看详细数值。
        </p>
      </div>
    </div>
  );
};

export default ChartsDisplay;