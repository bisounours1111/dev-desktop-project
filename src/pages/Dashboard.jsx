import React from "react";
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Button,
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import EmployeesList from "./EmployeesList";
import WeeklySchedule from "./WeeklySchedule";
import JobPositions from "./JobPositions";
import JobCategories from "./JobCategories";

function Dashboard() {
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = React.useState(0);
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const handleProfileClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }
  };

  const handleNavigateToProfile = () => {
    handleProfileClose();
    navigate("/profile");
  };

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          mt: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Tableau de bord
          </Typography>
          <Typography variant="body1" gutterBottom>
            Bienvenue, {currentUser?.firstName}
          </Typography>

          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              throw new Error("test");
            }}
          >
            Test
          </Button>
        </Box>

        <IconButton onClick={handleProfileClick}>
          <Avatar>{currentUser?.email?.[0]?.toUpperCase()}</Avatar>
        </IconButton>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileClose}
      >
        <MenuItem onClick={handleNavigateToProfile}>Voir le profil</MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
          Se déconnecter
        </MenuItem>
      </Menu>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mt: 3 }}>
        <Tabs value={selectedTab} onChange={handleTabChange}>
          <Tab label="Planning Hebdomadaire" />
          {userRole > 1 && <Tab label="Employés" />}
          {userRole > 1 && <Tab label="Gestion des Postes" />}
          {userRole > 1 && <Tab label="Gestion des Catégories" />}
        </Tabs>
      </Box>

      <Box sx={{ mt: 3 }}>
        {selectedTab === 0 && <WeeklySchedule />}
        {selectedTab === 1 && userRole > 1 && <EmployeesList />}
        {selectedTab === 2 && userRole > 1 && <JobPositions />}
        {selectedTab === 3 && userRole > 1 && <JobCategories />}
      </Box>
    </Container>
  );
}

export default Dashboard;
