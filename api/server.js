const express = require("express");
const cors = require("cors");
const XLSX = require("xlsx");
const { BlobServiceClient } = require("@azure/storage-blob");

const app = express();
app.use(cors()); // autorise les requêtes depuis le frontend

require("dotenv").config(); // ← Charge les variables depuis .env
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_CONTAINER_NAME;


app.get("/data", async (req, res) => {
    try {
        const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
        const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

        let allData = [];

        for await (const blob of containerClient.listBlobsFlat()) {
            if (blob.name.endsWith(".xlsx")) {
                const blobClient = containerClient.getBlobClient(blob.name);
                const downloadBlockBlobResponse = await blobClient.download();
                const buffer = await streamToBuffer(downloadBlockBlobResponse.readableStreamBody);

                const workbook = XLSX.read(buffer, { type: "buffer" });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(sheet);

                allData = allData.concat(json); // on fusionne les lignes
            }
        }

        res.json(allData);
    } catch (error) {
        console.error(error);
        res.status(500).send("Erreur serveur");
    }
});

function streamToBuffer(readableStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on("data", (data) => chunks.push(data));
        readableStream.on("end", () => resolve(Buffer.concat(chunks)));
        readableStream.on("error", reject);
    });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log("API lancée sur http://localhost:" + PORT);
});
