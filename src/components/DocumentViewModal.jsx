import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
    X, Download, Eye, FileText, File, ExternalLink, Loader2, 
    Bot, ZoomIn, ZoomOut, RotateCw, Copy, Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const DocumentViewModal = ({ isOpen, onClose, doc, onOpenChat, onOpenSummary }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [fileBlobUrl, setFileBlobUrl] = useState(null);
    const [textContent, setTextContent] = useState('');
    const [viewMode, setViewMode] = useState('preview'); // 'preview' | 'text'
    const [copied, setCopied] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(100);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen || !doc) {
            if (fileBlobUrl) {
                URL.revokeObjectURL(fileBlobUrl);
                setFileBlobUrl(null);
            }
            setTextContent('');
            setError('');
            setLoading(true);
            return;
        }

        let isSubscribed = true;
        setLoading(true);
        setError('');
        setZoomLevel(100);

        const isDocx = ['DOCX', 'DOC'].includes(doc.fileFormat?.toUpperCase());
        // Default to text mode for DOC/DOCX since iframe cannot render docx directly
        setViewMode(isDocx ? 'text' : 'preview');

        // Fetch file as blob for iframe preview (PDF/TXT)
        const loadFile = async () => {
            try {
                // Fetch blob for inline rendering with auth header
                const res = await api.get(`/documents/${doc.id}/file`, {
                    responseType: 'blob'
                });
                
                if (isSubscribed) {
                    const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' });
                    const url = URL.createObjectURL(blob);
                    setFileBlobUrl(url);
                }
            } catch (err) {
                console.error("Failed to load file blob", err);
                if (isSubscribed && !isDocx) {
                    setError("Could not render file preview directly. You can read the extracted text or download the file.");
                }
            }

            // Also load extracted text content
            try {
                const textRes = await api.get(`/documents/${doc.id}/content`);
                if (isSubscribed) {
                    setTextContent(textRes.data?.content || '');
                }
            } catch (err) {
                console.error("Failed to load text content", err);
            } finally {
                if (isSubscribed) {
                    setLoading(false);
                }
            }
        };

        loadFile();

        return () => {
            isSubscribed = false;
            if (fileBlobUrl) {
                URL.revokeObjectURL(fileBlobUrl);
            }
        };
    }, [isOpen, doc?.id]);

    if (!isOpen || !doc) return null;

    const format = doc.fileFormat?.toUpperCase() || '';
    const isPdf = format === 'PDF';
    const isDocx = ['DOCX', 'DOC'].includes(format);

    const handleDownload = async () => {
        try {
            const res = await api.get(`/documents/${doc.id}/download`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', doc.filename || 'document');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Failed to download file", err);
            alert("Failed to download file. Please try again.");
        }
    };

    const handleCopyText = () => {
        if (!textContent) return;
        navigator.clipboard.writeText(textContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const formatSize = (bytes) => {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-[#070913]/85 backdrop-blur-md" 
                onClick={onClose}
            />

            {/* Modal Dialog */}
            <div className="relative z-10 w-full max-w-5xl h-[92vh] flex flex-col rounded-3xl bg-[#141233]/95 border border-white/20 shadow-2xl backdrop-blur-2xl overflow-hidden transition-all text-white">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#1D1B42]/50 shrink-0">
                    <div className="flex items-center gap-3.5 min-w-0 pr-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-inner">
                            {isPdf ? <File className="h-5 w-5 text-red-400" /> : <FileText className="h-5 w-5 text-blue-400" />}
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-base md:text-lg font-bold text-white tracking-tight truncate" title={doc.filename}>
                                {doc.filename}
                            </h3>
                            <div className="flex items-center gap-2 text-xs text-gray-300 mt-0.5">
                                <span className="px-2 py-0.5 rounded-md bg-white/10 font-semibold uppercase text-[10px] tracking-wider text-indigo-300">
                                    {doc.fileFormat}
                                </span>
                                <span>•</span>
                                <span>{formatSize(doc.fileSize)}</span>
                            </div>
                        </div>
                    </div>

                    {/* View Controls & Action buttons */}
                    <div className="flex items-center gap-2">
                        {/* Tab Switcher: Preview vs Raw Text */}
                        <div className="hidden sm:flex items-center bg-white/10 p-1 rounded-xl border border-white/10">
                            {!isDocx && (
                                <button
                                    onClick={() => setViewMode('preview')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                        viewMode === 'preview' 
                                            ? 'bg-indigo-600 text-white shadow-sm' 
                                            : 'text-gray-300 hover:text-white'
                                    }`}
                                >
                                    <Eye className="h-3.5 w-3.5" />
                                    Viewer
                                </button>
                            )}
                            <button
                                onClick={() => setViewMode('text')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                    viewMode === 'text' 
                                        ? 'bg-indigo-600 text-white shadow-sm' 
                                        : 'text-gray-300 hover:text-white'
                                }`}
                            >
                                <FileText className="h-3.5 w-3.5" />
                                Text Content
                            </button>
                        </div>

                        {/* Download button */}
                        <button
                            onClick={handleDownload}
                            title="Download original file"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white transition-all shadow-sm"
                        >
                            <Download className="h-4 w-4 text-emerald-400" />
                            <span className="hidden md:inline">Download</span>
                        </button>

                        {/* Chat button */}
                        <button
                            onClick={() => {
                                onClose();
                                navigate('/chat', { state: { docId: doc.id } });
                            }}
                            title="Chat with document"
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600/80 hover:bg-purple-600 border border-purple-500/40 text-xs font-semibold text-white transition-all shadow-sm"
                        >
                            <Bot className="h-4 w-4" />
                            <span className="hidden md:inline">Chat</span>
                        </button>

                        {/* Close button */}
                        <button 
                            onClick={onClose}
                            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors ml-1"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Subheader bar for active mode utilities */}
                <div className="flex items-center justify-between px-6 py-2 bg-black/20 border-b border-white/5 text-xs text-gray-300 shrink-0">
                    <div className="flex items-center gap-2">
                        {viewMode === 'text' ? (
                            <span>Extracted searchable text representation</span>
                        ) : (
                            <span>Interactive file rendering</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {viewMode === 'text' && textContent && (
                            <button
                                onClick={handleCopyText}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 transition-colors"
                            >
                                {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                                {copied ? 'Copied text' : 'Copy text'}
                            </button>
                        )}

                        {viewMode === 'preview' && fileBlobUrl && isPdf && (
                            <div className="flex items-center gap-2">
                                <a 
                                    href={fileBlobUrl} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-gray-200 transition-colors"
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    Open in New Tab
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 min-h-0 relative bg-[#0d0c24]/90 p-4 overflow-hidden flex flex-col">
                    {loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                            <p className="text-sm font-medium">Opening and preparing document...</p>
                        </div>
                    ) : error && viewMode === 'preview' ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                            <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mb-4">
                                <FileText className="h-7 w-7" />
                            </div>
                            <h4 className="text-base font-bold text-white mb-2">Native Preview Not Available</h4>
                            <p className="text-sm text-gray-300 max-w-md mb-6">{error}</p>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setViewMode('text')}
                                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-all"
                                >
                                    View Extracted Text
                                </button>
                                <button
                                    onClick={handleDownload}
                                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all"
                                >
                                    Download File
                                </button>
                            </div>
                        </div>
                    ) : viewMode === 'preview' && fileBlobUrl ? (
                        <div className="w-full h-full rounded-2xl overflow-hidden bg-white shadow-2xl border border-white/10">
                            <iframe 
                                src={fileBlobUrl} 
                                title={doc.filename}
                                className="w-full h-full border-none"
                            />
                        </div>
                    ) : (
                        // Text mode
                        <div className="w-full h-full flex flex-col rounded-2xl bg-[#17153B]/70 border border-white/10 p-6 overflow-hidden">
                            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 pr-4 select-text">
                                {textContent ? (
                                    <div className="text-sm text-gray-200 leading-relaxed font-mono whitespace-pre-wrap">
                                        {textContent}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                        <FileText className="h-10 w-10 mb-2 opacity-50" />
                                        <p className="text-sm">No text content could be extracted from this document.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer bar */}
                <div className="px-6 py-3 border-t border-white/10 bg-[#1D1B42]/50 flex items-center justify-between text-xs text-gray-400 shrink-0">
                    <div>
                        Tip: Click <span className="text-indigo-300 font-semibold">Download</span> or <span className="text-purple-300 font-semibold">Chat</span> to interact further.
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-all border border-white/10"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default DocumentViewModal;
