import {Button, Card, Col, Row} from "react-bootstrap";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faImage} from '@fortawesome/free-solid-svg-icons';
import UseDarkMode from "../utils/UseDarkMode";

const BlogPostCard = ({post}) => {
    const {bgClass, textClass, linkClass} = UseDarkMode();

    // Determine the background color based on the post's accent_color
    const getBackgroundColor = () => {
        // Check if accent_color is provided and is a valid hex color
        if (post.accent_color && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(post.accent_color)) {
            return post.accent_color;
        }
        return "#e0e0e0";
    };

    return (
        <Card
            className={`my-4 shadow rounded-3 ${bgClass} ${textClass}`}
            id={`post-${post.id}`}
        >
            {
                post.image ?
                    <Card.Img variant="top" src={post.image}/> :
                    <div
                        className="d-flex align-items-center justify-content-center"
                        style={{height: 200, backgroundColor: `${getBackgroundColor()}`}}
                    >
                        <FontAwesomeIcon icon={faImage} size="3x"/>
                    </div>
            }
            <Card.Body className="p-4">
                <Row className="mb-2">
                    <Col className="d-flex flex-column justify-content-between pr-2 text-start">
                        <Card.Title className="mb-1">
                            <Card.Link
                                href={`/blog/posts/${post.id}`}
                                className={`${linkClass} text-decoration-none`}
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
                            />
                            <Card.Link
                                href={`/users/${post.author.username}`}
                                className={`${linkClass} text-decoration-none`}
                            >
                                <span className="fs-6">{post.author.username}</span>
                            </Card.Link>
                        </div>
                    </Col>
                    <Col xs="auto" className="d-flex align-items-center">
                        <Button variant="primary" href={`/blog/posts/${post.id}`} className="shadow">Go!</Button>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    );
};

export default BlogPostCard;
