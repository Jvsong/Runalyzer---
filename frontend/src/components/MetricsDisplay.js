import React from 'react';

const MetricsDisplay = ({ metrics }) => {
  if (!metrics) return null;

  // 心率相关指标
  const hrMetrics = [
    {
      label: '平均心率',
      value: metrics.avg_heart_rate ? `${Math.round(metrics.avg_heart_rate)} bpm` : '--',
      icon: 'bi-heart-pulse',
      color: '#e63946',
      description: '整个活动的平均心率'
    },
    {
      label: '最大心率',
      value: metrics.max_heart_rate ? `${Math.round(metrics.max_heart_rate)} bpm` : '--',
      icon: 'bi-activity',
      color: '#ff006e',
      description: '活动中的最高心率'
    },
    {
      label: '心率变异性',
      value: metrics.hr_std ? `${metrics.hr_std.toFixed(1)}` : '--',
      icon: 'bi-graph-up',
      color: '#8338ec',
      description: '心率的标准差'
    }
  ];

  // 配速相关指标
  const paceMetrics = [
    {
      label: '平均配速',
      value: metrics.avg_pace ? `${metrics.avg_pace.toFixed(2)} min/km` : '--',
      icon: 'bi-speedometer2',
      color: '#3a86ff',
      description: '平均每公里用时'
    },
    {
      label: '最快配速',
      value: metrics.fastest_pace ? `${metrics.fastest_pace.toFixed(2)} min/km` : '--',
      icon: 'bi-lightning-charge',
      color: '#ffbe0b',
      description: '最快的一公里配速'
    },
    {
      label: '配速稳定性',
      value: metrics.pace_std ? `${metrics.pace_std.toFixed(2)}` : '--',
      icon: 'bi-shield-check',
      color: '#06d6a0',
      description: '配速的标准差'
    }
  ];

  // 距离和时间指标
  const distanceMetrics = [
    {
      label: '总距离',
      value: metrics.total_distance ? `${metrics.total_distance.toFixed(2)} km` : '--',
      icon: 'bi-signpost',
      color: '#118ab2',
      description: '活动总距离'
    },
    {
      label: '总时间',
      value: metrics.total_time_minutes ?
        `${Math.floor(metrics.total_time_minutes / 60)}h ${Math.floor(metrics.total_time_minutes % 60)}m` : '--',
      icon: 'bi-clock',
      color: '#073b4c',
      description: '活动总时长'
    },
    {
      label: '平均速度',
      value: metrics.total_distance && metrics.total_time_minutes ?
        `${(metrics.total_distance / (metrics.total_time_minutes / 60)).toFixed(2)} km/h` : '--',
      icon: 'bi-graph-up-arrow',
      color: '#ef476f',
      description: '平均速度'
    }
  ];

  // 其他指标
  const otherMetrics = [
    {
      label: '平均步频',
      value: metrics.avg_cadence ? `${Math.round(metrics.avg_cadence)} spm` : '--',
      icon: 'bi-person-walking',
      color: '#7209b7',
      description: '平均每分钟步数'
    },
    {
      label: '总爬升',
      value: metrics.total_ascent ? `${metrics.total_ascent.toFixed(0)} m` : '--',
      icon: 'bi-mountain',
      color: '#2a9d8f',
      description: '累计爬升高度'
    },
    {
      label: '训练负荷',
      value: metrics.training_load ? `${Math.round(metrics.training_load)} TRIMP` : '--',
      icon: 'bi-battery-charging',
      color: '#e76f51',
      description: 'TRIMP训练负荷值'
    }
  ];

  const renderMetricCard = (metric, index) => (
    <div key={index} className="col-md-4 col-sm-6 mb-3">
      <div className="metric-card card h-100">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <div
              className="metric-icon me-3 rounded-circle d-flex align-items-center justify-content-center"
              style={{
                width: '50px',
                height: '50px',
                backgroundColor: `${metric.color}20`,
                color: metric.color
              }}
            >
              <i className={`bi ${metric.icon}`} style={{ fontSize: '1.5rem' }}></i>
            </div>
            <div>
              <div className="metric-value">{metric.value}</div>
              <div className="metric-label">{metric.label}</div>
            </div>
          </div>
          <p className="card-text text-muted small mb-0">
            <i className="bi bi-info-circle me-1"></i>
            {metric.description}
          </p>
        </div>
      </div>
    </div>
  );

  const renderMetricSection = (title, metrics, icon) => (
    <div className="mb-4">
      <div className="d-flex align-items-center mb-3">
        <i className={`bi ${icon} me-2`} style={{ fontSize: '1.5rem', color: '#667eea' }}></i>
        <h4 className="mb-0">{title}</h4>
      </div>
      <div className="row">
        {metrics.map((metric, index) => renderMetricCard(metric, index))}
      </div>
    </div>
  );

  return (
    <div className="metrics-display">
      {metrics.has_hr_data && renderMetricSection('心率分析', hrMetrics, 'bi-heart')}
      {metrics.has_pace_data && renderMetricSection('配速分析', paceMetrics, 'bi-speedometer')}
      {renderMetricSection('距离与时间', distanceMetrics, 'bi-signpost-split')}
      {renderMetricSection('其他指标', otherMetrics, 'bi-clipboard-data')}

      {/* 数据可用性提示 */}
      <div className="mt-4">
        {!metrics.has_hr_data && (
          <div className="alert alert-warning" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            未检测到心率数据。某些分析功能可能受限。
          </div>
        )}
        {!metrics.has_pace_data && (
          <div className="alert alert-warning" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i>
            未检测到配速数据。某些分析功能可能受限。
          </div>
        )}
      </div>
    </div>
  );
};

export default MetricsDisplay;