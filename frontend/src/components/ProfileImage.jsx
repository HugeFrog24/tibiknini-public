import React, { useState, useEffect } from "react";
import { Button, Dropdown, DropdownButton } from "react-bootstrap";
import { PhotoCamera, Delete, Upload } from '@mui/icons-material';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Avatar from '@mui/material/Avatar';

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
    const [showDropdown, setShowDropdown] = useState(false);
    const [hideDropdownTimeout, setHideDropdownTimeout] = useState(null);

    // Calculate font size based on avatar dimensions
    const fontSize = Math.min(Number(width), Number(height)) / 2;

    const handleDocumentClick = (e) => {
        if (!e.target.closest("#profile-image-dropdown")) {
            setShowDropdown(false);
        }
    };

    const handleMouseEnter = () => {
        setIsHovered(showOptions);
        setShowDropdown(showOptions);
        if (hideDropdownTimeout) {
            clearTimeout(hideDropdownTimeout);
            setHideDropdownTimeout(null);
        }
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        const timeout = setTimeout(() => {
            setShowDropdown(false);
        }, 300);
        setHideDropdownTimeout(timeout);
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
        if (showDropdown) {
            document.addEventListener("click", handleDocumentClick);
        } else {
            document.removeEventListener("click", handleDocumentClick);
        }
        return () => {
            document.removeEventListener("click", handleDocumentClick);
        };
    }, [showDropdown]);

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
                        <DropdownButton
                            show={showDropdown}
                            title={<PhotoCamera />}
                            variant="light"
                            className="rounded-circle"
                        >
                            <Dropdown.Item onClick={() => fileInputRef.current.click()}>
                                <Upload className="me-2" /> Upload
                            </Dropdown.Item>
                            {imageSrc && (
                                <Dropdown.Item onClick={onImageDelete} className="text-danger">
                                    <Delete className="me-2" /> Remove
                                </Dropdown.Item>
                            )}
                        </DropdownButton>
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
