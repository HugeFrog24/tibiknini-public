# Tibik-Nini

This project is a multi-user blog platform, utilizing Django for the backend and React for the frontend. The goal is to connect minds and voices from across the globe.

## Tech Stack
### Containerization
| Technology | Path | Description |
|------------|------|-------------|
| ![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=flat-square&logo=docker&logoColor=white) | Root Directory, [`backend`](./backend) directory, [`nginx`](./nginx) directory | Docker is used to containerize the application, ensuring consistent performance in different environments. It includes Docker configuration files for the frontend, backend, and NGINX server. |

### Frontend
| Technology | Path | Description |
|------------|------|-------------|
| ![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat-square&logo=react&logoColor=%2361DAFB) | [`frontend`](./frontend) directory | The frontend utilizes React, a popular JavaScript library, along with libraries like react-bootstrap, axios, formik, and yup for UI components, HTTP requests, form handling, and validation, respectively. |

### Backend
| Technology | Path | Description |
|------------|------|-------------|
| ![Django](https://img.shields.io/badge/django-%23092E20.svg?style=flat-square&logo=django&logoColor=white) | [`backend`](./backend) directory | The backend is developed using Django, a high-level Python web framework, managing data and server-side logic. |

## Features

- Content Management:
    - Create, edit, update, and delete posts.
    - Customizable profile, including the ability to upload profile pictures and add a personal bio.
- User Interaction:
    - Login and registration functionalities.
    - Users can follow each other.
    - Users can like and comment on posts.
- Design Considerations:
    - Platform- and environment-agnostic.
    - Dark Mode support.

## TODO
- [ ] Test the project in different configurations and environments to improve stability.
- [ ] Create an Out of Box Experience (OOBE) for the site’s first launch.

## Contributing
Contributions are welcome. For major changes, please open a pull request to discuss what you would like to change.
