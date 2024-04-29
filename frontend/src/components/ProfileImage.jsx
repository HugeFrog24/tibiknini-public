import {useEffect, useState} from "react";
import {Button, Dropdown, DropdownButton} from "react-bootstrap";
import {faCamera, faTrash, faUpload,} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { handleProfileImageError } from '../utils/ImageUtils';

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
                    <img
                        src={imageSrc}
                        className={`rounded-circle shadow ${isHovered ? "opacity-50" : ""}`}
                        alt={imageAlt}
                        width={width}
                        height={height}
                        onError={handleProfileImageError}
                    />
                </Button>
                {isHovered && showOptions && (
                    <div className="position-absolute top-50 start-50 translate-middle">
                        <FontAwesomeIcon icon={faCamera} size="2x"/>
                    </div>
                    )}
            </div>
            {showOptions && (
                <>
                <DropdownButton
                    id="profile-image-dropdown"
                    title=""
                    variant="none"
                    className="align-self-end"
                    show={showDropdown}
                    style={{zIndex: 100}}
                    >
                    <Dropdown.Item
                        onClick={() => {
                        setShowDropdown(false);
                        fileInputRef.current.click();
                    }}
                        >
                        <FontAwesomeIcon icon={faUpload} className="me-2"/>
                        Upload photo
                    </Dropdown.Item>
                    <Dropdown.Item
                        className="text-danger"
                        onClick={() => {
                        setShowDropdown(false);
                        onImageDelete();
                    }}
                        >
                        <FontAwesomeIcon icon={faTrash} className="me-2"/>
                        Delete photo
                    </Dropdown.Item>
                </DropdownButton>
                <input
                    id="file-input"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                    accept="image/*"
                    style={{display: "none"}} // Add this line to hide the input element
                />
                </>
                )}
        </div>
        );
}

export default ProfileImage;