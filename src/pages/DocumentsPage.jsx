import { useState, useEffect } from 'react';
import { File, FileText, FileSpreadsheet, FileIcon, User, Search, Loader2, Star, Trash2, MessageSquare, Eye } from 'lucide-react';
import api from '../services/api';
import SummaryModal from '../components/SummaryModal';
import DocumentViewModal from '../components/DocumentViewModal';
import { useOutletContext, useNavigate } from 'react-router-dom';

const DocumentsPage = ({ showSummariesOnly = false }) => {
    const navigate = useNavigate();
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const { refreshTrigger = 0 } = useOutletContext() || {};

    const [summarizingDocId, setSummarizingDocId] = useState(null);
    const [summaryModalOpen, setSummaryModalOpen] = useState(false);
    const [currentSummary, setCurrentSummary] = useState('');
    const [currentDocName, setCurrentDocName] = useState('');
    const [currentDocId, setCurrentDocId] = useState(null);

    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedViewDoc, setSelectedViewDoc] = useState(null);

    useEffect(() => {
        fetchDocuments();
    }, [refreshTrigger]);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const response = await api.get('/documents');
            setDocuments(response.data);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch documents. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleFavorite = async (e, id) => {
        e.stopPropagation();
        try {
            const response = await api.patch(`/documents/${id}/favorite`);
            setDocuments(docs => docs.map(d => d.id === id ? { ...d, isFavorite: response.data.isFavorite } : d));
        } catch (err) {
            console.error("Failed to toggle favorite", err);
        }
    };

    const handleSummarize = async (e, doc, force = false) => {
        if (e) e.stopPropagation();
        if (doc.summary && !force) {
            navigate('/summaries', { state: { docId: doc.id } });
            return;
        }

        setSummarizingDocId(doc.id);
        setError('');
        try {
            await api.post(`/documents/${doc.id}/summarize${force ? '?force=true' : ''}`);
            navigate('/summaries', { state: { docId: doc.id } });
        } catch (error) {
            console.error("Failed to summarize document", error);
            const msg = error.response?.data?.detail || "Failed to summarize document. Please try again.";
            setError(msg);
        } finally {
            setSummarizingDocId(null);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this document?")) return;
        try {
            await api.delete(`/documents/${id}`);
            setDocuments(docs => docs.filter(d => d.id !== id));
        } catch (err) {
            console.error("Failed to delete document", err);
            setError("Failed to delete document.");
        }
    };

    const getFileIcon = (format) => {
        switch (format) {
            case 'PDF': return { icon: File, color: 'text-red-400', bg: 'bg-red-400/20' };
            case 'DOCX':
            case 'DOC': return { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400/20' };
            case 'XLSX': return { icon: FileSpreadsheet, color: 'text-green-400', bg: 'bg-green-400/20' };
            default: return { icon: FileIcon, color: 'text-orange-400', bg: 'bg-orange-400/20' };
        }
    };

    const filteredDocs = documents
        .filter(doc => showSummariesOnly ? doc.summary : true)
        .filter(doc => (doc.filename || '').toLowerCase().includes(searchQuery.toLowerCase()));

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown date';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Unknown date';
        
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleString(undefined, options);
    };

    return (
        <div className="flex flex-col h-full text-white w-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">
                        {showSummariesOnly ? "Summarized Documents" : "My Documents"}
                    </h2>
                    <p className="text-sm text-gray-300 mt-1 drop-shadow">Manage and analyze all your uploaded files.</p>
                </div>

                {/* Local Search */}
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-64 rounded-xl border border-white/20 bg-[#17153B]/50 py-2.5 pl-11 pr-4 text-sm text-white placeholder-gray-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 backdrop-blur-md shadow-inner transition-all hover:bg-[#17153B]/70"
                        placeholder="Search document"
                    />
                </div>
            </div>

            <div className="flex-1 min-h-0 rounded-3xl bg-[#17153B]/50 border border-white/10 p-8 backdrop-blur-xl shadow-2xl flex flex-col transition-all overflow-hidden">
                {error && (
                    <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                    </div>
                ) : filteredDocs.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <File className="h-16 w-16 mb-4 opacity-50" />
                        <p className="text-lg font-medium text-white">
                            {showSummariesOnly ? "No summarized documents yet" : "No documents found"}
                        </p>
                        <p className="text-sm mt-1">
                            {showSummariesOnly ? "Click 'Summarize' on any uploaded document to view its summary here." : "Upload a document to get started!"}
                        </p>
                    </div>
                ) : (
                    <div className="flex-1 min-h-0 overflow-y-auto pr-3 pb-4 scrollbar-thin">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDocs.map((doc) => {
                            const { icon: Icon, color, bg } = getFileIcon(doc.fileFormat);
                            return (
                                <div 
                                    key={doc.id} 
                                    onClick={() => {
                                        setSelectedViewDoc(doc);
                                        setViewModalOpen(true);
                                    }}
                                    className="group flex flex-col justify-between rounded-2xl bg-white/5 border border-white/10 p-6 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer shadow-lg hover:shadow-xl hover:scale-[1.02]"
                                >
                                    <div className="flex items-start gap-4 mb-6">
                                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${bg} ${color} shadow-inner relative`}>
                                            <Icon className="h-6 w-6" />
                                            {doc.isFavorite && (
                                                <div className="absolute -top-1.5 -right-1.5">
                                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 drop-shadow-md" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h4 className="text-base font-semibold text-gray-100 truncate group-hover:text-indigo-300 transition-colors" title={doc.filename}>{doc.filename}</h4>
                                            <p className="text-xs font-medium text-gray-400 mt-1">{doc.fileFormat} • {(doc.fileSize / (1024 * 1024)).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                    <div className="border-t border-white/10 pt-4 mt-auto space-y-3">
                                        <div className="flex items-center justify-between text-xs text-gray-400">
                                            <span>Uploaded {formatDate(doc.createdAt)}</span>
                                            {doc.summary ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
                                                    Summarized
                                                </span>
                                            ) : null}
                                        </div>

                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-1.5">
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
                                                    title={doc.isFavorite ? "Remove from favorites" : "Add to favorites"}
                                                    className={`h-8 w-8 rounded-full border border-white/20 flex items-center justify-center transition-colors ${doc.isFavorite ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30' : 'text-gray-400 hover:text-yellow-400 hover:bg-white/10'}`}
                                                >
                                                    <Star className={`h-4 w-4 ${doc.isFavorite ? 'fill-yellow-400' : ''}`} />
                                                </button>
                                                <button 
                                                    onClick={(e) => handleDelete(e, doc.id)}
                                                    title="Delete document"
                                                    className="h-8 w-8 rounded-full border border-white/20 flex items-center justify-center transition-colors text-gray-400 hover:text-red-400 hover:bg-white/10 hover:border-red-400/30"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate('/chat', { state: { docId: doc.id } });
                                                    }}
                                                    title="Chat with document"
                                                    className="h-8 w-8 rounded-full border border-white/20 flex items-center justify-center transition-colors text-gray-400 hover:text-indigo-400 hover:bg-white/10 hover:border-indigo-400/30"
                                                >
                                                    <MessageSquare className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <button 
                                                onClick={(e) => handleSummarize(e, doc)}
                                                disabled={summarizingDocId === doc.id}
                                                className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-1.5 text-xs font-semibold hover:opacity-90 shadow-[0_0_10px_rgba(147,51,234,0.3)] transition-all text-white disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
                                            >
                                                {summarizingDocId === doc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                                                {summarizingDocId === doc.id ? 'Summarizing...' : (doc.summary ? 'View Summary' : 'Summarize')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        </div>
                    </div>
                )}
            </div>

            <SummaryModal 
                isOpen={summaryModalOpen} 
                onClose={() => setSummaryModalOpen(false)} 
                summary={currentSummary}
                docName={currentDocName}
                docId={currentDocId}
                isSummarizing={summarizingDocId === currentDocId}
                onResummarize={() => handleSummarize(null, documents.find(d => d.id === currentDocId), true)}
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

export default DocumentsPage;
