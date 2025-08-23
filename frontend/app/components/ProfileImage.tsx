import React, { type MouseEvent as ReactMouseEvent, type ChangeEvent } from 'react';
import { useState, useEffect, useRef } from "react";
import { Button, Menu, MenuItem, IconButton, Box } from '@mui/material';
import { PhotoCamera, Delete, Upload } from '@mui/icons-material';
import { Avatar } from '@mui/material';
import api from '../utils/api';
import { showToastMessage, showErrorToast } from '../constants/Constants';

interface ProfileImageProps {
    imageSrc?: string | null;
    username?: string;
    width?: number;
    height?: number;
    showOptions?: boolean;
    onImageChange?: (newImageUrl: string | null) => void;
}

const validateImage = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Valid image if we can load it and get dimensions
                resolve(img.width > 0 && img.height > 0);
            };
            img.onerror = () => {
                resolve(false);
            };
            img.src = e.target?.result as string;
        };
        reader.onerror = () => {
            resolve(false);
        };
        reader.readAsDataURL(file);
    });
};

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
            showToastMessage('PROFILE_IMAGE', 'SIZE_ERROR');
            e.target.value = '';
            return;
        }

        // Validate file type using both MIME type and actual image validation
        const isValidMimeType = /^image\/(jpeg|png|gif|webp)$/.test(file.type);
        if (!isValidMimeType) {
            showToastMessage('PROFILE_IMAGE', 'TYPE_ERROR');
            e.target.value = '';
            return;
        }

        // Validate that it's a real image by trying to load it
        const isValidImage = await validateImage(file);
        if (!isValidImage) {
            showToastMessage('PROFILE_IMAGE', 'TYPE_ERROR');
            e.target.value = '';
            return;
        }

        try {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('image', file);

            const response = await api.put('/users/me/image/update/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data?.image) {
                onImageChange?.(response.data.image);
                showToastMessage('PROFILE_IMAGE', 'UPDATE_SUCCESS');
            }
        } catch (error) {
            showErrorToast(error, 'Failed to upload profile image');
            console.error('Error uploading profile image:', error);
            onImageChange?.(null);
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
            await api.delete('/users/me/image/delete/');
            onImageChange?.(null);
            showToastMessage('PROFILE_IMAGE', 'REMOVE_SUCCESS');
        } catch (error) {
            showErrorToast(error, 'Failed to remove profile image');
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
                accept="image/jpeg,image/png,image/gif,image/webp"
                sx={{ display: 'none' }}
            />
        </Box>
    );
}
