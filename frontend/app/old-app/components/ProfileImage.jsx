import React, { useState, useEffect } from "react";
import { Button, Menu, MenuItem, IconButton } from '@mui/material';
import { PhotoCamera, Delete, Upload } from '@mui/icons-material';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Avatar } from '@mui/material'

function ProfileImage({
    imageSrc,
    imageAlt,
    width,
    height,
    showOptions,
    onImageUpload,
    onImageDelete,
    fileInputRef,
}) {
    const [isHovered, setIsHovered] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);

    // Calculate font size based on avatar dimensions
    const fontSize = Math.min(Number(width), Number(height)) / 2;

    const handleDocumentClick = (e) => {
        if (!e.target.closest("#profile-image-dropdown")) {
            setAnchorEl(null);
        }
    };

    const handleMouseEnter = () => {
        setIsHovered(showOptions);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
    };

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleFileInputChange = (e) => {
        const file = e.target.files[0];
        if (file.size > 2 * 1024 * 1024) {  // 2 MB
            toast.error('Image size must be less than 2 MB');
            e.target.value = '';  // Clear the selected file
        } else {
            onImageUpload(e);
            fileInputRef.current.value = "";
        }
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
        <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            style={showOptions ? {cursor: "pointer"} : {}}
            >
            <div className="position-relative">
                <Button
                    style={{
                    background: "none",
                        border: "none",
                        padding: 0,
                        textDecoration: "none",
                        cursor: showOptions ? "pointer" : "default",
                    }}
                    >
                    <Avatar
                        src={imageSrc}
                        alt={imageAlt}
                        sx={{
                            width: width,
                            height: height,
                            fontSize: `${fontSize}px`,
                            fontWeight: 'bold'
                        }}
                        className={`shadow ${isHovered ? "opacity-50" : ""}`}
                    >
                        {imageAlt.charAt(0).toUpperCase()}
                    </Avatar>
                </Button>
                {isHovered && showOptions && (
                    <div
                        id="profile-image-dropdown"
                        className="position-absolute top-50 start-50 translate-middle"
                        style={{ zIndex: 1000 }}
                    >
                        <IconButton
                            onClick={handleClick}
                            size="small"
                            sx={{ 
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' }
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
                                fileInputRef.current.click();
                                handleClose();
                            }}>
                                <Upload sx={{ mr: 1 }} /> Upload
                            </MenuItem>
                            {imageSrc && (
                                <MenuItem onClick={() => {
                                    onImageDelete();
                                    handleClose();
                                }} sx={{ color: 'error.main' }}>
                                    <Delete sx={{ mr: 1 }} /> Remove
                                </MenuItem>
                            )}
                        </Menu>
                    </div>
                )}
            </div>
            <input
                id="file-input"
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept="image/*"
                style={{display: "none"}}
            />
        </div>
        );
}

export default ProfileImage;
