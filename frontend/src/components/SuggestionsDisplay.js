import React from 'react';

const SuggestionsDisplay = ({ suggestions }) => {
  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="suggestion-container">
        <div className="alert alert-info">
          <i className="bi bi-info-circle me-2"></i>
          没有可用的训练建议。
        </div>
      </div>
    );
  }

  const getSuggestionIcon = (suggestion) => {
    if (suggestion.includes('⚠️') || suggestion.includes('注意') || suggestion.includes('风险')) {
      return 'bi-exclamation-triangle text-warning';
    } else if (suggestion.includes('✅') || suggestion.includes('良好') || suggestion.includes('很好')) {
      return 'bi-check-circle text-success';
    } else if (suggestion.includes('建议') || suggestion.includes('尝试') || suggestion.includes('增加')) {
      return 'bi-lightbulb text-info';
    } else if (suggestion.includes('🔥') || suggestion.includes('高强度') || suggestion.includes('强度较高')) {
      return 'bi-fire text-danger';
    } else if (suggestion.includes('🌱') || suggestion.includes('低强度') || suggestion.includes('轻松')) {
      return 'bi-tree text-success';
    } else {
      return 'bi-chat-square-text text-primary';
    }
  };

  const getSuggestionType = (suggestion) => {
    if (suggestion.includes('心率') || suggestion.includes('HR') || suggestion.includes('bpm')) {
      return '心率相关';
    } else if (suggestion.includes('配速') || suggestion.includes('速度') || suggestion.includes('pace')) {
      return '配速相关';
    } else if (suggestion.includes('步频') || suggestion.includes('cadence') || suggestion.includes('步数')) {
      return '步频相关';
    } else if (suggestion.includes('距离') || suggestion.includes('时间') || suggestion.includes('时长')) {
      return '训练量相关';
    } else if (suggestion.includes('恢复') || suggestion.includes('休息') || suggestion.includes('营养')) {
      return '恢复相关';
    } else if (suggestion.includes('训练') || suggestion.includes('强度') || suggestion.includes('负荷')) {
      return '训练负荷';
    } else {
      return '综合建议';
    }
  };

  const suggestionCards = suggestions.map((suggestion, index) => {
    const iconClass = getSuggestionIcon(suggestion);
    const type = getSuggestionType(suggestion);

    return (
      <div key={index} className="col-md-6 mb-3">
        <div className="suggestion-card card h-100">
          <div className="card-body">
            <div className="d-flex align-items-start">
              <div className="me-3">
                <i className={`bi ${iconClass}`} style={{ fontSize: '1.5rem' }}></i>
              </div>
              <div className="flex-grow-1">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h6 className="card-title mb-0">{suggestion}</h6>
                  <span className="badge bg-light text-dark">{type}</span>
                </div>
                <div className="suggestion-details">
                  {renderSuggestionDetails(suggestion, type)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  });

  const renderSuggestionDetails = (suggestion, type) => {
    const details = {
      '心率相关': '基于您的心率数据分析得出，关注训练强度和心血管负荷。',
      '配速相关': '基于配速变化和稳定性分析，关注跑步经济性和速度控制。',
      '步频相关': '基于步频数据分析，关注跑步技术和效率。',
      '训练量相关': '基于训练距离和时间分析，关注训练负荷和恢复需求。',
      '恢复相关': '关注身体恢复、营养补充和避免过度训练。',
      '训练负荷': '基于TRIMP等训练负荷指标，关注整体训练压力。',
      '综合建议': '基于整体训练表现的综合评估。'
    };

    return (
      <p className="card-text text-muted small mb-0">
        <i className="bi bi-info-circle me-1"></i>
        {details[type] || '基于您的训练数据分析得出的建议。'}
      </p>
    );
  };

  const renderTrainingPrinciples = () => (
    <div className="training-principles mt-4">
      <div className="card bg-light">
        <div className="card-body">
          <h6><i className="bi bi-journal-text me-2"></i>训练原则参考</h6>
          <div className="row mt-3">
            <div className="col-md-4 mb-3">
              <div className="principle-card text-center p-3">
                <i className="bi bi-arrow-repeat text-primary" style={{ fontSize: '2rem' }}></i>
                <h6 className="mt-2">渐进超负荷</h6>
                <p className="small text-muted mb-0">
                  每周训练量增加不超过10%，避免受伤
                </p>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <div className="principle-card text-center p-3">
                <i className="bi bi-arrow-clockwise text-success" style={{ fontSize: '2rem' }}></i>
                <h6 className="mt-2">充分恢复</h6>
                <p className="small text-muted mb-0">
                  高强度训练后需要48小时恢复
                </p>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <div className="principle-card text-center p-3">
                <i className="bi bi-bar-chart text-info" style={{ fontSize: '2rem' }}></i>
                <h6 className="mt-2">个体化</h6>
                <p className="small text-muted mb-0">
                  根据个人感受调整训练计划
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="suggestions-display">
      <div className="chart-container">
        <div className="d-flex align-items-center mb-3">
          <i className="bi bi-chat-square-text me-2" style={{ fontSize: '1.5rem', color: '#667eea' }}></i>
          <h5 className="mb-0">💡 训练建议</h5>
        </div>

        <div className="row">
          {suggestionCards}
        </div>

        {renderTrainingPrinciples()}

        <div className="mt-4">
          <div className="alert alert-warning">
            <h6><i className="bi bi-exclamation-triangle me-2"></i>重要提醒</h6>
            <ul className="mb-0 small">
              <li>这些建议基于算法分析，仅供参考</li>
              <li>请结合个人感受和身体状况调整训练</li>
              <li>如有不适，立即停止训练并咨询专业医生</li>
              <li>新手跑者建议从低强度开始，逐步增加训练量</li>
            </ul>
          </div>
        </div>

        <div className="mt-3">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h6>下一步训练建议</h6>
              <p className="text-muted small mb-0">
                基于本次训练，建议下次训练：
              </p>
            </div>
            <div>
              <button className="btn btn-outline-primary btn-sm">
                <i className="bi bi-calendar-plus me-1"></i>
                生成训练计划
              </button>
            </div>
          </div>
          <div className="mt-2">
            <div className="list-group">
              <div className="list-group-item">
                <div className="d-flex w-100 justify-content-between">
                  <h6 className="mb-1">恢复训练</h6>
                  <small>明天</small>
                </div>
                <p className="mb-1 small">轻松跑30分钟，心率控制在Z1-Z2区间</p>
              </div>
              <div className="list-group-item">
                <div className="d-flex w-100 justify-content-between">
                  <h6 className="mb-1">中等强度训练</h6>
                  <small>后天</small>
                </div>
                <p className="mb-1 small">节奏跑45分钟，包含10分钟Z3区间训练</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuggestionsDisplay;