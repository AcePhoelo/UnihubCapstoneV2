// CreationClub.jsx
import React, { useState, useEffect } from 'react';
import './CreationClub.css';
import { useNavigate } from 'react-router-dom';
import backIcon from '../../assets/Back.png';
import { useNotification } from '../Notification/Context';

const CreationClub = () => {
    const navigate = useNavigate();
    const [bannerPreview, setBannerPreview] = useState(null);
    const [iconPreview, setIconPreview] = useState(null);
    const [clubName, setClubName] = useState('');
    const [description, setDescription] = useState('');
    const [members, setMembers] = useState(Array(10).fill(''));
    const [formValid, setFormValid] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const maxDescriptionLength = 1500;
    const { success: success2, error: error2 } = useNotification();

    const handleIconChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setIconPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleBannerChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setBannerPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        const clubInfoValid = clubName.trim() !== '' && description.trim() !== '';
        const membersValid = members.every((id) => id.trim() !== '' && /^\d{8}$/.test(id));
        setFormValid(clubInfoValid && membersValid);
    }, [clubName, description, members]);

    const handleSubmit = async () => {
        const formData = new FormData();
        formData.append('name', clubName);
        formData.append('description', description);
        if (iconPreview) {
            formData.append('logo', document.getElementById('icon-upload').files[0]);
        }
        if (bannerPreview) {
            formData.append('banner', document.getElementById('banner-upload').files[0]);
        }
        members.forEach((member, index) => {
            formData.append(`members[${index}]`, member);
        });

        try {
            const response = await fetch('http://127.0.0.1:8000/clubs/clubs/create/', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                },
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                success2('Club created successfully!');
                // Use React Router navigation instead of window.location
                navigate(`/club/${data.club.id}`);
            }else {
                const errorData = await response.json();
                setErrorMessage(errorData.error || 'Failed to create club');
            }
        } catch (error) {
            console.error('Error creating club:', error);
            setErrorMessage('An error occurred while creating the club.');
        }
    };

    return (
        <div className="creation-club-page">
            <div className="creation-header">
                <img
                    src={backIcon}
                    alt="Back"
                    className="back-button"
                    onClick={() => navigate(-1)}
                    style={{ cursor: 'pointer', marginRight: '16px' }}
                />
                <div className="creation-name">Add Club</div>
            </div>
            <div className="creation-body">
                <div className="form-wrapper">
                    <div className="content-wrapper">
                        <div className="shared-columns">
                            <div className="club-information">
                                <div className="creation-title">Club Information</div>
                                <div className="creation-inputs">
                                    <input
                                        type="text"
                                        className="creation-input"
                                        placeholder="Club Name"
                                        value={clubName}
                                        onChange={(e) => setClubName(e.target.value)}
                                        required
                                    />
                                    <div className="club-creation-description-group">
                                        <textarea
                                            className="club-creation-description"
                                            value={description}
                                            onChange={(e) => {
                                                if (
                                                    e.target.value.length <=
                                                    maxDescriptionLength
                                                ) {
                                                    setDescription(e.target.value);
                                                }
                                            }}
                                            placeholder="Description"
                                        />
                                        <div
                                            className={`description-char-counter ${description.length ===
                                                    maxDescriptionLength
                                                    ? 'red'
                                                    : ''
                                                }`}
                                        >
                                            {description.length}/{maxDescriptionLength}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="media-pickers">
                                <div className="creation-icon">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        id="icon-upload"
                                        style={{ display: 'none' }}
                                        onChange={handleIconChange}
                                    />
                                    <label
                                        htmlFor="icon-upload"
                                        className="club-creation-icon"
                                    >
                                        {iconPreview ? (
                                            <img
                                                src={iconPreview}
                                                alt="Club Icon"
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    borderRadius: '50%',
                                                }}
                                            />
                                        ) : (
                                            '+'
                                        )}
                                    </label>
                                    <div className="icon-size">
                                        Club Icon (500x500px)
                                    </div>
                                </div>

                                <div className="creation-banner">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        id="banner-upload"
                                        style={{ display: 'none' }}
                                        onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setBannerPreview(reader.result);
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                    <label
                                        htmlFor="banner-upload"
                                        className="club-creation-banner"
                                    >
                                        {bannerPreview ? (
                                            <img
                                                src={bannerPreview}
                                                alt="Club Banner"
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                        ) : (
                                            '+'
                                        )}
                                    </label>
                                    <div className="banner-size">
                                        Club Banner (1024x576px)
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="creation-members">
                            <div className="creation-title">Members (min. 10)</div>
                            <div className="shared-columns">
                                {[0, 1].map((col) => (
                                    <div className="members-column" key={col}>
                                        {Array(5)
                                            .fill(0)
                                            .map((_, i) => {
                                                const idx = col * 5 + i;
                                                return (
                                                    <input
                                                        key={idx}
                                                        type="text"
                                                        className="creation-input"
                                                        placeholder="StudentID (8 digits)"
                                                        value={members[idx]}
                                                        onChange={(e) => {
                                                            const m = [...members];
                                                            m[idx] = e.target.value;
                                                            setMembers(m);
                                                        }}
                                                        pattern="\d{8}"
                                                        title="Enter an 8-digit StudentID"
                                                        required
                                                    />
                                                );
                                            })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {errorMessage && (
                        <div className="error-message">{errorMessage}</div>
                    )}

                    <button
                        className={`creation-submit ${formValid ? '' : 'disabled'
                            }`}
                        disabled={!formValid}
                        onClick={handleSubmit}
                    >
                        Submit
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreationClub;