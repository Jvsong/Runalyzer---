import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const HrZonesDisplay = ({ zones }) => {
  if (!zones || zones.length === 0) {
    return (
      <div className="chart-container">
        <div className="alert alert-info">
          <i className="bi bi-info-circle me-2"></i>
          没有可用的心率区间数据。
        </div>
      </div>
    );
  }

  // 准备饼图数据
  const pieData = zones.map(zone => ({
    name: zone.name,
    value: zone.time_minutes,
    percentage: zone.percentage,
    zone: zone.zone
  })).filter(item => item.value > 0);

  // 颜色映射
  const COLORS = {
    'Z1': '#a8e6cf',
    'Z2': '#ffd3b6',
    'Z3': '#ff8b94',
    'Z4': '#a283c4',
    'Z5': '#ff6b6b'
  };

  const getZoneDescription = (zone) => {
    const descriptions = {
      'Z1': '恢复区：非常轻松的活动，用于恢复和热身',
      'Z2': '有氧区：轻松的有氧运动，适合长距离训练',
      'Z3': '节奏区：中等强度，提高有氧能力',
      'Z4': '阈值区：高强度，接近乳酸阈值',
      'Z5': '无氧区：最大强度，短时间爆发'
    };
    return descriptions[zone] || '未知区间';
  };

  const renderZoneCard = (zone) => {
    const color = COLORS[zone.zone] || '#cccccc';

    return (
      <div key={zone.zone} className={`zone-card zone-${zone.zone.toLowerCase()}`}>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <div className="d-flex align-items-center">
              <div
                className="zone-indicator me-2 rounded-circle"
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: color
                }}
              ></div>
              <h6 className="mb-0">{zone.name} ({zone.zone})</h6>
            </div>
            <small className="text-muted">{getZoneDescription(zone.zone)}</small>
          </div>
          <div className="text-end">
            <div className="fw-bold">{zone.time_minutes} 分钟</div>
            <div className="text-muted small">{zone.percentage}%</div>
          </div>
        </div>
        <div className="mt-2">
          <div className="progress" style={{ height: '8px' }}>
            <div
              className="progress-bar"
              role="progressbar"
              style={{
                width: `${zone.percentage}%`,
                backgroundColor: color
              }}
              aria-valuenow={zone.percentage}
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
        </div>
      </div>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip p-3 bg-white border rounded shadow-sm">
          <p className="fw-bold mb-1">{data.name}</p>
          <p className="mb-1">时间: <strong>{data.value} 分钟</strong></p>
          <p className="mb-0">占比: <strong>{data.percentage}%</strong></p>
        </div>
      );
    }
    return null;
  };

  const totalTime = zones.reduce((sum, zone) => sum + zone.time_minutes, 0);
  const totalPercentage = zones.reduce((sum, zone) => sum + zone.percentage, 0);

  return (
    <div className="hr-zones-display">
      <div className="chart-container">
        <h5 className="mb-3">❤️ 心率区间分析</h5>

        <div className="row">
          <div className="col-md-6">
            <div className="mb-4">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.zone]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="col-md-6">
            <div className="zone-stats mb-3">
              <div className="card bg-light">
                <div className="card-body">
                  <div className="row text-center">
                    <div className="col-6">
                      <div className="fs-4 fw-bold">{totalTime.toFixed(1)}</div>
                      <div className="text-muted small">总时间(分钟)</div>
                    </div>
                    <div className="col-6">
                      <div className="fs-4 fw-bold">{totalPercentage.toFixed(1)}%</div>
                      <div className="text-muted small">区间覆盖</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="zone-description">
              {zones.map(zone => renderZoneCard(zone))}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="alert alert-info">
            <h6><i className="bi bi-lightbulb me-2"></i>训练建议</h6>
            <ul className="mb-0 small">
              <li>理想训练分布：Z1-Z2占60-70%，Z3-Z4占20-30%，Z5占5-10%</li>
              <li>恢复日应主要保持在Z1-Z2区间</li>
              <li>高强度训练日可增加Z3-Z5区间时间</li>
              <li>长期保持在Z4-Z5区间可能增加受伤风险</li>
            </ul>
          </div>
        </div>

        <div className="mt-3">
          <h6>心率区间说明</h6>
          <div className="table-responsive">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>区间</th>
                  <th>名称</th>
                  <th>心率范围</th>
                  <th>训练效果</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span className="badge" style={{ backgroundColor: COLORS['Z1'] }}>Z1</span></td>
                  <td>恢复区</td>
                  <td>&lt; 120 bpm</td>
                  <td>恢复、热身</td>
                </tr>
                <tr>
                  <td><span className="badge" style={{ backgroundColor: COLORS['Z2'] }}>Z2</span></td>
                  <td>有氧区</td>
                  <td>120-140 bpm</td>
                  <td>基础有氧能力</td>
                </tr>
                <tr>
                  <td><span className="badge" style={{ backgroundColor: COLORS['Z3'] }}>Z3</span></td>
                  <td>节奏区</td>
                  <td>140-160 bpm</td>
                  <td>有氧能力提升</td>
                </tr>
                <tr>
                  <td><span className="badge" style={{ backgroundColor: COLORS['Z4'] }}>Z4</span></td>
                  <td>阈值区</td>
                  <td>160-180 bpm</td>
                  <td>乳酸阈值训练</td>
                </tr>
                <tr>
                  <td><span className="badge" style={{ backgroundColor: COLORS['Z5'] }}>Z5</span></td>
                  <td>无氧区</td>
                  <td>&gt; 180 bpm</td>
                  <td>最大摄氧量提升</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HrZonesDisplay;