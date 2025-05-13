import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './ClubDirectory.css';
import logo from '../../assets/logo.png';
import calendar from '../../assets/calendar.png';
import twitter from '../../assets/twitter.png';
import facebook from '../../assets/facebook.png';
import instagram from '../../assets/instagram.png';
import youtube from '../../assets/youtube.png';
import linkedin from '../../assets/linkedin.png';
import ColorThief from 'colorthief';
import chroma from 'chroma-js';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { decodeHTMLEntities } from '../../utils';

const createGradientFromPalette = (palette, stops = 4) => {
    const colors = palette.map(c => `rgb(${c.join(',')})`);
    const scale = chroma.scale(colors).mode('lab').colors(stops);
    return `linear-gradient(to right, ${scale.join(', ')})`;
};

const ClubDirectory = () => {
    const navigate = useNavigate();
    const location = useLocation();

    

    const [currentUserName, setCurrentUserName] = useState('');
    const [currentUserProfilePic, setCurrentUserProfilePic] = useState('');
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const isGuest = localStorage.getItem('isGuest') === 'true';

    const pinnedClubs = clubs.slice(0, 3);
    const [featuredIndex, setFeaturedIndex] = useState(0);
    const intervalRef = useRef(null);
    
    useEffect(() => {
        if (pinnedClubs.length === 0) return;
        intervalRef.current = setInterval(() => {
            setFeaturedIndex(i => (i + 1) % pinnedClubs.length);
        }, 5000);
        return () => clearInterval(intervalRef.current);
    }, [pinnedClubs.length]);

    const pauseAutoplay = () => clearInterval(intervalRef.current);
    const resumeAutoplay = () => {
        clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            setFeaturedIndex(i => (i + 1) % pinnedClubs.length);
        }, 5000);
    };

    useEffect(() => {
        const currentUserData = JSON.parse(localStorage.getItem('profile') || '{}');
        const profilePicUrl = currentUserData.profile_picture || '';

        setCurrentUserName(currentUserData.full_name || currentUserData.name || '');
        setCurrentUserProfilePic(
            profilePicUrl.startsWith('http') ? profilePicUrl :
            profilePicUrl ? `http://54.169.81.75:8000${profilePicUrl}` : ''
        );

        const fetchClubs = async () => {
            setLoading(true);
            const isGuest = localStorage.getItem('isGuest') === 'true';
            const token = localStorage.getItem('access_token');

            const headers = { 'Content-Type': 'application/json' };
            if (!isGuest && token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            try {
                const res = await fetch('http://54.169.81.75:8000/clubs/clubs/', { headers });

                if (res.status === 401 && !isGuest) {
                    throw new Error('Unauthorized');
                }

                const data = await res.json();

                const enriched = await Promise.all(data.map(async club => {
                    try {
                        const imgRes = await fetch(`http://54.169.81.75:8000${club.banner}`);
                        const blob = await imgRes.blob();
                        const url = URL.createObjectURL(blob);
                        const img = new Image();
                        img.src = url;

                        await new Promise((resolve, reject) => {
                            img.onload = () => resolve(true);
                            img.onerror = reject;
                        });

                        const palette = new ColorThief().getPalette(img, 3);
                        URL.revokeObjectURL(url);
                        const [r, g, b] = palette[0];

                        return {
                            ...club,
                            hoverBackground: createGradientFromPalette(palette, 4),
                            hoverColor: `rgb(${r}, ${g}, ${b})`,
                        };
                    } catch {
                        return {
                            ...club,
                            hoverBackground: 'linear-gradient(to right, #ccc, #eee)',
                            hoverColor: 'rgba(200,200,200,0.5)',
                        };
                    }
                }));

                setClubs(enriched);
            } catch (e) {
                console.error(e);
                if (e.message === 'Unauthorized') {
                    localStorage.removeItem('access_token');
                    navigate('/login');
                    setError('Unauthorized: please log in again.');
                } else {
                    setError(isGuest ? 'Failed to load public club list.' : 'Failed to fetch clubs.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchClubs();
    }, [navigate]);


    const handleNav = path => () => navigate(path);

    const getInitials = (name = '') => {
        const parts = name.trim().split(/\s+/).filter(Boolean);
        return parts.map(part => part.charAt(0).toUpperCase()).join('');
    };

    const featuredClub = clubs[0];
    const current = pinnedClubs[featuredIndex] || { hoverColor: '' };

    if (loading) {
        return (
            <div className="my-activity-page">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <div>Loading clubs...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="club-directory-page">
            <div className="navbar">
                <img src={logo} alt="Logo" className="curtin-logo" onClick={handleNav('/club-directory')} />
                <div className="navbar-text">
                    <div
                        className="clubs-navbar"
                        onClick={handleNav('/club-directory')}
                        style={{ color: location.pathname === '/club-directory' ? '#000' : '#999' }}
                    >
                        Clubs
                    </div>
                    <div
                        className="events-navbar"
                        onClick={handleNav('/event-directory')}
                        style={{ color: location.pathname === '/event-directory' ? '#000' : '#999' }}
                    >
                        Events
                    </div>
                    {!isGuest && (
                        <div
                            className="activity-navbar"
                            onClick={handleNav('/my-activity')}
                            style={{ color: location.pathname === '/my-activity' ? '#000' : '#999' }}
                        >
                            My Activity
                        </div>
                    )}
                </div>
                <div className="navbar-right">
                    {isGuest ? (
                        <div
                            onClick={handleNav('/login')}
                            style={{
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                color: '#000',
                                fontFamily: 'Effra, sans-serif'
                            }}
                        >
                            LOGIN
                        </div>
                    ) : (
                        <div
                            className="profile-icon"
                            onClick={handleNav('/profile')}
                            style={{
                                backgroundImage: currentUserProfilePic ? `url(${currentUserProfilePic})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                cursor: 'pointer',
                            }}
                        >
                            {!currentUserProfilePic && getInitials(decodeHTMLEntities(currentUserName))}
                        </div>
                    )}
                    {!isGuest && (
                        <img
                            src={calendar}
                            alt="Calendar"
                            className="calendar-icon"
                            onClick={handleNav('/calendar')}
                            style={{ cursor: 'pointer' }}
                        />
                    )}
                </div>
            </div>

            {loading
                ? <div className="loading-text fade visible">Loading...</div>
                : null
            }
            <div
                className={`club-body fade ${!loading ? 'visible' : ''}`}
                style={{
                    backgroundImage: current.hoverColor
                        ? `linear-gradient(to bottom, ${current.hoverColor} 0%, rgba(250,250,250,0) 50%)`
                        : undefined,
                    }}
            >
                {!loading && pinnedClubs.length > 0 && (
                    <div 
                        className="featured-club"
                        onMouseEnter={pauseAutoplay}
                        onMouseLeave={resumeAutoplay}
                    >
                        <button
                            className="arrow left-arrow"
                            onClick={() => setFeaturedIndex((featuredIndex - 1 + pinnedClubs.length) % pinnedClubs.length)}
                        >
                            <ChevronLeft />
                        </button>
                        <motion.div
                            className="featured-club-box"
                            key={pinnedClubs[featuredIndex].id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            whileHover={{ scale: 1.03 }}
                            style={{
                                '--hover-bg': pinnedClubs[featuredIndex].hoverBackground,
                                '--hover-shadow': pinnedClubs[featuredIndex].hoverColor,
                                cursor: 'pointer',
                            }}
                            onClick={() => navigate(`/club/${pinnedClubs[featuredIndex].id}`)}
                        >
                            {pinnedClubs[featuredIndex].banner && (
                                <img
                                    src={`http://54.169.81.75:8000${pinnedClubs[featuredIndex].banner}`}
                                    alt={pinnedClubs[featuredIndex].name}
                                    className="featured-club-image"
                                />
                            )}
                            <div className="featured-club-name">{decodeHTMLEntities(pinnedClubs[featuredIndex].name)}</div>
                        </motion.div>
                        <button
                            className="arrow right-arrow"
                            onClick={() => setFeaturedIndex((featuredIndex + 1) % pinnedClubs.length)}
                        >
                            <ChevronRight />
                        </button>
                    </div>
                )}
                {loading && <div className="loading-text fade visible">Loading...</div>}
                {error && <div className="error-text">{error}</div>}

                <div className="club-explore">
                    <div className="club-explore-title">Explore</div>
                    {error && <div className="error-text" style={{ marginBottom: '1rem' }}>{error}</div>}
                    <div className="clubs-grid">
                        {clubs.length > 0 && clubs.map(club => (
                            <motion.div
                                key={club.id}
                                className="explore-club-box"
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                whileHover={{ scale: 1.05 }}
                                viewport={{ once: true, amount: 0.2 }}
                                style={{ cursor: 'pointer', '--hover-bg': club.hoverBackground, '--hover-shadow': club.hoverColor }}
                                onClick={() => navigate(`/club/${club.id}`)}
                            >
                                <div className="club-card">
                                    {club.banner ? (
                                        <img
                                            src={`http://54.169.81.75:8000${club.banner}`}
                                            alt={club.name}
                                            className="club-card-banner"
                                        />
                                    ) : (
                                        <div className="club-card-banner">No Banner Available</div>
                                    )}
                                    <div className="club-card-name">{decodeHTMLEntities(club.name)}</div>
                                    <div className="club-card-description">{decodeHTMLEntities(club.description)}</div>
                                </div>
                            </motion.div>
                        ))}
                        {clubs.length === 0 && !loading && (
                            <div className="error-text">No clubs available</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="footer">
                <div className="footer-left">
                    <a
                        href="https://www.curtin.edu.au/socialmedia/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="follow-link"
                    >
                        Follow Curtin
                    </a>
                    <div className="social-media">
                        <a href="https://x.com/curtinuni" target="_blank" rel="noopener noreferrer">
                            <img src={twitter} alt="Twitter" className="twitter" />
                        </a>
                        <a href="https://www.facebook.com/curtinuniversity" target="_blank" rel="noopener noreferrer">
                            <img src={facebook} alt="Facebook" className="facebook" />
                        </a>
                        <a href="https://www.instagram.com/curtinuniversity/" target="_blank" rel="noopener noreferrer">
                            <img src={instagram} alt="Instagram" className="instagram" />
                        </a>
                        <a href="https://www.youtube.com/user/CurtinUniversity" target="_blank" rel="noopener noreferrer">
                            <img src={youtube} alt="YouTube" className="youtube" />
                        </a>
                        <a href="https://www.linkedin.com/school/8788/" target="_blank" rel="noopener noreferrer">
                            <img src={linkedin} alt="LinkedIn" className="linkedin" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClubDirectory;