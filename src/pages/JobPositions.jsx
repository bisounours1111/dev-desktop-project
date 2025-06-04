import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  addDoc,
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

export default function JobPositions() {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const [positions, setPositions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPosition, setEditingPosition] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    salary: "",
    categoryId: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const db = getFirestore();

  useEffect(() => {
    if (!currentUser || userRole <= 1) {
      navigate("/");
      return;
    }
    fetchPositions();
    fetchCategories();
  }, [currentUser, userRole]);

  const fetchCategories = async () => {
    try {
      const categoriesRef = collection(db, "jobCategories");
      const q = query(
        categoriesRef,
        where("companyName", "==", currentUser?.companyName)
      );
      const querySnapshot = await getDocs(q);
      const categoriesList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategories(categoriesList);
    } catch (error) {
      console.error("Erreur lors du chargement des catégories:", error);
    }
  };

  const fetchPositions = async () => {
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
      setPositions(positionsList);
    } catch (error) {
      setError("Erreur lors du chargement des postes");
      console.error("Erreur:", error);
    }
  };

  const handleOpenDialog = (position = null) => {
    if (position) {
      setEditingPosition(position);
      setFormData({
        title: position.title,
        description: position.description,
        requirements: position.requirements,
        salary: position.salary,
        categoryId: position.categoryId || "",
      });
    } else {
      setEditingPosition(null);
      setFormData({
        title: "",
        description: "",
        requirements: "",
        salary: "",
        categoryId: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPosition(null);
    setFormData({
      title: "",
      description: "",
      requirements: "",
      salary: "",
      categoryId: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const positionData = {
        ...formData,
        companyName: currentUser.companyName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editingPosition) {
        await updateDoc(
          doc(db, "jobPositions", editingPosition.id),
          positionData
        );
        setSuccess("Poste mis à jour avec succès");
      } else {
        await addDoc(collection(db, "jobPositions"), positionData);
        setSuccess("Poste créé avec succès");
      }

      handleCloseDialog();
      fetchPositions();
    } catch (error) {
      setError("Erreur lors de la sauvegarde du poste");
      console.error("Erreur:", error);
    }
  };

  const handleDelete = async (positionId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce poste ?")) {
      try {
        await deleteDoc(doc(db, "jobPositions", positionId));
        setSuccess("Poste supprimé avec succès");
        fetchPositions();
      } catch (error) {
        setError("Erreur lors de la suppression du poste");
        console.error("Erreur:", error);
      }
    }
  };

  const filteredPositions = positions.filter((position) => {
    if (!selectedCategory) return true;
    return position.categoryId === selectedCategory;
  });

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4">Gestion des Postes</Typography>
        {userRole > 1 && (
          <Box>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleOpenDialog()}
            >
              Ajouter un Poste
            </Button>
          </Box>
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

      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filtrer par catégorie</InputLabel>
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            label="Filtrer par catégorie"
          >
            <MenuItem value="">
              <em>Toutes les catégories</em>
            </MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {filteredPositions.map((position) => (
          <Grid item xs={12} md={6} lg={4} key={position.id}>
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
                    {position.title}
                  </Typography>
                  {userRole > 1 && (
                    <Box>
                      <IconButton
                        onClick={() => handleOpenDialog(position)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(position.id)}
                        size="small"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  )}
                </Box>
                <Typography color="textSecondary" gutterBottom>
                  Catégorie:{" "}
                  {categories.find((c) => c.id === position.categoryId)?.name ||
                    "Non catégorisé"}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  Salaire: {position.salary}
                </Typography>
                <Typography variant="body2" paragraph>
                  {position.description}
                </Typography>
                <Typography variant="subtitle2" color="textSecondary">
                  Prérequis:
                </Typography>
                <Typography variant="body2">{position.requirements}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {userRole > 1 && (
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            {editingPosition ? "Modifier le Poste" : "Ajouter un Poste"}
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <FormControl fullWidth margin="normal">
                <InputLabel>Catégorie</InputLabel>
                <Select
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryId: e.target.value })
                  }
                  label="Catégorie"
                >
                  <MenuItem value="">
                    <em>Aucune</em>
                  </MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Titre du poste"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                margin="normal"
                multiline
                rows={3}
              />
              <TextField
                fullWidth
                label="Prérequis"
                value={formData.requirements}
                onChange={(e) =>
                  setFormData({ ...formData, requirements: e.target.value })
                }
                margin="normal"
                multiline
                rows={2}
              />
              <TextField
                fullWidth
                label="Salaire"
                value={formData.salary}
                onChange={(e) =>
                  setFormData({ ...formData, salary: e.target.value })
                }
                margin="normal"
                required
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Annuler</Button>
              <Button type="submit" variant="contained" color="primary">
                {editingPosition ? "Mettre à jour" : "Créer"}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      )}
    </Box>
  );
}
