import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

const FileUpload = ({ onFileUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      setIsDragging(false);

      // 立即上传文件
      onFileUpload(file);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/octet-stream': ['.fit'],
      'application/gpx+xml': ['.gpx'],
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false)
  });

  const handleManualUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      onFileUpload(file);
    }
  };

  return (
    <div className="file-upload">
      <div
        {...getRootProps()}
        className={`upload-area ${isDragActive || isDragging ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="upload-content">
          <div className="mb-3">
            <i className="bi bi-cloud-upload" style={{ fontSize: '3rem', color: '#667eea' }}></i>
          </div>
          <h4>拖放文件到这里</h4>
          <p className="text-muted">或点击选择文件</p>
          <div className="supported-formats mt-3">
            <span className="badge bg-primary me-2">.FIT</span>
            <span className="badge bg-success me-2">.GPX</span>
            <span className="badge bg-info">.CSV</span>
          </div>
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
          />
          <label className="input-group-text" htmlFor="manualUpload">
            <i className="bi bi-folder2-open"></i>
          </label>
        </div>
      </div>

      {selectedFile && (
        <div className="mt-3">
          <div className="alert alert-success d-flex align-items-center" role="alert">
            <i className="bi bi-check-circle-fill me-2"></i>
            <div>
              已选择文件: <strong>{selectedFile.name}</strong>
              <br />
              <small>大小: {(selectedFile.size / 1024).toFixed(2)} KB</small>
            </div>
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
        </div>
      </div>
    </div>
  );
};

export default FileUpload;