import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import {
  LocalizationProvider,
  DatePicker,
  TimePicker,
} from "@mui/x-date-pickers";
import { fr } from "date-fns/locale";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { useAuth } from "../contexts/AuthContext";
function Schedule() {
  const { currentUser } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [performers, setPerformers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [formData, setFormData] = useState({
    performerId: "",
    title: "",
    start: new Date(),
    end: new Date(),
    color: "#3788d8",
    notes: "",
    type: "performance",
  });

  const db = getFirestore();

  useEffect(() => {
    loadPerformers();
    loadShifts();
  }, []);

  const loadPerformers = async () => {
    const q = query(
      collection(db, "performers"),
      where("companyId", "==", currentUser.companyId)
    );
    const querySnapshot = await getDocs(q);
    const performersList = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    console.log(performersList);
    setPerformers(performersList);
  };

  const loadShifts = async () => {
    const querySnapshot = await getDocs(collection(db, "shifts"));
    const shiftsList = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        start: new Date(data.start),
        end: new Date(data.end),
        color: data.color,
        notes: data.notes,
        performerId: data.performerId,
        type: data.type || "performance",
        extendedProps: {
          performerName:
            performers.find((p) => p.id === data.performerId)?.stageName ||
            "Inconnue",
        },
      };
    });
    setShifts(shiftsList);
  };

  const handleOpenDialog = (shift = null) => {
    if (shift) {
      setSelectedShift(shift);
      setFormData({
        performerId: shift.performerId,
        title: shift.title,
        start: new Date(shift.start),
        end: new Date(shift.end),
        color: shift.color,
        notes: shift.notes,
        type: shift.type,
      });
    } else {
      setSelectedShift(null);
      setFormData({
        performerId: "",
        title: "",
        start: new Date(),
        end: new Date(),
        color: "#3788d8",
        notes: "",
        type: "performance",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedShift(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const shiftData = {
        ...formData,
        start: formData.start.toISOString(),
        end: formData.end.toISOString(),
      };

      if (selectedShift) {
        await updateDoc(doc(db, "shifts", selectedShift.id), shiftData);
      } else {
        await addDoc(collection(db, "shifts"), shiftData);
      }
      handleCloseDialog();
      loadShifts();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce créneau ?")) {
      try {
        await deleteDoc(doc(db, "shifts", id));
        loadShifts();
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
      }
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h4" component="h1">
            Emplois du temps
          </Typography>
          <Button variant="contained" onClick={() => handleOpenDialog()}>
            Ajouter un créneau
          </Button>
        </Box>

        <Grid container spacing={2}>
          {shifts.map((shift) => {
            const performer = performers.find(
              (p) => p.id === shift.performerId
            );
            return (
              <Grid item xs={12} md={6} lg={4} key={shift.id}>
                <Paper sx={{ p: 2, borderLeft: `4px solid ${shift.color}` }}>
                  <Typography variant="h6">{performer?.stageName}</Typography>
                  <Typography variant="subtitle1">{shift.title}</Typography>
                  <Typography>
                    Date: {new Date(shift.start).toLocaleDateString()}
                  </Typography>
                  <Typography>
                    De: {new Date(shift.start).toLocaleTimeString()}
                  </Typography>
                  <Typography>
                    À: {new Date(shift.end).toLocaleTimeString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Type:{" "}
                    {shift.type === "performance"
                      ? "Performance"
                      : "Disponibilité"}
                  </Typography>
                  {shift.notes && (
                    <Typography variant="body2" color="text.secondary">
                      Notes: {shift.notes}
                    </Typography>
                  )}
                  <Box sx={{ mt: 2 }}>
                    <Button
                      size="small"
                      onClick={() => handleOpenDialog(shift)}
                      sx={{ mr: 1 }}
                    >
                      Modifier
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleDelete(shift.id)}
                    >
                      Supprimer
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Box>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {selectedShift ? "Modifier" : "Ajouter"} un créneau
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <LocalizationProvider
              dateAdapter={AdapterDateFns}
              adapterLocale={fr}
            >
              <FormControl fullWidth margin="normal">
                <InputLabel>Strip-teaseuse</InputLabel>
                <Select
                  value={formData.performerId}
                  onChange={(e) =>
                    setFormData({ ...formData, performerId: e.target.value })
                  }
                  required
                >
                  {performers.map((performer) => (
                    <MenuItem key={performer.id} value={performer.id}>
                      {performer.stageName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal">
                <InputLabel>Type de créneau</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  required
                >
                  <MenuItem value="performance">Performance</MenuItem>
                  <MenuItem value="disponibilite">Disponibilité</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Titre"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                margin="normal"
                required
              />

              <DatePicker
                label="Date"
                value={formData.start}
                onChange={(newValue) =>
                  setFormData({ ...formData, start: newValue })
                }
                renderInput={(params) => (
                  <TextField {...params} fullWidth margin="normal" />
                )}
              />

              <TimePicker
                label="Heure de début"
                value={formData.start}
                onChange={(newValue) =>
                  setFormData({ ...formData, start: newValue })
                }
                renderInput={(params) => (
                  <TextField {...params} fullWidth margin="normal" />
                )}
              />

              <TimePicker
                label="Heure de fin"
                value={formData.end}
                onChange={(newValue) =>
                  setFormData({ ...formData, end: newValue })
                }
                renderInput={(params) => (
                  <TextField {...params} fullWidth margin="normal" />
                )}
              />

              <TextField
                fullWidth
                label="Couleur"
                type="color"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                margin="normal"
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                fullWidth
                label="Notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                margin="normal"
                multiline
                rows={3}
              />
            </LocalizationProvider>
          </DialogContent>
          <DialogActions>
            {selectedShift && (
              <Button
                onClick={() => handleDelete(selectedShift.id)}
                color="error"
              >
                Supprimer
              </Button>
            )}
            <Button onClick={handleCloseDialog}>Annuler</Button>
            <Button type="submit" variant="contained">
              {selectedShift ? "Modifier" : "Ajouter"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
}

export default Schedule;
