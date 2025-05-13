﻿import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import './Club.css';
import logo from '../../assets/logo.png';
import calendar from '../../assets/calendar.png';
import collaborationIcon from '../../assets/collaboration.png';
import membersIcon from '../../assets/members.png';
import editIcon from '../../assets/edit.png';
import Exit from '../../assets/Exit.png';
import deleteIcon from '../../assets/delete_white.png';
import Sidebar from '../CollabSidebar/Sidebar';
import { AnimatePresence, motion } from 'framer-motion';
import { useNotification } from '../Notification/Context';
import { decodeHTMLEntities } from '../../utils';

const MemberCategorySection = ({ title, members, searchQuery, getInitials }) => {
    if (!members || members.length === 0) return null;
    return (
        <div className="role-section">
            <div className="role-title">{title}</div>
            {members
                .filter(m =>
                    !searchQuery ||
                    (m.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (m.studentid || '').includes(searchQuery)
                )
                .map((m, idx) => (
                    <div className="person-card" key={`${title}-${idx}`}>
                        <div
                            className="person-icon"
                            style={{
                                backgroundImage: m.profile_picture ? `url(${m.profile_picture})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {!m.profile_picture && getInitials(m.full_name)}
                        </div>
                        <div className="person-info">
                            <div className="person-name">{decodeHTMLEntities(m.full_name || 'Unknown')}</div>
                            <div className="person-id">{m.studentid || 'No ID'}</div>
                        </div>
                    </div>
                ))}
        </div>
    );
};

const Club = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { club_id } = useParams();
    const { success: success2, error: error2, confirm } = useNotification();

    const [club, setClub] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [eventsError, setEventsError] = useState(null);  
    const [isUserMember, setIsUserMember] = useState(false);
    const [profilePicture, setProfilePicture] = useState('');
    const [studentName, setStudentName] = useState('');
    const [showMembersPanel, setShowMembersPanel] = useState(false);
    const [members, setMembers] = useState([]);
    const [events, setEvents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [overlayHiding, setOverlayHiding] = useState(false);
    const [hidingExit, setHidingExit] = useState(false);
    const [hidingPanel, setHidingPanel] = useState(false);
    const [collabSidebarOpen, setCollabSidebarOpen] = useState(false);
    const [presidentEmail, setPresidentEmail] = useState('');
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [descriptionText, setDescriptionText] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);
    const [editedClubName, setEditedClubName] = useState('');
    const [newLogo, setNewLogo] = useState(null);
    const [newBanner, setNewBanner] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [bannerPreview, setBannerPreview] = useState(null);
    const [isClubPresident, setIsClubPresident] = useState(false);
    const [clubRoles, setClubRoles] = useState([]);

    const [showTransferModal, setShowTransferModal] = useState(false);
    const [eligibleMembers, setEligibleMembers] = useState([]);
    const [selectedNewPresident, setSelectedNewPresident] = useState(null);
    const [stayAsRegularMember, setStayAsRegularMember] = useState(false);
    const logoInputRef = useRef(null);
    const bannerInputRef = useRef(null);
    const descRef = useRef(null);
    const eventsRef = useRef(null);

    const [descVisible, setDescVisible] = useState(false);
    const [eventsVisible, setEventsVisible] = useState(false);

    const isGuest = localStorage.getItem('isGuest') === 'true';
    const maxDescriptionLength = 1500;

    useEffect(() => {
        const io = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.target === descRef.current) setDescVisible(e.isIntersecting);
                if (e.target === eventsRef.current) setEventsVisible(e.isIntersecting);
            });
        }, { threshold: 0.2 });

        if (descRef.current) io.observe(descRef.current);
        if (eventsRef.current) io.observe(eventsRef.current);
        return () => io.disconnect();
    }, []);

    const sec = club?.secondary_color?.join(',') || '0,0,0';
    const dom = club?.dominant_color?.join(',') || '255,255,255';
    const ter = club?.tertiary_color?.join(',') || '128,128,128';
    const bgOverlay = club?.banner
        ? `linear-gradient(to left, rgb(${sec}) 0%, rgb(${dom}) 33%, rgb(${ter}) 67%, rgb(${sec}) 100%)`
        : 'transparent';

    const getInitials = (name = '') =>
        name
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .map(p => p.charAt(0).toUpperCase())
            .join('');

    const fetchClubDetails = async () => {
        setLoading(true);
        try {
            const isGuest = localStorage.getItem('isGuest') === 'true';
            const token = localStorage.getItem('access_token');
            const userProfile = JSON.parse(localStorage.getItem('profile') || '{}');

            const headers = { 'Content-Type': 'application/json' };
            if (!isGuest && token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const response = await fetch(`http://54.169.81.75:8000/clubs/clubs/${club_id}/`, {
                method: 'GET',
                headers,
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Error status: ${response.status}, Details:`, errorText);
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('Club API Response:', data);
            setClub(data);

            if (data.president?.email) {
                setPresidentEmail(data.president.email);
            }

            if (!isGuest && userProfile?.studentid && data.president?.studentid) {
                const isPresident = String(userProfile.studentid) === String(data.president.studentid);
                setIsClubPresident(Boolean(isPresident));
            } else {
                setIsClubPresident(false);
            }

            if (!isGuest && userProfile?.studentid && Array.isArray(data.members)) {
                const isMember = data.members.some(
                    m =>
                        m.studentid === userProfile.studentid ||
                        m.student?.studentid === userProfile.studentid
                );
                setIsUserMember(isMember);
                localStorage.setItem(`club_member_${club_id}`, isMember.toString());
            }
        } catch (err) {
            console.error(err);
            setError(`Failed to load club: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };


    const fetchClubEvents = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const isGuest = localStorage.getItem('isGuest') === 'true';

            const headers = { 'Content-Type': 'application/json' };
            if (!isGuest && token) headers.Authorization = `Bearer ${token}`;

            const resp = await fetch(
                `http://54.169.81.75:8000/api/event/club_events/?club_id=${club_id}`,
                { headers }
            );

            if (!resp.ok) {
                const txt = await resp.text();
                throw new Error(`Status ${resp.status}: ${txt}`);
            }

            setEvents(await resp.json());
        } catch (err) {
            console.error('Error loading club events:', err);
            setEventsError('Не удалось загрузить события клуба.');
        }
    };


    const fetchClubMembers = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const isGuest = localStorage.getItem('isGuest') === 'true';

            const headers = { 'Content-Type': 'application/json' };
            if (!isGuest && token) headers.Authorization = `Bearer ${token}`;

            // First fetch members data (works for both guests and authenticated users)
            const mResp = await fetch(`http://54.169.81.75:8000/clubs/clubs/${club_id}/members/`, { headers });
            
            if (mResp.ok) {
                const md = await mResp.json();
                const membersList = (md.results || []).map(m => ({
                    full_name: m.full_name || m.student?.full_name || 'Unknown',
                    studentid: m.studentid || m.student?.studentid || 'No ID',
                    position: m.position || 'Member',
                    custom_position: m.custom_position || '',
                    profile_picture: m.profile_picture || m.student?.profile_picture || null
                }));
                
                setMembers(membersList);
                
                // For guests, extract unique roles directly from members data
                if (isGuest) {
                    const uniquePositions = [...new Set(
                        membersList
                            .map(m => m.custom_position || m.position)
                            .filter(Boolean)
                    )];
                    
                    setClubRoles(uniquePositions.map(position => ({
                        id: position,
                        name: position
                    })));
                }
            }

            // Try to get roles from API (will work for authenticated users)
            if (!isGuest) {
                try {
                    const rResp = await fetch(`http://54.169.81.75:8000/clubs/clubs/${club_id}/roles/`, { headers });
                    if (rResp.ok) {
                        const rd = await rResp.json();
                        setClubRoles(rd.roles || []);
                    }
                } catch (roleErr) {
                    console.error('Error fetching roles:', roleErr);
                    // Already handled roles for guests above
                }
            }
        } catch (err) {
            console.error('Error fetching members/roles:', err);
        }
    };


    useEffect(() => { fetchClubDetails(); }, [club_id]);
    useEffect(() => { fetchClubEvents(); }, [club_id]);
    useEffect(() => {
        const cache = localStorage.getItem(`club_member_${club_id}`);
        if (cache) setIsUserMember(cache === 'true');
        
        // Improve profile picture handling with URL prefixing
        const currentUserData = JSON.parse(localStorage.getItem('profile') || '{}');
        const profilePicUrl = currentUserData.profile_picture || '';
        
        setStudentName(currentUserData.full_name || currentUserData.name || '');
        setProfilePicture(profilePicUrl.startsWith('http') ? profilePicUrl : 
                          profilePicUrl ? `http://54.169.81.75:8000${profilePicUrl}` : '');
    }, [club_id]);

    const joinClub = async () => {
        if (isGuest) {
            navigate('/error', {
                state: {
                    errorCode: '401',
                    errorMessage: 'Login Required',
                    errorDetails: 'Please log in to join clubs.'
                }
            });
            return;
        }
        
        const token = localStorage.getItem('access_token');
        await fetch(`http://54.169.81.75:8000/clubs/clubs/${club_id}/members/add/`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_id: JSON.parse(localStorage.getItem('profile')).studentid,
                position: 'Member'
            })
        });
        setIsUserMember(true);
        fetchClubMembers();
    };

    const leaveClub = async () => {
        if (isClubPresident) {
            try {
                // Get fresh member data with original structure - don't transform it!
                const token = localStorage.getItem('access_token');
                const response = await fetch(`http://54.169.81.75:8000/clubs/clubs/${club_id}/members/`, {
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
                });
    
                if (!response.ok) {
                    throw new Error("Failed to fetch club members");
                }
    
                const data = await response.json();
                const currentUserID = JSON.parse(localStorage.getItem('profile')).studentid;
                
                // Keep the original structure from API, don't transform it
                const membersList = data.results || [];
                console.log("Raw API members data:", membersList);
                
                // Filter out the current user using studentid
                const eligibleMemberList = membersList.filter(m => {
                    const memberStudentId = m.studentid || m.student?.studentid;
                    return memberStudentId && memberStudentId !== currentUserID;
                });
                
                console.log("Eligible members:", eligibleMemberList);
    
                if (eligibleMemberList.length > 0) {
                    setEligibleMembers(eligibleMemberList);
                    setShowTransferModal(true);
                } else {
                    error2("No eligible members found to transfer leadership to");
                }
            } catch (err) {
                console.error("Error preparing leadership transfer:", err);
                error2("Failed to load members for leadership transfer");
            }
        } else {
            // Normal leave process for non-presidents
            const token = localStorage.getItem('access_token');
            await fetch(`http://54.169.81.75:8000/clubs/clubs/${club_id}/members/${JSON.parse(localStorage.getItem('profile')).studentid}/remove/`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsUserMember(false);
            fetchClubMembers();
        }
    };
    
    const handleTransferLeadership = async () => {
        if (!selectedNewPresident) {
            error2('Please select a member to become the new president');
            return;
        }

        try {
            const token = localStorage.getItem('access_token');
            
            // Extract the correct Student ID
            const newPresidentId = selectedNewPresident.student?.id || selectedNewPresident.id;
            
            console.log("Full selected object:", selectedNewPresident);
            console.log("Using ID for transfer:", newPresidentId);
            
            if (!newPresidentId) {
                throw new Error("Could not determine new president ID");
            }
            
            const response = await fetch(`http://54.169.81.75:8000/clubs/clubs/${club_id}/transfer_leadership/`, {
                method: 'POST',
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    new_president_id: newPresidentId,
                    remove_old_president: !stayAsRegularMember // Use the toggle state
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to transfer leadership');
            }

            success2('Leadership transferred successfully');
            setIsClubPresident(false);
            setIsUserMember(stayAsRegularMember); // Update membership status based on choice
            setShowTransferModal(false);
            
            if (!stayAsRegularMember) {
                navigate('/club-directory');
            } else {
                // Refresh the club details to show updated roles
                fetchClubDetails();
                fetchClubMembers();
            }
        } catch (err) {
            error2(`Failed to transfer leadership: ${err.message}`);
            console.error(err);
        }
    };

    const navigateToProfile = user => {
        if (isGuest) {
            navigate('/error', {
                state: {
                    errorCode: '401',
                    errorMessage: 'Login Required',
                    errorDetails: 'Please log in to view user profiles.'
                }
            });
            return;
        }
        
        console.log("Navigating to profile:", user);
        if (!user?.studentid) {
            console.error("Invalid user object:", user);
            navigate('/error', {
                state: {
                    errorCode: '404',
                    errorMessage: 'Profile Not Found',
                    errorDetails: 'The requested profile information is not available.'
                }
            });
        } else {
            navigate(`/profile`, { state: { studentId: user.studentid } });
        }
    };

    const toggleMembersPanel = () => {
        if (showMembersPanel) {
            handleClosePanel();
        } else {
            fetchClubMembers();
            setShowMembersPanel(true);
        }
    };

    const updateClubDescription = async () => {
        try {
            const token = localStorage.getItem('access_token');
            const resp = await fetch(`http://54.169.81.75:8000/clubs/clubs/${club_id}/update/`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: descriptionText })
            });
            if (resp.ok) {
                setClub({ ...club, description: descriptionText });
                setIsEditingDescription(false);
            } else {
                console.error('Failed to update description');
            }
        } catch (err) {
            console.error('Error updating description:', err);
        }
    };

    const handleLogoChange = e => {
        const f = e.target.files[0];
        setNewLogo(f);
        setLogoPreview(URL.createObjectURL(f));
    };
    const handleBannerChange = e => {
        const f = e.target.files[0];
        setNewBanner(f);
        setBannerPreview(URL.createObjectURL(f));
    };

    const handleSaveChanges = async () => {
        const token = localStorage.getItem('access_token');
        const form = new FormData();
        form.append('name', editedClubName);
        form.append('description', descriptionText);
        if (newLogo) form.append('logo', newLogo);
        if (newBanner) form.append('banner', newBanner);
        const resp = await fetch(`http://54.169.81.75:8000/clubs/clubs/${club_id}/update/`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` },
            body: form
        });
        if (resp.ok) {
            const upd = await resp.json();
            setClub(upd.club);
            setIsEditMode(false);
            logoPreview && URL.revokeObjectURL(logoPreview);
            bannerPreview && URL.revokeObjectURL(bannerPreview);
        }
    };

    const handleCancelEdit = () => {
        setIsEditMode(false);
        setEditedClubName(club.name);
        setDescriptionText(club.description);
        logoPreview && URL.revokeObjectURL(logoPreview);
        bannerPreview && URL.revokeObjectURL(bannerPreview);
    };

    const handleClosePanel = () => {
        setOverlayHiding(true);
        setHidingExit(true);
        setHidingPanel(true);
        setTimeout(() => setShowMembersPanel(false), 300);
    };

    const handleDeleteClub = async () => {
        const confirmed = await confirm('Are you sure you want to delete this club? This action cannot be undone.');
        
        if (!confirmed) return;
        
        const token = localStorage.getItem('access_token');
        const resp = await fetch(`http://54.169.81.75:8000/clubs/clubs/${club_id}/delete/`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (resp.ok) {
            success2('Club deleted successfully');
            navigate('/club-directory');
        } else {
            error('Failed to delete club');
        }
    };

    const handleEventCreationClick = () => navigate('/creation-event');
    const handleManageRolesClick = () => navigate(`/manage-roles/${club_id}`);
    const handleNav = path => () => navigate(path);

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="error-text">{error}</div>;
    if (!club) return <div>Club not found.</div>;

    return (
        <div className="club-page">
<div className="navbar">
    <img src={logo} alt="Logo" className="curtin-logo" onClick={handleNav('/club-directory')} />
    <div className="navbar-text">
        <div
            className="clubs-navbar"
            onClick={handleNav('/club-directory')}
            style={{ color: location.pathname === '/club-directory' ? '#000000' : '#999999' }}
        >
            Clubs
        </div>
        <div
            className="events-navbar"
            onClick={handleNav('/event-directory')}
            style={{ color: location.pathname === '/event-directory' ? '#000000' : '#999999' }}
        >
            Events
        </div>
        {!isGuest && (
            <div
                className="activity-navbar"
                onClick={handleNav('/my-activity')}
                style={{ color: location.pathname === '/my-activity' ? '#000000' : '#999999' }}
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
                                backgroundImage: profilePicture ? `url(${profilePicture})` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                cursor: 'pointer',
                            }}
                        >
                            {!profilePicture && getInitials(studentName)}
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

            <div className="club-page-body">
                <div className="club-banner-wrapper" style={{ background: bgOverlay }}>
                    {(bannerPreview || club.banner) && (
                        <img
                            src={bannerPreview || club.banner}
                            alt="Banner"
                            className="club-banner-img"
                        />
                    )}
                    <div
                        className="banner-overlay"
                        style={{
                            background: club.banner
                                ? `linear-gradient(to top, rgb(${club.shadow_color?.join(',')}), transparent)`
                                : 'transparent'
                        }}
                    />
                    <div className="club-banner-content">
                        <div className="club-banner-left">
                            {isClubPresident ? (
                                <div className="club-delete-info" onClick={handleDeleteClub}>
                                    <img src={deleteIcon} alt="Delete" className="club-delete-icon" />
                                    <div className="club-delete-title">Delete Club</div>
                                </div>
                            ) : !isGuest ? (
                                <div className="event-collaboration-info" onClick={() => setCollabSidebarOpen(true)}>
                                    <img src={collaborationIcon} alt="Collaboration Icon" className="collaboration-icon" />
                                    <div className="event-collaboration-title">Collaboration</div>
                                </div>
                            ) : null}
                        </div>
                        <div className="club-banner-center">
                            <img
                                src={logoPreview || club.logo}
                                alt="Logo"
                                className="club-logo"
                                onClick={isEditMode ? () => logoInputRef.current.click() : undefined}
                                style={isEditMode ? { cursor: 'pointer', border: '2px dashed white' } : {}}
                            />
                            {isEditMode ? (
                                <input
                                    type="text"
                                    value={editedClubName}
                                    onChange={e => setEditedClubName(e.target.value)}
                                    className="edit-club-name-input"
                                />
                            ) : (
                                <h1 className="club-page-name">{decodeHTMLEntities(club.name)}</h1>
                            )}
                            <div className="club-banner-buttons">
                                {isEditMode ? (
                                    <>
                                        <button className="club-banner-button save-edit" onClick={handleSaveChanges}>
                                            Save
                                        </button>
                                        <button className="club-banner-button cancel-edit" onClick={handleCancelEdit}>
                                            Cancel
                                        </button>
                                        <button
                                            className="club-banner-button change-club-banner-button"
                                            onClick={() => bannerInputRef.current.click()}
                                        >
                                            Change Banner
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {isClubPresident && (
                                            <button className="club-banner-button edit-club-button" onClick={() => setIsEditMode(true)}>
                                                Edit
                                            </button>
                                        )}
                                        <button
                                            className="club-banner-button join-button"
                                            onClick={isUserMember ? leaveClub : joinClub}
                                            style={{ background: isUserMember ? '#CF2424' : '#2074AC' }}
                                        >
                                            {isUserMember ? 'Leave' : 'Join'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="club-banner-right">
                            <div className="club-leader-info">
                            <img
                                    src={club.president?.profile_picture || '/default-profile.png'}
                                    alt="Leader"
                                    className="leader-photo"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => navigateToProfile(club.president)}
                                    onError={(e) => { e.target.onerror = null; e.target.src = '/default-profile.png'; }} // Fallback for broken images
                                />
                                <div className="club-leader-name">
                                    {(club.president?.full_name || 'No Leader').split(' ').map((n, i) =>
                                        i === 0 ? (
                                            <div key={i} className="leader-firstname">{n}</div>
                                        ) : (
                                            <div key={i} className="leader-surname">{n.toUpperCase()}</div>
                                        )
                                    )}
                                </div>
                            </div>
                            <div className="club-members-info" onClick={toggleMembersPanel}>
                                <img src={membersIcon} alt="Members" className="members-icon" />
                                <div className="club-members-title">Members</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="club-details">
                    <motion.div
                        ref={descRef}
                        className="club-description-container"
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.6, delay: 0 }}
                    >
                        <div className="club-description-header">
                            <div className="club-description-title">Description</div>
                            {isClubPresident && (
                                <button
                                    className="edit-club-description"
                                    onClick={() => setIsEditingDescription(true)}
                                >
                                    <img src={editIcon} alt="Edit" />
                                </button>
                            )}
                        </div>
                        <div className="club-description">
                            {isEditingDescription ? (
                                <>
                                    <div style={{ position: 'relative' }}>
                                        <textarea
                                            className="edit-club-description-textarea"
                                            value={descriptionText}
                                            onChange={e => {
                                                if (e.target.value.length <= maxDescriptionLength) {
                                                    setDescriptionText(e.target.value);
                                                }
                                            }}
                                            placeholder="Edit description..."
                                        />
                                        <div
                                            className={`club-description-char-counter ${
                                                descriptionText.length === maxDescriptionLength ? 'red' : ''
                                            }`}
                                        >
                                            {descriptionText.length}/{maxDescriptionLength}
                                        </div>
                                    </div>
                                    <div className="edit-description-controls">
                                        <button
                                            className="save-club-description-button"
                                            onClick={updateClubDescription}
                                        >
                                            Save
                                        </button>
                                        <button
                                            className="cancel-club-description-button"
                                            onClick={() => {
                                                setDescriptionText(club.description || '');
                                                setIsEditingDescription(false);
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </>
                            ) : (
                                (club.description || '').split('\n').map((line, i) => <p key={i}>{decodeHTMLEntities(line)}</p>)
                            )}
                        </div>
                    </motion.div>

                    <motion.div
                        className="club-event-container"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="club-event-header">
                            <div className="club-event-title">Events</div>
                            {isClubPresident && (
                                <button className="create-event-button" onClick={handleEventCreationClick}>
                                    <span className="plus-icon">+</span>
                                </button>
                            )}
                        </div>
                        {events.length > 0 ? (
                            <div className="club-events-grid">
                                {events.map((evt, idx) => (
                                    <motion.div
                                        key={evt.id}
                                        className="club-event-card-wrapper"
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, amount: 0.2 }}
                                        whileHover={{ scale: 1.03, boxShadow: '0px 0px 30px rgba(13,39,80,0.5)' }}
                                        transition={{ duration: 0.5, delay: 0 }}
                                        onClick={() => navigate(`/event/${encodeURIComponent(evt.name)}`)}
                                    >
                                        <div className="club-event-card">
                                            <img
                                                src={evt.banner}
                                                alt={evt.name}
                                                className="club-event-card-banner"
                                            />
                                            <div className="club-event-card-content">
                                                <div className="club-event-card-name">{decodeHTMLEntities(evt.name)}</div>
                                                <div className="club-event-card-description">{decodeHTMLEntities(evt.description)}</div>
                                                <div className="club-spacer" />
                                                <div className="club-event-card-meta">
                                                    Date: {evt.date} | Time: {evt.time} | Place: {evt.location}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <p className="club-error-text">No events created by this club yet.</p>
                        )}
                    </motion.div>
                </div>

                <AnimatePresence>
                    {showMembersPanel && (
                        <>
                            <motion.div
                                className="overlay"
                                onClick={handleClosePanel}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            />

                            <motion.div
                                className="members-container"
                                initial={{ x: '100vw' }}
                                animate={{ x: 0 }}
                                exit={{ x: '100vw' }}
                                transition={{ type: 'tween', duration: 0.3 }}
                            >
                                <motion.div
                                    className="exit-col"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <img
                                        src={Exit}
                                        alt="Close"
                                        className="exit-icon"
                                        onClick={handleClosePanel}
                                    />
                                </motion.div>

                                <div className="panel-col members-panel">
                                    <div className="members-panel-content">
                                        <div className="members-panel-header">
                                            <span className="total-members">Total: {members.length}</span>
                                            <div className="search-bar-wrapper">
                                                <input
                                                    type="text"
                                                    className="members-search-input"
                                                    placeholder="Search by name or ID"
                                                    value={searchTerm}
                                                    onChange={e => setSearchTerm(e.target.value)}
                                                />
                                                <button
                                                    className="members-search-button"
                                                    onClick={() => setSearchQuery(searchTerm.trim())}
                                                >
                                                    SEARCH
                                                </button>
                                            </div>
                                            {isClubPresident && (
                                                <button className="manage-roles" onClick={handleManageRolesClick}>
                                                    Manage Roles +
                                                </button>
                                            )}
                                        </div>
                                        <div className="members-body">
                                            {/* 1. President section (always first) */}
                                            <MemberCategorySection
                                                title="President"
                                                members={members.filter(m => m.position === 'President')}
                                                searchQuery={searchQuery}
                                                getInitials={getInitials}
                                            />
                                            
                                            {/* 2. All other custom roles (in the middle) */}
                                            {clubRoles
                                                .filter(r => !['President', 'Member'].includes(r.name))
                                                .map(role => (
                                                    <MemberCategorySection
                                                        key={role.id}
                                                        title={decodeHTMLEntities(role.name)}
                                                        members={members.filter(
                                                            m =>
                                                                decodeHTMLEntities(m.position) === decodeHTMLEntities(role.name) ||
                                                                decodeHTMLEntities(m.custom_position) === decodeHTMLEntities(role.name)
                                                        )}
                                                        searchQuery={searchQuery}
                                                        getInitials={getInitials}
                                                    />
                                                ))}
                                            
                                            {/* 3. Regular Members section (always last) */}
                                            <MemberCategorySection
                                                title="Members"
                                                members={members.filter(m => m.position === 'Member' && !m.custom_position)}
                                                searchQuery={searchQuery}
                                                getInitials={getInitials}
                                            />
                                            
                                            {/* No results message */}
                                            {members.filter(m =>
                                                !searchQuery ||
                                                (m.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                m.studentid.includes(searchQuery)
                                            ).length === 0 && (
                                                <div className="no-results">
                                                    No members found matching your search.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                <Sidebar
                    isOpen={collabSidebarOpen}
                    onClose={() => setCollabSidebarOpen(false)}
                    presidentEmail={presidentEmail}
                    currentClubName={club.name} 
                />
                <input
                    type="file"
                    ref={logoInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleLogoChange}
                />
                <input
                    type="file"
                    ref={bannerInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleBannerChange}
                />
                {/* Transfer Leadership Modal */}
                {showTransferModal && (
                    <div className="modal-overlay">
                        <div className="transfer-leadership-modal">
                            <div className="modal-header">
                                <h2>Transfer Club Leadership</h2>
                                <button 
                                    className="close-button" 
                                    onClick={() => setShowTransferModal(false)}
                                >
                                    &times;
                                </button>
                            </div>
                            <div className="modal-body">
                                <p>
                                    As club president, you must designate a new leader before leaving.
                                    Please select a member to become the new president:
                                </p>
                                
                                <div className="member-selection">
                                <select
                                    className="member-dropdown"
                                    onChange={(e) => {
                                        const selectedId = parseInt(e.target.value);
                                        const selectedMember = eligibleMembers.find(m => {
                                            // Focus on the database ID, not studentid
                                            const memberId = m.id || m.student?.id;
                                            return memberId === selectedId;
                                        });
                                        
                                        console.log("Selected member:", selectedMember);
                                        setSelectedNewPresident(selectedMember);
                                    }}
                                    defaultValue=""
                                >
                                    <option value="" disabled>Select a new president</option>
                                    {eligibleMembers.map(member => {
                                        const id = member.id || member.student?.id;
                                        const name = member.full_name || member.student?.full_name;
                                        return (
                                            <option key={id} value={id}>
                                                {name}
                                            </option>
                                        );
                                    })}
                                </select>
                                </div>

                                    <div className="stay-member-option">
                                    <input
                                        type="checkbox"
                                        id="stay-as-member"
                                        checked={stayAsRegularMember}
                                        onChange={(e) => setStayAsRegularMember(e.target.checked)}
                                    />
                                    <label htmlFor="stay-as-member">
                                        Stay in club as a regular member
                                    </label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    className="cancel-button"
                                    onClick={() => setShowTransferModal(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="confirm-button"
                                    onClick={handleTransferLeadership}
                                    disabled={!selectedNewPresident}
                                >
                                    Confirm and Leave
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Club;