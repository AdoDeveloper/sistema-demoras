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

// Listas de opciones (ejemplo)
const allTipoCargaBarco = [
  "CEREALES",
  "AZÚCAR CRUDA",
  "CARBÓN",
  "MELAZA",
  "GRASA AMARILLA",
  "YESO",
];
const allSistemaUtilizadoBarco = [
  "UNIDAD DE CARGA",
  "SUCCIONADORA",
  "ALMEJA",
  "CHINGUILLOS",
  "EQUIPO BULHER",
  "ALAMBRE",
];

// Función para obtener fecha/hora
const getFechaHoraGenerada = () => {
  return new Date().toLocaleString("es-SV", { timeZone: "America/El_Salvador" });
};

// Estilos
const styles = StyleSheet.create({
  page: {
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#F3F4F6",
    color: "#000",
    // Ajusta estos valores según la altura de tu header y footer
    paddingTop: 80,
    paddingBottom: 30,
    paddingHorizontal: 10,
  },
  headerContainer: {
    backgroundColor: "#003E9B",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
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
  whiteBox: {
    backgroundColor: "#fff",
    marginTop: 0,
    marginBottom: 20,
    padding: 15,
    borderRadius: 5,
    breakInside: "avoid",
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 8,
    color: "#000",
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
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 3,
    minHeight: 18,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  card: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 3,
    marginBottom: 10,
    breakInside: "avoid",
  },
  cardHeader: {
    backgroundColor: "#E5E7EB",
    padding: 4,
  },
  cardHeaderText: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    color: "#000",
    textAlign: "center",
  },
  cardBody: {
    padding: 4,
  },
  checkboxBox: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: "#000",
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
  infoCard: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 3,
    padding: 4,
    marginBottom: 10,
    breakInside: "avoid",
  },
  tableContainer: {
    marginTop: 10,
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
    fontSize: 9,
    fontWeight: "bold",
    padding: 4,
    flex: 1,
    textAlign: "center",
    borderRightWidth: 1,
    borderColor: "#ccc",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
    padding: 3,
    textAlign: "center",
    borderRightWidth: 1,
    borderColor: "#eee",
  },
  observationsLabel: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
    marginTop: 10,
    marginBottom: 2,
  },
  observationsBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    minHeight: 40,
    borderRadius: 3,
    padding: 5,
    fontSize: 9,
    flexWrap: "wrap",
  },
});

const PDFBitacora = ({ formData }) => {
  const {
    // Datos de la Bitácora
    fechaInicio,
    fechaCierre,
    nombreMuellero,
    turnoInicio,
    turnoFin,
    operaciones = [],
    observaciones,
    // Datos del Barco
    barco = {},
  } = formData;

  const fechaHoraGenerada = getFechaHoraGenerada();

  return (
    <Document>
      {/* ================= PRIMERA PÁGINA: INFORMACIÓN DEL BARCO ================= */}
      <Page size="LETTER" style={styles.page}>
        {/* Header fijo en todas las páginas */}
        <View style={styles.headerContainer} fixed>
          <View style={styles.headerRow}>
            <Image style={styles.logo} src="/logo.png" />
            <Text style={styles.title}>
              Bitácora de Operaciones en Muelle y Abordo
            </Text>
          </View>
        </View>

        {/* Footer fijo en todas las páginas */}
        <View style={styles.footerContainer} fixed>
          <Text style={styles.footerText}>Generado: {fechaHoraGenerada}</Text>
        </View>

        {/* Contenido de la primera página: Información del Barco */}
        <View style={styles.whiteBox}>
          <Text style={styles.sectionHeader}>Información del Barco</Text>

          {/* Fila: MUELLE y VAPOR/BARCO */}
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.columnLabel}>MUELLE</Text>
              <View style={styles.inputBox}>
                <Text>{barco.muelle || "-"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <Text style={styles.columnLabel}>VAPOR/BARCO</Text>
              <View style={styles.inputBox}>
                <Text>{barco.vaporBarco || "-"}</Text>
              </View>
            </View>
          </View>

          {/* Tarjetas: Tipo de Carga y Sistema Utilizado */}
          <View style={styles.row}>
            <View style={styles.column}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardHeaderText}>TIPO DE CARGA</Text>
                </View>
                <View style={styles.cardBody}>
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    {allTipoCargaBarco.map((tipo) => (
                      <View
                        key={tipo}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          width: "50%",
                          marginBottom: 3,
                        }}
                      >
                        <View
                          style={[
                            styles.checkboxBox,
                            barco.tipoCarga &&
                              barco.tipoCarga.includes(tipo) &&
                              styles.checkedBox,
                          ]}
                        >
                          <Text
                            style={[
                              styles.checkMark,
                              barco.tipoCarga &&
                                barco.tipoCarga.includes(tipo) &&
                                styles.checkedMark,
                            ]}
                          >
                            {barco.tipoCarga &&
                            barco.tipoCarga.includes(tipo)
                              ? "✓"
                              : ""}
                          </Text>
                        </View>
                        <Text style={styles.checkboxText}>{tipo}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.column}>
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardHeaderText}>
                    SISTEMA UTILIZADO
                  </Text>
                </View>
                <View style={styles.cardBody}>
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    {allSistemaUtilizadoBarco.map((sistema) => (
                      <View
                        key={sistema}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          width: "50%",
                          marginBottom: 3,
                        }}
                      >
                        <View
                          style={[
                            styles.checkboxBox,
                            barco.sistemaUtilizado &&
                              barco.sistemaUtilizado.includes(sistema) &&
                              styles.checkedBox,
                          ]}
                        >
                          <Text
                            style={[
                              styles.checkMark,
                              barco.sistemaUtilizado &&
                                barco.sistemaUtilizado.includes(sistema) &&
                                styles.checkedMark,
                            ]}
                          >
                            {barco.sistemaUtilizado &&
                            barco.sistemaUtilizado.includes(sistema)
                              ? "✓"
                              : ""}
                          </Text>
                        </View>
                        <Text style={styles.checkboxText}>{sistema}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Fechas y Horas del Barco */}
          <View style={styles.row}>
            {/* ARRIBO */}
            <View style={styles.column}>
              <View style={styles.infoCard}>
                <Text style={styles.cardHeaderText}>ARRIBO</Text>
                <View style={styles.row}>
                  <View style={styles.column}>
                    <Text style={styles.columnLabel}>Fecha Arribo</Text>
                    <View style={styles.inputBox}>
                      <Text>{barco.fechaArribo || "-"}</Text>
                    </View>
                  </View>
                  <View style={styles.column}>
                    <Text style={styles.columnLabel}>Hora Arribo</Text>
                    <View style={styles.inputBox}>
                      <Text>{barco.horaArribo || "-"}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* ATRAQUE */}
            <View style={styles.column}>
              <View style={styles.infoCard}>
                <Text style={styles.cardHeaderText}>ATRAQUE</Text>
                <View style={styles.row}>
                  <View style={styles.column}>
                    <Text style={styles.columnLabel}>Fecha Atraque</Text>
                    <View style={styles.inputBox}>
                      <Text>{barco.fechaAtraque || "-"}</Text>
                    </View>
                  </View>
                  <View style={styles.column}>
                    <Text style={styles.columnLabel}>Hora Atraque</Text>
                    <View style={styles.inputBox}>
                      <Text>{barco.horaAtraque || "-"}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.row}>
            {/* RECIBIDO */}
            <View style={styles.column}>
              <View style={styles.infoCard}>
                <Text style={styles.cardHeaderText}>RECIBIDO</Text>
                <View style={styles.row}>
                  <View style={styles.column}>
                    <Text style={styles.columnLabel}>Fecha Recibido</Text>
                    <View style={styles.inputBox}>
                      <Text>{barco.fechaRecibido || "-"}</Text>
                    </View>
                  </View>
                  <View style={styles.column}>
                    <Text style={styles.columnLabel}>Hora Recibido</Text>
                    <View style={styles.inputBox}>
                      <Text>{barco.horaRecibido || "-"}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* INICIO OPERACIONES */}
            <View style={styles.column}>
              <View style={styles.infoCard}>
                <Text style={styles.cardHeaderText}>
                  INICIO OPERACIONES
                </Text>
                <View style={styles.row}>
                  <View style={styles.column}>
                    <Text style={styles.columnLabel}>Fecha Inicio</Text>
                    <View style={styles.inputBox}>
                      <Text>{barco.fechaInicioOperaciones || "-"}</Text>
                    </View>
                  </View>
                  <View style={styles.column}>
                    <Text style={styles.columnLabel}>Hora Inicio</Text>
                    <View style={styles.inputBox}>
                      <Text>{barco.horaInicioOperaciones || "-"}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.row}>
            {/* FIN OPERACIONES */}
            <View style={styles.column}>
              <View style={styles.infoCard}>
                <Text style={styles.cardHeaderText}>FIN OPERACIONES</Text>
                <View style={styles.row}>
                  <View style={styles.column}>
                    <Text style={styles.columnLabel}>Fecha Fin</Text>
                    <View style={styles.inputBox}>
                      <Text>{barco.fechaFinOperaciones || "-"}</Text>
                    </View>
                  </View>
                  <View style={styles.column}>
                    <Text style={styles.columnLabel}>Hora Fin</Text>
                    <View style={styles.inputBox}>
                      <Text>{barco.horaFinOperaciones || "-"}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Page>

      {/* ================= SEGUNDA (Y DEMÁS) PÁGINAS: BITÁCORAS ================= */}
      <Page size="LETTER" style={styles.page}>
        {/* Header fijo en todas las páginas */}
        <View style={styles.headerContainer} fixed>
          <View style={styles.headerRow}>
            <Image style={styles.logo} src="/logo.png" />
            <Text style={styles.title}>
              Bitácora de Operaciones en Muelle y Abordo
            </Text>
          </View>
        </View>

        {/* Footer fijo en todas las páginas */}
        <View style={styles.footerContainer} fixed>
          <Text style={styles.footerText}>Generado: {fechaHoraGenerada}</Text>
        </View>

        {/* Contenido de la segunda página (y subsecuentes si el contenido crece) */}
        <View style={styles.whiteBox}>
          <Text style={styles.sectionHeader}>Bitácoras</Text>

          {/* Datos generales de la Bitácora */}
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.columnLabel}>FECHA INICIO</Text>
              <View style={styles.inputBox}>
                <Text>{fechaInicio || "-"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <Text style={styles.columnLabel}>FECHA CIERRE</Text>
              <View style={styles.inputBox}>
                <Text>{fechaCierre || "-"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <Text style={styles.columnLabel}>NOMBRE DEL MUELLERO</Text>
              <View style={styles.inputBox}>
                <Text>{nombreMuellero || "-"}</Text>
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.columnLabel}>TURNO DE</Text>
              <View style={styles.inputBox}>
                <Text>{turnoInicio || "-"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <Text style={styles.columnLabel}>A</Text>
              <View style={styles.inputBox}>
                <Text>{turnoFin || "-"}</Text>
              </View>
            </View>
          </View>

          {/* Tabla de operaciones */}
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>BODEGA</Text>
              <Text style={styles.tableHeaderText}>INICIO</Text>
              <Text style={styles.tableHeaderText}>FINAL</Text>
              <Text style={styles.tableHeaderText}>MINUTOS</Text>
              <Text style={[styles.tableHeaderText, { borderRightWidth: 0 }]}>
                ACTIVIDAD
              </Text>
            </View>
            {operaciones.map((op, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.tableCell}>{op.bodega}</Text>
                <Text style={styles.tableCell}>{op.inicio}</Text>
                <Text style={styles.tableCell}>{op.final}</Text>
                <Text style={styles.tableCell}>{op.minutos}</Text>
                <Text style={[styles.tableCell, { borderRightWidth: 0 }]}>
                  {op.actividad}
                </Text>
              </View>
            ))}
          </View>

          {/* Observaciones */}
          <Text style={styles.observationsLabel}>Observaciones</Text>
          <View style={styles.observationsBox}>
            <Text>{observaciones || ""}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default PDFBitacora;
