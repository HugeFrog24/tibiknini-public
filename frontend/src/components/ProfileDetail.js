import {useCallback, useContext, useEffect, useRef, useState} from "react";
import {Link, useNavigate, useParams} from "react-router-dom";
import {Button, Card, Col, Container, InputGroup, Form, Row, Tab, Tabs} from "react-bootstrap";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCheckCircle, faPencilAlt, faSave, faTimes} from "@fortawesome/free-solid-svg-icons";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

import UserContext from "./contexts/UserContext";
import {REDIRECT_REASONS} from "./constants/Constants";
import BlogPostsTab from "./BlogPostsTab";
import ProfileImage from "./ProfileImage";
import FetchUserFollows from '../utils/FetchUserFollows';
import UseDarkMode from "../utils/UseDarkMode";
import {handleProfileImageError} from '../utils/ImageUtils';
import api from '../utils/api';

function ProfileDetail() {
    const authenticatedUser = useContext(UserContext);
    const { username } = useParams();
    const navigate = useNavigate();
    const { bgClass, textClass } = UseDarkMode();
    const [bio, setBio] = useState('');
    const [loading, setLoading] = useState(true);

    const [activeTab, setActiveTab] = useState("posts");
    const [profile, setProfile] = useState({});
    const [isFollowing, setIsFollowing] = useState(false);
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);

    const isOwner = authenticatedUser && authenticatedUser.username === username;
    const fileInputRef = useRef(null);

    const [isEditingBio, setIsEditingBio] = useState(false);
    const [bioInput, setBioInput] = useState('');

    const fetchProfile = useCallback(async (username) => {
        setLoading(true);

        try {
            const response = await api.get(`/users/${username}/`);
            setProfile(response.data);
        } catch (error) {
            if (error?.response?.status === 404) {
                navigate(`/error/${error?.response?.status}`, { state: { errorCode: 404 } });
            }
            console.error(error);
        }

        // Only check the following status if there's an authenticated user
        if (authenticatedUser) {
            try {
                const followResponse = await api.get(`/users/${authenticatedUser.username}/follows/${username}/`);
                setIsFollowing(followResponse.status === 200);
            } catch (error) {
                if (error?.response?.status === 401) {
                    navigate("/login", { state: { reason: REDIRECT_REASONS.VIEW_OWN_PROFILE } });
                }
                console.error(error);
            }
        }
        setLoading(false);
    }, [setIsFollowing, setProfile, navigate, authenticatedUser]);

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
    
        const formData = new FormData();
        formData.append("image", file);
    
        try {
            await api.put(`/users/me/image/update/`, formData);
            await fetchProfile(username);
        } catch (error) {
            console.error(error);
        }
    };

    const handleImageDelete = async () => {
        try {
            await api.delete(`/users/me/image/delete/`);
            await fetchProfile(username);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchFollowers = useCallback(
        async (username) => {
            FetchUserFollows(username, 'followers', setFollowers);
        },
        []
    );

    const fetchFollowing = useCallback(
        async (username) => {
            FetchUserFollows(username, 'following', setFollowing);
        },
        []
    );

    const handleEditBio = () => {
        setBioInput(bio || '');  // Use the bio state variable
        setIsEditingBio(true);
    };

    const handleSaveBio = async () => {
        try {
            await api.patch(`/users/${username}/bio/`, { bio: bioInput });
            setBio(bioInput); // Update the local state
            setIsEditingBio(false);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCancelBioEdit = () => {
        setIsEditingBio(false);
    };

    useEffect(() => {
        const fetchBio = async () => {
            try {
                const response = await api.get(`/users/${username}/bio/`);
                setBio(response.data.bio);
            } catch (error) {
                console.error(error);
            }
        };
        fetchBio();
    }, [username]);

    useEffect(() => {
        // Reset isFollowing state when switching profiles
        setIsFollowing(false);

        // Fetch profile and blog posts
        (async () => {
            await fetchProfile(username);
        })();
    }, [username, fetchProfile]);

    useEffect(() => {
        if (username === "me" && !authenticatedUser && !loading) {
            navigate("/login", { state: { reason: REDIRECT_REASONS.VIEW_OWN_PROFILE } });
        }
    }, [username, authenticatedUser, loading, navigate]);

    useEffect(() => {
        // Fetch followers and following regardless of the active tab
        fetchFollowers(username);
        fetchFollowing(username);
        }, [username, fetchFollowers, fetchFollowing]);

    const handleFollowToggle = async () => {
        if (!authenticatedUser) {
            navigate("/login", {state: {reason: REDIRECT_REASONS.FOLLOW_USER}});
            return;
        }
        try {
            if (isFollowing) {
                await api.delete(`/users/${authenticatedUser.username}/follows/${username}/`);
                setIsFollowing(false);
            } else {
                await api.post(`/users/${authenticatedUser.username}/follows/${username}/`);
                setIsFollowing(true);
            }
        } catch (error) {
            console.error(error);
        }
    };


    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    return (
        <Container className="profile-detail">
            <Row>
                <Col>
                    <Container>
                        <Row className="align-items-center">
                            <Col>
                                <Row>
                                    {loading ? (
                                        <Skeleton circle={true} height={120} width={120} />
                                    ) : (
                                        <ProfileImage
                                            imageSrc={profile.image}
                                            imageAlt={profile.username}
                                            width="120"
                                            height="120"
                                            showOptions={isOwner}
                                            onImageUpload={handleImageUpload}
                                            onImageDelete={handleImageDelete}
                                            fileInputRef={fileInputRef}
                                        />
                                    )}
                                    <Container className="d-flex justify-content-center align-items-center">
                                        <h3 className={`${textClass} my-1`}>
                                            {loading ? <Skeleton width={150} /> : profile.username}
                                        </h3>
                                        {profile.is_staff && (
                                            <FontAwesomeIcon
                                                icon={faCheckCircle}
                                                className="ms-2 text-primary"
                                                style={{width: "15px", height: "15px"}}
                                            />
                                        )}
                                    </Container>
                                </Row>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={12}>
                                {
                                    (!authenticatedUser || authenticatedUser.username !== username) && username !== "me" && (
                                        <Button
                                            onClick={handleFollowToggle}
                                            variant={isFollowing ? "secondary" : "primary"}
                                            className="my-1 shadow"
                                        >
                                            {isFollowing ? "Unfollow" : "Follow"}
                                        </Button>
                                    )
                                }
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={12}>
                                <i className={`opacity-75 mt-2 ${textClass}`}>
                                    Member since {formatDate(profile.date_joined)}
                                </i>
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={12}>
                                {isEditingBio ? (
                                    <InputGroup hasValidation className="d-flex align-items-center mb-2 bg-white">
                                        <Form.Control
                                            type="text"
                                            value={bioInput}
                                            onChange={(e) => setBioInput(e.target.value)}
                                            className={`${bgClass} ${textClass} mr-2 flex-grow-1`}
                                            rounded="0"
                                            isInvalid={bioInput.length > 256}
                                        />
                                        <Button variant="success" className="mr-2" onClick={handleSaveBio} rounded="0">
                                            <FontAwesomeIcon icon={faSave} />
                                        </Button>
                                        <Button variant="danger" onClick={handleCancelBioEdit} rounded="0">
                                            <FontAwesomeIcon icon={faTimes} />
                                        </Button>
                                        <Form.Control.Feedback type="invalid">
                                            Bio cannot exceed 256 characters.
                                        </Form.Control.Feedback>
                                    </InputGroup>
                                    ) : (
                                        <>
                                        <spaprn>
                                            {loading ? (
                                                <Skeleton width={200} />
                                            ) : (
                                                bio || `Hello, my name is ${profile.username} 👋`
                                            )}
                                        </spaprn>
                                        {(isOwner || username === "me") && (
                                            <FontAwesomeIcon
                                                icon={faPencilAlt}
                                                className="ms-2"
                                                style={{cursor: 'pointer'}}
                                                onClick={handleEditBio}
                                            />
                                            )}
                                        </>
                                        )}
                            </Col>
                        </Row>
                    </Container>
                </Col>
                <Col lg={8} md={6} sm={12}>
                    <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="custom-tabs">
                        <Tab eventKey="posts" title="Posts">
                            <BlogPostsTab username={username} />
                        </Tab>
                        <Tab eventKey="followers" title="Followers">
                            {followers ? followers.map((follow, index) => (
                                <Card key={follow.follower || index}
                                      className={`my-4 ${bgClass} shadow`}>
                                    <Card.Body className="d-flex align-items-center">
                                        <Link to={`/users/${follow.follower}`}
                                              className="text-start text-info text-decoration-none d-flex align-items-center">
                                            <Card.Img
                                                variant="top" src={follow.follower_image}
                                                className="rounded-circle me-3"
                                                style={{width: '50px', height: '50px'}}
                                                onError={handleProfileImageError}
                                            />
                                            <Card.Title className="mb-0">{follow.follower}</Card.Title>
                                        </Link>
                                    </Card.Body>
                                </Card>
                            )) : 'Loading...'}
                        </Tab>
                        <Tab eventKey="following" title="Following">
                            {following ? following.map((follow, index) => (
                                <Card key={follow.following || index}
                                      className={`my-4 ${bgClass} shadow`}>
                                    <Card.Body className="d-flex align-items-center">
                                        <Link to={`/users/${follow.following}`}
                                              className="text-start text-info text-decoration-none d-flex align-items-center">
                                            <Card.Img
                                                variant="top" src={follow.following_image}
                                                className="rounded-circle me-3"
                                                style={{width: '50px', height: '50px'}}
                                                onError={handleProfileImageError}
                                            />
                                            <Card.Title className="mb-0">{follow.following}</Card.Title>
                                        </Link>
                                    </Card.Body>
                                </Card>
                            )) : 'Loading...'}
                        </Tab>
                    </Tabs>
                </Col>
            </Row>
        </Container>
    );
}

export default ProfileDetail;
