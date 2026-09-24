import { useState, useEffect } from 'react';
import { 
    FileText, MessageSquare, User, FileUp, 
    PieChart, ChevronRight, Smile, File, FileSpreadsheet, FileIcon,
    Plus, Star, Loader2, X, Trash2, Eye
} from 'lucide-react';
import api from '../services/api';
import UploadModal from '../components/UploadModal';
import SummaryModal from '../components/SummaryModal';
import DocumentViewModal from '../components/DocumentViewModal';
import { useOutletContext, useNavigate } from 'react-router-dom';

const DashboardPage = ({ showFavoritesOnly = false }) => {
    const navigate = useNavigate();
    const [documents, setDocuments] = useState([]);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [deletingDocId, setDeletingDocId] = useState(null);
    
    const [summarizingDocId, setSummarizingDocId] = useState(null);
    const [summaryModalOpen, setSummaryModalOpen] = useState(false);
    const [currentSummary, setCurrentSummary] = useState('');
    const [currentDocName, setCurrentDocName] = useState('');
    const [currentDocId, setCurrentDocId] = useState(null);

    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedViewDoc, setSelectedViewDoc] = useState(null);
    
    const [notification, setNotification] = useState(null);
    const { searchQuery = '', refreshTrigger = 0 } = useOutletContext() || {};

    const fetchDocuments = async () => {
        try {
            const response = await api.get('/documents/');
            setDocuments(response.data);
        } catch (error) {
            console.error("Failed to fetch documents", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, [refreshTrigger]);

    const timeAgo = (dateStr) => {
        if (!dateStr) return 'Unknown time';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return 'Unknown time';
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + ' years ago';
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + ' months ago';
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + ' days ago';
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + ' hours ago';
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + ' minutes ago';
        return 'just now';
    };

    const handleSummarize = async (e, doc) => {
        e.stopPropagation();
        if (doc.summary) {
            navigate('/summaries', { state: { docId: doc.id } });
            return;
        }

        setSummarizingDocId(doc.id);
        try {
            await api.post(`/documents/${doc.id}/summarize`);
            navigate('/summaries', { state: { docId: doc.id } });
        } catch (error) {
            console.error("Failed to summarize document", error);
            const msg = error.response?.data?.detail || "Failed to summarize document. Please try again.";
            alert(msg);
        } finally {
            setSummarizingDocId(null);
        }
    };

    const handleDeleteDocument = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this document?")) {
            return;
        }

        setDeletingDocId(id);
        try {
            await api.delete(`/documents/${id}`);
            setDocuments(docs => docs.filter(d => d.id !== id));
        } catch (error) {
            console.error("Failed to delete document", error);
        } finally {
            setDeletingDocId(null);
        }
    };

    const handleUploadSuccess = async (newDoc) => {
        await fetchDocuments();
        
        try {
            setSummarizingDocId(newDoc.id);
            const response = await api.post(`/documents/${newDoc.id}/summarize`);
            setDocuments(docs => docs.map(d => d.id === newDoc.id ? { ...d, summary: response.data.summary } : d));
            
            // Show notification
            setNotification(`Summary is ready for ${newDoc.filename}`);
            setTimeout(() => setNotification(null), 5000);
        } catch (error) {
            console.error("Failed to summarize newly uploaded document", error);
        } finally {
            setSummarizingDocId(null);
        }
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getIconAndColors = (format) => {
        switch (format?.toUpperCase()) {
            case 'PDF':
                return { icon: File, color: 'text-red-400', bg: 'bg-red-400/20' };
            case 'DOC':
            case 'DOCX':
            case 'TXT':
                return { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400/20' };
            case 'XLSX':
            case 'XLS':
            case 'CSV':
                return { icon: FileSpreadsheet, color: 'text-green-400', bg: 'bg-green-400/20' };
            case 'PPT':
            case 'PPTX':
                return { icon: FileIcon, color: 'text-orange-400', bg: 'bg-orange-400/20' };
            default:
                return { icon: File, color: 'text-gray-400', bg: 'bg-gray-400/20' };
        }
    };

    return (
        <div className="flex flex-col h-full text-white w-full relative">
            {/* Notification Toast */}
            {notification && (
                <div className="absolute top-4 right-4 z-[200] bg-indigo-600 text-white px-4 py-3 rounded-xl shadow-lg border border-indigo-400/30 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                    <FileText className="h-5 w-5" />
                    <p className="text-sm font-medium">{notification}</p>
                    <button onClick={() => setNotification(null)} className="text-white/70 hover:text-white">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-8">
                {/* Card 1: Total Documents (Indigo-Blue Theme) */}
                <div className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-indigo-900/40 via-[#1D1B42]/60 to-purple-900/30 border border-indigo-500/20 p-5 backdrop-blur-md shadow-lg relative overflow-hidden transition-all hover:border-indigo-400/40 hover:scale-[1.02] light-stat-card-1">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-500/25 border border-indigo-400/40 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                            <FileText className="h-6 w-6 stroke-[2.5]" />
                        </div>
                        <div className="w-full">
                            <p className="text-xs font-semibold text-indigo-200/90 tracking-wide uppercase">
                                {showFavoritesOnly ? 'Favorite Documents' : 'Total Documents'}
                            </p>
                            <h3 className="text-2xl font-black mt-1 text-white flex items-baseline gap-2">
                                {showFavoritesOnly ? documents.filter(d => d.isFavorite).length : documents.length}
                            </h3>
                        </div>
                    </div>
                    <div className="absolute top-4 right-4 text-indigo-400/10 pointer-events-none"><FileText className="h-16 w-16" /></div>
                </div>

                {/* Card 2: Summaries Generated (Emerald-Teal Theme) */}
                <div className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-emerald-900/40 via-[#1D1B42]/60 to-teal-900/30 border border-emerald-500/20 p-5 backdrop-blur-md shadow-lg relative overflow-hidden transition-all hover:border-emerald-400/40 hover:scale-[1.02] light-stat-card-2">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/25 border border-emerald-400/40 text-emerald-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                            <FileUp className="h-6 w-6 stroke-[2.5]" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-emerald-200/90 tracking-wide uppercase">Summaries Generated</p>
                            <h3 className="text-2xl font-black mt-1 text-white">
                                {(showFavoritesOnly ? documents.filter(d => d.isFavorite) : documents).filter(d => Boolean(d.summary)).length}
                            </h3>
                        </div>
                    </div>
                    <div className="absolute top-4 right-4 text-emerald-400/10 pointer-events-none"><FileUp className="h-16 w-16" /></div>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="flex-1 min-h-0">
                {/* Recent Documents List (Full Width) */}
                <div className="w-full h-full rounded-2xl bg-[#17153B]/50 border border-white/10 p-6 backdrop-blur-md shadow-xl flex flex-col transition-all hover:bg-[#17153B]/60">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-white drop-shadow">
                            {showFavoritesOnly ? 'Favorite Documents' : 'Recent Documents'}
                        </h3>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => navigate('/documents')}
                                className="text-xs font-medium text-indigo-300 hover:text-indigo-200 flex items-center gap-1 transition-colors"
                            >
                                View All <ChevronRight className="h-3 w-3" />
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-1 space-y-3">
                        {isLoading ? (
                            <div className="flex justify-center items-center h-full text-gray-400 text-sm">
                                Loading documents...
                            </div>
                        ) : documents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center p-6">
                                <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4 text-gray-500">
                                    <FileText className="h-8 w-8" />
                                </div>
                                <h4 className="text-white font-medium mb-1">No documents yet</h4>
                                <p className="text-xs text-gray-400 mb-4 max-w-xs">Upload your first document to start generating summaries.</p>
                                <button 
                                    onClick={() => setIsUploadModalOpen(true)}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                                >
                                    Upload Document
                                </button>
                            </div>
                        ) : (
                            (showFavoritesOnly ? documents.filter(d => d.isFavorite) : documents)
                                .filter(doc => (doc.filename || '').toLowerCase().includes((searchQuery || '').toLowerCase()))
                                .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
                                .slice(0, 4)
                                .map((doc) => {
                                const { icon: DocIcon, color, bg } = getIconAndColors(doc.fileFormat);
                                
                                // Safe date parsing
                                let timeText = 'Unknown time';
                                try {
                                    if (doc.createdAt) {
                                        timeText = `Uploaded ${timeAgo(doc.createdAt)}`;
                                    }
                                } catch(e) {}
                                
                                const isFavorite = doc.isFavorite;
                                
                                const toggleFavorite = async (e, id) => {
                                    e.stopPropagation();
                                    try {
                                        const response = await api.patch(`/documents/${id}/favorite`);
                                        setDocuments(docs => docs.map(d => d.id === id ? { ...d, isFavorite: response.data.isFavorite } : d));
                                    } catch (error) {
                                        console.error("Failed to toggle favorite", error);
                                    }
                                };

                                return (
                                    <div 
                                        key={doc.id} 
                                        onClick={() => {
                                            setSelectedViewDoc(doc);
                                            setViewModalOpen(true);
                                        }}
                                        className="group flex items-center justify-between rounded-xl bg-white/5 border border-white/5 p-4 hover:bg-white/15 hover:border-white/20 transition-all cursor-pointer"
                                    >
                                        <div className="flex items-center gap-4">
                                             <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bg} ${color} shadow-inner relative`}>
                                                <DocIcon className="h-5 w-5" />
                                                {isFavorite && (
                                                    <div className="absolute -top-1 -right-1">
                                                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-100 group-hover:text-indigo-300 transition-colors">{doc.filename}</h4>
                                                <p className="text-xs text-gray-400 mt-0.5">{doc.fileFormat} • {formatSize(doc.fileSize)} • {timeText}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedViewDoc(doc);
                                                    setViewModalOpen(true);
                                                }}
                                                title="Open & View document"
                                                className="h-8 w-8 rounded-full border border-white/20 flex items-center justify-center transition-colors text-gray-400 hover:text-emerald-400 hover:bg-white/10 hover:border-emerald-400/30"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button 
                                                onClick={(e) => toggleFavorite(e, doc.id)} 
                                                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                                                className={`h-8 w-8 rounded-full border border-white/20 flex items-center justify-center transition-colors ${isFavorite ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30' : 'text-gray-400 hover:text-yellow-400 hover:bg-white/10'}`}
                                            >
                                                <Star className={`h-4 w-4 ${isFavorite ? 'fill-yellow-400' : ''}`} />
                                            </button>
                                            <button 
                                                onClick={(e) => handleSummarize(e, doc)}
                                                disabled={summarizingDocId === doc.id}
                                                className="rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-1.5 text-xs font-semibold hover:opacity-90 shadow-[0_0_10px_rgba(147,51,234,0.3)] opacity-0 group-hover:opacity-100 transition-all text-white transform translate-x-2 group-hover:translate-x-0 disabled:opacity-100 disabled:translate-x-0 flex items-center justify-center gap-2"
                                            >
                                                {summarizingDocId === doc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                                                {summarizingDocId === doc.id ? 'Summarizing...' : 'Summarize'}
                                            </button>
                                            <button 
                                                onClick={(e) => handleDeleteDocument(e, doc.id)}
                                                disabled={deletingDocId === doc.id}
                                                title="Delete document"
                                                className="h-8 w-8 rounded-full border border-white/20 flex items-center justify-center text-gray-400 hover:text-red-400 hover:border-red-400/40 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                                            >
                                                {deletingDocId === doc.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            <UploadModal 
                isOpen={isUploadModalOpen} 
                onClose={() => setIsUploadModalOpen(false)} 
                onSuccess={handleUploadSuccess}
            />
            
            <SummaryModal 
                isOpen={summaryModalOpen} 
                onClose={() => setSummaryModalOpen(false)} 
                summary={currentSummary}
                docName={currentDocName}
                docId={currentDocId}
            />

            <DocumentViewModal
                isOpen={viewModalOpen}
                onClose={() => {
                    setViewModalOpen(false);
                    setSelectedViewDoc(null);
                }}
                doc={selectedViewDoc}
            />
        </div>
    );
};

export default DashboardPage;

