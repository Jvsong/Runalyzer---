import React, { useState } from 'react';
import { aiConsultation } from '../services/api';

const AIConsultation = ({ analysisData }) => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [conversation, setConversation] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await aiConsultation(question, analysisData);

      const newQuestion = {
        type: 'question',
        content: question,
        timestamp: new Date().toLocaleTimeString()
      };

      const newResponse = {
        type: 'response',
        content: result.response,
        timestamp: new Date().toLocaleTimeString()
      };

      // 添加到对话历史
      setConversation(prev => [...prev, newQuestion, newResponse]);

      // 清空问题输入
      setQuestion('');
      setResponse(result);
    } catch (err) {
      setError(err.message || 'AI问询失败，请稍后重试');
      console.error('AI问询错误:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearConversation = () => {
    setConversation([]);
    setResponse(null);
  };

  const renderSampleQuestions = () => {
    const samples = [
      "根据我的训练数据，我应该如何改进？",
      "我的心率区间分布是否合理？",
      "如何提高我的跑步配速？",
      "我应该增加训练强度吗？",
      "如何避免跑步受伤？",
      "我的恢复训练计划应该如何安排？"
    ];

    return (
      <div className="sample-questions mt-3">
        <h6>💡 常见问题示例</h6>
        <div className="d-flex flex-wrap gap-2 mt-2">
          {samples.map((sample, index) => (
            <button
              key={index}
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setQuestion(sample)}
            >
              {sample}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderResponseAnalysis = () => {
    if (!response) return null;

    return (
      <div className="response-analysis mt-4">
        <div className="card">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="card-title mb-0">
                <i className="bi bi-robot me-2"></i>
                AI回答
              </h5>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => navigator.clipboard.writeText(response.response)}
              >
                <i className="bi bi-clipboard me-1"></i>复制
              </button>
            </div>

            <div className="ai-response-content">
              <div className="mb-3">
                <small className="text-muted">
                  <i className="bi bi-question-circle me-1"></i>
                  问题: {response.question}
                </small>
              </div>

              <div className="response-text p-3 bg-light rounded">
                {response.response.split('\n').map((line, index) => (
                  <p key={index} className={index === 0 ? 'mb-2' : 'mb-2'}>
                    {line}
                  </p>
                ))}
              </div>

              <div className="mt-3 text-end">
                <small className="text-muted">
                  <i className="bi bi-clock me-1"></i>
                  回答时间: {new Date(response.timestamp).toLocaleString()}
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderConversationHistory = () => {
    if (conversation.length === 0) return null;

    return (
      <div className="conversation-history mt-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">
            <i className="bi bi-chat-left-text me-2"></i>
            对话历史
          </h5>
          <button
            className="btn btn-sm btn-outline-danger"
            onClick={handleClearConversation}
          >
            <i className="bi bi-trash me-1"></i>清空
          </button>
        </div>

        <div className="conversation-timeline">
          {conversation.map((item, index) => (
            <div
              key={index}
              className={`timeline-item ${item.type === 'question' ? 'timeline-question' : 'timeline-response'} mb-3`}
            >
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-start">
                    <div className="me-3">
                      {item.type === 'question' ? (
                        <i className="bi bi-person-circle text-primary" style={{ fontSize: '1.5rem' }}></i>
                      ) : (
                        <i className="bi bi-robot text-success" style={{ fontSize: '1.5rem' }}></i>
                      )}
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <span className="badge bg-light text-dark me-2">
                            {item.type === 'question' ? '你的问题' : 'AI回答'}
                          </span>
                          <small className="text-muted">
                            <i className="bi bi-clock me-1"></i>
                            {item.timestamp}
                          </small>
                        </div>
                      </div>
                      <div className="message-content">
                        <p className="mb-0">{item.content}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="ai-consultation">
      <div className="chart-container">
        <div className="d-flex align-items-center mb-3">
          <i className="bi bi-robot" style={{ fontSize: '1.5rem', color: '#667eea', marginRight: '10px' }}></i>
          <h5 className="mb-0">🤖 AI智能问询</h5>
        </div>

        <div className="card mb-4">
          <div className="card-body">
            <div className="ai-intro mb-4">
              <div className="d-flex align-items-start">
                <div className="me-3">
                  <i className="bi bi-info-circle text-info" style={{ fontSize: '1.5rem' }}></i>
                </div>
                <div>
                  <h6 className="card-title">AI跑步教练</h6>
                  <p className="card-text text-muted mb-0">
                    基于您的训练数据，AI跑步教练可以为您提供个性化的训练建议、回答关于跑步训练的问题，
                    并帮助您分析和改进训练计划。
                  </p>
                </div>
              </div>
            </div>

            {analysisData && (
              <div className="analysis-context mb-4">
                <div className="alert alert-info">
                  <div className="d-flex align-items-start">
                    <i className="bi bi-bar-chart me-2"></i>
                    <div>
                      <h6 className="alert-heading mb-2">当前分析数据</h6>
                      <p className="mb-0 small">
                        AI将基于您的训练数据进行回答，提供更准确的个性化建议。
                      </p>
                      <div className="mt-2">
                        {analysisData.file_count && (
                          <span className="badge bg-primary me-2">
                            分析文件: {analysisData.file_count}个
                          </span>
                        )}
                        {analysisData.combined_metrics && analysisData.combined_metrics.avg_avg_heart_rate && (
                          <span className="badge bg-success me-2">
                            平均心率: {analysisData.combined_metrics.avg_avg_heart_rate.toFixed(1)} bpm
                          </span>
                        )}
                        {analysisData.combined_metrics && analysisData.combined_metrics.avg_avg_pace && (
                          <span className="badge bg-info me-2">
                            平均配速: {analysisData.combined_metrics.avg_avg_pace.toFixed(2)} min/km
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="questionInput" className="form-label">
                  向AI教练提问
                </label>
                <textarea
                  id="questionInput"
                  className="form-control"
                  rows="3"
                  placeholder="例如：根据我的训练数据，我应该如何改进我的训练计划？"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={loading}
                />
                <div className="form-text">
                  请详细描述您的问题，AI教练会根据您的训练数据提供专业建议。
                </div>
              </div>

              {renderSampleQuestions()}

              <div className="d-flex justify-content-between align-items-center mt-4">
                <div>
                  {loading && (
                    <div className="d-flex align-items-center">
                      <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                      <span className="small">AI思考中...</span>
                    </div>
                  )}
                </div>
                <div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || !question.trim()}
                  >
                    <i className="bi bi-send me-1"></i>
                    {loading ? '发送中...' : '发送问题'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="alert alert-danger mt-3" role="alert">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {error}
                </div>
              )}
            </form>
          </div>
        </div>

        {response && renderResponseAnalysis()}
        {renderConversationHistory()}

        <div className="ai-disclaimer mt-4">
          <div className="alert alert-warning">
            <h6><i className="bi bi-exclamation-triangle me-2"></i>重要说明</h6>
            <ul className="mb-0 small">
              <li>AI回答仅供参考，不能替代专业医疗或训练建议</li>
              <li>请结合个人身体状况和感受调整训练计划</li>
              <li>如有任何不适或健康问题，请咨询专业医生</li>
              <li>AI基于DeepSeek模型提供回答，训练数据仅用于分析</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIConsultation;