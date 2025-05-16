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

// Obtiene fecha/hora actual en zona America/El_Salvador
const getFechaHoraGenerada = () =>
  new Date().toLocaleString("es-SV", { timeZone: "America/El_Salvador" });

// Formatea el ID con ceros a la izquierda
const formatId = (id) => `#${id.toString().padStart(5, "0")}`;

const styles = StyleSheet.create({
  page: {
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#FFF",
    paddingTop: 25,
    paddingBottom: 25,
    paddingHorizontal: 15,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  logo: {
    width: 100,
    height: 30,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    textAlign: "center",
  },
  headerId: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#B00000",
    textAlign: "right",
  },
  box: {
    marginBottom: 10,
    padding: 6,
    borderWidth: 1,
    borderColor: "#CCC",
    borderRadius: 4,
  },
  label: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  valueBox: {
    borderWidth: 1,
    borderColor: "#CCC",
    padding: 4,
    minHeight: 14,
    justifyContent: "center",
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  column: {
    flex: 1,
    marginRight: 5,
  },
  lastColumn: {
    flex: 1,
    marginRight: 0,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  table: {
    width: "auto",
    borderWidth: 1,
    borderColor: "#CCC",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#EEE",
  },
  th: {
    flex: 1,
    fontSize: 9,
    fontWeight: "bold",
    padding: 4,
    textAlign: "center",
    borderRightWidth: 1,
    borderColor: "#CCC",
  },
  tr: {
    flexDirection: "row",
  },
  td: {
    flex: 1,
    fontSize: 9,
    padding: 4,
    textAlign: "center",
    borderRightWidth: 1,
    borderColor: "#EEE",
  },
  lastTd: {
    borderRightWidth: 0,
  },
  footerContainer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: "center",
  },
  footerText: {
    fontSize: 8,
  },
});

const PDFAcontecimiento = ({ data }) => {
  const {
    id,
    fecha,
    turno,
    condicion,
    puntosDescarga = [],
    operadores,
    enlonadores,
    equipos,
    basculas = [],
    acontecimientos = [],
  } = data;

  const generadoEn = getFechaHoraGenerada();

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Image src="/logo.png" style={styles.logo} />
          <Text style={styles.title}>Acontecimientos e Interrupciones</Text>
          <Text style={styles.headerId}>{formatId(id)}</Text>
        </View>

        {/* Datos generales */}
        <View style={styles.box}>
          {/* Fila 1: Fecha / Turno / Condición */}
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Fecha</Text>
              <View style={styles.valueBox}>
                <Text>{fecha || "-"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Turno</Text>
              <View style={styles.valueBox}>
                <Text>{turno || "-"}</Text>
              </View>
            </View>
            <View style={styles.lastColumn}>
              <Text style={styles.label}>Condición</Text>
              <View style={styles.valueBox}>
                <Text>{condicion || "-"}</Text>
              </View>
            </View>
          </View>

          {/* Fila 2: Puntos Descarga */}
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Puntos Descarga Habilitados</Text>
              <View style={styles.valueBox}>
                <Text>
                  {Array.isArray(puntosDescarga) && puntosDescarga.length > 0
                    ? puntosDescarga.join(", ")
                    : "-"}
                </Text>
              </View>
            </View>
          </View>

          {/* Fila 3: Enlonadores / Operadores / Equipos */}
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Enlonadores</Text>
              <View style={styles.valueBox}>
                <Text>{enlonadores ?? "-"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Operadores</Text>
              <View style={styles.valueBox}>
                <Text>{operadores ?? "-"}</Text>
              </View>
            </View>
            <View style={styles.lastColumn}>
              <Text style={styles.label}>Equipos</Text>
              <View style={styles.valueBox}>
                <Text>{equipos ?? "-"}</Text>
              </View>
            </View>
          </View>

          {/* Fila 4: Básculas */}
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Básculas Habilitadas</Text>
              <View style={styles.valueBox}>
                <Text>
                  {Array.isArray(basculas) && basculas.length > 0
                    ? basculas.join(", ")
                    : "-"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Acontecimientos */}
        <View style={styles.box}>
          <Text style={styles.sectionHeader}>Acontecimientos</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.th}>Razón</Text>
              <Text style={styles.th}>Inicio</Text>
              <Text style={styles.th}>Final</Text>
              <Text style={[styles.th, { flex: 1 }]}>Total</Text>
              <Text style={[styles.th, styles.lastTd]}>Observaciones</Text>
            </View>

            {acontecimientos.length > 0 ? (
              acontecimientos.map((ac, idx) => (
                <View key={idx} style={styles.tr}>
                  <Text style={styles.td}>{ac.razon || "-"}</Text>
                  <Text style={styles.td}>{ac.horaInicio || "-"}</Text>
                  <Text style={styles.td}>{ac.horaFinal || "-"}</Text>
                  <Text style={styles.td}>{ac.tiempoTotal || "-"}</Text>
                  <Text style={[styles.td, styles.lastTd]}>
                    {ac.observaciones || "-"}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={{ padding: 4 }}>No hay registros.</Text>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footerContainer} fixed>
          <Text style={styles.footerText}>Generado: {generadoEn}</Text>
        </View>
      </Page>
    </Document>
  );
};

export default PDFAcontecimiento;