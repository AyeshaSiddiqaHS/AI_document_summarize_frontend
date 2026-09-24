import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone, Eye, EyeOff, Loader2, Check, X, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNo: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { register } = useAuth();
    const navigate = useNavigate();

    // Password validation rules
    const passwordChecks = useMemo(() => {
        const pwd = formData.password;
        return {
            minLength: pwd.length >= 8,
            hasLetter: /[a-zA-Z]/.test(pwd),
            hasNumber: /[0-9]/.test(pwd),
            hasSpecial: /[^A-Za-z0-9]/.test(pwd),
            notOnlyNumbers: !/^\d+$/.test(pwd) && pwd.length > 0
        };
    }, [formData.password]);

    // Calculate score (0 to 4)
    const passwordScore = useMemo(() => {
        let score = 0;
        if (passwordChecks.minLength) score += 1;
        if (passwordChecks.hasLetter) score += 1;
        if (passwordChecks.hasNumber) score += 1;
        if (passwordChecks.hasSpecial) score += 1;
        return score;
    }, [passwordChecks]);

    const isPasswordValid = 
        passwordChecks.minLength && 
        passwordChecks.hasLetter && 
        passwordChecks.hasNumber && 
        passwordChecks.notOnlyNumbers;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!formData.password) {
            setError("Password is required");
            return;
        }

        if (/^\d+$/.test(formData.password)) {
            setError("Password cannot contain only numbers. It must include letters and numbers.");
            return;
        }

        if (!isPasswordValid) {
            setError("Password must be at least 8 characters long and contain both letters and numbers.");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        
        setLoading(true);
        try {
            const { confirmPassword, ...registerData } = formData;
            await register(registerData);
            sessionStorage.setItem(`just_registered_${registerData.email}`, 'true');
            navigate('/login', { 
                state: { 
                    message: 'Registration successful! Please log in.',
                    isNewUser: true,
                    registeredEmail: registerData.email
                } 
            });
        } catch (err) {
            const detail = err.response?.data?.detail;
            if (Array.isArray(detail)) {
                setError(detail[0]?.msg || 'Validation failed. Please check the requirements.');
            } else {
                setError(detail || 'Registration failed. Please check your details.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-xl">
                <div>
                    <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-gray-900">
                        Create an account
                    </h2>
                </div>
                
                {error && (
                    <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                    <div className="flex space-x-4">
                        <div className="relative w-1/2">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <User className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                name="firstName"
                                type="text"
                                required
                                value={formData.firstName}
                                onChange={handleChange}
                                className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                                placeholder="First Name"
                            />
                        </div>
                        <div className="relative w-1/2">
                            <input
                                name="lastName"
                                type="text"
                                required
                                value={formData.lastName}
                                onChange={handleChange}
                                className="block w-full rounded-lg border border-gray-300 py-3 px-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                                placeholder="Last Name"
                            />
                        </div>
                    </div>

                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            name="email"
                            type="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                            placeholder="Email address"
                        />
                    </div>
                    
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Phone className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            name="phoneNo"
                            type="tel"
                            required
                            pattern="^\+?[1-9]\d{1,14}$"
                            title="Please enter a valid phone number (10-15 digits)"
                            value={formData.phoneNo}
                            onChange={handleChange}
                            className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                            placeholder="Phone Number (e.g. 1234567890)"
                        />
                    </div>

                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={formData.password}
                            onChange={handleChange}
                            onFocus={() => setPasswordFocused(true)}
                            className={`block w-full rounded-lg border py-3 pl-10 pr-10 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 sm:text-sm ${
                                formData.password && !isPasswordValid 
                                    ? 'border-amber-400 focus:border-amber-500 focus:ring-amber-500' 
                                    : formData.password && isPasswordValid 
                                    ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500'
                                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                            }`}
                            placeholder="Password"
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center pr-3"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? (
                                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                            ) : (
                                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                            )}
                        </button>
                    </div>

                    {/* Inline password helper/notification when typing password */}
                    {formData.password.length > 0 && (
                        <div className="text-xs transition-all duration-200">
                            {/^\d+$/.test(formData.password) ? (
                                <p className="text-amber-600 font-medium flex items-center space-x-1.5 bg-amber-50 px-2.5 py-1.5 rounded-md border border-amber-200/80">
                                    <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
                                    <span>Numbers only are not allowed. Please include letters too.</span>
                                </p>
                            ) : formData.password.length < 8 ? (
                                <p className="text-amber-600 font-medium flex items-center space-x-1.5 bg-amber-50 px-2.5 py-1.5 rounded-md border border-amber-200/80">
                                    <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
                                    <span>Must be at least 8 characters ({formData.password.length}/8).</span>
                                </p>
                            ) : !(/[a-zA-Z]/.test(formData.password)) || !(/[0-9]/.test(formData.password)) ? (
                                <p className="text-amber-600 font-medium flex items-center space-x-1.5 bg-amber-50 px-2.5 py-1.5 rounded-md border border-amber-200/80">
                                    <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
                                    <span>Must include both letters and numbers.</span>
                                </p>
                            ) : (
                                <p className="text-emerald-600 font-medium flex items-center space-x-1.5 bg-emerald-50 px-2.5 py-1.5 rounded-md border border-emerald-200/80">
                                    <Check className="w-3.5 h-3.5 flex-shrink-0 text-emerald-500" />
                                    <span>Strong password! Requirements met.</span>
                                </p>
                            )}
                        </div>
                    )}

                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            name="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="block w-full rounded-lg border border-gray-300 py-3 pl-10 pr-10 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
                            placeholder="Confirm Password"
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 flex items-center pr-3"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            {showConfirmPassword ? (
                                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                            ) : (
                                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                            )}
                        </button>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative flex w-full justify-center rounded-lg bg-blue-600 py-3 px-4 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-70"
                        >
                            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                            Sign up
                        </button>
                    </div>
                </form>
                
                <p className="mt-2 text-center text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
