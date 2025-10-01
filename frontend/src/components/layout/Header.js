import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ThemeSwitcher from '../common/ThemeSwitcher';
import { motion, AnimatePresence } from 'framer-motion';
import { 
	BarChart, 
	FileText, 
	Settings, 
	Users,  
	Layout,
	Download,
	Sparkles,
	Zap,
	Menu,
	X,
	ArrowRight
} from 'lucide-react';
import './Header.css';

const Header = () => {
	const { user, logout } = useAuth();
	const { isDarkMode } = useTheme();
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const location = useLocation();
	const dropdownRef = useRef(null);
	const headerRef = useRef(null);

	// Quantum state management
	useEffect(() => {
		setIsDropdownOpen(false);
		setIsMobileMenuOpen(false);
	}, [location]);

	// Add click outside listener
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setIsDropdownOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, []);

	const navigation = {
		admin: [
			{ name: 'Dashboard', path: '/admin/dashboard', icon: Layout },
			{ name: 'Users', path: '/admin/users', icon: Users },
			{ name: 'Analytics', path: '/admin/analytics', icon: BarChart },
			{ name: 'Payments', path: '/admin/payments', icon: FileText },
		],
		vendor: [
			{ name: 'Dashboard', path: '/vendor/dashboard', icon: Layout },
			{ name: 'My Tests', path: '/vendor/tests', icon: FileText },
			{ name: 'Analytics', path: '/vendor/analytics/tests', icon: BarChart },
			{ name: 'Candidates', path: '/vendor/candidates', icon: Users },
		],
		candidate: [
			{ name: 'Dashboard', path: '/dashboard/user', icon: Layout },
		]
	};

	const getNavigationByRole = (userRole) => {
		switch(userRole) {
			case 'admin':
				return navigation.admin;
			case 'vendor':
				return navigation.vendor;
			case 'user':
				return navigation.candidate;
			default:
				return navigation.candidate;
		}
	};

	const isActive = (path) => location.pathname === path;

	return (
		<motion.header 
			ref={headerRef}
			className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
			style={{
				background: isDarkMode ? '#000000' : '#ffffff',
				borderBottom: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)'
			}}
			initial={{ y: -100 }}
			animate={{ y: 0 }}
			transition={{ duration: 0.8, ease: "easeOut" }}
		>
			<nav className="container mx-auto px-4">
				<div className="flex justify-between items-center h-20">
					{/* Logo Portal */}
					<Link to="/" className="flex items-center space-x-4 group">
						<motion.div
							className="relative"
							whileHover={{ scale: 1.05 }}
							transition={{ duration: 0.2 }}
						>
							<img 
								src="https://res.cloudinary.com/dfdtxogcl/images/c_scale,w_248,h_180,dpr_1.25/f_auto,q_auto/v1706606519/Picture1_215dc6b/Picture1_215dc6b.png"
								alt="Eval8 Logo"
								className="w-16 h-12 object-contain"
							/>
						</motion.div>
            
						<motion.span 
							className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
							style={{
								textShadow: isDarkMode ? '0 0 10px rgba(23, 162, 184, 0.5)' : 'none'
							}}
						>
						 AI<span className="text-teal-400">_hiring</span>
						</motion.span>
					</Link>

					{/* No navigation items - keep same layout as when not logged in */}

					{/* Cosmic Actions */}
					<div className="hidden lg:flex items-center space-x-6">
						{/* 9 Dots Grid Button */}
						<button
							className="rounded-lg transition-all duration-200 hover:bg-gray-700/20"
							style={{ 
								width: '36px', 
								height: '36px', 
								background: isDarkMode ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)',
								border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.2)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center'
							}}
							aria-label="Apps"
						>
							<div 
								style={{ 
									display: 'grid', 
									gridTemplateColumns: 'repeat(3, 1fr)', 
									gap: '2px',
									width: '16px',
									height: '16px'
								}}
							>
								{[...Array(9)].map((_, i) => (
									<div
										key={i}
										style={{
											width: '3px',
											height: '3px',
											borderRadius: '50%',
											backgroundColor: isDarkMode ? '#ffffff' : '#000000'
										}}
									/>
								))}
							</div>
						</button>

						{/* Portal Button - Only show when logged in */}
						{user && (
							<Link
								to="/dashboard"
								className={`relative h-10 flex items-center gap-2 px-3 rounded-xl backdrop-blur-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
								style={{
									background: isDarkMode ? 'rgba(30,64,175,0.15)' : 'rgba(30,64,175,0.1)',
									backdropFilter: 'blur(10px)',
									border: isDarkMode ? '1px solid rgba(59,130,246,0.3)' : '1px solid rgba(59,130,246,0.2)',
									boxShadow: isDarkMode ? '0 4px 12px rgba(30,58,138,0.2)' : '0 4px 12px rgba(30,58,138,0.1)',
									minWidth: '70px'
								}}
							>
							<span className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-600">
								<Sparkles className="w-4 h-4" />
							</span>
								<span className="font-semibold">Portal</span>
								{/* Red notification dot */}
								<div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
							</Link>
						)}

						{/* Theme Switcher */}
						<ThemeSwitcher />
						{/* Cosmic Download Portal */}
						<motion.a 
							href="https://github.com/HysterChat/eval8/releases/download/e5/Eval8.Setup.1.0.2.exe"
							target="_blank"
							rel="noopener noreferrer"
							className="group relative h-10 px-4 rounded-xl overflow-hidden flex items-center justify-center"
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							style={{
								background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
								boxShadow: isDarkMode ? '0 8px 24px rgba(3, 105, 161, 0.35)' : '0 8px 24px rgba(3, 105, 161, 0.2)',
								minWidth: '70px'
							}}
						>
							<motion.div
								className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
								style={{ background: 'linear-gradient(135deg, rgba(255,255,255,.12), rgba(255,255,255,.06))' }}
								whileHover={{ scale: 1.02 }}
							/>
							<span className="relative z-10 flex items-center gap-2 font-semibold text-white">
								<motion.div
									animate={{ y: [0, -2, 0] }}
									transition={{ duration: 2, repeat: 1000, repeatType: 'loop' }}
								>
									<Download className="w-4 h-4 text-white" />
								</motion.div>
								<span>Download</span>
							</span>
						</motion.a>

						{/* User Profile Button */}
						{user ? (
							<div className="relative" ref={dropdownRef}>
								<button
									onClick={() => setIsDropdownOpen(!isDropdownOpen)}
									className={`h-10 flex items-center gap-2 px-3 rounded-xl focus:outline-none ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
									style={{ 
										background: isDarkMode ? 'rgba(31, 41, 55, .9)' : 'rgba(255, 255, 255, .9)', 
										boxShadow: isDarkMode ? 'inset 0 0 0 1px rgba(255,255,255,.06)' : 'inset 0 0 0 1px rgba(0,0,0,.06)',
										minWidth: '100px'
									}}
									aria-haspopup="true"
									aria-expanded={isDropdownOpen}
								>
									<span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 font-bold">
										{user.name ? user.name.charAt(0).toUpperCase() : 'U'}
									</span>
									<span className="font-semibold max-w-[140px] truncate">{user.name || 'User'}</span>
									<ArrowRight className="w-4 h-4 opacity-80" />
								</button>

								<AnimatePresence>
									{isDropdownOpen && (
										<motion.div 
											className="absolute right-0 mt-3 w-60 rounded-2xl backdrop-blur-3xl bg-black/80 border border-white/20 shadow-2xl overflow-hidden z-50"
											initial={{ opacity: 0, y: -8, scale: 0.98 }}
											animate={{ opacity: 1, y: 0, scale: 1 }}
											exit={{ opacity: 0, y: -8, scale: 0.98 }}
											transition={{ duration: 0.15 }}
										>
											<div className="p-4 border-b border-white/10">
												<div className="flex items-center gap-3">
													<div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white">
														{user.name ? user.name.charAt(0).toUpperCase() : 'U'}
													</div>
													<div className="min-w-0">
														<div className="text-white font-semibold truncate">{user.name || 'User'}</div>
														<div className="text-xs text-gray-300 truncate">{user.email || ''}</div>
													</div>
												</div>
											</div>
											<div className="py-1">
												<Link
													to="/profile"
													className="flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/10"
													onClick={() => setIsDropdownOpen(false)}
												>
													<Settings className="w-5 h-5 text-teal-400" />
													<span>Profile</span>
												</Link>
												<button
													onClick={() => { setIsDropdownOpen(false); logout(); }}
													className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10"
												>
													<Zap className="w-5 h-5" />
													<span>Logout</span>
												</button>
											</div>
										</motion.div>
									)}
								</AnimatePresence>
							</div>
						) : (
							<Link to="/login">
								<motion.button 
									className="h-10 px-4 rounded-xl text-white font-semibold flex items-center justify-center"
									style={{
										background: 'linear-gradient(135deg, #ec4899 0%, #9333ea 100%)',
										boxShadow: isDarkMode ? '0 4px 12px rgba(236, 72, 153, 0.3)' : '0 4px 12px rgba(236, 72, 153, 0.2)',
										minWidth: '70px'
									}}
									whileHover={{ scale: 1.05 }}
									whileTap={{ scale: 0.95 }}
								>
									<span>Login</span>
								</motion.button>
							</Link>
						)}
          </div>

					{/* Quantum Mobile Toggle */}
					<motion.button 
						className={`lg:hidden p-3 rounded-2xl backdrop-blur-xl border-2 ${isDarkMode ? 'border-purple-400 text-white hover:bg-purple-400/20' : 'border-purple-600 text-gray-900 hover:bg-purple-600/20'}`}
						style={{
							background: isDarkMode ? 'rgba(111, 66, 193, 0.2)' : 'rgba(111, 66, 193, 0.1)',
							boxShadow: isDarkMode ? '0 4px 20px rgba(111, 66, 193, 0.2)' : '0 4px 20px rgba(111, 66, 193, 0.1)'
						}}
						onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						aria-label="Toggle menu"
						aria-expanded={isMobileMenuOpen}
						aria-controls="mobile-menu"
					>
						<motion.div
							animate={{ rotate: isMobileMenuOpen ? 180 : 0 }}
							transition={{ duration: 0.3 }}
						>
							{isMobileMenuOpen ? (
								<X className="w-6 h-6" />
							) : (
								<Menu className="w-6 h-6" />
							)}
						</motion.div>
					</motion.button>
        </div>

				{/* Quantum Mobile Portal */}
				<AnimatePresence>
					{isMobileMenuOpen && (
						<motion.div 
							id="mobile-menu" 
							className="lg:hidden fixed inset-0 top-20 backdrop-blur-3xl bg-black/90 z-40 overflow-y-auto"
							initial={{ opacity: 0, x: '100%' }}
							animate={{ opacity: 1, x: 0 }}
							exit={{ opacity: 0, x: '100%' }}
							transition={{ duration: 0.4, ease: "easeOut" }}
						>
						<div className="p-6 flex flex-col gap-6">
							{/* Theme Switcher Mobile */}
							<motion.div
								className="flex justify-center"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.05 }}
							>
								<ThemeSwitcher />
							</motion.div>

							{/* Quantum Download Mobile */}
							<motion.a 
								href="https://github.com/HysterChat/eval8/releases/download/e2/Eval8.Setup.1.0.1.exe"
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center justify-center space-x-3 w-full py-4 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 text-white font-bold"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.1 }}
								whileTap={{ scale: 0.95 }}
							>
								<Download className="w-5 h-5" />
								<span>Download Reality</span>
							</motion.a>

							{user && (
								<>
									<motion.div 
										className="flex items-center space-x-4 mb-8 p-6 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20"
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: 0.2 }}
									>
										<div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
											<span className="text-xl font-black text-white">
												{user.name ? user.name.charAt(0).toUpperCase() : '?'}
											</span>
										</div>
										<div className="min-w-0">
											<p className="font-bold text-white truncate">
												{user.name || 'Admin'}
											</p>
											<p className="text-sm text-gray-400 truncate">{user.email || ''}</p>
											{user.role === 'admin' && (
												<span className="inline-block mt-1 px-2 py-1 text-xs font-bold bg-purple-500/20 text-purple-300 rounded-full">
													System Admin
												</span>
											)}
										</div>
									</motion.div>
									{getNavigationByRole(user.role).map((item, index) => (
										<motion.div
											key={item.name}
											initial={{ opacity: 0, x: 20 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ delay: 0.3 + index * 0.1 }}
										>
											<Link
												to={item.path}
												className={`flex items-center space-x-4 px-6 py-4 rounded-2xl transition-all duration-300 ${
													isActive(item.path)
														? 'text-white bg-gradient-to-r from-purple-500 to-pink-500'
														: 'text-gray-300 hover:text-white hover:bg-white/10'
												}`}
												onClick={() => setIsMobileMenuOpen(false)}
											>
												<item.icon className="w-6 h-6" />
												<span className="font-bold">{item.name}</span>
												<ArrowRight className="w-4 h-4 ml-auto opacity-50" />
											</Link>
										</motion.div>
									))}
									<div className="border-t border-white/20 mt-8 pt-8 space-y-4">
										<motion.div
											initial={{ opacity: 0, x: 20 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ delay: 0.6 }}
										>
											<Link 
												to={user.role === 'admin' ? "/admin/dashboard" : "/profile"}
												className="flex items-center space-x-4 px-6 py-4 text-white hover:bg-white/10 rounded-2xl transition-all duration-300"
												onClick={() => setIsMobileMenuOpen(false)}
											>
												<Settings className="w-6 h-6 text-purple-400" />
												<span className="font-bold">{user.role === 'admin' ? 'Control Center' : 'Settings'}</span>
												<ArrowRight className="w-4 h-4 ml-auto opacity-50" />
											</Link>
										</motion.div>
										
										<motion.div
											initial={{ opacity: 0, x: 20 }}
											animate={{ opacity: 1, x: 0 }}
											transition={{ delay: 0.7 }}
										>
											<button 
												onClick={() => { setIsMobileMenuOpen(false); logout(); }}
												className="flex items-center space-x-4 w-full px-6 py-4 text-red-400 hover:bg-red-500/10 rounded-2xl transition-all duration-300"
											>
												<Zap className="w-6 h-6" />
												<span className="font-bold">Disconnect</span>
												<ArrowRight className="w-4 h-4 ml-auto opacity-50" />
											</button>
										</motion.div>
									</div>
                </>
              )}
							{!user && (
								<motion.div 
									className="space-y-6"
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: 0.3 }}
								>
									<Link 
										to="/login" 
										className="flex items-center justify-center space-x-3 w-full py-4 text-white rounded-2xl font-bold overflow-hidden"
										style={{
											background: 'linear-gradient(135deg, #9333ea 0%, #ec4899 50%, #3b82f6 100%)',
										}}
										onClick={() => setIsMobileMenuOpen(false)}
									>
										<span>Enter Reality</span>
										<ArrowRight className="w-5 h-5" />
									</Link>
								</motion.div>
							)}
						</div>
					</motion.div>
					)}
				</AnimatePresence>
			</nav>
		</motion.header>
	);
};

export default Header;
