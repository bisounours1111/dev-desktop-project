import React from "react";
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  Paper,
  Avatar,
  IconButton,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import { getFirestore, doc, updateDoc } from "firebase/firestore";

function ProfilePage() {
  const navigate = useNavigate();
  const { currentUser, updateEmail, updatePassword, updateProfile, login } =
    useAuth();
  const [formData, setFormData] = React.useState({
    email: currentUser?.email || "",
    password: "",
    newPassword: "",
    confirmPassword: "",
    username: currentUser?.displayName || "",
    firstName: currentUser?.firstName || "",
    lastName: currentUser?.lastName || "",
  });
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState("profile");
  const [showCamera, setShowCamera] = React.useState(false);
  const [profileImage, setProfileImage] = React.useState(null);

  const db = getFirestore();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (section) => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      switch (section) {
        case "email":
          if (!formData.email) {
            throw new Error("L'email ne peut pas être vide");
          }
          await updateEmail(formData.email);
          setSuccess("Email mis à jour avec succès");
          break;

        case "password":
          if (
            !formData.password ||
            !formData.newPassword ||
            !formData.confirmPassword
          ) {
            throw new Error("Tous les champs sont requis");
          }
          if (formData.newPassword !== formData.confirmPassword) {
            throw new Error("Les mots de passe ne correspondent pas");
          }
          if (formData.newPassword.length < 6) {
            throw new Error(
              "Le mot de passe doit contenir au moins 6 caractères"
            );
          }
          if (await login(currentUser.email, formData.password)) {
            await updatePassword(formData.newPassword);
            setSuccess("Mot de passe mis à jour avec succès");
            break;
          } else {
            throw new Error("Le mot de passe actuel est incorrect");
          }

        case "username":
          if (!formData.username) {
            throw new Error("Le pseudo ne peut pas être vide");
          }
          await updateProfile({
            displayName: formData.username,
            firstName: formData.firstName,
            lastName: formData.lastName,
          });
          setSuccess("Profil mis à jour avec succès");
          break;

        default:
          break;
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const webcamRef = React.useRef(null);

  const uploadImage = async (imageSrc) => {
    if (!currentUser) return;

    const userDoc = doc(db, "users", currentUser.uid);
    await updateDoc(userDoc, {
      profileImageUrl: imageSrc,
    });

    setProfileImage(imageSrc);
    setSuccess("Photo de profil mise à jour avec succès");
  };

  const captureImage = React.useCallback(async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    console.log(imageSrc); // Pour debug
    setShowCamera(false);
    await uploadImage(imageSrc);
  }, [webcamRef]);

  const renderProfileSection = () => (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Avatar
          src={profileImage || currentUser.profileImageUrl}
          sx={{ width: 100, height: 100, mr: 2 }}
        />
        <Box>
          <Typography variant="h6">
            {currentUser?.firstName && currentUser?.lastName
              ? `${currentUser.firstName} ${currentUser.lastName} (${
                  currentUser?.displayName || "Utilisateur"
                })`
              : currentUser?.displayName || "Utilisateur"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {currentUser?.email}
          </Typography>
        </Box>
      </Box>
      <Button
        variant="outlined"
        onClick={() => setActiveSection("email")}
        sx={{ mr: 2 }}
      >
        Modifier l'email
      </Button>
      <Button
        variant="outlined"
        onClick={() => setActiveSection("password")}
        sx={{ mr: 2 }}
      >
        Changer le mot de passe
      </Button>
      <Button variant="outlined" onClick={() => setActiveSection("username")}>
        Modifier le profil
      </Button>
      <Button variant="outlined" onClick={() => setShowCamera(true)}>
        Prendre une photo de profil
      </Button>
    </Paper>
  );

  const renderEmailSection = () => (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Modifier l'email
      </Typography>
      <TextField
        fullWidth
        margin="normal"
        label="Nouvel email"
        name="email"
        value={formData.email}
        onChange={handleInputChange}
        disabled={loading}
      />
      <Box sx={{ mt: 2 }}>
        <Button
          variant="contained"
          onClick={() => handleSubmit("email")}
          disabled={loading}
          sx={{ mr: 2 }}
        >
          {loading ? "Enregistrement..." : "Enregistrer"}
        </Button>
        <Button
          variant="outlined"
          onClick={() => setActiveSection("profile")}
          disabled={loading}
        >
          Annuler
        </Button>
      </Box>
    </Paper>
  );

  const renderPasswordSection = () => (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Changer le mot de passe
      </Typography>
      <TextField
        fullWidth
        margin="normal"
        label="Mot de passe actuel"
        type="password"
        name="password"
        value={formData.password}
        onChange={handleInputChange}
        disabled={loading}
      />
      <TextField
        fullWidth
        margin="normal"
        label="Nouveau mot de passe"
        type="password"
        name="newPassword"
        value={formData.newPassword}
        onChange={handleInputChange}
        disabled={loading}
      />
      <TextField
        fullWidth
        margin="normal"
        label="Confirmer le mot de passe"
        type="password"
        name="confirmPassword"
        value={formData.confirmPassword}
        onChange={handleInputChange}
        disabled={loading}
      />
      <Box sx={{ mt: 2 }}>
        <Button
          variant="contained"
          onClick={() => handleSubmit("password")}
          disabled={loading}
          sx={{ mr: 2 }}
        >
          {loading ? "Enregistrement..." : "Enregistrer"}
        </Button>
        <Button
          variant="outlined"
          onClick={() => setActiveSection("profile")}
          disabled={loading}
        >
          Annuler
        </Button>
      </Box>
    </Paper>
  );

  const renderUsernameSection = () => (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Modifier le profil
      </Typography>
      <TextField
        fullWidth
        margin="normal"
        label="Prénom"
        name="firstName"
        value={formData.firstName}
        onChange={handleInputChange}
        disabled={loading}
      />
      <TextField
        fullWidth
        margin="normal"
        label="Nom"
        name="lastName"
        value={formData.lastName}
        onChange={handleInputChange}
        disabled={loading}
      />
      <TextField
        fullWidth
        margin="normal"
        label="Pseudo"
        name="username"
        value={formData.username}
        onChange={handleInputChange}
        disabled={loading}
      />
      <Box sx={{ mt: 2 }}>
        <Button
          variant="contained"
          onClick={() => handleSubmit("username")}
          disabled={loading}
          sx={{ mr: 2 }}
        >
          {loading ? "Enregistrement..." : "Enregistrer"}
        </Button>
        <Button
          variant="outlined"
          onClick={() => setActiveSection("profile")}
          disabled={loading}
        >
          Annuler
        </Button>
      </Box>
    </Paper>
  );

  const renderCameraSection = () => (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Prendre une photo de profil
      </Typography>
      <Webcam
        audio={false}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={{ facingMode: "user" }}
      />
      <Box sx={{ mt: 2 }}>
        <Button variant="contained" onClick={captureImage} sx={{ mr: 2 }}>
          Capturer
        </Button>
        <Button variant="outlined" onClick={() => setShowCamera(false)}>
          Annuler
        </Button>
      </Box>
    </Paper>
  );

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <IconButton
            onClick={() => navigate(-1)}
            sx={{ mr: 2 }}
            aria-label="retour"
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1">
            Mon Profil
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {activeSection === "profile" && renderProfileSection()}
        {activeSection === "email" && renderEmailSection()}
        {activeSection === "password" && renderPasswordSection()}
        {activeSection === "username" && renderUsernameSection()}
        {showCamera && renderCameraSection()}
      </Box>
    </Container>
  );
}

export default ProfilePage;
