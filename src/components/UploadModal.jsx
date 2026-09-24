import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, UploadCloud, File, AlertCircle, Loader2 } from 'lucide-react';
import api from '../services/api';

const UploadModal = ({ isOpen, onClose, onSuccess }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [mounted, setMounted] = useState(false);
    
    const fileInputRef = useRef(null);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!isOpen || !mounted) return null;

    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];

    const validateFile = (selectedFile) => {
        setError('');
        if (!selectedFile) return false;
        
        const ext = '.' + selectedFile.name.split('.').pop().toLowerCase();
        if (!allowedTypes.includes(ext)) {
            setError(`Invalid file format. Allowed: ${allowedTypes.join(', ')}`);
            return false;
        }
        return true;
    };

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (validateFile(selectedFile)) {
            setFile(selectedFile);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (validateFile(droppedFile)) {
            setFile(droppedFile);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        
        setIsUploading(true);
        setError('');
        
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const response = await api.post('/documents/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            if (onSuccess) {
                onSuccess(response.data);
            }
            handleClose();
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to upload document.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleClose = () => {
        if (!isUploading) {
            setFile(null);
            setError('');
            onClose();
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-[#0B0F19]/80 backdrop-blur-sm" onClick={handleClose}></div>
            
            <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-[#1D1B42]/95 border border-white/10 p-8 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-2xl font-bold text-white tracking-tight">Upload Document</h3>
                        <p className="text-sm text-gray-400 mt-1">Add a new file to your workspace for analysis.</p>
                    </div>
                    <button onClick={handleClose} disabled={isUploading} className="text-gray-400 hover:text-white transition-colors disabled:opacity-50 p-2 hover:bg-white/10 rounded-full">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {error && (
                    <div className="mb-6 flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                        <p>{error}</p>
                    </div>
                )}

                {!file ? (
                    <div 
                        className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-20 px-10 transition-all cursor-pointer ${
                            isDragging ? 'border-indigo-400 bg-indigo-500/10 scale-[1.02]' : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40'
                        }`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={handleFileSelect}
                        />
                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 mb-6 shadow-inner">
                            <UploadCloud className="h-12 w-12" />
                        </div>
                        <p className="text-lg font-semibold text-white text-center">Click or drag and drop to upload</p>
                        <p className="text-sm text-gray-400 mt-2 text-center">Supported formats: PDF, DOCX, TXT</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 p-5 hover:border-white/20 transition-all">
                            <div className="flex items-center gap-4 overflow-hidden">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 shadow-inner">
                                    <File className="h-7 w-7" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-base font-semibold text-white truncate">{file.name}</p>
                                    <p className="text-sm text-gray-400 mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setFile(null)}
                                className="shrink-0 text-gray-400 hover:text-red-400 transition-colors ml-4 p-2 hover:bg-white/10 rounded-full"
                                disabled={isUploading}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <button 
                            onClick={handleUpload}
                            disabled={isUploading}
                            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 py-4 text-base font-bold text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:opacity-90 hover:scale-[1.01] transition-all disabled:opacity-50 disabled:hover:scale-100"
                        >
                            {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
                            {isUploading ? 'Uploading Document...' : 'Upload Document'}
                        </button>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default UploadModal;
