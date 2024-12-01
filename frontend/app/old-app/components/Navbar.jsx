import React, { useContext, useState } from "react";
import UserContext from "./contexts/UserContext";
import { useLocation, useNavigate, Link } from "@remix-run/react";
import {
  AppBar,
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  useTheme,
  Slide,
  useScrollTrigger,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import BookIcon from "@mui/icons-material/Book";
import EmailIcon from "@mui/icons-material/Email";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import SettingsIcon from "@mui/icons-material/Settings";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import config from '../config.json';
import { handleLogout } from '../utils/auth';

function HideOnScroll(props) {
  const { children } = props;
  const trigger = useScrollTrigger();

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
}

const NavigationBar = ({ toggleDarkMode }) => {
  const theme = useTheme();
  const { user, isAuthenticated, updateUser } = useContext(UserContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const navItems = [
    { path: "/", icon: <HomeIcon />, label: "Home" },
    { path: "/blog", icon: <BookIcon />, label: "Blog" },
    { path: "/contact", icon: <EmailIcon />, label: "Contact" },
  ];

  const renderNavLinks = () => (
    <Box sx={{ display: { xs: 'none', sm: 'flex' } }}>
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          style={{
            textDecoration: 'none',
            color: 'inherit',
            backgroundColor: location.pathname === item.path ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
          }}
        >
          <Button
            color="inherit"
            sx={{
              px: 2,
              py: 1,
              display: 'flex',
              alignItems: 'center',
              ...(location.pathname === item.path && {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              })
            }}
          >
            {item.icon}
            <Typography variant="button" sx={{ ml: 1 }}>{item.label}</Typography>
          </Button>
        </Link>
      ))}
    </Box>
  );

  const renderUserSection = () => (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {isAuthenticated ? (
        <>
          <IconButton onClick={toggleDarkMode} color="inherit">
            {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
          <IconButton
            onClick={handleMenu}
            color="inherit"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
          >
            <AccountCircleIcon />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            keepMounted
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem disabled>{user.username}</MenuItem>
            <MenuItem onClick={() => { handleClose(); navigate("/users/me"); }}>
              <ListItemIcon>
                <AccountCircleIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Profile</ListItemText>
            </MenuItem>
            {user.is_staff && (
              <MenuItem onClick={() => { handleClose(); navigate("/admin"); }}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Admin console</ListItemText>
              </MenuItem>
            )}
            <MenuItem onClick={() => { handleClose(); navigate("/settings"); }}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Settings</ListItemText>
            </MenuItem>
            <MenuItem onClick={onLogout}>
              <ListItemIcon>
                <ExitToAppIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </>
      ) : (
        <Button
          variant="outlined"
          color="inherit"
          startIcon={<ExitToAppIcon />}
          onClick={() => navigate("/login")}
        >
          Login
        </Button>
      )}
    </Box>
  );

  const onLogout = async () => {
    handleClose();
    await handleLogout(navigate, updateUser);
  };

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ width: 250 }}>
      <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        {config.siteName}
      </Typography>
      <List>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <Link
              to={item.path}
              style={{
                textDecoration: 'none',
                color: 'inherit',
                width: '100%'
              }}
            >
              <Button
                fullWidth
                sx={{
                  justifyContent: 'flex-start',
                  px: 3,
                  py: 1,
                  ...(location.pathname === item.path && {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  })
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </Button>
            </Link>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <HideOnScroll>
      <AppBar position="sticky">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ display: { xs: 'none', sm: 'block' } }}>
                {config.siteName}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {renderNavLinks()}
            {renderUserSection()}
          </Box>
        </Toolbar>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
          }}
        >
          {drawer}
        </Drawer>
      </AppBar>
    </HideOnScroll>
  );
};

export default NavigationBar;