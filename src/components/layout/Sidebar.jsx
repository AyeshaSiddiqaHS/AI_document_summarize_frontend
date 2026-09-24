import { 
    Bot, LayoutDashboard, FileText, MessageSquare, List, 
    Star, Settings, Award, ChevronRight, X
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ isOpen, onClose }) => {
    const location = useLocation();

    return (
        <>
            {/* Mobile backdrop overlay */}
            {isOpen && (
                <div 
                    onClick={onClose}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
                    aria-hidden="true"
                />
            )}

            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 flex-shrink-0 flex flex-col bg-[#13112E]/95 md:bg-[#13112E]/40 
                backdrop-blur-xl md:backdrop-blur-md border-r border-white/10 h-full p-6 transition-transform duration-300 ease-in-out shadow-2xl
                md:static md:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {/* Logo & Mobile Close Button */}
                <div className="flex items-center justify-between mb-8 pl-1">
                    <div className="flex items-center gap-3">
                        <img 
                            src="/logo.png" 
                            alt="DocuMind AI Logo" 
                            className="h-10 w-10 md:h-12 md:w-12 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.3)] object-cover" 
                        />
                        <h1 className="text-xl font-bold tracking-tight text-white">
                            DocuMind <span className="text-yellow-400 font-light">AI</span>
                        </h1>
                    </div>
                    {/* Close button on mobile */}
                    <button 
                        onClick={onClose}
                        className="md:hidden p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10"
                        aria-label="Close Sidebar"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

            {/* Nav Links */}
            <nav className="flex-1 space-y-2.5">
                <Link 
                    to="/dashboard" 
                    onClick={onClose}
                    className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-base font-extrabold tracking-wide transition-all ${
                        location.pathname === '/dashboard' 
                        ? 'bg-gradient-to-r from-indigo-500/80 to-purple-600/80 shadow-[0_0_15px_rgba(99,102,241,0.5)] text-white' 
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`}
                >
                    <LayoutDashboard className="h-5 w-5 stroke-[2.5]" /> Dashboard
                </Link>
                <Link 
                    to="/documents" 
                    onClick={onClose}
                    className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-base font-extrabold tracking-wide transition-all ${
                        location.pathname === '/documents' 
                        ? 'bg-gradient-to-r from-indigo-500/80 to-purple-600/80 shadow-[0_0_15px_rgba(99,102,241,0.5)] text-white' 
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`}
                >
                    <FileText className="h-5 w-5 stroke-[2.5]" /> My Documents
                </Link>
                <Link 
                    to="/chat" 
                    onClick={onClose}
                    className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-base font-extrabold tracking-wide transition-all ${
                        location.pathname === '/chat' 
                        ? 'bg-gradient-to-r from-indigo-500/80 to-purple-600/80 shadow-[0_0_15px_rgba(99,102,241,0.5)] text-white' 
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`}
                >
                    <MessageSquare className="h-5 w-5 stroke-[2.5]" /> AI Chat
                </Link>
                <Link 
                    to="/summaries" 
                    onClick={onClose}
                    className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-base font-extrabold tracking-wide transition-all ${
                        location.pathname === '/summaries' 
                        ? 'bg-gradient-to-r from-indigo-500/80 to-purple-600/80 shadow-[0_0_15px_rgba(99,102,241,0.5)] text-white' 
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`}
                >
                    <List className="h-5 w-5 stroke-[2.5]" /> Summaries
                </Link>

                <Link 
                    to="/favorites" 
                    onClick={onClose}
                    className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-base font-extrabold tracking-wide transition-all ${
                        location.pathname === '/favorites' 
                        ? 'bg-gradient-to-r from-indigo-500/80 to-purple-600/80 shadow-[0_0_15px_rgba(99,102,241,0.5)] text-white' 
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`}
                >
                    <Star className="h-5 w-5 stroke-[2.5]" /> Favorites
                </Link>
                
                <div className="pt-4 mt-4 border-t border-white/10"></div>
                
                <Link 
                    to="/settings" 
                    onClick={onClose}
                    className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-base font-extrabold tracking-wide transition-all ${
                        location.pathname === '/settings' 
                        ? 'bg-gradient-to-r from-indigo-500/80 to-purple-600/80 shadow-[0_0_15px_rgba(99,102,241,0.5)] text-white' 
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`}
                >
                    <Settings className="h-5 w-5 stroke-[2.5]" /> Settings
                </Link>
            </nav>
        </aside>
        </>
    );
};

export default Sidebar;
