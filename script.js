
const damageForm = document.getElementById("damageForm");
const formMessage = document.getElementById("formMessage");

const trackForm = document.getElementById("trackForm");
const trackResult = document.getElementById("trackResult");

// Resize and compress an uploaded photo before saving it.
async function resizePhoto(file) {
    if (!file) return null;

    if (!file.type.startsWith("image/")) {
        throw new Error("Please upload an image file.");
    }

    if (file.size > 10 * 1024 * 1024) {
        throw new Error("Please choose an image smaller than 10 MB.");
    }

    let image;

    if ("createImageBitmap" in window) {
        image = await createImageBitmap(file);
    } else {
        image = await new Promise(function (resolve, reject) {
            const objectUrl = URL.createObjectURL(file);
            const img = new Image();

            img.onload = function () {
                URL.revokeObjectURL(objectUrl);
                resolve(img);
            };

            img.onerror = function () {
                URL.revokeObjectURL(objectUrl);
                reject(new Error("Could not read this image."));
            };

            img.src = objectUrl;
        });
    }

    const maxSize = 1000;
    const scale = Math.min(
        1,
        maxSize / Math.max(image.width, image.height)
    );

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));

    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    if (typeof image.close === "function") {
        image.close();
    }

    return canvas.toDataURL("image/jpeg", 0.7);
}

// Safely read saved reports.
function getSavedReports() {
    const saved = JSON.parse(
        localStorage.getItem("roadRescueReports") || "[]"
    );

    if (!Array.isArray(saved)) {
        throw new Error("Saved report data is invalid.");
    }

    return saved;
}

// Submit a road damage report.
damageForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const submitButton = damageForm.querySelector(
        'button[type="submit"]'
    );

    submitButton.disabled = true;
    formMessage.textContent = "Processing your report...";
    formMessage.style.color = "#17243a";

    try {
        const photoFile = document.getElementById("photo").files[0];

        // Compress the image before storing it.
        const photoData = await resizePhoto(photoFile);

        const report = {
            id: "RR-" + Date.now() + "-" +
                Math.random().toString(36).slice(2, 6).toUpperCase(),
            name: document.getElementById("reporterName").value.trim(),
            damageType: document.getElementById("damageType").value,
            location: document.getElementById("location").value.trim(),
            description: document.getElementById("description").value.trim(),
            photoName: photoFile ? photoFile.name : "No photo uploaded",
            photoData: photoData,
            status: "Pending",
            priority: "Medium",
            date: new Date().toLocaleString()
        };

        const reports = getSavedReports();
        reports.push(report);

        // Saving can fail if browser storage is full.
        localStorage.setItem(
            "roadRescueReports",
            JSON.stringify(reports)
        );

        formMessage.textContent =
            "Report submitted! Your Report ID is " + report.id;
        formMessage.style.color = "#166534";

        damageForm.reset();

    } catch (error) {
        console.error("RoadRescue submission error:", error);

        formMessage.textContent = error.name === "QuotaExceededError"
            ? "Browser storage is full. Try a smaller photo or remove old test reports."
            : error.message || "Could not submit your report. Please try again.";

        formMessage.style.color = "#b91c1c";

    } finally {
        submitButton.disabled = false;
    }
});

// Track a report using its ID.
trackForm.addEventListener("submit", function (event) {
    event.preventDefault();

    trackResult.replaceChildren();

    try {
        const enteredId = document.getElementById("trackId")
            .value.trim();

        const reports = getSavedReports();

        const report = reports.find(function (item) {
            return item.id.toLowerCase() === enteredId.toLowerCase();
        });

        if (!report) {
            trackResult.textContent =
                "No report found. Please check your Report ID.";
            return;
        }

        const card = document.createElement("div");
        card.className = "report-card";

        const heading = document.createElement("h3");
        heading.textContent = "Report Details";
        card.appendChild(heading);

        const details = [
            ["Report ID", report.id],
            ["Damage Type", report.damageType],
            ["Location", report.location],
            ["Description", report.description],
            ["Submitted On", report.date],
            ["Photo", report.photoName || "No photo uploaded"]
        ];

        details.forEach(function (detail) {
            const paragraph = document.createElement("p");
            const label = document.createElement("strong");

            label.textContent = detail[0] + ": ";
            paragraph.appendChild(label);
            paragraph.appendChild(
                document.createTextNode(detail[1] || "Not provided")
            );

            card.appendChild(paragraph);
        });

        if (report.photoData) {
            const photo = document.createElement("img");
            photo.src = report.photoData;
            photo.alt = "Uploaded road damage evidence";
            photo.className = "report-photo";
            card.appendChild(photo);
        }

        const status = document.createElement("p");
        const statusLabel = document.createElement("strong");

        statusLabel.textContent = "Current Status: ";
        status.appendChild(statusLabel);
        status.appendChild(
            document.createTextNode(report.status || "Pending")
        );

        card.appendChild(status);
        trackResult.appendChild(card);

    } catch (error) {
        console.error("RoadRescue tracking error:", error);
        trackResult.textContent =
            "Could not load the report. Please refresh and try again.";
    }
});
