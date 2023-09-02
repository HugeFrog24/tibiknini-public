import {useCallback, useContext, useEffect, useRef, useState} from "react";
import {Link, useNavigate, useParams} from "react-router-dom";
import {Button, Card, Col, Container, Row, Tab, Tabs} from "react-bootstrap";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCheckCircle} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import ApiUrlContext from "./contexts/ApiUrlContext";
import UserContext from "./contexts/UserContext";
import BlogPostsTab from "./BlogPostsTab";
import ProfileImage from "./ProfileImage";
import {GetAccessToken} from "../utils/AccessToken";
import FetchUserFollows from '../utils/FetchUserFollows';
import UseDarkMode from "../utils/UseDarkMode";

function ProfileDetail() {
    const apiUrl = useContext(ApiUrlContext);
    const [activeTab, setActiveTab] = useState("posts");
    const [profile, setProfile] = useState({});
    const [isFollowing, setIsFollowing] = useState(false);
    const {username} = useParams();
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);
    const accessToken = GetAccessToken();
    const authenticatedUser = useContext(UserContext);
    const isOwner = authenticatedUser && authenticatedUser.username === username;
    const fileInputRef = useRef(null);
    const {bgClass, textClass} = UseDarkMode();
    const navigate = useNavigate();

    const fetchProfile = useCallback(
        async (username) => {
            try {
                const response = await axios.get(`${apiUrl}/users/${username}/`);
                setProfile(response.data);

                if (authenticatedUser && authenticatedUser.username !== username) {
                    try {
                        const followResponse = await axios.get(
                            `${apiUrl}/users/${authenticatedUser.username}/follows/${username}/`,
                            {
                                headers: {
                                    Authorization: `Bearer ${accessToken}`,
                                },
                            }
                        );
                        setIsFollowing(followResponse.status === 200);
                    } catch (followError) {
                        // Interpret a 404 error as "user is not following the profile"
                        if (followError.response && followError.response.status === 404) {
                            setIsFollowing(false);
                        } else {
                            console.error(followError);
                        }
                    }
                }
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    navigate(`/error/${error.response.status}`, {
                        state: {errorCode: 404}
                    });
                } else {
                    console.error(error);
                }
            }
        },
        [apiUrl, setIsFollowing, setProfile, navigate, authenticatedUser, accessToken]
    );

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("image", file);

        try {
            await axios.put(`${apiUrl}/users/me/image/update/`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            await fetchProfile(username);
        } catch (error) {
            console.error(error);
        }
    };

    const handleImageDelete = async () => {
        try {
            await axios.delete(`${apiUrl}/users/me/image/delete/`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            await fetchProfile(username);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchFollowers = useCallback(
        async (username) => {
            FetchUserFollows(apiUrl, username, 'followers', setFollowers);
        },
        [apiUrl]
    );

    const fetchFollowing = useCallback(
        async (username) => {
            FetchUserFollows(apiUrl, username, 'following', setFollowing);
        },
        [apiUrl]
    );

    useEffect(() => {
        // Fetch profile and blog posts
        (async () => {
            await fetchProfile(username);
        })();

        // Fetch followers and following regardless of the active tab
        fetchFollowers(username);
        fetchFollowing(username);
    }, [username, apiUrl, fetchProfile, fetchFollowers, fetchFollowing, activeTab]);

    const handleFollowToggle = async () => {
        if (!authenticatedUser || !accessToken) {
            navigate('/login'); // Add your login route here
            return;
        }
        try {
            if (isFollowing) {
                // Unfollow if a follow relationship already exists
                await axios.delete(
                    `${apiUrl}/users/${authenticatedUser.username}/follows/${username}/`,
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );
                setIsFollowing(false);
            } else {
                // Follow if no follow relationship exists
                await axios.post(
                    `${apiUrl}/users/${authenticatedUser.username}/follows/${username}/`,
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );
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
            {/* Breadcrumb component */}
            {/* Replace with your breadcrumb component and pass app_name and page_title props */}
            <Row>
                <Col>
                    <Container>
                        <Row className="align-items-center">
                            <Col>
                                <Row>
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
                                    <Container className="d-flex justify-content-center align-items-center">
                                        <h3 className={textClass}>{profile.username}</h3>
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
                                <Button
                                    onClick={handleFollowToggle}
                                    variant={isFollowing ? "secondary" : "primary"}
                                    className="mt-2 shadow"
                                    disabled={authenticatedUser && authenticatedUser.username === username}
                                >
                                    {isFollowing ? "Unfollow" : "Follow"}
                                </Button>
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
                                <span
                                    className="mt-2">{profile.bio ? profile.bio : `Hello, my name is ${profile.username} 👋`}</span>
                            </Col>
                        </Row>
                    </Container>
                </Col>
                <Col lg={8} md={6} sm={12}>
                    <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="custom-tabs">
                        <Tab eventKey="posts" title="Posts">
                            <BlogPostsTab username={username} apiUrl={apiUrl}/>
                        </Tab>
                        <Tab eventKey="followers" title="Followers">
                            {followers ? followers.map((follow, index) => (
                                <Card key={follow.follower || index}
                                      className={`my-4 ${bgClass} shadow`}>
                                    <Card.Body className="d-flex align-items-center">
                                        <Link to={`/users/${follow.follower}`}
                                              className="text-start text-info text-decoration-none d-flex align-items-center">
                                            <Card.Img variant="top" src={`${apiUrl}${follow.follower_image}`}
                                                      className="rounded-circle me-3"
                                                      style={{width: '50px', height: '50px'}}/>
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
                                            <Card.Img variant="top" src={`${apiUrl}${follow.following_image}`}
                                                      className="rounded-circle me-3"
                                                      style={{width: '50px', height: '50px'}}/>
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
