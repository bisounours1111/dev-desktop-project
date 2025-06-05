import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Grid,
  IconButton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { getAuth } from "firebase/auth";

export default function EmployeesList() {
  const { currentUser, userRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [jobPositions, setJobPositions] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    firstName: "",
    lastName: "",
    companyName: "",
    role: "1", // 1: Employé, 2: Manager, 3: Admin
    positionId: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tempPassword, setTempPassword] = useState("");

  const db = getFirestore();
  const auth = getAuth();

  useEffect(() => {
    fetchUsers();
    fetchJobPositions();
  }, [currentUser, userRole]);

  const fetchJobPositions = async () => {
    try {
      const positionsRef = collection(db, "jobPositions");
      const q = query(
        positionsRef,
        where("companyName", "==", currentUser?.companyName)
      );
      const querySnapshot = await getDocs(q);
      const positionsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setJobPositions(positionsList);
    } catch (error) {
      console.error("Erreur lors du chargement des postes:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("companyName", "==", currentUser?.companyName)
      );
      const querySnapshot = await getDocs(q);
      const usersList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersList);
    } catch (error) {
      setError("Erreur lors du chargement des utilisateurs");
      console.error("Erreur:", error);
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        email: user.email,
        username: user.username,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        companyName: user.companyName,
        role: user.role || "1",
        positionId: user.positionId || "",
        phone: user.phone || "",
      });
    } else {
      setSelectedUser(null);
      setFormData({
        email: "",
        username: "",
        firstName: "",
        lastName: "",
        companyName: currentUser.companyName,
        role: "1",
        positionId: "",
        phone: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setFormData({
      email: "",
      username: "",
      firstName: "",
      lastName: "",
      companyName: "",
      role: "1",
      positionId: "",
      phone: "",
    });
    setTempPassword("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      if (selectedUser) {
        // Mise à jour d'un utilisateur existant
        await updateDoc(doc(db, "users", selectedUser.id), {
          ...formData,
          updatedAt: new Date().toISOString(),
        });
        setSuccess("Utilisateur mis à jour avec succès");
      } else {
        // Création d'un nouvel utilisateur via l'API backend
        const response = await fetch("http://127.0.0.1:5000/createuser", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userData: {
              ...formData,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();

          throw new Error(
            errorData.message || "Erreur lors de la création de l'utilisateur"
          );
        }

        const { uid, tempPassword } = await response.json();
        setTempPassword(tempPassword);
        setSuccess(
          "Utilisateur créé avec succès. Un email a été envoyé avec les instructions de connexion."
        );
      }

      handleCloseDialog();
      fetchUsers();
    } catch (error) {
      setError(error.message);
      console.error("Erreur:", error);
    }
  };

  const handleDelete = async (userId) => {
    if (
      window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")
    ) {
      try {
        await deleteDoc(doc(db, "users", userId));
        setSuccess("Utilisateur supprimé avec succès");
        fetchUsers();
      } catch (error) {
        setError("Erreur lors de la suppression de l'utilisateur");
        console.error("Erreur:", error);
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4">Gestion des Employés</Typography>
        {userRole > 1 && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleOpenDialog()}
          >
            Ajouter un Employé
          </Button>
        )}
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

      <Grid container spacing={3}>
        {users.map((user) => (
          <Grid item xs={12} md={6} lg={4} key={user.id}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <Typography variant="h6" gutterBottom>
                    {user.firstName} {user.lastName}
                  </Typography>
                  {userRole > 1 && (
                    <Box>
                      <IconButton
                        onClick={() => handleOpenDialog(user)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(user.id)}
                        size="small"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  )}
                </Box>
                <Typography color="textSecondary" gutterBottom>
                  Nom d'utilisateur: {user.username}
                </Typography>
                <Typography
                  color="textSecondary"
                  gutterBottom
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(user.email);
                      setSuccess("Email copié dans le presse-papiers");
                    } catch (err) {
                      // Méthode alternative de copie
                      const textArea = document.createElement("textarea");
                      textArea.value = user.email;
                      document.body.appendChild(textArea);
                      textArea.select();
                      try {
                        document.execCommand("copy");
                        setSuccess("Email copié dans le presse-papiers");
                      } catch (err) {
                        setError("Impossible de copier l'email");
                      }
                      document.body.removeChild(textArea);
                    }
                  }}
                  style={{ cursor: "pointer" }}
                >
                  Email: {user.email}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  Rôle:{" "}
                  {user.role === "1"
                    ? "Employé"
                    : user.role === "2"
                    ? "Manager"
                    : "Admin"}
                </Typography>
                {user.positionId && (
                  <Typography color="textSecondary" gutterBottom>
                    Poste:{" "}
                    {jobPositions.find((p) => p.id === user.positionId)
                      ?.title || "Non assigné"}
                  </Typography>
                )}
                {user.phone && (
                  <Typography color="textSecondary" gutterBottom>
                    Téléphone: {user.phone}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedUser ? "Modifier" : "Ajouter"} un employé
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              label="Nom d'utilisateur"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Prénom"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Nom"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              margin="normal"
              required
            />

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              margin="normal"
              required
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Poste</InputLabel>
              <Select
                value={formData.positionId}
                onChange={(e) =>
                  setFormData({ ...formData, positionId: e.target.value })
                }
                label="Poste"
              >
                <MenuItem value="">
                  <em>Aucun</em>
                </MenuItem>
                {jobPositions.map((position) => (
                  <MenuItem key={position.id} value={position.id}>
                    {position.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
              <InputLabel>Rôle</InputLabel>
              <Select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                label="Rôle"
              >
                <MenuItem value="1">Employé</MenuItem>
                <MenuItem value="2">Manager</MenuItem>
                <MenuItem value="3">Admin</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Téléphone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              margin="normal"
            />

            {selectedUser && (
              <Button
                onClick={() => {
                  sendPasswordResetEmail(auth, formData.email);
                  setSuccess(
                    "Un email de réinitialisation de mot de passe a été envoyé"
                  );
                }}
                sx={{ mt: 2 }}
              >
                Réinitialiser le mot de passe
              </Button>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Annuler</Button>
            <Button type="submit" variant="contained" color="primary">
              {selectedUser ? "Mettre à jour" : "Créer"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
