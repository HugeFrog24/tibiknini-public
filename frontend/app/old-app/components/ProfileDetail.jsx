import {useCallback, useEffect, useState} from "react";
import { useNavigate, useParams, useLocation, useLoaderData} from "@remix-run/react";
import {
    Edit as EditIcon,
    Save as SaveIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { 
    Tabs, 
    Tab, 
    Box, 
    Avatar,
    Button,
    Container,
    Grid,
    Card,
    CardContent,
    TextField,
    Typography,
    Link as MUILink
} from '@mui/material';

import {REDIRECT_REASONS} from "./constants/Constants";
import BlogPostsTab from "./BlogPostsTab";
import ProfileImage from "../../components/ProfileImage";
import FetchUserFollows from '../utils/FetchUserFollows';
import api from '../../utils/api';

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

function a11yProps(index) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

function ProfileDetail({ initialUser }) {
    const { user: authenticatedUser } = useLoaderData();
    const { username } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [bio, setBio] = useState(initialUser?.bio || '');
    const [loading, setLoading] = useState(false);

    const [activeTab, setActiveTab] = useState(0);
    const [profile, setProfile] = useState(initialUser);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);

    const isOwner = authenticatedUser?.username === username;
    const isAuthenticated = !!authenticatedUser;

    const [isEditingBio, setIsEditingBio] = useState(false);
    const [bioInput, setBioInput] = useState(initialUser?.bio || '');

    // Only fetch additional authenticated data if needed
    const fetchAuthenticatedData = useCallback(async () => {
        if (!authenticatedUser) return;

        try {
            // Check following status only if authenticated
            const followResponse = await api.get(`/users/${authenticatedUser.username}/follows/${username}/`);
            setIsFollowing(followResponse.status === 200);
        } catch (error) {
            console.error('Error fetching authenticated data:', error);
        }
    }, [authenticatedUser, username]);

    const handleImageChange = async (newImageUrl) => {
        // Update the profile state with the new image URL
        setProfile(prev => ({
            ...prev,
            profile_image: newImageUrl
        }));
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
        setBioInput(bio || '');
        setIsEditingBio(true);
    };

    const handleSaveBio = async () => {
        try {
            await api.patch(`/users/${username}/bio/`, { bio: bioInput });
            setBio(bioInput);
            setIsEditingBio(false);
            // Update profile data
            const response = await api.get(`/users/${username}/`);
            setProfile(response.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCancelBioEdit = () => {
        setIsEditingBio(false);
    };

    useEffect(() => {
        // Reset isFollowing state when switching profiles
        setIsFollowing(false);
        
        // Fetch authenticated data if needed
        fetchAuthenticatedData();
    }, [username, fetchAuthenticatedData]);

    useEffect(() => {
        // Fetch followers and following regardless of the active tab
        fetchFollowers(username);
        fetchFollowing(username);
    }, [username, fetchFollowers, fetchFollowing]);

    useEffect(() => {
        const hash = location.hash.replace('#', '');
        if (hash === 'posts') setActiveTab(0);
        else if (hash === 'followers') setActiveTab(1);
        else if (hash === 'following') setActiveTab(2);
    }, [location]);

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

    const handleChange = (event, newValue) => {
        setActiveTab(newValue);
        const tabNames = ['posts', 'followers', 'following'];
        navigate(`#${tabNames[newValue]}`, { replace: true });
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    return (
        <Container maxWidth="lg">
            <Card sx={{ mb: 4, mt: 2 }}>
                <CardContent>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            {loading ? (
                                <Skeleton circle width={200} height={200} />
                            ) : (
                                <ProfileImage
                                    imageSrc={profile.profile_image}
                                    username={username}
                                    width={200}
                                    height={200}
                                    showOptions={isOwner}
                                    onImageChange={handleImageChange}
                                />
                            )}
                        </Grid>
                        <Grid item xs={12} md={8}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h4" component="h1" sx={{ mr: 2 }}>
                                    {loading ? <Skeleton width={200} /> : profile.username}
                                </Typography>
                                {!loading && !isOwner && isAuthenticated && (
                                    <Button
                                        variant="contained"
                                        color={isFollowing ? "secondary" : "primary"}
                                        onClick={handleFollowToggle}
                                        sx={{ minWidth: 100 }}
                                    >
                                        {isFollowing ? 'Unfollow' : 'Follow'}
                                    </Button>
                                )}
                            </Box>
                            <Box sx={{ mb: 2 }}>
                                {loading ? (
                                    <Skeleton count={3} />
                                ) : (
                                    <>
                                        {isEditingBio ? (
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                                <TextField
                                                    fullWidth
                                                    multiline
                                                    rows={3}
                                                    value={bioInput}
                                                    onChange={(e) => setBioInput(e.target.value)}
                                                    variant="outlined"
                                                    slotProps={{
                                                        input: {
                                                            maxLength: 256
                                                        }
                                                    }}
                                                    helperText={`${bioInput.length}/256 characters`}
                                                />
                                                <Button
                                                    onClick={handleSaveBio}
                                                    variant="contained"
                                                    color="primary"
                                                    startIcon={<SaveIcon />}
                                                >
                                                    Save
                                                </Button>
                                                <Button
                                                    onClick={handleCancelBioEdit}
                                                    variant="outlined"
                                                    color="secondary"
                                                    startIcon={<CloseIcon />}
                                                >
                                                    Cancel
                                                </Button>
                                            </Box>
                                        ) : (
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                                <Typography>
                                                    {profile.bio || `Hello, my name is ${profile.username} 👋`}
                                                </Typography>
                                                {isOwner && (
                                                    <Button
                                                        onClick={handleEditBio}
                                                        variant="outlined"
                                                        size="small"
                                                        startIcon={<EditIcon />}
                                                    >
                                                        Edit Bio
                                                    </Button>
                                                )}
                                            </Box>
                                        )}
                                    </>
                                )}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <Typography variant="body1" sx={{ mr: 2 }}>
                                    Member since {formatDate(profile.date_joined)}
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
            <Box sx={{ width: '100%' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={activeTab}
                        onChange={handleChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        aria-label="profile tabs"
                    >
                        <Tab label="Posts" {...a11yProps(0)} component={MUILink} to="#posts" />
                        <Tab label="Followers" {...a11yProps(1)} component={MUILink} to="#followers" />
                        <Tab label="Following" {...a11yProps(2)} component={MUILink} to="#following" />
                    </Tabs>
                </Box>
                <TabPanel value={activeTab} index={0}>
                    <BlogPostsTab username={username} />
                </TabPanel>
                <TabPanel value={activeTab} index={1}>
                    {followers ? followers.map((follow, index) => (
                        <Card key={follow.follower || index} sx={{ mb: 2 }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <MUILink to={`/users/${follow.follower}`} underline="none">
                                        <Avatar
                                            src={follow.follower_image}
                                            alt={follow.follower}
                                            sx={{ width: 50, height: 50, marginRight: 2 }}
                                        />
                                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                            {follow.follower}
                                        </Typography>
                                    </MUILink>
                                </Box>
                            </CardContent>
                        </Card>
                    )) : 'Loading...'}
                </TabPanel>
                <TabPanel value={activeTab} index={2}>
                    {following ? following.map((follow, index) => (
                        <Card key={follow.following || index} sx={{ mb: 2 }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <MUILink to={`/users/${follow.following}`} underline="none">
                                        <Avatar
                                            src={follow.following_image}
                                            alt={follow.following}
                                            sx={{ width: 50, height: 50, marginRight: 2 }}
                                        />
                                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                            {follow.following}
                                        </Typography>
                                    </MUILink>
                                </Box>
                            </CardContent>
                        </Card>
                    )) : 'Loading...'}
                </TabPanel>
            </Box>
        </Container>
    );
}

export default ProfileDetail;
