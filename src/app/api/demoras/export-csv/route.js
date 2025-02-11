// pages/api/demoras/export-csv.js
import prisma from "../../../../../lib/prisma";
import { Parser as Json2CsvParser } from "json2csv";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      // 1) Obtener todos
      const demoras = await prisma.demora.findMany({
        orderBy: { createdAt: "desc" },
      });

      // 2) "Aplanar" la data
      const rows = demoras.map((d) => {
        const data = d.data || {};
        // Toma lo que necesites de data
        return {
          id: d.id,
          fechaInicio: data.fechaInicio || "",
          primer_terminal: data.primerProceso?.terminal || "",
          primer_cliente: data.primerProceso?.cliente || "",
          // ... añade todos los campos que quieras
        };
      });

      // 3) Define campos
      const fields = [
        "id",
        "fechaInicio",
        "primer_terminal",
        "primer_cliente",
        // ...
      ];
      const parser = new Json2CsvParser({ fields });
      const csv = parser.parse(rows);

      // 4) Responder CSV
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=demoras_export.csv"
      );
      return res.status(200).send(csv);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Error generando CSV" });
    }
  }
  return res.status(405).end();
}
