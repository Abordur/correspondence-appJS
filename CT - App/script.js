let currentMode = null;
let excelData = []; // Données reçues de l'API

// Charger les données dès que la page est prête
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("name").addEventListener("click", () => selectMode("name"));
    document.getElementById("google").addEventListener("click", () => selectMode("link"));
    document.getElementById("id").addEventListener("click", () => selectMode("id"));

    // Appel à l'API backend
    fetch("http://localhost:3001/api/files")
        .then(response => response.json())
        .then(data => {
            excelData = data;
            console.log("✅ Données chargées :", excelData.length, "lignes");
        })
        .catch(err => console.error("Erreur lors du chargement des données :", err));
});

const inputArea = document.getElementById("input_area");

// Affiche le champ de recherche selon le bouton cliqué
function selectMode(mode) {
    currentMode = mode;
    let placeholderText = "";

    if (mode === "name") {
        placeholderText = "Please enter the name of your file";
    } else if (mode === "link") {
        placeholderText = "Please enter the Google link of your file";
    } else if (mode === "id") {
        placeholderText = "Please enter the ID of your file";
    }

    inputArea.innerHTML = `
        <input type="text" id="user-input" placeholder="${placeholderText}" class="input-style">
        <button onclick="search()">Search</button>
        <div id="results"></div>
    `;
}

// Fonction déclenchée au clic sur "Search"
function search() {
    const input = document.getElementById("user-input").value.trim().toLowerCase();
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";

    if (!input || !currentMode || excelData.length === 0) {
        resultsDiv.innerHTML = "<p style='color:red;'>Aucune donnée ou champ vide.</p>";
        return;
    }

    // 🔁 Filtrage intelligent (équivalent au `.str.contains()` Python)
    const matches = excelData.filter(row => {
        const field = (row[currentMode === "google" ? "PathGoogle" :
                           currentMode === "name" ? "FileName" :
                           currentMode === "id" ? "FileID" : ""] || "").toLowerCase();
        return field.includes(input) || input.includes(field);
    });

    if (matches.length >= 15) {
        resultsDiv.innerHTML = "<p style='color:orange;'>⚠️ Too many results. Please refine your search.</p>";
        return;
    }

    if (matches.length === 0) {
        resultsDiv.innerHTML = "<p style='color:red;'>❌ No result found.</p>";
        return;
    }

    // ✅ Affichage
    matches.forEach(row => {
        const name = row.FileName || "Unknown";
        const link = row.LinkSharepoint || "#";
        const path = row.PathSharepoint || "Unknown";

        const card = `
            <div class="result-card">
                <strong>${name}</strong><br>
                🔗 <a href="${link}" target="_blank">Microsoft Link</a><br>
                📁 SharePoint Path: <code>${path}</code>
                <hr>
            </div>
        `;
        resultsDiv.innerHTML += card;
    });
}
