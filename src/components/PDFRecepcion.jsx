"use client";

import React from "react";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

// Obtiene fecha y hora actual en zona America/El_Salvador
const getFechaHoraGenerada = () =>
  new Date().toLocaleString("es-SV", { timeZone: "America/El_Salvador" });

// Formatea el ID con ceros a la izquierda
const formatId = (id) => `#${id.toString().padStart(5, "0")}`;

const styles = StyleSheet.create({
  page: {
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#FFF",
    color: "#000",
    paddingTop: 25,
    paddingBottom: 25,
    paddingHorizontal: 15,
  },
  // Header en una fila: logo, título y ID
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  logo: {
    width: 180,
    height: 50,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
    textAlign: "center",
    lineHeight: 1.2,
  },
  headerId: {
    width: 50,
    fontSize: 12,
    fontWeight: "bold",
    color: "#FF0000",
    textAlign: "right",
  },
  footerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  footerText: {
    fontSize: 8,
  },
  box: {
    backgroundColor: "#FFF",
    marginBottom: 10,
    padding: 8,
    borderRadius: 4,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    marginBottom: 6,
  },
  column: {
    flex: 1,
    marginRight: 5,
  },
  lastColumn: {
    flex: 1,
    marginRight: 0,
  },
  label: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  valueBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 4,
    minHeight: 14,
    justifyContent: "center",
  },
  table: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F0F0F0",
  },
  th: {
    fontSize: 10,
    fontWeight: "bold",
    padding: 4,
    textAlign: "center",
    borderRightWidth: 1,
    borderColor: "#ccc",
  },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  td: {
    fontSize: 10,
    padding: 4,
    textAlign: "center",
    borderRightWidth: 1,
    borderColor: "#eee",
  },
  lastTd: {
    borderRightWidth: 0,
  },
});

const PDFRecepcion = ({ data }) => {
  const {
    id,
    fecha,
    hora,
    producto,
    nombreBarco,
    chequero,
    turnoInicio,
    turnoFin,
    puntoCarga,
    puntoDescarga,
    bitacoras = [],
  } = data;

  const generadoEn = getFechaHoraGenerada();

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header: logo, título y ID en una sola fila */}
        <View style={styles.headerContainer}>
          <Image
            src="/logo.png"
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>
            Recepción y Traslado de Cereales
          </Text>
          <Text style={styles.headerId}>{formatId(id)}</Text>
        </View>

        {/* Detalles de la Recepción */}
        <View style={styles.box}>

          {/* Fila 1: Fecha/Hora, Producto, Barco */}
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Fecha / Hora</Text>
              <View style={styles.valueBox}>
                <Text>
                  {fecha || "-"} {hora || "-"}
                </Text>
              </View>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Producto</Text>
              <View style={styles.valueBox}>
                <Text>{producto || "-"}</Text>
              </View>
            </View>
            <View style={styles.lastColumn}>
              <Text style={styles.label}>Barco</Text>
              <View style={styles.valueBox}>
                <Text>{nombreBarco || "-"}</Text>
              </View>
            </View>
          </View>

          {/* Fila 2: Chequero, Turno Inicio, Turno Fin */}
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Chequero</Text>
              <View style={styles.valueBox}>
                <Text>{chequero || "-"}</Text>
              </View>
            </View>
            <View style={styles.column}>
              <Text style={styles.label}>Inicio Turno</Text>
              <View style={styles.valueBox}>
                <Text>{turnoInicio || "-"}</Text>
              </View>
            </View>
            <View style={styles.lastColumn}>
              <Text style={styles.label}>Fin Turno</Text>
              <View style={styles.valueBox}>
                <Text>{turnoFin || "-"}</Text>
              </View>
            </View>
          </View>

          {/* Fila 3: Carga, Descarga */}
          <View style={styles.row}>
            <View style={styles.column}>
              <Text style={styles.label}>Punto de Carga</Text>
              <View style={styles.valueBox}>
                <Text>{puntoCarga || "-"}</Text>
              </View>
            </View>
            <View style={styles.lastColumn}>
              <Text style={styles.label}>Punto de Descarga</Text>
              <View style={styles.valueBox}>
                <Text>{puntoDescarga || "-"}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bitácoras */}
        <View style={styles.box}>
          <Text style={styles.sectionHeader}>Bitácoras</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, { width: 50 }]}>Placa</Text>
              <Text style={[styles.th, { flex: 1 }]}>Motorista</Text>
              <Text style={[styles.th, { width: 50 }]}>Ticket</Text>
              <Text style={[styles.th, { width: 60 }]}>Inicio</Text>
              <Text style={[styles.th, { width: 60 }]}>Final</Text>
              <Text style={[styles.th, { width: 60 }]}>Total</Text>
              <Text style={[styles.th, { flex: 1 }]}>Transporte</Text>
              <Text
                style={[
                  styles.th,
                  { width: 100, borderRightWidth: 0 },
                ]}
              >
                Observaciones
              </Text>
            </View>
            {bitacoras.length > 0 ? (
              bitacoras.map((b, i) => (
                <View key={i} style={styles.tr}>
                  <Text style={[styles.td, { width: 50 }]}>{b.placa}</Text>
                  <Text style={[styles.td, { flex: 1 }]}>{b.motorista}</Text>
                  <Text style={[styles.td, { width: 50 }]}>{b.ticket}</Text>
                  <Text style={[styles.td, { width: 60 }]}>
                    {b.horaInicio}
                  </Text>
                  <Text style={[styles.td, { width: 60 }]}>
                    {b.horaFinal}
                  </Text>
                  <Text style={[styles.td, { width: 60 }]}>
                    {b.tiempoTotal}
                  </Text>
                  <Text style={[styles.td, { flex: 1 }]}>
                    {b.transporte}
                  </Text>
                  <Text
                    style={[
                      styles.td,
                      { width: 100, borderRightWidth: 0 },
                    ]}
                  >
                    {b.observaciones || "-"}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={{ padding: 8 }}>
                No hay bitácoras registradas.
              </Text>
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

export default PDFRecepcion;