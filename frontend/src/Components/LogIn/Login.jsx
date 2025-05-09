import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import bg from '../../assets/login-background.jpeg';

const Login = () => {
    const navigate = useNavigate();
    const [student_id, setstudent_id] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGuestClick = () => {
        localStorage.setItem('isGuest', 'true');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('profile');
        navigate('/club-directory');
    };


    const handleLoginClick = async () => {
        if (!student_id || !password) {
            setError("Login was unsuccessful. Please correct the errors and try again.\nInvalid Curtin ID or password.");
            return;
        }
    
        setIsLoading(true);
        try {
            const response = await fetch('http://127.0.0.1:8000/api/token/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username: student_id, password }),
            });
    
            const data = await response.json();
            setIsLoading(false);
    
            if (response.ok && data.access) {
                localStorage.setItem('access_token', data.access);
                localStorage.setItem('refresh_token', data.refresh);
                localStorage.setItem('student_id', student_id);
                localStorage.setItem('isGuest', 'false');
        
                const accessToken = localStorage.getItem('access_token');
                const profileResponse = await fetch('http://127.0.0.1:8000/profile/profile/', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                });
        
                const profileData = await profileResponse.json();
        
                if (profileResponse.ok) {
                    // Ensure the profile has all the needed fields
                    const enhancedProfile = {
                        ...profileData,
                        id: profileData.id || profileData.user_id,
                        user_id: profileData.user_id || profileData.id,
                        studentid: profileData.studentid || student_id,
                        full_name: profileData.full_name || profileData.name || "Unknown",
                    };
        
                    localStorage.setItem('profile', JSON.stringify(enhancedProfile));
                    navigate('/club-directory');
                } else {
                    setError("Failed to fetch profile data. Please try again.");
                }
            }
        } catch (error) {
            setIsLoading(false);
            setError("Login was unsuccessful. Please try again later.");
        }
    };

    return (
        <div className="login-page" style={{ '--login-bg': `url(${bg})` }}>
            <div>
                <div className="login-container">
                    <div className="login-title">Unihub+</div>
                    <div className="login-inputs">
                        <div className="login-input-group">
                            <input
                                type="text"
                                className="login-input"
                                placeholder="Curtin ID"
                                value={student_id}
                                onChange={(e) => setstudent_id(e.target.value)}
                            />
                        </div>
                        <div className="login-input-group">
                            <input
                                type="password"
                                className="login-input"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {error && <p className="login-error">{error}</p>}

                        <div className="login-forgot-password">
                            <span>Forgot your password?</span>
                        </div>

                        <div className="login-submit-container">
                            <div 
                                className="login-submit" 
                                onClick={!isLoading ? handleLoginClick : undefined}
                                style={{ opacity: isLoading ? 0.7 : 1 }}
                            >
                                {isLoading ? 'Logging in...' : 'Login to Unihub+'}
                            </div>
                        </div>
                        <div className="login-guest">
                            <span onClick={handleGuestClick}>Don't have an account? <strong>Continue as Guest</strong></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;