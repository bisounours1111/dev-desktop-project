import React from "react";
import { Container, Typography, Box } from "@mui/material";
import { useParams } from "react-router-dom";

function EventDetail() {
  const { id } = useParams();

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Détails de l'événement
        </Typography>
        <Typography variant="body1">ID de l'événement : {id}</Typography>
      </Box>
    </Container>
  );
}

export default EventDetail;
