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
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

export default function JobCategories() {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const db = getFirestore();

  useEffect(() => {
    if (!currentUser || userRole <= 1) {
      navigate("/");
      return;
    }
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
      setError("Erreur lors du chargement des catégories");
      console.error("Erreur:", error);
    }
  };

  const handleOpenDialog = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        description: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const categoryData = {
        ...formData,
        companyName: currentUser.companyName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editingCategory) {
        await updateDoc(
          doc(db, "jobCategories", editingCategory.id),
          categoryData
        );
        setSuccess("Catégorie mise à jour avec succès");
      } else {
        await addDoc(collection(db, "jobCategories"), categoryData);
        setSuccess("Catégorie créée avec succès");
      }

      handleCloseDialog();
      fetchCategories();
    } catch (error) {
      setError("Erreur lors de la sauvegarde de la catégorie");
      console.error("Erreur:", error);
    }
  };

  const handleDelete = async (categoryId) => {
    if (
      window.confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?")
    ) {
      try {
        await deleteDoc(doc(db, "jobCategories", categoryId));
        setSuccess("Catégorie supprimée avec succès");
        fetchCategories();
      } catch (error) {
        setError("Erreur lors de la suppression de la catégorie");
        console.error("Erreur:", error);
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4">Gestion des Catégories</Typography>
        {userRole > 1 && (
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleOpenDialog()}
          >
            Ajouter une Catégorie
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
        {categories.map((category) => (
          <Grid item xs={12} md={6} lg={4} key={category.id}>
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
                    {category.name}
                  </Typography>
                  {userRole > 1 && (
                    <Box>
                      <IconButton
                        onClick={() => handleOpenDialog(category)}
                        size="small"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleDelete(category.id)}
                        size="small"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  )}
                </Box>
                <Typography variant="body2">{category.description}</Typography>
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
            {editingCategory
              ? "Modifier la Catégorie"
              : "Ajouter une Catégorie"}
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <TextField
                fullWidth
                label="Nom de la catégorie"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
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
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Annuler</Button>
              <Button type="submit" variant="contained" color="primary">
                {editingCategory ? "Mettre à jour" : "Créer"}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      )}
    </Box>
  );
}
