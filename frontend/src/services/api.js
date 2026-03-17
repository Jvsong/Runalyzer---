import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加认证token等
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response) {
      // 服务器返回错误状态码
      const { status, data } = error.response;
      let errorMessage = '请求失败';

      if (data && data.detail) {
        errorMessage = data.detail;
      } else if (status === 413) {
        errorMessage = '文件太大，请上传小于50MB的文件';
      } else if (status === 415) {
        errorMessage = '不支持的文件格式';
      } else if (status === 500) {
        errorMessage = '服务器处理文件时出错';
      } else if (status === 404) {
        errorMessage = 'API接口未找到';
      }

      return Promise.reject(new Error(errorMessage));
    } else if (error.request) {
      // 请求已发出但没有收到响应
      return Promise.reject(new Error('无法连接到服务器，请检查网络连接'));
    } else {
      // 请求配置出错
      return Promise.reject(new Error('请求配置错误'));
    }
  }
);

export const analyzeActivity = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60秒超时，处理大文件
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`上传进度: ${percentCompleted}%`);
        }
      },
    });

    return response;
  } catch (error) {
    console.error('分析活动失败:', error);
    throw error;
  }
};

export const getSampleData = async () => {
  try {
    const response = await api.get('/api/sample');
    return response;
  } catch (error) {
    console.error('获取示例数据失败:', error);
    throw error;
  }
};

export const getHealthStatus = async () => {
  try {
    const response = await api.get('/health');
    return response;
  } catch (error) {
    console.error('检查API健康状态失败:', error);
    throw error;
  }
};

export const getActivityMetrics = async (activityId) => {
  try {
    const response = await api.get(`/api/activities/${activityId}/metrics`);
    return response;
  } catch (error) {
    console.error('获取活动指标失败:', error);
    throw error;
  }
};

export const getActivityChartData = async (activityId, chartType) => {
  try {
    const response = await api.get(`/api/activities/${activityId}/charts`, {
      params: { type: chartType },
    });
    return response;
  } catch (error) {
    console.error('获取图表数据失败:', error);
    throw error;
  }
};

// 批量导出分析结果
export const exportAnalysis = async (activityId, format = 'json') => {
  try {
    const response = await api.get(`/api/activities/${activityId}/export`, {
      params: { format },
      responseType: 'blob', // 处理文件下载
    });

    // 创建下载链接
    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `runalyzer-analysis-${activityId}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    return true;
  } catch (error) {
    console.error('导出分析结果失败:', error);
    throw error;
  }
};

// 用户设置相关API
export const updateUserSettings = async (settings) => {
  try {
    const response = await api.post('/api/user/settings', settings);
    return response;
  } catch (error) {
    console.error('更新用户设置失败:', error);
    throw error;
  }
};

export const getUserSettings = async () => {
  try {
    const response = await api.get('/api/user/settings');
    return response;
  } catch (error) {
    console.error('获取用户设置失败:', error);
    throw error;
  }
};

// 心率区间自定义设置
export const updateHrZones = async (zones) => {
  try {
    const response = await api.post('/api/user/hr-zones', zones);
    return response;
  } catch (error) {
    console.error('更新心率区间设置失败:', error);
    throw error;
  }
};

export default api;