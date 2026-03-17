import React, { useState } from 'react';
import './App.css';
import FileUpload from './components/FileUpload';
import MetricsDisplay from './components/MetricsDisplay';
import ChartsDisplay from './components/ChartsDisplay';
import HrZonesDisplay from './components/HrZonesDisplay';
import SuggestionsDisplay from './components/SuggestionsDisplay';
import { analyzeActivity } from './services/api';

function App() {
  const [activityData, setActivityData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
            {!activityData ? (
              <div className="row justify-content-center">
                <div className="col-md-8">
                  <div className="card shadow">
                    <div className="card-body text-center py-5">
                      <h2 className="mb-4">开始分析你的跑步数据</h2>
                      <p className="text-muted mb-4">
                        支持 FIT (Garmin), GPX (Strava等), CSV 格式
                      </p>
                      <FileUpload onFileUpload={handleFileUpload} />
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
                <div className="row mb-4">
                  <div className="col">
                    <div className="d-flex justify-content-between align-items-center">
                      <h2>分析结果</h2>
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => setActivityData(null)}
                      >
                        📤 分析新文件
                      </button>
                    </div>
                  </div>
                </div>

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