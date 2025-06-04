import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import PerformerDetail from "./pages/PerformerDetail";
import EventDetail from "./pages/EventDetail";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Register from "./pages/Register";
import { Box } from "@mui/material";
import ProfilePage from "./pages/ProfilePage";

const theme = createTheme({
  palette: {
    primary: {
      main: "#FF4081",
    },
    secondary: {
      main: "#7C4DFF",
    },
  },
});

const PrivateRoute = ({ children }) => {
  const { currentUser } = useAuth();

  if (currentUser === null) {
    return <Navigate to="/login" />;
  }
  return children;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <Routes>
          <Route
            path="/login"
            element={
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: "100vh",
                }}
              >
                <Login />
              </Box>
            }
          />
          <Route
            path="/forgotpassword"
            element={
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: "100vh",
                }}
              >
                <ForgotPassword />
              </Box>
            }
          />
          <Route
            path="/register"
            element={
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: "100vh",
                }}
              >
                <Register />
              </Box>
            }
          />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/performer/:id"
            element={
              <PrivateRoute>
                <PerformerDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/event/:id"
            element={
              <PrivateRoute>
                <EventDetail />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
