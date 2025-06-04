import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Chip,
  Select,
  MenuItem,
  Button,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
} from "@mui/material";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import {
  format,
  addDays,
  startOfWeek,
  isSameDay,
  addWeeks,
  subWeeks,
} from "date-fns";
import { fr } from "date-fns/locale";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useAuth } from "../contexts/AuthContext";
const ScheduleBar = ({
  status,
  startDate,
  onStatusChange,
  isEditable,
  previousDayStatus,
  nextDayStatus,
}) => {
  const getColor = () => {
    switch (status) {
      case "TT":
        return "#1976d2"; // Bleu
      case "ABSENT":
        return "#FFAFCC"; // Rose
      default:
        return "transparent"; // Transparent pour les jours normaux
    }
  };

  const handleClick = () => {
    if (!isEditable) return;

    let newStatus;
    switch (status) {
      case "TT":
        newStatus = "ABSENT";
        break;
      case "ABSENT":
        newStatus = null;
        break;
      default:
        newStatus = "TT";
    }
    onStatusChange(startDate, newStatus);
  };

  // Vérifier si c'est un weekend
  const isWeekend = startDate.getDay() === 0 || startDate.getDay() === 6;

  // Déterminer les coins arrondis en fonction des jours adjacents
  const getBorderRadius = () => {
    const radius = "8px";
    if (!status) return "0";

    if (status !== previousDayStatus && status !== nextDayStatus) {
      return radius; // Arrondi sur tous les coins pour un jour isolé
    }
    if (status !== previousDayStatus) {
      return `${radius} 0 0 ${radius}`; // Arrondi en haut à gauche
    }
    if (status !== nextDayStatus) {
      return `0  ${radius} ${radius} 0`; // Arrondi uniquement en bas à droite
    }
    return "0"; // Pas d'arrondi
  };

  // Déterminer la largeur en fonction des jours adjacents
  const getWidth = () => {
    if (!status) return "0%";

    if (status !== previousDayStatus && status !== nextDayStatus) {
      return "50%"; // Jour isolé
    }
    if (status !== previousDayStatus) {
      return "75%"; // Premier jour d'une séquence
    }
    if (status !== nextDayStatus) {
      return "75%"; // Dernier jour d'une séquence
    }
    return "100%"; // Jour au milieu d'une séquence
  };

  // Déterminer la position horizontale
  const getPosition = () => {
    if (!status) return "center";

    if (status !== previousDayStatus && status !== nextDayStatus) {
      return "center"; // Jour isolé
    }
    if (status !== previousDayStatus) {
      return "flex-end"; // Premier jour d'une séquence
    }
    if (status !== nextDayStatus) {
      return "flex-start"; // Dernier jour d'une séquence
    }
    return "center"; // Jour au milieu d'une séquence
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: getPosition(),
        alignItems: "center",
        backgroundColor: isWeekend ? "rgba(0, 0, 0, 0.03)" : "white",
        width: "100%",
        height: "100%",
        cursor: isEditable ? "pointer" : "default",
        "&:hover": {
          backgroundColor: isEditable ? "rgba(0, 0, 0, 0.04)" : undefined,
        },
      }}
      onClick={handleClick}
    >
      <Box
        sx={{
          height: "70%",
          width: getWidth(),
          backgroundColor: getColor(),
          borderRadius: getBorderRadius(),
          transition: "all 0.2s ease-in-out",
        }}
      />
    </Box>
  );
};

const WeeklySchedule = () => {
  const [scheduleData, setScheduleData] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("TT");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [jobCategories, setJobCategories] = useState({});
  const [jobPositions, setJobPositions] = useState({});
  const [companyName, setCompanyName] = useState(null);
  const { currentUser } = useAuth();
  console.log(currentUser);
  const db = getFirestore();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Récupérer le doc Firestore de l'utilisateur pour obtenir son companyId
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setCompanyName(currentUser.companyName || null);
          fetchJobCategories();
          fetchJobPositions();
          // Appeler fetchScheduleData seulement après avoir le companyId
          fetchScheduleData(currentUser.companyName);
        } else {
          setCompanyName(null);
        }
      } else {
        setCompanyName(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (companyName) {
      fetchScheduleData(companyName);
    }
  }, [companyName]);

  const fetchJobCategories = async () => {
    try {
      const categoriesRef = collection(db, "jobCategories");
      const snapshot = await getDocs(categoriesRef);
      const categoriesData = {};
      snapshot.forEach((doc) => {
        categoriesData[doc.id] = doc.data();
      });
      setJobCategories(categoriesData);
    } catch (error) {
      console.error("Erreur lors de la récupération des catégories:", error);
    }
  };

  const fetchJobPositions = async () => {
    try {
      const positionsRef = collection(db, "jobPositions");
      const snapshot = await getDocs(positionsRef);
      const positionsData = {};
      snapshot.forEach((doc) => {
        positionsData[doc.id] = doc.data();
      });
      setJobPositions(positionsData);
    } catch (error) {
      console.error("Erreur lors de la récupération des positions:", error);
    }
  };
  const findCategoryByPosition = (positionId) => {
    if (!positionId || !jobPositions[positionId]) {
      return "Non catégorisé";
    }

    const categoryId = jobPositions[positionId].categoryId;

    if (!categoryId || !jobCategories[categoryId]) {
      return "Non catégorisé";
    }
    return jobCategories[categoryId].name || "Non catégorisé";
  };

  const fetchScheduleData = async (companyName) => {
    try {
      const usersRef = collection(db, "users");
      const snapshot = await getDocs(usersRef);
      // Filtrer par companyId
      console.log(snapshot.docs);
      const usersData = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((user) => user.companyName === companyName);
      setScheduleData(usersData);
    } catch (error) {
      console.error("Erreur lors de la récupération des données:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (date, newStatus) => {
    if (!currentUser) return;

    try {
      const userRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        console.error("Utilisateur non trouvé");
        return;
      }

      const userData = userDoc.data();
      const dateKey = format(date, "yyyy-MM-dd");

      const updatedSchedule = {
        ...userData.schedule,
        [dateKey]: newStatus,
      };

      await updateDoc(userRef, {
        schedule: updatedSchedule,
      });

      // Mettre à jour l'état local
      setScheduleData((prevData) =>
        prevData.map((user) =>
          user.id === currentUser.uid
            ? { ...user, schedule: updatedSchedule }
            : user
        )
      );
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
    }
  };

  const handleAddSchedule = async () => {
    if (!currentUser || !startDate || !endDate) return;

    try {
      const userRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        console.error("Utilisateur non trouvé");
        return;
      }

      const userData = userDoc.data();
      const updatedSchedule = { ...userData.schedule };

      // Convertir les dates en objets Date
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Parcourir tous les jours entre start et end
      let currentDate = start;
      while (currentDate <= end) {
        const dateKey = format(currentDate, "yyyy-MM-dd");
        updatedSchedule[dateKey] = selectedStatus;
        currentDate = addDays(currentDate, 1);
      }

      await updateDoc(userRef, {
        schedule: updatedSchedule,
      });

      // Mettre à jour l'état local
      setScheduleData((prevData) =>
        prevData.map((user) =>
          user.id === currentUser.uid
            ? { ...user, schedule: updatedSchedule }
            : user
        )
      );

      setOpenDialog(false);
      setStartDate("");
      setEndDate("");
    } catch (error) {
      console.error("Erreur lors de la mise à jour du planning:", error);
    }
  };

  // Générer les dates pour la semaine actuelle
  const generateDates = () => {
    const dates = [];
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
    for (let i = 0; i < 7; i++) {
      dates.push(addDays(startDate, i));
    }
    return dates;
  };

  const dates = generateDates();

  const handlePreviousWeek = () => {
    setCurrentDate((prev) => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentDate((prev) => addWeeks(prev, 1));
  };

  // Grouper les données par catégorie de poste
  const groupedData = scheduleData.reduce((acc, item) => {
    const category = findCategoryByPosition(item.positionId);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {});

  // Trier les catégories pour que "Non catégorisé" soit en premier
  const sortedCategories = Object.keys(groupedData).sort((a, b) => {
    if (a === "Non catégorisé") return -1;
    if (b === "Non catégorisé") return 1;
    return a.localeCompare(b);
  });

  const generatePDF = () => {
    const calendarElement = document.querySelector("#calendar");
    if (!calendarElement) return;

    html2canvas(calendarElement).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape", // paysage pour mieux coller au calendrier
        unit: "mm",
        format: "a4",
      });

      // Dimensions du PDF
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Dimensions de l'image
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Calcul du ratio pour que l'image tienne dans la page sans être déformée
      const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);

      const printWidth = imgWidth * ratio;
      const printHeight = imgHeight * ratio;

      // Centrer l'image
      const x = (pageWidth - printWidth) / 2;
      const y = (pageHeight - printHeight) / 2;

      pdf.addImage(imgData, "PNG", x, y, printWidth, printHeight);
      pdf.save("calendrier.pdf");
    });
  };

  if (companyName === null && loading) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6">Chargement de votre entreprise...</Typography>
      </Box>
    );
  }
  if (companyName === null && !loading) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h6" color="error">
          Impossible de trouver votre entreprise. Veuillez contacter un
          administrateur.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: "100vw", overflowX: "auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="all">Toutes les catégories</MenuItem>
            {sortedCategories.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </Select>
          <Button
            variant="outlined"
            onClick={() => setCurrentDate(new Date())}
            size="small"
          >
            Aujourd'hui
          </Button>
          <Button
            variant="contained"
            onClick={() => setOpenDialog(true)}
            size="small"
            color="primary"
          >
            Ajouter des jours
          </Button>
          <Button
            variant="contained"
            onClick={generatePDF}
            size="small"
            color="secondary"
          >
            Exporter en PDF
          </Button>
        </Box>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Chip
            label="Télétravail"
            sx={{ backgroundColor: "#1976d2", color: "white" }}
          />
          <Chip
            label="Absent(e)"
            sx={{ backgroundColor: "#FFAFCC", color: "white" }}
          />
        </Box>
      </Box>

      <Box id="calendar" sx={{ display: "flex", position: "relative" }}>
        {/* Colonne des employés */}
        <Box sx={{ width: 250, flexShrink: 0 }}>
          <Box sx={{ height: 52 }} /> {/* Espace pour l'en-tête des dates */}
          {sortedCategories.map((category) => (
            <Box key={category}>
              <Typography
                variant="subtitle1"
                sx={{
                  color: "text.secondary",
                  fontWeight: "bold",
                  borderBottom: "2px solid",
                  borderColor: "primary.main",
                  height: 56.3,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {category}
              </Typography>
              {groupedData[category].map((employee) => (
                <Box
                  key={employee.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    height: 38,
                    p: 1,
                    borderRadius: 1,
                    borderBottom: "1px solid",
                    borderColor: "rgba(0, 0, 0, 0.15)",
                    "&:hover": { backgroundColor: "action.hover" },
                  }}
                >
                  <Avatar
                    src={employee.profileImageUrl}
                    sx={{ width: 32, height: 32 }}
                  >
                    {!employee.profileImageUrl && employee.firstName[0]}
                  </Avatar>
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {employee.firstName} {employee.lastName[0]}.
                  </Typography>
                </Box>
              ))}
            </Box>
          ))}
        </Box>

        {/* Timeline */}
        <Box sx={{ flexGrow: 1, position: "relative" }}>
          {/* En-tête des dates avec navigation */}
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <IconButton onClick={handlePreviousWeek} size="small">
              <ArrowBackIosNewIcon />
            </IconButton>
            <Typography variant="h6" sx={{ mx: 2 }}>
              {format(dates[0], "d MMM", { locale: fr })} -{" "}
              {format(dates[6], "d MMM yyyy", { locale: fr })}
            </Typography>
            <IconButton onClick={handleNextWeek} size="small">
              <ArrowForwardIosIcon />
            </IconButton>
          </Box>

          {/* En-tête des dates */}
          <Box
            sx={{
              display: "flex",
              position: "sticky",
              top: 0,
              bgcolor: "background.paper",
              zIndex: 1,
              width: "100%",
            }}
          >
            {dates.map((date) => {
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              return (
                <Box
                  key={date.toISOString()}
                  sx={{
                    flex: 1,
                    p: 1,
                    textAlign: "center",
                    backgroundColor: isWeekend
                      ? "rgba(0, 0, 0, 0.03)"
                      : "white",
                    borderBottom: "1px solid",
                    borderColor: "rgba(0, 0, 0, 0.15)",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: isSameDay(date, new Date())
                        ? "error.main"
                        : "text.secondary",
                    }}
                  >
                    {format(date, "EEE", { locale: fr })}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: "bold",
                      color: isSameDay(date, new Date())
                        ? "error.main"
                        : "text.secondary",
                    }}
                  >
                    {format(date, "d", { locale: fr })}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {/* Ligne verticale pour le jour actuel */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: `${
                (dates.findIndex((date) => isSameDay(date, new Date())) * 100) /
                7
              }%`,
              width: 2,
              backgroundColor: "error.main",
              zIndex: 2,
            }}
          />

          {/* Contenu du planning */}
          <Box sx={{ position: "relative", width: "100%" }}>
            {sortedCategories.map((category) => (
              <Box key={category}>
                {/* Espace pour le titre de la catégorie */}
                {category !== sortedCategories[0] && (
                  <Box
                    sx={{
                      height: 55,
                      borderBottom: "1px solid",
                      borderColor: "rgba(0, 0, 0, 0.15)",
                    }}
                  />
                )}
                {groupedData[category].map((employee) => (
                  <Box
                    key={employee.id}
                    sx={{
                      display: "flex",
                      height: 55,
                      borderBottom: "1px solid",
                      borderColor: "rgba(0, 0, 0, 0.15)",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    {dates.map((date, index) => (
                      <Box
                        key={date.toISOString()}
                        sx={{
                          flex: 1,
                          height: "100%",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <ScheduleBar
                          status={
                            employee.schedule?.[format(date, "yyyy-MM-dd")]
                          }
                          startDate={date}
                          endDate={date}
                          onStatusChange={handleStatusChange}
                          isEditable={employee.id === currentUser?.uid}
                          previousDayStatus={
                            index > 0
                              ? employee.schedule?.[
                                  format(dates[index - 1], "yyyy-MM-dd")
                                ]
                              : null
                          }
                          nextDayStatus={
                            index < dates.length - 1
                              ? employee.schedule?.[
                                  format(dates[index + 1], "yyyy-MM-dd")
                                ]
                              : null
                          }
                        />
                      </Box>
                    ))}
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Ajouter des jours</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <FormControl component="fieldset">
              <RadioGroup
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <FormControlLabel
                  value="TT"
                  control={<Radio />}
                  label="Télétravail"
                />
                <FormControlLabel
                  value="ABSENT"
                  control={<Radio />}
                  label="Absence"
                />
              </RadioGroup>
            </FormControl>
            <TextField
              label="Date de début"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Date de fin"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
          <Button
            onClick={handleAddSchedule}
            variant="contained"
            disabled={!startDate || !endDate}
          >
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default WeeklySchedule;
