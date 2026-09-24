import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, Bot, ArrowRight, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// IMPORTANT: Ensure this filename exactly matches what is in your assets folder
import bgImage from '../assets/login-bg.png';

const LoginPage = () => {
    const location = useLocation();
    const isNewUserFromRegister = location.state?.isNewUser || false;
    const initialEmail = location.state?.registeredEmail || '';

    const [email, setEmail] = useState(initialEmail);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            await login(email, password);
            navigate('/dashboard', { state: { isFirstVisit: isNewUserFromRegister } }); 
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to login. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full font-sans overflow-x-hidden">
            {/* Fixed Sticky Background */}
            <div 
                className="fixed inset-0 w-full h-full -z-10"
                style={{ 
                    backgroundImage: `url(${bgImage})`, 
                    backgroundSize: 'cover', 
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundAttachment: 'fixed'
                }}
            >
                {/* Subtle dark overlay */}
                <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"></div>
            </div>

            {/* Scrollable Login Container */}
            <div className="relative z-10 flex min-h-screen w-full items-center justify-center px-4 py-12 sm:px-6 lg:px-8">

            {/* Glassmorphism Card */}
            <div className="relative z-10 w-full max-w-[480px] rounded-[2rem] bg-white/10 p-10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-xl border border-white/20 text-white">
                
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-8 text-center">
                    <img 
                        src="/logo.png" 
                        alt="DocuMind AI Logo" 
                        className="h-20 w-20 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.3)] object-cover mb-4" 
                    />
                    <h1 className="text-3xl font-bold tracking-tight mb-2">
                        DocuMind <span className="text-indigo-400">AI</span>
                    </h1>
                    <p className="text-sm text-gray-300 font-light">
                        Your Documents. Smarter Insights.
                    </p>
                </div>

                
                {error && (
                    <div className="mb-6 rounded-xl bg-red-500/20 border border-red-500/50 p-4 text-sm text-red-200 text-center backdrop-blur-md">
                        {error}
                    </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>
                    {/* Email Input */}
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                            <Mail className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
                        </div>
                        <input
                            id="email-address"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="block w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 pl-12 pr-4 text-white placeholder-gray-400 focus:border-indigo-400 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-400 sm:text-sm transition-all"
                            placeholder="Email Address"
                        />
                    </div>

                    {/* Password Input */}
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                            <Lock className="h-5 w-5 text-gray-400" strokeWidth={1.5} />
                        </div>
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full rounded-2xl border border-white/10 bg-white/5 py-3.5 pl-12 pr-12 text-white placeholder-gray-400 focus:border-indigo-400 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-400 sm:text-sm transition-all"
                            placeholder="Password"
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center pr-4"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? (
                                <EyeOff className="h-5 w-5 text-gray-400 hover:text-white transition-colors" strokeWidth={1.5} />
                            ) : (
                                <Eye className="h-5 w-5 text-gray-400 hover:text-white transition-colors" strokeWidth={1.5} />
                            )}
                        </button>
                    </div>

                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 bg-white/10 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0 border-white/20"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                                Remember me
                            </label>
                        </div>
                        <div className="text-sm">
                            <Link to="/forgot-password" className="font-medium text-indigo-300 hover:text-indigo-200 transition-colors">
                                Forgot Password?
                            </Link>
                        </div>
                    </div>

                    {/* Sign In Button */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative flex w-full justify-center items-center rounded-full bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 py-3.5 px-4 text-sm font-semibold text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-70 transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                        >
                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                            Sign In
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-indigo-600 transition-transform group-hover:translate-x-1">
                                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                            </div>
                        </button>
                    </div>
                </form>
                
                {/* OR Divider */}
                <div className="my-6 flex items-center">
                    <div className="flex-1 border-t border-white/20"></div>
                    <div className="px-4 text-xs uppercase tracking-wider text-gray-400">OR</div>
                    <div className="flex-1 border-t border-white/20"></div>
                </div>

                {/* Create Account Button */}
                <div>
                    <Link 
                        to="/register"
                        className="flex w-full items-center justify-center gap-2 rounded-full border border-white/30 bg-transparent py-3.5 text-sm font-medium text-white hover:bg-white/10 transition-colors"
                    >
                        <UserPlus className="h-4 w-4" strokeWidth={2} />
                        Create New Account
                    </Link>
                </div>

                {/* Terms and Privacy */}
                <p className="mt-8 text-center text-xs text-gray-400">
                    By signing in, you agree to our{' '}
                    <a href="#" className="text-indigo-300 hover:text-indigo-200 transition-colors">Terms of Use</a>
                    {' '}and{' '}
                    <a href="#" className="text-indigo-300 hover:text-indigo-200 transition-colors">Privacy Policy</a>.
                </p>
            </div>
            </div>
        </div>
    );
};

export default LoginPage;
