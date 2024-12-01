let fallbackImageLoaded = false;

export const handleProfileImageError = (e) => {
    if (fallbackImageLoaded) {
        return;
    }
    e.target.onerror = null;
    e.target.src = '/media/profile_pics/default.png';
    fallbackImageLoaded = true;
};