"use client";

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

// Listas de opciones para mostrar en el PDF
const allTipoCargaCol1 = ["CEREALES", "CARBÓN", "GRASA AMARILLA"];
const allTipoCargaCol2 = ["AZÚCAR CRUDA", "MELAZA", "YESO"];
const allSistemaUtilizadoCol1 = ["UNIDAD DE CARGA", "ALMEJA", "EQUIPO BULHER"];
const allSistemaUtilizadoCol2 = ["SUCCIONADORA", "CHINGUILLOS"];

// Obtén la fecha/hora de generación
const getFechaHoraGenerada = () => {
  // Ajusta formato o zona horaria a tu preferencia
  return new Date().toLocaleString("es-SV", { timeZone: "America/El_Salvador" });
};

const styles = StyleSheet.create({
  page: {
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#F3F4F6",
    color: "#000",
    // Para que no se monte sobre el header y footer
    paddingTop: 110,   // Ajusta según la altura de tu encabezado
    paddingBottom: 30, // Ajusta según la altura de tu pie de página
    paddingHorizontal: 20,
  },
  /* Encabezado */
  headerContainer: {
    backgroundColor: "#003E9B",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
    // Repetir en todas las páginas
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    width: 200,
    height: "auto",
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    textTransform: "uppercase",
    textAlign: "right",
  },
  /* Pie de página */
  footerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  footerText: {
    fontSize: 9,
    color: "#000",
  },
  /* Contenedor principal */
  whiteBox: {
    backgroundColor: "#fff",
    marginTop: 0,
    marginBottom: 20,
    padding: 15,
    borderRadius: 5,
  },
  row: {
    flexDirection: "row",
    marginBottom: 10,
  },
  column: {
    flex: 1,
    marginRight: 10,
  },
  columnLabel: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  inputBox: {
    fontSize: 10,
    padding: 4,
    border: "1px solid #ccc",
    borderRadius: 3,
    minHeight: 18,
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    backgroundColor: "#E5E7EB",
    padding: 4,
    marginBottom: 2,
  },
  twoColumnsContainer: {
    flexDirection: "row",
  },
  checkboxColumn: {
    flex: 1,
    marginRight: 10,
  },
  checkboxContainer: {
    marginBottom: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxBox: {
    width: 12,
    height: 12,
    border: "1px solid #000",
    marginRight: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  checkedBox: {
    backgroundColor: "#003E9B",
  },
  checkMark: {
    fontSize: 8,
    textAlign: "center",
    color: "transparent",
  },
  checkedMark: {
    color: "#fff",
  },
  checkboxText: {
    fontSize: 9,
  },
  tableContainer: {
    marginTop: 10,
    border: "1px solid #ccc",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderBottom: "1px solid #ccc",
  },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: "bold",
    padding: 4,
    flex: 1,
    textAlign: "center",
    borderRight: "1px solid #ccc",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #eee",
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
    padding: 3,
    textAlign: "center",
    borderRight: "1px solid #eee",
  },
  observationsLabel: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginTop: 10,
    marginBottom: 2,
  },
  observationsBox: {
    border: "1px solid #ccc",
    minHeight: 40,
    borderRadius: 3,
    padding: 5,
    fontSize: 9,
  },
});

const PDFBitacora = ({ formData }) => {
  const {
    bValue,
    valorMuelle,
    fecha,
    fechaInicio,
    nombreMuellero,
    turnoInicio,
    turnoFin,
    tipoCarga,
    sistemaUtilizado,
    operaciones,
    observaciones,
  } = formData;

  // Fecha/hora en que se genera el PDF
  const fechaHoraGenerada = getFechaHoraGenerada();

  // Función para dibujar el checkbox con fondo azul si la opción está seleccionada
  const renderCheckbox = (option, selectedList) => {
    const isChecked = selectedList.includes(option);
    return (
      <View style={styles.checkboxContainer} key={option}>
        <View style={[styles.checkboxBox, isChecked && styles.checkedBox]}>
          <Text style={[styles.checkMark, isChecked && styles.checkedMark]}>
            {isChecked ? "✓" : ""}
          </Text>
        </View>
        <Text style={styles.checkboxText}>{option}</Text>
      </View>
    );
  };

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Encabezado repetido en todas las páginas */}
        <View style={styles.headerContainer} fixed>
          <View style={styles.headerRow}>
            <Image style={styles.logo} src="/logo.png" />
            <Text style={styles.title}>Bitácora de Operaciones en Muelle y Abordo</Text>
          </View>
        </View>

        {/* Pie de página con fecha/hora de generación, repetido en todas las páginas */}
        <View style={styles.footerContainer} fixed>
          <Text style={styles.footerText}>Generado: {fechaHoraGenerada}</Text>
        </View>

        {/* Contenedor blanco principal (contenido) */}
        <View style={styles.whiteBox}>
          {/* Fila 1: Código, Vapor/Muelle, Fecha */}
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.columnLabel}>CÓDIGO</Text>
              <View style={styles.inputBox}>
                <Text>{bValue}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <Text style={styles.columnLabel}>VAPOR/MUELLE</Text>
              <View style={styles.inputBox}>
                <Text>{valorMuelle}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <Text style={styles.columnLabel}>FECHA</Text>
              <View style={styles.inputBox}>
                <Text>{fecha}</Text>
              </View>
            </View>
          </View>

          {/* Fila 2: Nombre del Muellero y Turno*/}
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.columnLabel}>Nombre del Muellero</Text>
              <View style={styles.inputBox}>
                <Text>{nombreMuellero}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <Text style={styles.columnLabel}>Turno de</Text>
              <View style={styles.inputBox}>
                <Text>{turnoInicio}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <Text style={styles.columnLabel}>a</Text>
              <View style={styles.inputBox}>
                <Text>{turnoFin}</Text>
              </View>
            </View>
          </View>

          {/* Sección: Tipo de Carga y Sistema Utilizado (2 columnas cada uno) */}
          <View style={styles.row}>
            {/* Tipo de Carga */}
            <View style={styles.column}>
              <Text style={styles.sectionTitle}>Tipo de Carga</Text>
              <View style={styles.twoColumnsContainer}>
                {/* Columna 1 */}
                <View style={styles.checkboxColumn}>
                  {allTipoCargaCol1.map((option) =>
                    renderCheckbox(option, tipoCarga)
                  )}
                </View>
                {/* Columna 2 */}
                <View style={styles.checkboxColumn}>
                  {allTipoCargaCol2.map((option) =>
                    renderCheckbox(option, tipoCarga)
                  )}
                </View>
              </View>
            </View>

            {/* Sistema Utilizado */}
            <View style={styles.column}>
              <Text style={styles.sectionTitle}>Sistema Utilizado</Text>
              <View style={styles.twoColumnsContainer}>
                {/* Columna 1 */}
                <View style={styles.checkboxColumn}>
                  {allSistemaUtilizadoCol1.map((option) =>
                    renderCheckbox(option, sistemaUtilizado)
                  )}
                </View>
                {/* Columna 2 */}
                <View style={styles.checkboxColumn}>
                  {allSistemaUtilizadoCol2.map((option) =>
                    renderCheckbox(option, sistemaUtilizado)
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Tabla de operaciones (sin columna de acción) */}
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>BDS TS</Text>
              <Text style={styles.tableHeaderText}>INICIO</Text>
              <Text style={styles.tableHeaderText}>FINAL</Text>
              <Text style={styles.tableHeaderText}>MINUTOS</Text>
              <Text style={[styles.tableHeaderText, { borderRight: 0 }]}>
                ACTIVIDAD
              </Text>
            </View>
            {operaciones.map((op, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>{op.bdsTs}</Text>
                <Text style={styles.tableCell}>{op.inicio}</Text>
                <Text style={styles.tableCell}>{op.final}</Text>
                <Text style={styles.tableCell}>{op.minutos}</Text>
                <Text style={[styles.tableCell, { borderRight: 0 }]}>
                  {op.actividad}
                </Text>
              </View>
            ))}
          </View>

          {/* Observaciones */}
          <Text style={styles.observationsLabel}>Observaciones</Text>
          <View style={styles.observationsBox}>
            <Text>{observaciones}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default PDFBitacora;
