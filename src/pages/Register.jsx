import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();
  const db = getFirestore();

  async function handleSubmit(e) {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    try {
      setError("");
      setLoading(true);
      await register(
        email,
        username,
        password,
        firstName,
        lastName,
        companyName
      );
      navigate("/login");
    } catch (error) {
      setError(error.message);
    }
    setLoading(false);
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
          }}
        >
          <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
            Human'Agement
          </Typography>
          {error && (
            <Alert severity="error" sx={{ width: "100%", mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
            <TextField
              margin="normal"
              required
              fullWidth
              name="username"
              label="Nom d'utilisateur"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <Box sx={{ display: "flex", flexDirection: "row", gap: 2 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                name="Nom"
                label="Nom"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="Prenom"
                label="Prenom"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </Box>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Adresse email"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Mot de passe"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirmer le mot de passe"
              type="password"
              id="confirmPassword"
              autoComplete="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="companyName"
              label="Nom de la société"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              Créer un compte
            </Button>
            <Button
              onClick={() => navigate("/login")}
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Connexion
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default Register;
