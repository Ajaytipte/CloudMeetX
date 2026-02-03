/**
 * Example: File Upload and Download Component
 * Demonstrates S3 presigned URL usage with React
 */

import { useState, useRef } from 'react';
import { useS3Files } from '../hooks/useS3Files';
import { Upload, Download, File, X, CheckCircle, AlertCircle } from 'lucide-react';

const FileUploadExample = ({ meetingId, userId }) => {
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const fileInputRef = useRef(null);

    const {
        uploadFile,
        downloadFile,
        uploading,
        uploadProgress,
        error
    } = useS3Files();

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        const result = await uploadFile(
            selectedFile,
            meetingId,
            userId,
            (progress) => {
                console.log(`Upload progress: ${progress}%`);
            }
        );

        if (result.success) {
            setUploadedFiles(prev => [...prev, result]);
            setSelectedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDownload = async (s3Key, fileName) => {
        await downloadFile(s3Key, fileName);
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="file-upload-container">
            <h2>File Upload & Download</h2>

            {/* Error Display */}
            {error && (
                <div className="alert alert-error">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                </div>
            )}

            {/* Upload Section */}
            <div className="upload-section">
                <h3>Upload File</h3>

                <div className="file-input-wrapper">
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileSelect}
                        disabled={uploading}
                        className="file-input"
                    />
                </div>

                {selectedFile && (
                    <div className="selected-file">
                        <File className="w-5 h-5" />
                        <div className="file-details">
                            <p className="file-name">{selectedFile.name}</p>
                            <p className="file-size">{formatFileSize(selectedFile.size)}</p>
                        </div>
                        <button
                            onClick={() => setSelectedFile(null)}
                            className="btn-icon"
                            disabled={uploading}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {uploading && (
                    <div className="upload-progress">
                        <div className="progress-bar">
                            <div
                                className="progress-bar-fill"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                        </div>
                        <p>{uploadProgress}% uploaded</p>
                    </div>
                )}

                <button
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                    className="btn-primary"
                >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploading ? 'Uploading...' : 'Upload File'}
                </button>
            </div>

            {/* Uploaded Files List */}
            <div className="files-list">
                <h3>Uploaded Files ({uploadedFiles.length})</h3>

                {uploadedFiles.length === 0 ? (
                    <p className="text-gray-500">No files uploaded yet</p>
                ) : (
                    <ul>
                        {uploadedFiles.map((file, index) => (
                            <li key={file.fileId || index} className="file-item">
                                <div className="file-icon">
                                    <File className="w-6 h-6" />
                                </div>
                                <div className="file-info">
                                    <p className="file-name">{file.fileName}</p>
                                    <p className="file-meta">
                                        {formatFileSize(file.fileSize)} • {file.fileType}
                                    </p>
                                    <p className="file-id">{file.fileId}</p>
                                </div>
                                <div className="file-actions">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <button
                                        onClick={() => handleDownload(file.s3Key, file.fileName)}
                                        className="btn-icon"
                                    >
                                        <Download className="w-4 h-4" />
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Styling */}
            <style jsx>{`
        .file-upload-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }

        .upload-section {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }

        .file-input {
          width: 100%;
          padding: 10px;
          border: 2px dashed #ccc;
          border-radius: 4px;
          cursor: pointer;
        }

        .selected-file {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f5f5f5;
          border-radius: 4px;
          margin: 12px 0;
        }

        .upload-progress {
          margin: 12px 0;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          transition: width 0.3s ease;
        }

        .files-list {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .file-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-bottom: 1px solid #eee;
        }

        .file-item:last-child {
          border-bottom: none;
        }

        .file-actions {
          display: flex;
          gap: 8px;
          margin-left: auto;
        }

        .btn-primary {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px 20px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .alert {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 16px;
        }

        .alert-error {
          background: #fee;
          color: #c00;
          border: 1px solid #fcc;
        }
      `}</style>
        </div>
    );
};

export default FileUploadExample;
