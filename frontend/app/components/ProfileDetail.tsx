import * as React from "react";
import type { ReactNode, SyntheticEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useLocation, useLoaderData, Link } from "@remix-run/react";
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
    SxProps,
    Theme
} from '@mui/material';

import {REDIRECT_REASONS} from "../old-app/components/constants/Constants";
import BlogPostsTab from "./BlogPostsTab";
import ProfileImage from "./ProfileImage";
import FetchUserFollows from '../old-app/utils/FetchUserFollows';
import api from '../utils/api';
import type { User, Follow } from '../types/user';

interface TabPanelProps {
    children?: ReactNode;
    value: number;
    index: number;
}

interface ProfileDetailProps {
    initialUser: User;
}

interface BioResponse {
    bio: string;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
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
};

const a11yProps = (index: number) => {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
};

const ProfileDetail: React.FC<ProfileDetailProps> = ({ initialUser }) => {
    const { user: authenticatedUser } = useLoaderData<{ user: User }>();
    const { username } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState<boolean>(false);

    const [activeTab, setActiveTab] = useState<number>(0);
    const [profile, setProfile] = useState<User>(initialUser);
    const [bio, setBio] = useState<string>('');
    const [isFollowing, setIsFollowing] = useState<boolean>(false);
    const [followers, setFollowers] = useState<Follow[]>([]);
    const [following, setFollowing] = useState<Follow[]>([]);

    const isOwner = authenticatedUser?.username === username;
    const isAuthenticated = !!authenticatedUser;

    const [isEditingBio, setIsEditingBio] = useState<boolean>(false);
    const [bioInput, setBioInput] = useState<string>('');

    const fetchBio = useCallback(async () => {
        if (!username) return;
        try {
            const response = await api.get<BioResponse>(`/users/${username}/bio/`);
            setBio(response.data.bio || '');
            setBioInput(response.data.bio || '');
        } catch (error) {
            console.error('Error fetching bio:', error);
        }
    }, [username]);

    const fetchAuthenticatedData = useCallback(async () => {
        if (!authenticatedUser || !username) return;

        try {
            const followResponse = await api.get(`/users/${authenticatedUser.username}/follows/${username}/`);
            setIsFollowing(followResponse.status === 200);
        } catch (error) {
            console.error('Error fetching authenticated data:', error);
        }
    }, [authenticatedUser, username]);

    const handleImageChange = async (newImageUrl: string | null) => {
        setProfile(prev => ({
            ...prev,
            image: newImageUrl || prev.image
        }));
    };

    const fetchFollowers = useCallback(
        async (username: string) => {
            FetchUserFollows(username, 'followers', setFollowers);
        },
        []
    );

    const fetchFollowing = useCallback(
        async (username: string) => {
            FetchUserFollows(username, 'following', setFollowing);
        },
        []
    );

    const handleEditBio = () => {
        setBioInput(bio);
        setIsEditingBio(true);
    };

    const handleSaveBio = async () => {
        if (!username) return;
        
        try {
            await api.patch(`/users/${username}/bio/`, { bio: bioInput });
            setBio(bioInput);
            setIsEditingBio(false);
        } catch (error) {
            console.error('Error updating bio:', error);
        }
    };

    const handleCancelBioEdit = () => {
        setBioInput(bio);
        setIsEditingBio(false);
    };

    useEffect(() => {
        setIsFollowing(false);
        fetchAuthenticatedData();
        fetchBio();
    }, [username, fetchAuthenticatedData, fetchBio]);

    useEffect(() => {
        if (username) {
            fetchFollowers(username);
            fetchFollowing(username);
        }
    }, [username, fetchFollowers, fetchFollowing]);

    useEffect(() => {
        const hash = location.hash.replace('#', '');
        if (hash === 'posts') setActiveTab(0);
        else if (hash === 'followers') setActiveTab(1);
        else if (hash === 'following') setActiveTab(2);
    }, [location]);

    const handleFollowToggle = async () => {
        if (!authenticatedUser || !username) {
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
            console.error('Error toggling follow:', error);
        }
    };

    const handleChange = (_event: SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
        const tabNames = ['posts', 'followers', 'following'];
        navigate(`#${tabNames[newValue]}`, { replace: true });
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const avatarSx: SxProps<Theme> = { width: 50, height: 50, marginRight: 2 };

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
                                    imageSrc={profile.image}
                                    username={username || ''}
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
                                                    inputProps={{
                                                        maxLength: 256
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
                                                    {bio || `Hello, my name is ${profile.username} 👋`}
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
                        <Tab label="Posts" {...a11yProps(0)} href="#posts" />
                        <Tab label="Followers" {...a11yProps(1)} href="#followers" />
                        <Tab label="Following" {...a11yProps(2)} href="#following" />
                    </Tabs>
                </Box>
                <TabPanel value={activeTab} index={0}>
                    <BlogPostsTab username={username || ''} />
                </TabPanel>
                <TabPanel value={activeTab} index={1}>
                    {followers ? followers.map((follow, index) => (
                        <Card key={follow.follower || index} sx={{ mb: 2 }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Link to={`/users/${follow.follower}`} style={{ textDecoration: 'none' }}>
                                        <Avatar
                                            src={follow.follower_image || undefined}
                                            alt={follow.follower}
                                            sx={avatarSx}
                                        />
                                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                            {follow.follower}
                                        </Typography>
                                    </Link>
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
                                    <Link to={`/users/${follow.following}`} style={{ textDecoration: 'none' }}>
                                        <Avatar
                                            src={follow.following_image || undefined}
                                            alt={follow.following}
                                            sx={avatarSx}
                                        />
                                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                                            {follow.following}
                                        </Typography>
                                    </Link>
                                </Box>
                            </CardContent>
                        </Card>
                    )) : 'Loading...'}
                </TabPanel>
            </Box>
        </Container>
    );
};

export default ProfileDetail;
