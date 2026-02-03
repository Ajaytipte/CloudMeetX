/**
 * FileUpload Component
 * Drag-and-drop file upload with AWS S3 pre-signed URLs
 */

import { useState, useRef, useCallback } from 'react';
import { Upload, X, CheckCircle, AlertCircle, FileIcon, Loader } from 'lucide-react';
import useFileUpload from '../hooks/useFileUpload';
import { formatFileSize, getFileIcon } from '../utils/s3Upload';

const FileUpload = ({
    meetingId,
    onFileUploaded,
    maxSizeMB = 50,
    allowedTypes = [],
    multiple = true,
    className = ''
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const {
        uploads,
        isUploading,
        uploadFiles,
        removeUpload,
        clearCompleted,
        retryUpload
    } = useFileUpload(meetingId, {
        maxSizeMB,
        allowedTypes,
        onUploadComplete: (result) => {
            console.log('✅ Upload complete:', result);
            if (onFileUploaded) {
                onFileUploaded(result);
            }
        },
        onUploadError: (error, file) => {
            console.error('❌ Upload error:', error, file);
        }
    });

    // Handle drag events
    const handleDragEnter = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();

        // Only set dragging to false if we're leaving the drop zone
        if (e.currentTarget === e.target) {
            setIsDragging(false);
        }
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            uploadFiles(files);
        }
    }, [uploadFiles]);

    // Handle file input change
    const handleFileInputChange = useCallback((e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            uploadFiles(files);
        }
        // Reset input
        e.target.value = '';
    }, [uploadFiles]);

    // Open file picker
    const openFilePicker = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    return (
        <div className={`w-full ${className}`}>
            {/* Drop Zone */}
            <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={openFilePicker}
                className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragging
                        ? 'border-blue-500 bg-blue-50 scale-105'
                        : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                    }
        `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple={multiple}
                    onChange={handleFileInputChange}
                    className="hidden"
                    accept={allowedTypes.join(',')}
                />

                <div className="flex flex-col items-center space-y-4">
                    <div className={`
            w-16 h-16 rounded-full flex items-center justify-center
            ${isDragging ? 'bg-blue-100' : 'bg-gray-100'}
            transition-colors duration-200
          `}>
                        <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-600' : 'text-gray-600'}`} />
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {isDragging ? 'Drop files here' : 'Upload files'}
                        </h3>
                        <p className="text-sm text-gray-600">
                            Drag and drop or click to browse
                        </p>
                        {maxSizeMB && (
                            <p className="text-xs text-gray-500 mt-2">
                                Max file size: {maxSizeMB}MB
                            </p>
                        )}
                        {allowedTypes.length > 0 && (
                            <p className="text-xs text-gray-500">
                                Allowed types: {allowedTypes.join(', ')}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Upload List */}
            {uploads.length > 0 && (
                <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold text-gray-700">
                            Uploads ({uploads.length})
                        </h4>
                        {uploads.some(u => u.status === 'success') && (
                            <button
                                onClick={clearCompleted}
                                className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                            >
                                Clear completed
                            </button>
                        )}
                    </div>

                    {uploads.map((upload) => (
                        <UploadItem
                            key={upload.id}
                            upload={upload}
                            onRemove={() => removeUpload(upload.id)}
                            onRetry={() => retryUpload(upload.id)}
                        />
                    ))}
                </div>
            )}

            {/* Upload Indicator */}
            {isUploading && (
                <div className="mt-4 flex items-center justify-center space-x-2 text-blue-600">
                    <Loader className="w-4 h-4 animate-spin" />
                    <span className="text-sm font-semibold">Uploading files...</span>
                </div>
            )}
        </div>
    );
};

// Upload Item Component
const UploadItem = ({ upload, onRemove, onRetry }) => {
    const { fileName, fileSize, fileType, progress, status, error, fileUrl } = upload;

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start space-x-3">
                {/* File Icon */}
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                        {getFileIcon(fileType)}
                    </div>
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <h5 className="text-sm font-semibold text-gray-900 truncate pr-2">
                            {fileName}
                        </h5>

                        {/* Status Icon */}
                        {status === 'success' && (
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        )}
                        {status === 'error' && (
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        )}
                        {status === 'uploading' && (
                            <Loader className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />
                        )}
                    </div>

                    <p className="text-xs text-gray-500">
                        {formatFileSize(fileSize)}
                    </p>

                    {/* Progress Bar */}
                    {(status === 'uploading' || status === 'pending') && (
                        <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{progress}%</p>
                        </div>
                    )}

                    {/* Error Message */}
                    {status === 'error' && error && (
                        <p className="text-xs text-red-600 mt-1">{error}</p>
                    )}

                    {/* Success - File URL */}
                    {status === 'success' && fileUrl && (
                        <div className="mt-2 flex items-center space-x-2">
                            <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                            >
                                View file
                            </a>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(fileUrl);
                                }}
                                className="text-xs text-gray-600 hover:text-gray-700"
                            >
                                Copy URL
                            </button>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex-shrink-0">
                    {status === 'error' && (
                        <button
                            onClick={onRetry}
                            className="text-xs text-blue-600 hover:text-blue-700 font-semibold mr-2"
                        >
                            Retry
                        </button>
                    )}
                    <button
                        onClick={onRemove}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FileUpload;
