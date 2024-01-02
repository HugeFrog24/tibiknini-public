import {Button, Card, Col, Row} from "react-bootstrap";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faImage} from '@fortawesome/free-solid-svg-icons';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { handleProfileImageError } from '../utils/ImageUtils';
import DarkModeContext from "./contexts/DarkModeContext";

const BlogPostCard = ({post}) => {
    const { modeClasses } = useContext(DarkModeContext);
    const navigate = useNavigate();

    // Determine the background color based on the post's accent_color
    const getBackgroundColor = () => {
        // Check if accent_color is provided and is a valid hex color
        if (post.accent_color && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(post.accent_color)) {
            return post.accent_color;
        }
        return "#e0e0e0";
    };

    if (!post) {
        return (
            <Card className={`my-4 shadow rounded-3 ${modeClasses.bgClass} ${modeClasses.textClass}`}>
                <Skeleton height={200} />
                <Card.Body className="p-4">
                    <Row className="mb-2">
                        <Col className="d-flex flex-column justify-content-between pr-2 text-start">
                            <Skeleton height={20} width={"60%"} />
                            <div className="d-flex align-items-center gap-3 mt-3">
                                <Skeleton circle={true} height={32} width={32} />
                                <Skeleton width={"50%"} height={16}  containerClassName="flex-grow-1" />
                            </div>
                        </Col>
                        <Col xs="auto" className="d-flex align-items-center">
                            <Skeleton className="mt-3" height={40} width={50} />
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
            );
    }

    return (
        <Card
            className={`my-4 shadow rounded-3 ${modeClasses.bgClass} ${modeClasses.textClass}`}
            id={`post-${post.id}`}
        >
            {
                post.image ?
                    <div
                        onClick={() => navigate(`/blog/posts/${post.id}`)}
                        style={{ cursor: 'pointer' }}
                        >
                        <Card.Img variant="top" src={post.image} />
                    </div> :
                    <div
                        onClick={() => navigate(`/blog/posts/${post.id}`)} // Added onClick here
                        className="d-flex align-items-center justify-content-center"
                        style={{ cursor: 'pointer', height: 200, backgroundColor: `${getBackgroundColor()}` }}
                        >
                        <FontAwesomeIcon icon={faImage} size="3x"/>
                    </div>
            }
            <Card.Body className="p-4">
                <Row className="mb-2">
                    <Col className="d-flex flex-column justify-content-between pr-2 text-start">
                        <Card.Title className="mb-1">
                            <Card.Link
                                onClick={() => navigate(`/blog/posts/${post.id}`)}
                                className={`${modeClasses.linkClass} text-decoration-none`}
                                style={{ cursor: 'pointer' }}
                            >
                                {post.title}
                            </Card.Link>
                        </Card.Title>
                        <div className="d-flex align-items-center gap-3">
                            <img
                                src={post.author.image}
                                alt={post.author.username}
                                className="rounded-circle"
                                width="32"
                                height="32"
                                onError={handleProfileImageError}
                            />
                            <Card.Link
                                onClick={() => navigate(`/users/${post.author.username}`)}
                                className={`${modeClasses.linkClass} text-decoration-none`}
                                style={{ cursor: 'pointer' }}
                            >
                                <span className="fs-6">{post.author.username}</span>
                            </Card.Link>
                        </div>
                    </Col>
                    <Col xs="auto" className="d-flex align-items-center">
                       <Button
                            variant="primary"
                            onClick={() => navigate(`/blog/posts/${post.id}`)}
                            className="shadow"
                       >
                           Go!
                       </Button>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
};

export default BlogPostCard;
