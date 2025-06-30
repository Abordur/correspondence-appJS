let currentMode = null;
const loader = document.getElementById("loader");

// Charger les événements au démarrage
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("name").addEventListener("click", () => selectMode("name"));
    document.getElementById("google").addEventListener("click", () => selectMode("link"));
    document.getElementById("id").addEventListener("click", () => selectMode("id"));
});

const inputArea = document.getElementById("input_area");

function selectMode(mode) {
    currentMode = mode;

    let instruction = "";

    if (mode === "name") {
        instruction = "Please enter the name of your file:";
    } else if (mode === "link") {
        instruction = "Please enter the Google link of your file:";
    } else if (mode === "id") {
        instruction = "Please enter the ID of your file:";
    }

    // 🔁 Met à jour et affiche le texte d’instruction
    const instructionText = document.getElementById("instruction-text");
    instructionText.textContent = instruction;
    instructionText.style.display = "block";

    // 💬 On supprime le placeholder
    inputArea.innerHTML = `
        <input type="text" id="user-input" class="input-style">
        <button onclick="search()">Search</button>
        <div id="results"></div>
    `;
}



function search() {
    const input = document.getElementById("user-input").value.trim().toLowerCase();
    const resultsDiv = document.getElementById("results");
    resultsDiv.innerHTML = "";

    if (!input || !currentMode) {
        resultsDiv.innerHTML = "<p style='color:red;'>Champ vide ou mode non sélectionné</p>";
        return;
    }

    // 👉 Afficher le loader
    loader.classList.add("active");

    const url = `http://localhost:3001/data?filter=${encodeURIComponent(input)}&limit=15&mode=${currentMode}`;

    fetch(url)
        .then((response) => response.json())
        .then((data) => {
            loader.classList.remove("active"); // ✅ cacher le loader
            if (!data || data.length === 0) {
                resultsDiv.innerHTML = "<p style='color:red;'>❌ Aucun résultat trouvé.</p>";
                return;
            }

            data.forEach(row => {
                const name = row.FileName || "Unknown";
                const link = row.LinkSharepoint || "#";
                const path = row.PathSharepoint || "Unknown";

                resultsDiv.innerHTML += `
                    <div class="result-card">
                        <strong>${name}</strong><br>
                        🔗 <a href="${link}" target="_blank">Microsoft Link</a><br>
                        📁 SharePoint Path: <code>${path}</code>
                        <hr>
                    </div>
                `;
            });
        })
        .catch((err) => {
            loader.classList.remove("active"); // ✅ cacher le loader en cas d'erreur
            resultsDiv.innerHTML = "<p style='color:red;'>❌ Erreur lors de la recherche</p>";
            console.error("Erreur API :", err);
        });
}

