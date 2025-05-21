import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { assets } from '../assets/assets.js';
import NotificationBell from './NotificationBell';

const Navbar = () => {
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);
    const [token, setToken] = useState(() => !!localStorage.getItem('token'));

    const handleLogout = () => {
        localStorage.removeItem('token');
        setToken(false);
        navigate('/');
    };

    return (
        <div className="mx-4 sm:mx-[10%]">
            <div className='flex items-center justify-between text-sm py-4 mb-5 border-b border-gray-400'>
                <img 
                    onClick={() => navigate('/')} 
                    src={assets.logo} 
                    alt='logo' 
                    className='w-30 md:w-40 h-auto transition-transform duration-300 hover:scale-105 cursor-pointer'
                />
                
                {/* Navigation Links */}
                <ul className='hidden md:flex items-start gap-5 font medium'>
                    <NavLink to={'/home'}>
                        <li className='py-1'>Home</li>
                        <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
                    </NavLink>
                    <NavLink to={'/doctors'}>
                        <li className='py-1'>Doctors</li>
                        <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
                    </NavLink>
                    <NavLink to={'/appointments'}>
                        <li className='py-1'>My Appointments</li>
                        <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
                    </NavLink>
                    <NavLink to={'/my-records'}>
                        <li className='py-1'>My Records</li>
                        <hr className='border-none outline-none h-0.5 bg-primary w-3/5 m-auto hidden' />
                    </NavLink>
                </ul>

                <div className="flex items-center gap-4">
                    {token && (
                        <>
                            <NotificationBell />
                            
                            <div className='cursor-pointer hover:opacity-80 transition-opacity' onClick={() => navigate('/chat')}>
                                <img className='w-4 h-4' src={assets.messageIcon} alt="Messages" />
                            </div>
                            
                            <div className='flex items-center gap-2 cursor-pointer group relative' onClick={() => setShowMenu(!showMenu)}>
                                <img className='w-5 rounded-full' src={assets.user} alt="user" />
                                <img className='w-7' src={assets.dropdown} alt="dropdown" />
                                <div className='absolute top-0 right-0 pt-14 text-base font-medium text-gray-600 hidden group-hover:block w-auto z-50'>
                                    <div className='min-w-48 bg-stone-100 rounded flex flex-col gap-4 p-4 shadow-lg'>
                                        <p onClick={() => navigate('my-profile')} className='hover:text-black cursor-pointer'>My Profile</p>
                                        <p onClick={handleLogout} className='hover:text-black cursor-pointer'>Logout</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                    
                    {!token && (
                        <button onClick={() => navigate('/patient-login')} className='bg-primary text-white px-8 py-3 rounded-full font-light hidden md:block'>
                            Create account
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Navbar;