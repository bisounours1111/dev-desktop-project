import React from "react";
import { Container, Typography, Box } from "@mui/material";
import { useParams } from "react-router-dom";

function PerformerDetail() {
  const { id } = useParams();

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Détails du performer
        </Typography>
        <Typography variant="body1">ID du performer : {id}</Typography>
      </Box>
    </Container>
  );
}

export default PerformerDetail;
