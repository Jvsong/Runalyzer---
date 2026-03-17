import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

const FileUpload = ({ onFileUpload, onMultipleFileUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadMode, setUploadMode] = useState('single'); // 'single' or 'multiple'

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      if (uploadMode === 'single') {
        const file = acceptedFiles[0];
        setSelectedFiles([file]);
        setIsDragging(false);
        onFileUpload(file);
      } else {
        setSelectedFiles(acceptedFiles);
        setIsDragging(false);
        // 多文件模式不上传，等待用户点击按钮
      }
    }
  }, [onFileUpload, uploadMode]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/octet-stream': ['.fit'],
      'application/gpx+xml': ['.gpx'],
      'text/csv': ['.csv']
    },
    maxFiles: uploadMode === 'single' ? 1 : 10,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false)
  });

  const handleManualUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      if (uploadMode === 'single') {
        const file = files[0];
        setSelectedFiles([file]);
        onFileUpload(file);
      } else {
        setSelectedFiles(files);
      }
    }
  };

  const handleUploadMultipleFiles = () => {
    if (selectedFiles.length > 0 && onMultipleFileUpload) {
      onMultipleFileUpload(selectedFiles);
    }
  };

  const handleModeChange = (mode) => {
    setUploadMode(mode);
    setSelectedFiles([]);
  };

  return (
    <div className="file-upload">
      {/* 上传模式选择 */}
      <div className="mb-4">
        <div className="btn-group w-100" role="group">
          <button
            type="button"
            className={`btn ${uploadMode === 'single' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => handleModeChange('single')}
          >
            <i className="bi bi-file-earmark me-2"></i>单个文件分析
          </button>
          <button
            type="button"
            className={`btn ${uploadMode === 'multiple' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => handleModeChange('multiple')}
          >
            <i className="bi bi-files me-2"></i>多文件综合分析
          </button>
        </div>
      </div>

      <div
        {...getRootProps()}
        className={`upload-area ${isDragActive || isDragging ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="upload-content">
          <div className="mb-3">
            <i className="bi bi-cloud-upload" style={{ fontSize: '3rem', color: '#667eea' }}></i>
          </div>
          <h4>{uploadMode === 'single' ? '拖放文件到这里' : '拖放多个文件到这里'}</h4>
          <p className="text-muted">或点击选择文件</p>
          <div className="supported-formats mt-3">
            <span className="badge bg-primary me-2">.FIT</span>
            <span className="badge bg-success me-2">.GPX</span>
            <span className="badge bg-info">.CSV</span>
          </div>
          {uploadMode === 'multiple' && (
            <p className="mt-2 small text-muted">最多支持10个文件</p>
          )}
          {isDragActive && (
            <div className="mt-3">
              <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
              <span>释放以上传文件</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3">
        <div className="input-group">
          <input
            type="file"
            className="form-control"
            id="manualUpload"
            onChange={handleManualUpload}
            accept=".fit,.gpx,.csv"
            multiple={uploadMode === 'multiple'}
          />
          <label className="input-group-text" htmlFor="manualUpload">
            <i className="bi bi-folder2-open"></i>
          </label>
        </div>
      </div>

      {/* 选择的文件显示 */}
      {selectedFiles.length > 0 && (
        <div className="mt-3">
          <div className="alert alert-success" role="alert">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div>
                <i className="bi bi-check-circle-fill me-2"></i>
                <strong>
                  {uploadMode === 'single' ? '已选择文件' : `已选择 ${selectedFiles.length} 个文件`}
                </strong>
              </div>
              {uploadMode === 'multiple' && (
                <button
                  className="btn btn-sm btn-primary"
                  onClick={handleUploadMultipleFiles}
                  disabled={!onMultipleFileUpload}
                >
                  <i className="bi bi-cloud-upload me-1"></i>开始综合分析
                </button>
              )}
            </div>

            <div className="mt-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                  <div>
                    <i className="bi bi-file-earmark me-2"></i>
                    <span className="fw-medium">{file.name}</span>
                    <br />
                    <small className="text-muted">
                      大小: {(file.size / 1024).toFixed(2)} KB |
                      类型: {file.name.split('.').pop().toUpperCase()}
                    </small>
                  </div>
                  <span className="badge bg-light text-dark">
                    {index + 1}
                  </span>
                </div>
              ))}
            </div>

            {uploadMode === 'multiple' && selectedFiles.length > 1 && (
              <div className="mt-3 pt-2 border-top">
                <small className="text-muted">
                  <i className="bi bi-info-circle me-1"></i>
                  综合分析将分析多个文件的趋势和统计信息，提供更准确的训练建议
                </small>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 file-requirements">
        <h6>支持的文件格式:</h6>
        <ul className="list-unstyled">
          <li><i className="bi bi-check-circle text-success me-2"></i>
            <strong>.FIT</strong> - Garmin设备导出的标准格式</li>
          <li><i className="bi bi-check-circle text-success me-2"></i>
            <strong>.GPX</strong> - GPS交换格式（Strava, Suunto等）</li>
          <li><i className="bi bi-check-circle text-success me-2"></i>
            <strong>.CSV</strong> - 逗号分隔值（Apple Watch等）</li>
        </ul>
        <div className="alert alert-warning mt-3" role="alert">
          <i className="bi bi-info-circle me-2"></i>
          文件大小限制: 最大50MB。建议文件包含心率、配速和距离数据。
          {uploadMode === 'multiple' && (
            <div className="mt-1">
              多文件分析: 最多10个文件，每个文件不超过50MB
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;