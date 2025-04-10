"use client";

import React from "react";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

// Función para obtener la fecha/hora actual
const getFechaHoraGenerada = () => {
  return new Date().toLocaleString("es-SV", { timeZone: "America/El_Salvador" });
};

// Función para formatear el ID con ceros
const formatId = (id) => {
  return `#${id.toString().padStart(5, '0')}`;
};

// Estilos ajustados para garantizar que todo cabe en una sola página
const styles = StyleSheet.create({
  page: {
    fontSize: 10, // Aumentar el tamaño de la fuente
    fontFamily: "Helvetica",
    backgroundColor: "#FFFFFF",
    color: "#000",
    paddingTop: 20, // Ajustar el espacio superior
    paddingBottom: 25, // Ajustar el espacio inferior
    paddingHorizontal: 10,
    maxHeight: "100%", // Asegura que el contenido no se desborde
    overflow: "hidden", // Evita que el contenido se salga de la página
  },
  headerContainer: {
    backgroundColor: "#FFF", // Fondo blanco
    paddingTop: 15,
    paddingHorizontal: 15,
    paddingBottom: 15,
    flexDirection: "row", // Divide el header en tres partes horizontales
    justifyContent: "space-between", // Ajusta la separación entre elementos
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  logo: {
    width: '100%', // La imagen ocupa todo el ancho
    height: '100%', // La imagen ocupa todo el alto
    objectFit: "cover", // La imagen cubre el recuadro sin distorsionar
  },
  titleContainer: {
    flex: 4, // Ocupa la mayor parte del espacio
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 15,
  },
  title: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#000",
    textTransform: "uppercase",
    textAlign: "center",
  },
  headerIdContainer: {
    flex: 1, // Espacio pequeño para el ID
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 10,
  },
  headerId: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#FF0000", // Color rojo para el ID
    textAlign: "right",
  },
  footerContainer: {
    position: "absolute",
    bottom: 0, // Colocarlo al final de la página
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  footerText: {
    fontSize: 8,
    color: "#000",
  },
  whiteBox1: {
    backgroundColor: "#fff",
    marginTop: 48,
    marginBottom: 0,
    padding: 10,
    borderRadius: 5,
    breakInside: "avoid",
  },
  whiteBox: {
    backgroundColor: "#fff",
    marginTop: 2,
    marginBottom: 0,
    padding: 10,
    borderRadius: 5,
    breakInside: "avoid",
  },
  sectionHeader: {
    fontSize: 11, // Tamaño de fuente de la sección
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 8,
    color: "#000",
  },
  row: {
    flexDirection: "row",
    marginBottom: 5,
    flexWrap: "wrap",
  },
  column: {
    flex: 1,
    marginRight: 5,
  },
  columnLabel: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  inputBox: {
    fontSize: 10,
    padding: 5,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 3,
    minHeight: 16,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  tableContainer: {
    marginTop: 5,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: "bold",
    padding: 6,
    textAlign: "center",
    borderRightWidth: 1,
    borderColor: "#ccc",
  },
  tableHeaderTextNumber: {
    width: 20,
    fontSize: 10,
    fontWeight: "bold",
    padding: 5,
    textAlign: "center",
    borderRightWidth: 1,
    borderColor: "#ccc",
  },
  tableHeaderTextCumple: {
    width: 45,
    fontSize: 10,
    fontWeight: "bold",
    padding: 5,
    textAlign: "center",
    borderRightWidth: 1,
    borderColor: "#ccc",
  },
  tableHeaderTitulo: {
    width: 340,
    fontSize: 10,
    fontWeight: "bold",
    padding: 5,
    textAlign: "center",
    borderRightWidth: 1,
    borderColor: "#ccc",
  },
  tableHeaderObservaciones: {
    width: 170,
    fontSize: 10,
    fontWeight: "bold",
    padding: 5,
    textAlign: "center",
    borderRightWidth: 0,
    borderColor: "#ccc",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  tableCell: {
    fontSize: 10,
    padding: 5,
    textAlign: "center",
    borderRightWidth: 1,
    borderColor: "#eee",
  },
  tableCellNumber: {
    width: 20,
    fontSize: 10,
    padding: 5,
    textAlign: "center",
    borderRightWidth: 1,
    borderColor: "#eee",
  },
  tableCellTitulo: {
    width: 340,
    fontSize: 10,
    padding: 5,
    textAlign: "left",
    borderRightWidth: 1,
    borderColor: "#eee",
  },
  tableCellCumple: {
    width: 45,
    fontSize: 10,
    padding: 5,
    textAlign: "center",
    borderRightWidth: 1,
    borderColor: "#eee",
  },
  tableCellObservaciones: {
    width: 170,
    fontSize: 10,
    padding: 5,
    textAlign: "justify", // Justifica el texto
    borderRightWidth: 0,
    borderColor: "#eee",
  },
});

// Componente que genera el PDF para el reporte de un equipo.
const PDFEquipo = ({ formData }) => {
  const {
    equipo,
    horometro,
    operador,
    fecha,
    hora,
    horaDe,
    horaA,
    recomendaciones,
    inspecciones,
    id, // Asumimos que el ID está en formData
  } = formData;

  const fechaHoraGenerada = getFechaHoraGenerada();

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header solo en la primera página */}
        <View style={styles.headerContainer}>
          <View style={{ flex: 2 }}>
            <Image style={styles.logo} src="/logo.png" resizeMode="cover" />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>LISTADO DE ACTIVIDADES AL</Text>
            <Text style={styles.title}>INICIO DE LAS OPERACIONES</Text>
            <Text style={styles.title}>CON EQUIPO FRONTAL</Text>
          </View>
          <View style={styles.headerIdContainer}>
            <Text style={styles.headerId}>{formatId(id)}</Text>
          </View>
        </View>

        {/* Footer en todas las páginas */}
        <View style={styles.footerContainer} fixed>
          <Text style={styles.footerText}>Generado: {fechaHoraGenerada}</Text>
        </View>

        {/* Contenido: Datos del Equipo */}
        <View style={styles.whiteBox1}>
          <Text style={styles.sectionHeader}>Información del Equipo</Text>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.columnLabel}>Equipo</Text>
              <View style={styles.inputBox}>
                <Text>{equipo || "-"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <Text style={styles.columnLabel}>Horómetro</Text>
              <View style={styles.inputBox}>
                <Text>{horometro || "-"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <Text style={styles.columnLabel}>Fecha</Text>
              <View style={styles.inputBox}>
                <Text>{fecha || "-"} {hora || "-"}</Text>
              </View>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.columnLabel}>Operador</Text>
              <View style={styles.inputBox}>
                <Text>{operador || "-"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <Text style={styles.columnLabel}>Inicio Turno</Text>
              <View style={styles.inputBox}>
                <Text>{horaDe || "-"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <Text style={styles.columnLabel}>Fin Turno</Text>
              <View style={styles.inputBox}>
                <Text>{horaA || "-"}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Inspecciones */}
        <View style={styles.whiteBox}>
          <Text style={styles.sectionHeader}>Inspecciones</Text>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderTextNumber}>N°</Text>
              <Text style={styles.tableHeaderTitulo}>Parte Evaluada</Text>
              <Text style={styles.tableHeaderTextCumple}>Cumple</Text>
              <Text style={styles.tableHeaderObservaciones}>Observaciones</Text>
            </View>
            {Array.isArray(inspecciones) && inspecciones.length > 0 ? (
              inspecciones.map((insp, index) => (
                <View key={insp.id} style={styles.tableRow}>
                  <Text style={styles.tableCellNumber}>{index + 1}</Text>
                  <Text style={styles.tableCellTitulo}>{insp.titulo}</Text>
                  <Text style={styles.tableCellCumple}>
                    {insp.cumple ? "SI" : "NO"}
                  </Text>
                  <Text style={styles.tableCellObservaciones}>
                    {insp.observaciones || "-"}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.tableCell}>No hay inspecciones disponibles.</Text>
            )}
          </View>
        </View>

        {/* Recomendaciones */}
        <View style={styles.whiteBox}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.columnLabel}>Recomendaciones</Text>
              <View style={styles.inputBox}>
                <Text>{recomendaciones || "-"}</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default PDFEquipo;
