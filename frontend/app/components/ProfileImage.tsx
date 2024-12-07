import React, { type MouseEvent as ReactMouseEvent, type ChangeEvent } from 'react';
import { useState, useEffect, useRef } from "react";
import { Button, Menu, MenuItem, IconButton, Box } from '@mui/material';
import { PhotoCamera, Delete, Upload } from '@mui/icons-material';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Avatar } from '@mui/material';
import api from '../utils/api';

interface ProfileImageProps {
    imageSrc?: string | null;
    username?: string;
    width?: number;
    height?: number;
    showOptions?: boolean;
    onImageChange?: (newImageUrl: string | null) => void;
}

export default function ProfileImage({
    imageSrc,
    username,
    width = 150,
    height = 150,
    showOptions = false,
    onImageChange,
}: ProfileImageProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDocumentClick = (e: globalThis.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (!target.closest("#profile-image-dropdown")) {
            setAnchorEl(null);
        }
    };

    const handleMouseEnter = () => {
        setIsHovered(showOptions);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    const handleClick = (event: ReactMouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleFileInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {  // 2 MB
            toast.error('Image size must be less than 2 MB');
            e.target.value = '';
            return;
        }

        try {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('image', file);

            const response = await api.post('/users/me/profile-image/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data?.image) {
                onImageChange?.(response.data.image);
                toast.success('Profile image updated successfully');
            }
        } catch (error) {
            toast.error('Failed to update profile image');
            console.error('Error uploading profile image:', error);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDeleteImage = async () => {
        try {
            setIsUploading(true);
            await api.delete('/users/me/profile-image/');
            onImageChange?.(null);
            toast.success('Profile image removed successfully');
        } catch (error) {
            toast.error('Failed to remove profile image');
            console.error('Error deleting profile image:', error);
        } finally {
            setIsUploading(false);
        }
        handleClose();
    };

    useEffect(() => {
        if (anchorEl) {
            document.addEventListener("click", handleDocumentClick);
        } else {
            document.removeEventListener("click", handleDocumentClick);
        }
        return () => {
            document.removeEventListener("click", handleDocumentClick);
        };
    }, [anchorEl]);

    return (
        <Box
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            sx={{
                cursor: showOptions ? 'pointer' : 'default',
                position: 'relative'
            }}
        >
            <Box sx={{ position: 'relative' }}>
                <Button
                    disableRipple
                    sx={{
                        background: 'none',
                        border: 'none',
                        p: 0,
                        textDecoration: 'none',
                        cursor: showOptions ? 'pointer' : 'default',
                        minWidth: 'auto',
                        '&:hover': {
                            background: 'none'
                        }
                    }}
                    disabled={isUploading}
                >
                    <Avatar
                        src={imageSrc || undefined}
                        sx={{
                            width,
                            height,
                            bgcolor: 'primary.main',
                            fontSize: Math.min(width, height) * 0.4,
                            fontWeight: 'bold',
                            opacity: isUploading ? 0.5 : 1,
                            boxShadow: 2,
                            ...(isHovered && {
                                opacity: 0.5
                            })
                        }}
                    >
                        {username ? username.charAt(0).toUpperCase() : '?'}
                    </Avatar>
                </Button>
                {isHovered && showOptions && !isUploading && (
                    <Box
                        id="profile-image-dropdown"
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 1000
                        }}
                    >
                        <IconButton
                            onClick={handleClick}
                            size="small"
                            sx={{ 
                                bgcolor: 'rgba(255, 255, 255, 0.9)',
                                '&:hover': { 
                                    bgcolor: 'rgba(255, 255, 255, 1)'
                                }
                            }}
                        >
                            <PhotoCamera />
                        </IconButton>
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleClose}
                        >
                            <MenuItem onClick={() => {
                                fileInputRef.current?.click();
                                handleClose();
                            }}>
                                <Upload sx={{ mr: 1 }} /> Upload
                            </MenuItem>
                            {imageSrc && (
                                <MenuItem 
                                    onClick={handleDeleteImage}
                                    sx={{ color: 'error.main' }}
                                >
                                    <Delete sx={{ mr: 1 }} /> Remove
                                </MenuItem>
                            )}
                        </Menu>
                    </Box>
                )}
            </Box>
            <Box
                component="input"
                type="file"
                id="file-input"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept="image/*"
                sx={{ display: 'none' }}
            />
        </Box>
    );
}
