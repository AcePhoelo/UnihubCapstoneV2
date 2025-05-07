import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './ClubDirectory.css';
import logo from '../../assets/logo.png';
import calendar from '../../assets/calendar.png';
import twitter from '../../assets/twitter.png';
import facebook from '../../assets/facebook.png';
import instagram from '../../assets/instagram.png';
import youtube from '../../assets/youtube.png';
import linkedin from '../../assets/linkedin.png';
import { motion } from 'framer-motion';
import ColorThief from 'colorthief';
import chroma from 'chroma-js';

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

    // Set the current user's profile information from localStorage on component mount
    useEffect(() => {
        const currentUserData = JSON.parse(localStorage.getItem('profile') || '{}');
        const profilePicUrl = currentUserData.profile_picture || '';
        
        setCurrentUserName(currentUserData.full_name || currentUserData.name || '');
        setCurrentUserProfilePic(profilePicUrl.startsWith('http') ? profilePicUrl : 
                                profilePicUrl ? `http://127.0.0.1:8000${profilePicUrl}` : '');
                                
        // Rest of club fetching logic
        (async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('access_token');
                const res = await fetch('http://127.0.0.1:8000/clubs/', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (res.status === 401) {
                    throw new Error('Unauthorized');
                }
                const data = await res.json();

                const enriched = await Promise.all(
                    data.map(async club => {
                        try {
                            const imgRes = await fetch(`http://127.0.0.1:8000${club.banner}`);
                            const blob = await imgRes.blob();
                            const url = URL.createObjectURL(blob);
                            const img = new Image();
                            img.src = url;
                            await new Promise(r => (img.onload = r));
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
                    })
                );
                setClubs(enriched);
            } catch (e) {
                if (e.message === 'Unauthorized') {
                    localStorage.removeItem('access_token');
                    navigate('/login');
                    setError('Unauthorized: please log in again.');
                } else {
                    console.error(e);
                    setError('Failed to fetch clubs.');
                }
            } finally {
                setLoading(false);
            }
        })();
    }, [navigate]);

    const handleNav = path => () => navigate(path);

    const getInitials = (name = '') => {
        const parts = name.trim().split(/\s+/).filter(Boolean);
        return parts.map(part => part.charAt(0).toUpperCase()).join('');
    };

    const featuredClub = clubs[0];

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
                    {!isGuest ? (
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
                            {!currentUserProfilePic && getInitials(currentUserName)}
                        </div>
                    ) : (
                        <div className="profile-icon guest" onClick={handleNav('/login')}>
                            LOGIN
                        </div>
                    )}
                    <img
                        src={calendar}
                        alt="Calendar"
                        className="calendar-icon"
                        onClick={handleNav('/calendar')}
                        style={{ cursor: 'pointer' }}
                    />
                </div>
            </div>

            {loading
                ? <div className="loading-text fade visible">Loading...</div>
                : null
            }
            <div
                className={`club-body fade ${!loading ? 'visible' : ''}`}
                style={{
                    backgroundImage: featuredClub
                        ? `linear-gradient(to bottom, ${featuredClub.hoverColor} 0%, rgba(250,250,250,0) 50%)`
                        : undefined,
                }}
            >
                {!loading && featuredClub && (
                    <div className="featured-club">
                        <motion.div
                            className="featured-club-box"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            whileHover={{ scale: 1.03 }}
                            style={{
                                '--hover-bg': featuredClub.hoverBackground,
                                '--hover-shadow': featuredClub.hoverColor,
                                cursor: 'pointer',
                            }}
                            onClick={() => navigate(`/club/${featuredClub.id}`)}
                        >
                            {featuredClub.banner && (
                                <img
                                    src={`http://127.0.0.1:8000${featuredClub.banner}`}
                                    alt={featuredClub.name}
                                    className="featured-club-image"
                                />
                            )}
                            <div className="featured-club-name">{featuredClub.name}</div>
                        </motion.div>
                    </div>
                )}
                {loading && <div className="loading-text fade visible">Loading...</div>}
                {error && <div className="error-text">{error}</div>}

                <div className="club-explore">
                    <div className="club-explore-title">Explore</div>
                    {error && <div className="error-text" style={{ marginBottom: '1rem' }}>{error}</div>}
                    <div className="clubs-grid">
                        {clubs.length > 1 && clubs.slice(1).map(club => (
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
                                            src={`http://127.0.0.1:8000${club.banner}`}
                                            alt={club.name}
                                            className="club-card-banner"
                                        />
                                    ) : (
                                        <div className="club-card-banner">No Banner Available</div>
                                    )}
                                    <div className="club-card-name">{club.name}</div>
                                    <div className="club-card-description">{club.description}</div>
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