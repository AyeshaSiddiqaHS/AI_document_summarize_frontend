import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLocation, Link } from 'react-router-dom';
import { 
    User, Mail, Lock, Shield, Moon, Sun, Monitor, 
    Save, Loader2, CheckCircle2, ChevronDown, ChevronRight, Sparkles,
    Edit3, X, Phone, HelpCircle
} from 'lucide-react';
import api from '../services/api';

const SettingsPage = () => {
    const { user, fetchCurrentUser } = useAuth();
    const { theme, setTheme } = useTheme();
    const location = useLocation();

    // Section toggle: null | 'user' | 'appearance' | 'security'
    const [openSection, setOpenSection] = useState(location.state?.section || 'user');

    // Profile editing state
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editFirstName, setEditFirstName] = useState('');
    const [editLastName, setEditLastName] = useState('');
    const [editPhoneNo, setEditPhoneNo] = useState('');
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState('');

    useEffect(() => {
        if (user) {
            setEditFirstName(user.firstName || '');
            setEditLastName(user.lastName || '');
            setEditPhoneNo(user.phoneNo || '');
        }
    }, [user]);

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileError('');
        setProfileSuccess('');

        if (!editFirstName.trim() || !editLastName.trim()) {
            setProfileError('First and last name cannot be empty.');
            return;
        }

        try {
            setProfileLoading(true);
            await api.put('/auth/profile', {
                firstName: editFirstName.trim(),
                lastName: editLastName.trim(),
                phoneNo: editPhoneNo.trim()
            });
            await fetchCurrentUser();
            setProfileSuccess('Profile updated successfully!');
            setIsEditingProfile(false);
            setTimeout(() => setProfileSuccess(''), 4000);
        } catch (err) {
            setProfileError(err.response?.data?.detail || 'Failed to update profile.');
        } finally {
            setProfileLoading(false);
        }
    };

    useEffect(() => {
        if (location.state?.section) {
            setOpenSection(location.state.section);
        }
    }, [location.state]);

    const toggleSection = (sectionName) => {
        setOpenSection(prev => prev === sectionName ? null : sectionName);
    };

    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match.');
            return;
        }

        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters.');
            return;
        }

        try {
            setLoading(true);
            await api.post('/auth/change-password', {
                currentPassword,
                newPassword
            });
            setSuccess('Password updated successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to update password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full text-white w-full max-w-4xl mx-auto overflow-y-auto pr-2 scrollbar-thin">
            <div className="mb-8 shrink-0">
                <h2 className="text-2xl font-bold tracking-tight text-white drop-shadow-md">Settings</h2>
                <p className="text-sm text-gray-300 mt-1 drop-shadow">Manage your account details and preferences.</p>
            </div>

            <div className="flex flex-col gap-8 pb-12">
                
                {/* Option 1: User Details Accordion */}
                <div className="rounded-3xl bg-[#17153B]/50 border border-white/10 backdrop-blur-xl shadow-2xl transition-all overflow-hidden">
                    <button 
                        type="button"
                        onClick={() => toggleSection('user')}
                        className="w-full flex items-center justify-between p-6 md:p-8 hover:bg-white/5 transition-colors text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-400 shadow-inner border border-blue-400/30">
                                <User className="h-6 w-6 stroke-[2.5]" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white drop-shadow">User Details</h3>
                                <p className="text-xs text-gray-300 mt-0.5">View your registered profile and account identity.</p>
                            </div>
                        </div>
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/10 text-gray-300 transition-transform duration-300 ${openSection === 'user' ? 'rotate-180 text-white bg-white/10' : ''}`}>
                            <ChevronDown className="h-4 w-4" />
                        </div>
                    </button>
                    
                    {openSection === 'user' && (
                        <div className="p-6 md:p-8 pt-0 border-t border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
                            {/* Feedback messages */}
                            {profileError && (
                                <div className="mt-6 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                                    {profileError}
                                </div>
                            )}
                            {profileSuccess && (
                                <div className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-400">
                                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                                    {profileSuccess}
                                </div>
                            )}

                            {/* Header row with Edit button */}
                            <div className="flex items-center justify-between mt-6 pb-2 border-b border-white/5">
                                <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Profile Information</h4>
                                {!isEditingProfile ? (
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingProfile(true)}
                                        className="flex items-center gap-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white transition-all shadow-[0_0_10px_rgba(99,102,241,0.4)]"
                                    >
                                        <Edit3 className="h-3.5 w-3.5" /> Edit Profile
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditingProfile(false);
                                            setProfileError('');
                                            if (user) {
                                                setEditFirstName(user.firstName || '');
                                                setEditLastName(user.lastName || '');
                                                setEditPhoneNo(user.phoneNo || '');
                                            }
                                        }}
                                        className="flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-semibold text-gray-300 transition-all"
                                    >
                                        <X className="h-3.5 w-3.5" /> Cancel
                                    </button>
                                )}
                            </div>

                            {isEditingProfile ? (
                                <form onSubmit={handleProfileSubmit} className="mt-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                                    <User className="h-4 w-4 text-gray-400" />
                                                </div>
                                                <input 
                                                    type="text" 
                                                    required
                                                    value={editFirstName} 
                                                    onChange={(e) => setEditFirstName(e.target.value)}
                                                    className="block w-full rounded-xl border border-white/20 bg-white/10 py-3 pl-11 pr-4 text-white font-medium focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 transition-all"
                                                    placeholder="First Name"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                                    <User className="h-4 w-4 text-gray-400" />
                                                </div>
                                                <input 
                                                    type="text" 
                                                    required
                                                    value={editLastName} 
                                                    onChange={(e) => setEditLastName(e.target.value)}
                                                    className="block w-full rounded-xl border border-white/20 bg-white/10 py-3 pl-11 pr-4 text-white font-medium focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 transition-all"
                                                    placeholder="Last Name"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                                    <Phone className="h-4 w-4 text-gray-400" />
                                                </div>
                                                <input 
                                                    type="text" 
                                                    value={editPhoneNo} 
                                                    onChange={(e) => setEditPhoneNo(e.target.value)}
                                                    className="block w-full rounded-xl border border-white/20 bg-white/10 py-3 pl-11 pr-4 text-white font-medium focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 transition-all"
                                                    placeholder="Phone Number"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-400 mb-2">Email Address (Read-only)</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                                    <Mail className="h-4 w-4 text-gray-500" />
                                                </div>
                                                <input 
                                                    type="email" 
                                                    disabled 
                                                    value={user?.email || ''} 
                                                    className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-gray-400 cursor-not-allowed"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 pt-2">
                                        <button 
                                            type="submit"
                                            disabled={profileLoading}
                                            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] hover:opacity-90 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
                                        >
                                            {profileLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                            Save Changes
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setIsEditingProfile(false)}
                                            className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/10 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">First Name</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                                <User className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <input 
                                                type="text" 
                                                disabled 
                                                value={user?.firstName || ''} 
                                                className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-gray-200 font-semibold cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Last Name</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                                <User className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <input 
                                                type="text" 
                                                disabled 
                                                value={user?.lastName || ''} 
                                                className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-gray-200 font-semibold cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                                <Phone className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <input 
                                                type="text" 
                                                disabled 
                                                value={user?.phoneNo || 'Not provided'} 
                                                className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-gray-200 font-semibold cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                                <Mail className="h-4 w-4 text-gray-400" />
                                            </div>
                                            <input 
                                                type="email" 
                                                disabled 
                                                value={user?.email || ''} 
                                                className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-gray-200 font-semibold cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <p className="text-xs text-gray-400">Click "Edit Profile" above to update your first name, last name, or phone number.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Option 2: Appearance Accordion */}
                <div className="rounded-3xl bg-[#17153B]/50 border border-white/10 backdrop-blur-xl shadow-2xl transition-all overflow-hidden">
                    <button 
                        type="button"
                        onClick={() => toggleSection('appearance')}
                        className="w-full flex items-center justify-between p-6 md:p-8 hover:bg-white/5 transition-colors text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 shadow-inner border border-amber-400/30">
                                <Monitor className="h-6 w-6 stroke-[2.5]" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white drop-shadow">Appearance</h3>
                                <p className="text-xs text-gray-300 mt-0.5">Customize theme mode (Dark and Light glassmorphism).</p>
                            </div>
                        </div>
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/10 text-gray-300 transition-transform duration-300 ${openSection === 'appearance' ? 'rotate-180 text-white bg-white/10' : ''}`}>
                            <ChevronDown className="h-4 w-4" />
                        </div>
                    </button>

                    {openSection === 'appearance' && (
                        <div className="p-6 md:p-8 pt-0 border-t border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                <button 
                                    onClick={() => setTheme('dark')}
                                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                                        theme === 'dark' 
                                        ? 'border-indigo-500 bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.3)]' 
                                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                                    }`}
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0B0A1A] border border-white/20 shadow-inner text-white">
                                        <Moon className="h-6 w-6" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-white">Dark Theme</p>
                                        <p className="text-xs text-gray-300 mt-1">Perfect for low-light environments.</p>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => setTheme('light')}
                                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                                        theme === 'light' 
                                        ? 'border-indigo-500 bg-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.3)]' 
                                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                                    }`}
                                >
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white border border-gray-200 shadow-inner text-gray-900">
                                        <Sun className="h-6 w-6" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-white">Light Theme</p>
                                        <p className="text-xs text-gray-300 mt-1">Crisp, clean and bold for bright rooms.</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Option 3: Security & Password Accordion */}
                <div className="rounded-3xl bg-[#17153B]/50 border border-white/10 backdrop-blur-xl shadow-2xl transition-all overflow-hidden">
                    <button 
                        type="button"
                        onClick={() => toggleSection('security')}
                        className="w-full flex items-center justify-between p-6 md:p-8 hover:bg-white/5 transition-colors text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 shadow-inner border border-purple-400/30">
                                <Shield className="h-6 w-6 stroke-[2.5]" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white drop-shadow">Security & Password</h3>
                                <p className="text-xs text-gray-300 mt-0.5">Change your account password and review protection.</p>
                            </div>
                        </div>
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/10 text-gray-300 transition-transform duration-300 ${openSection === 'security' ? 'rotate-180 text-white bg-white/10' : ''}`}>
                            <ChevronDown className="h-4 w-4" />
                        </div>
                    </button>

                    {openSection === 'security' && (
                        <div className="p-6 md:p-8 pt-0 border-t border-white/10 animate-in fade-in slide-in-from-top-2 duration-200">
                            <form onSubmit={handlePasswordChange} className="space-y-5 max-w-lg mt-6">
                                {error && (
                                    <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                                        {error}
                                    </div>
                                )}
                                {success && (
                                    <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-400">
                                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                                        {success}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                            <Lock className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input 
                                            type="password" 
                                            required
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400 transition-all hover:bg-white/10"
                                            placeholder="Enter current password"
                                        />
                                    </div>
                                    <div className="flex justify-end mt-1.5">
                                        <Link 
                                            to="/forgot-password" 
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-purple-300 hover:text-purple-200 transition-colors"
                                        >
                                            <HelpCircle className="h-3.5 w-3.5" /> Forgot your password?
                                        </Link>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                            <Lock className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input 
                                            type="password" 
                                            required
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400 transition-all hover:bg-white/10"
                                            placeholder="Enter new password"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                            <Lock className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input 
                                            type="password" 
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400 transition-all hover:bg-white/10"
                                            placeholder="Confirm new password"
                                        />
                                    </div>
                                </div>
                                
                                <div className="pt-2">
                                    <button 
                                        type="submit"
                                        disabled={loading}
                                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:opacity-90 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
                                    >
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        Update Password
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default SettingsPage;
