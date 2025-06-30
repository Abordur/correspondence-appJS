const express = require("express");
const cors = require("cors");
const XLSX = require("xlsx");
const { BlobServiceClient } = require("@azure/storage-blob");
require("dotenv").config();

const app = express();
app.use(cors());

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME;

// ROUTE AVEC PARAMÈTRES : ?filter=motclé&limit=15

app.get("/data", async (req, res) => {
    const mode = req.query.mode || "";
    const filter = (req.query.filter || "").toLowerCase();
    const limit = parseInt(req.query.limit) || 999999; // on ne limite plus sauf si demandé

    console.log("🔎 Requête reçue avec :", { mode, filter, limit });

    try {
        const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
        const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

        let results = [];

        for await (const blob of containerClient.listBlobsFlat()) {
            if (!blob.name.endsWith(".xlsx")) continue;

            const blobClient = containerClient.getBlobClient(blob.name);
            const stream = await blobClient.download();
            const buffer = await streamToBuffer(stream.readableStreamBody);

            const workbook = XLSX.read(buffer, { type: "buffer" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet);

            for (let row of rows) {
                let value = "";
                if (mode === "name") value = row.FileName || "";
                else if (mode === "link") value = row.PathGoogle || "";
                else if (mode === "id") value = row.FileID || "";
                else value = JSON.stringify(row);

                if (typeof value === "string" && value.toLowerCase().includes(filter)) {
                    results.push(row);
                }

                if (results.length >= limit) break;
            }

            if (results.length >= limit) break;
        }

        res.json(results);
    } catch (err) {
        console.error("❌ Erreur serveur :", err);
        res.status(500).send("Erreur serveur");
    }
});


function streamToBuffer(readableStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on("data", (d) => chunks.push(d));
        readableStream.on("end", () => resolve(Buffer.concat(chunks)));
        readableStream.on("error", reject);
    });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log("🚀 API lancée sur http://localhost:" + PORT);
});
