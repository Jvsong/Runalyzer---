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
  ScatterChart,
  Scatter,
  ComposedChart
} from 'recharts';

const ChartsDisplay = ({ timeSeries }) => {
  const [activeChart, setActiveChart] = useState('heartRate');

  // 计算直方图数据的辅助函数
  const calculateHistogramData = (data, bins, label) => {
    if (!data || data.length === 0) return [];

    const min = Math.min(...data);
    const max = Math.max(...data);
    const binWidth = (max - min) / bins;

    const histogram = [];
    for (let i = 0; i < bins; i++) {
      const binStart = min + i * binWidth;
      const binEnd = binStart + binWidth;
      const count = data.filter(value => value >= binStart && value < binEnd).length;

      histogram.push({
        range: `${binStart.toFixed(1)}-${binEnd.toFixed(1)}`,
        count,
        label: `${label}分布`
      });
    }

    return histogram;
  };

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

  // 心率vs配速散点图数据
  const hrVsPaceData = chartData
    .filter(item => item.heartRate !== null && item.pace !== null)
    .map(item => ({
      心率: item.heartRate,
      配速: item.pace,
      time: item.time
    }));

  // 心率分布数据（直方图）
  const heartRateHistogramData = calculateHistogramData(
    chartData.filter(item => item.heartRate !== null).map(item => item.heartRate),
    10,  // 箱数
    '心率'
  );

  // 配速分布数据（直方图）
  const paceHistogramData = calculateHistogramData(
    chartData.filter(item => item.pace !== null).map(item => item.pace),
    10,  // 箱数
    '配速'
  );

  // 组合图表数据（心率和配速叠加）
  const combinedData = chartData
    .filter(item => item.heartRate !== null && item.pace !== null)
    .slice(0, 50) // 限制数据点数量
    .map(item => ({
      time: item.time,
      心率: item.heartRate,
      配速: item.pace
    }));

  // 计算基本统计数据
  const stats = {
    heartRate: {
      min: null,
      max: null,
      avg: null,
      count: 0
    },
    pace: {
      min: null,
      max: null,
      avg: null,
      count: 0
    },
    distance: {
      total: null,
      count: 0
    },
    altitude: {
      min: null,
      max: null,
      avg: null,
      count: 0
    }
  };

  // 计算心率统计
  const heartRates = chartData.filter(item => item.heartRate !== null).map(item => item.heartRate);
  if (heartRates.length > 0) {
    stats.heartRate.min = Math.min(...heartRates);
    stats.heartRate.max = Math.max(...heartRates);
    stats.heartRate.avg = heartRates.reduce((a, b) => a + b, 0) / heartRates.length;
    stats.heartRate.count = heartRates.length;
  }

  // 计算配速统计
  const paces = chartData.filter(item => item.pace !== null).map(item => item.pace);
  if (paces.length > 0) {
    stats.pace.min = Math.min(...paces);
    stats.pace.max = Math.max(...paces);
    stats.pace.avg = paces.reduce((a, b) => a + b, 0) / paces.length;
    stats.pace.count = paces.length;
  }

  // 计算距离统计
  const distances = chartData.filter(item => item.distance !== null).map(item => item.distance);
  if (distances.length > 0) {
    stats.distance.total = distances[distances.length - 1] - distances[0];
    stats.distance.count = distances.length;
  }

  // 计算海拔统计
  const altitudes = chartData.filter(item => item.altitude !== null).map(item => item.altitude);
  if (altitudes.length > 0) {
    stats.altitude.min = Math.min(...altitudes);
    stats.altitude.max = Math.max(...altitudes);
    stats.altitude.avg = altitudes.reduce((a, b) => a + b, 0) / altitudes.length;
    stats.altitude.count = altitudes.length;
  }

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

  // 心率vs配速散点图
  const renderHrVsPaceChart = () => {
    if (hrVsPaceData.length === 0) return null;

    return (
      <div className="chart-container">
        <h5 className="mb-3">📊 心率 vs 配速关系</h5>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart
            data={hrVsPaceData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              type="number"
              dataKey="心率"
              name="心率"
              label={{ value: '心率 (bpm)', angle: 0, position: 'bottom' }}
              domain={['auto', 'auto']}
            />
            <YAxis
              type="number"
              dataKey="配速"
              name="配速"
              label={{ value: '配速 (min/km)', angle: -90, position: 'insideLeft' }}
              reversed
              domain={['auto', 'auto']}
            />
            <Tooltip
              formatter={(value, name) => {
                if (name === '心率') return [`${value} bpm`, '心率'];
                if (name === '配速') return [`${value.toFixed(2)} min/km`, '配速'];
                return [value, name];
              }}
              labelFormatter={(label) => ''}
            />
            <Legend />
            <Scatter
              name="心率 vs 配速"
              data={hrVsPaceData}
              fill="#8884d8"
              shape="circle"
              fillOpacity={0.6}
            />
          </ScatterChart>
        </ResponsiveContainer>
        <p className="text-muted small mt-2">
          <i className="bi bi-info-circle me-1"></i>
          散点图显示了心率和配速之间的关系。理想情况下，心率越高，配速越快（点应沿对角线分布）。
        </p>
      </div>
    );
  };

  // 心率分布直方图
  const renderHeartRateHistogram = () => {
    if (heartRateHistogramData.length === 0) return null;

    return (
      <div className="chart-container">
        <h5 className="mb-3">📈 心率分布</h5>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={heartRateHistogramData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="range"
              angle={-45}
              textAnchor="end"
              height={60}
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              label={{ value: '频数', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              formatter={(value) => [`${value} 次`, '频数']}
              labelFormatter={(label) => `区间: ${label}`}
            />
            <Legend />
            <Bar
              dataKey="count"
              name="心率分布"
              fill="#e63946"
              fillOpacity={0.8}
            />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-muted small mt-2">
          <i className="bi bi-info-circle me-1"></i>
          直方图显示了心率值的分布情况。理想的心率分布应集中在有氧区间。
        </p>
      </div>
    );
  };

  // 配速分布直方图
  const renderPaceHistogram = () => {
    if (paceHistogramData.length === 0) return null;

    return (
      <div className="chart-container">
        <h5 className="mb-3">📈 配速分布</h5>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={paceHistogramData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="range"
              angle={-45}
              textAnchor="end"
              height={60}
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              label={{ value: '频数', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              formatter={(value) => [`${value} 次`, '频数']}
              labelFormatter={(label) => `区间: ${label}`}
            />
            <Legend />
            <Bar
              dataKey="count"
              name="配速分布"
              fill="#3a86ff"
              fillOpacity={0.8}
            />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-muted small mt-2">
          <i className="bi bi-info-circle me-1"></i>
          直方图显示了配速值的分布情况。稳定的配速分布应集中在一个较窄的区间。
        </p>
      </div>
    );
  };

  // 组合图表（心率和配速叠加）
  const renderCombinedChart = () => {
    if (combinedData.length === 0) return null;

    return (
      <div className="chart-container">
        <h5 className="mb-3">📊 心率与配速叠加图</h5>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart
            data={combinedData}
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
              yAxisId="left"
              label={{ value: '心率 (bpm)', angle: -90, position: 'insideLeft' }}
              domain={['auto', 'auto']}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              label={{ value: '配速 (min/km)', angle: -90, position: 'insideRight' }}
              reversed
              domain={['auto', 'auto']}
            />
            <Tooltip
              formatter={(value, name) => {
                if (name === '心率') return [`${value} bpm`, '心率'];
                if (name === '配速') return [`${value.toFixed(2)} min/km`, '配速'];
                return [value, name];
              }}
              labelFormatter={(label) => `时间: ${label}`}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="心率"
              stroke="#e63946"
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 6 }}
              name="心率"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="配速"
              stroke="#3a86ff"
              strokeWidth={2}
              dot={{ r: 2 }}
              activeDot={{ r: 6 }}
              name="配速"
            />
          </ComposedChart>
        </ResponsiveContainer>
        <p className="text-muted small mt-2">
          <i className="bi bi-info-circle me-1"></i>
          组合图同时显示心率和配速随时间的变化，便于比较两者的关系。
        </p>
      </div>
    );
  };

  // 渲染统计摘要
  const renderStatsSummary = () => (
    <div className="stats-summary mb-4">
      <div className="card">
        <div className="card-header">
          <h6 className="mb-0"><i className="bi bi-graph-up me-2"></i>数据统计摘要</h6>
        </div>
        <div className="card-body">
          <div className="row">
            {stats.heartRate.count > 0 && (
              <div className="col-md-3 col-sm-6 mb-3">
                <div className="stat-card">
                  <div className="stat-label">心率</div>
                  <div className="stat-value">{stats.heartRate.avg.toFixed(1)} bpm</div>
                  <div className="stat-details">
                    <span className="me-3">最低: {stats.heartRate.min.toFixed(0)}</span>
                    <span>最高: {stats.heartRate.max.toFixed(0)}</span>
                  </div>
                  <div className="stat-count">{stats.heartRate.count} 个数据点</div>
                </div>
              </div>
            )}
            {stats.pace.count > 0 && (
              <div className="col-md-3 col-sm-6 mb-3">
                <div className="stat-card">
                  <div className="stat-label">配速</div>
                  <div className="stat-value">{stats.pace.avg.toFixed(2)} min/km</div>
                  <div className="stat-details">
                    <span className="me-3">最快: {stats.pace.min.toFixed(2)}</span>
                    <span>最慢: {stats.pace.max.toFixed(2)}</span>
                  </div>
                  <div className="stat-count">{stats.pace.count} 个数据点</div>
                </div>
              </div>
            )}
            {stats.distance.total !== null && (
              <div className="col-md-3 col-sm-6 mb-3">
                <div className="stat-card">
                  <div className="stat-label">距离</div>
                  <div className="stat-value">{stats.distance.total.toFixed(2)} km</div>
                  <div className="stat-details">
                    <span>数据点: {stats.distance.count}</span>
                  </div>
                  <div className="stat-count">累积距离</div>
                </div>
              </div>
            )}
            {stats.altitude.count > 0 && (
              <div className="col-md-3 col-sm-6 mb-3">
                <div className="stat-card">
                  <div className="stat-label">海拔</div>
                  <div className="stat-value">{stats.altitude.avg.toFixed(0)} m</div>
                  <div className="stat-details">
                    <span className="me-3">最低: {stats.altitude.min.toFixed(0)}</span>
                    <span>最高: {stats.altitude.max.toFixed(0)}</span>
                  </div>
                  <div className="stat-count">{stats.altitude.count} 个数据点</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const chartComponents = {
    heartRate: renderHeartRateChart,
    pace: renderPaceChart,
    distance: renderDistanceChart,
    altitude: renderAltitudeChart,
    hrVsPace: renderHrVsPaceChart,
    hrHistogram: renderHeartRateHistogram,
    paceHistogram: renderPaceHistogram,
    combined: renderCombinedChart
  };

  const chartTabs = [
    { id: 'heartRate', label: '心率', icon: 'bi-heart' },
    { id: 'pace', label: '配速', icon: 'bi-speedometer' },
    { id: 'distance', label: '距离', icon: 'bi-signpost' },
  ];

  if (altitudeData.length > 0) {
    chartTabs.push({ id: 'altitude', label: '海拔', icon: 'bi-mountain' });
  }

  // 添加新图表选项卡（仅在数据可用时）
  if (hrVsPaceData.length > 0) {
    chartTabs.push({ id: 'hrVsPace', label: '心率vs配速', icon: 'bi-bullseye' });
  }

  if (heartRateHistogramData.length > 0) {
    chartTabs.push({ id: 'hrHistogram', label: '心率分布', icon: 'bi-bar-chart' });
  }

  if (paceHistogramData.length > 0) {
    chartTabs.push({ id: 'paceHistogram', label: '配速分布', icon: 'bi-bar-chart' });
  }

  if (combinedData.length > 0) {
    chartTabs.push({ id: 'combined', label: '组合图', icon: 'bi-stack' });
  }

  return (
    <div className="charts-display">
      {/* 数据统计摘要 */}
      {renderStatsSummary()}

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