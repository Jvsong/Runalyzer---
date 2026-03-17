import React, { useState } from 'react';
import './App.css';
import FileUpload from './components/FileUpload';
import MetricsDisplay from './components/MetricsDisplay';
import ChartsDisplay from './components/ChartsDisplay';
import HrZonesDisplay from './components/HrZonesDisplay';
import SuggestionsDisplay from './components/SuggestionsDisplay';
import AIConsultation from './components/AIConsultation';
import { analyzeActivity, analyzeMultipleActivities } from './services/api';

function App() {
  const [activityData, setActivityData] = useState(null);
  const [combinedActivityData, setCombinedActivityData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAI, setShowAI] = useState(false);

  const handleFileUpload = async (file) => {
    setLoading(true);
    setError(null);

    try {
      const data = await analyzeActivity(file);
      setActivityData(data);
    } catch (err) {
      setError(err.message || '文件分析失败');
      console.error('Error analyzing file:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMultipleFileUpload = async (files) => {
    setLoading(true);
    setError(null);
    setShowAI(false);

    try {
      const data = await analyzeMultipleActivities(files);
      setCombinedActivityData(data);
      setActivityData(null); // 清空单个文件数据
    } catch (err) {
      setError(err.message || '多文件分析失败');
      console.error('Error analyzing multiple files:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSampleData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 使用示例数据
      const response = await fetch('http://localhost:8000/api/sample');
      const data = await response.json();
      setActivityData(data);
    } catch (err) {
      setError('无法加载示例数据');
      console.error('Error loading sample data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1 className="display-4">🏃 Runalyzer - 跑步训练分析工具</h1>
        <p className="lead">上传你的跑步数据文件，获取详细分析和训练建议</p>
      </header>

      <main className="container mt-4">
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center my-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">分析中...</span>
            </div>
            <p className="mt-3">正在分析您的跑步数据，请稍候...</p>
          </div>
        ) : (
          <>
            {!activityData && !combinedActivityData ? (
              <div className="row justify-content-center">
                <div className="col-md-8">
                  <div className="card shadow">
                    <div className="card-body text-center py-5">
                      <h2 className="mb-4">开始分析你的跑步数据</h2>
                      <p className="text-muted mb-4">
                        支持 FIT (Garmin), GPX (Strava等), CSV 格式
                      </p>
                      <FileUpload onFileUpload={handleFileUpload} onMultipleFileUpload={handleMultipleFileUpload} />
                      <div className="mt-4">
                        <button
                          className="btn btn-outline-secondary"
                          onClick={handleSampleData}
                        >
                          🔍 查看示例数据
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* 顶部控制栏 */}
                <div className="row mb-4">
                  <div className="col">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <h2 className="mb-0">
                          {combinedActivityData ? '📊 综合分析结果' : '分析结果'}
                          {combinedActivityData && (
                            <span className="badge bg-primary ms-2">
                              {combinedActivityData.file_count} 个文件
                            </span>
                          )}
                        </h2>
                        {combinedActivityData && (
                          <p className="text-muted mb-0 small">
                            基于多个训练文件的趋势分析和统计结果
                          </p>
                        )}
                      </div>
                      <div className="d-flex gap-2">
                        {/* AI问询按钮 */}
                        {(activityData || combinedActivityData) && (
                          <button
                            className={`btn ${showAI ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setShowAI(!showAI)}
                          >
                            <i className="bi bi-robot me-1"></i>
                            {showAI ? '隐藏AI问询' : 'AI智能问询'}
                          </button>
                        )}
                        {/* 分析新文件按钮 */}
                        <button
                          className="btn btn-outline-primary"
                          onClick={() => {
                            setActivityData(null);
                            setCombinedActivityData(null);
                            setShowAI(false);
                          }}
                        >
                          📤 分析新文件
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI问询组件 */}
                {showAI && (
                  <div className="row mb-4">
                    <div className="col">
                      <AIConsultation
                        analysisData={combinedActivityData || activityData}
                      />
                    </div>
                  </div>
                )}

                {/* 数据分析结果 */}
                {activityData && !combinedActivityData && (
                  <>
                    <div className="row mb-4">
                      <div className="col">
                        <MetricsDisplay metrics={activityData.metrics} />
                      </div>
                    </div>

                    <div className="row mb-4">
                      <div className="col-md-8">
                        <ChartsDisplay timeSeries={activityData.time_series} />
                      </div>
                      <div className="col-md-4">
                        <HrZonesDisplay zones={activityData.hr_zones} />
                      </div>
                    </div>

                    <div className="row">
                      <div className="col">
                        <SuggestionsDisplay suggestions={activityData.suggestions} />
                      </div>
                    </div>
                  </>
                )}

                {/* 多文件综合分析结果 */}
                {combinedActivityData && (
                  <>
                    {/* 综合指标 */}
                    <div className="row mb-4">
                      <div className="col">
                        <div className="card">
                          <div className="card-body">
                            <h5 className="card-title">
                              <i className="bi bi-graph-up me-2"></i>
                              综合统计指标
                            </h5>
                            <div className="row">
                              <div className="col-md-6">
                                {combinedActivityData.combined_metrics ? (
                                  <div className="table-responsive">
                                    <table className="table table-hover">
                                      <thead>
                                        <tr>
                                          <th>指标</th>
                                          <th>平均值</th>
                                          <th>最小值</th>
                                          <th>最大值</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {combinedActivityData.combined_metrics.avg_avg_heart_rate && (
                                          <tr>
                                            <td>平均心率</td>
                                            <td>{combinedActivityData.combined_metrics.avg_avg_heart_rate.toFixed(1)} bpm</td>
                                            <td>{combinedActivityData.combined_metrics.min_avg_heart_rate?.toFixed(1) || 'N/A'} bpm</td>
                                            <td>{combinedActivityData.combined_metrics.max_avg_heart_rate?.toFixed(1) || 'N/A'} bpm</td>
                                          </tr>
                                        )}
                                        {combinedActivityData.combined_metrics.avg_avg_pace && (
                                          <tr>
                                            <td>平均配速</td>
                                            <td>{combinedActivityData.combined_metrics.avg_avg_pace.toFixed(2)} min/km</td>
                                            <td>{combinedActivityData.combined_metrics.min_avg_pace?.toFixed(2) || 'N/A'} min/km</td>
                                            <td>{combinedActivityData.combined_metrics.max_avg_pace?.toFixed(2) || 'N/A'} min/km</td>
                                          </tr>
                                        )}
                                        {combinedActivityData.combined_metrics.avg_total_distance && (
                                          <tr>
                                            <td>平均距离</td>
                                            <td>{combinedActivityData.combined_metrics.avg_total_distance.toFixed(2)} km</td>
                                            <td>{combinedActivityData.combined_metrics.min_total_distance?.toFixed(2) || 'N/A'} km</td>
                                            <td>{combinedActivityData.combined_metrics.max_total_distance?.toFixed(2) || 'N/A'} km</td>
                                          </tr>
                                        )}
                                        {combinedActivityData.combined_metrics.avg_avg_cadence && (
                                          <tr>
                                            <td>平均步频</td>
                                            <td>{combinedActivityData.combined_metrics.avg_avg_cadence.toFixed(1)} spm</td>
                                            <td>{combinedActivityData.combined_metrics.min_avg_cadence?.toFixed(1) || 'N/A'} spm</td>
                                            <td>{combinedActivityData.combined_metrics.max_avg_cadence?.toFixed(1) || 'N/A'} spm</td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <div className="alert alert-info">
                                    <i className="bi bi-info-circle me-2"></i>
                                    无综合指标数据
                                  </div>
                                )}
                              </div>
                              <div className="col-md-6">
                                {combinedActivityData.trend_analysis ? (
                                  <div className="card bg-light">
                                    <div className="card-body">
                                      <h6>趋势分析</h6>
                                      <p className="card-text">
                                        <i className="bi bi-arrow-up text-success me-1"></i>
                                        <strong>{combinedActivityData.trend_analysis.overall_trend || '无趋势数据'}</strong>
                                      </p>
                                      {combinedActivityData.trend_analysis.metric_trends && (
                                        <div className="mt-3">
                                          <h6>具体指标趋势</h6>
                                          <ul className="list-unstyled">
                                            {Object.entries(combinedActivityData.trend_analysis.metric_trends).map(([metric, data]) => (
                                              <li key={metric} className="mb-2">
                                                <span className="fw-medium">{metric}: </span>
                                                <span className={`badge ${data.trend === '上升' ? 'bg-success' : data.trend === '下降' ? 'bg-warning' : 'bg-secondary'}`}>
                                                  {data.trend} ({data.improvement})
                                                </span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="card bg-light">
                                    <div className="card-body">
                                      <h6>趋势分析</h6>
                                      <p className="card-text text-muted">
                                        <i className="bi bi-info-circle me-1"></i>
                                        无趋势分析数据
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 心率区间分布 */}
                    {combinedActivityData.combined_hr_zones && combinedActivityData.combined_hr_zones.length > 0 && (
                      <div className="row mb-4">
                        <div className="col">
                          <div className="card">
                            <div className="card-body">
                              <h5 className="card-title">
                                <i className="bi bi-heart-pulse me-2"></i>
                                平均心率区间分布
                              </h5>
                              <div className="table-responsive">
                                <table className="table table-hover">
                                  <thead>
                                    <tr>
                                      <th>区间</th>
                                      <th>名称</th>
                                      <th>平均时间(分钟)</th>
                                      <th>平均比例(%)</th>
                                      <th>最小时间</th>
                                      <th>最大时间</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {combinedActivityData.combined_hr_zones.map((zone, index) => (
                                      <tr key={index}>
                                        <td>{zone.zone}</td>
                                        <td>{zone.name}</td>
                                        <td>{zone.avg_time_minutes.toFixed(1)}</td>
                                        <td>{zone.avg_percentage.toFixed(1)}%</td>
                                        <td>{zone.min_time_minutes?.toFixed(1) || zone.avg_time_minutes.toFixed(1)}</td>
                                        <td>{zone.max_time_minutes?.toFixed(1) || zone.avg_time_minutes.toFixed(1)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 综合建议 */}
                    {combinedActivityData.suggestions && (
                      <div className="row">
                        <div className="col">
                          <div className="card">
                            <div className="card-body">
                              <h5 className="card-title">
                                <i className="bi bi-lightbulb me-2"></i>
                                综合训练建议
                              </h5>
                              <div className="row">
                                {combinedActivityData.suggestions.map((suggestion, index) => (
                                  <div key={index} className="col-md-6 mb-3">
                                    <div className="card h-100">
                                      <div className="card-body">
                                        <div className="d-flex align-items-start">
                                          <div className="me-3">
                                            <i className="bi bi-chat-square-text text-primary" style={{ fontSize: '1.5rem' }}></i>
                                          </div>
                                          <div>
                                            <h6 className="card-title">{suggestion}</h6>
                                            <p className="card-text text-muted small mb-0">
                                              基于{combinedActivityData.file_count}个训练文件的综合分析
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 各文件详情（可折叠） */}
                    {combinedActivityData.individual_results && (
                      <div className="row mt-4">
                        <div className="col">
                          <div className="card">
                            <div className="card-body">
                              <h5 className="card-title">
                                <i className="bi bi-list-ul me-2"></i>
                                各文件详情
                              </h5>
                              <div className="accordion" id="individualResultsAccordion">
                                {combinedActivityData.individual_results.map((result, index) => (
                                  <div className="accordion-item" key={index}>
                                    <h2 className="accordion-header">
                                      <button
                                        className="accordion-button collapsed"
                                        type="button"
                                        data-bs-toggle="collapse"
                                        data-bs-target={`#collapse${index}`}
                                      >
                                        文件 {index + 1}: {result.filename || `训练 ${index + 1}`}
                                        {result.metrics && (
                                          <span className="badge bg-light text-dark ms-2">
                                            距离: {result.metrics.total_distance?.toFixed(2) || 'N/A'} km
                                          </span>
                                        )}
                                      </button>
                                    </h2>
                                    <div
                                      id={`collapse${index}`}
                                      className="accordion-collapse collapse"
                                      data-bs-parent="#individualResultsAccordion"
                                    >
                                      <div className="accordion-body">
                                        <div className="row">
                                          <div className="col-md-4">
                                            <h6>关键指标</h6>
                                            <ul className="list-unstyled">
                                              {result.metrics.avg_heart_rate && (
                                                <li>平均心率: {result.metrics.avg_heart_rate.toFixed(1)} bpm</li>
                                              )}
                                              {result.metrics.avg_pace && (
                                                <li>平均配速: {result.metrics.avg_pace.toFixed(2)} min/km</li>
                                              )}
                                              {result.metrics.total_distance && (
                                                <li>距离: {result.metrics.total_distance.toFixed(2)} km</li>
                                              )}
                                              {result.metrics.total_time_minutes && (
                                                <li>时间: {result.metrics.total_time_minutes.toFixed(1)} 分钟</li>
                                              )}
                                            </ul>
                                          </div>
                                          <div className="col-md-8">
                                            <h6>训练建议</h6>
                                            {result.suggestions && result.suggestions.length > 0 ? (
                                              <ul className="list-unstyled">
                                                {result.suggestions.slice(0, 3).map((suggestion, i) => (
                                                  <li key={i} className="mb-2">
                                                    <i className="bi bi-chevron-right me-1"></i>
                                                    {suggestion}
                                                  </li>
                                                ))}
                                              </ul>
                                            ) : (
                                              <p className="text-muted small">无具体建议</p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
      </main>

      <footer className="mt-5 py-4 bg-light">
        <div className="container text-center">
          <p className="text-muted mb-2">Runalyzer v1.0 - 跑步训练数据分析工具</p>
          <p className="text-muted small">
            支持 FIT, GPX, CSV 格式 | 使用 FastAPI + React 构建
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;