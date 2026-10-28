
document.addEventListener("DOMContentLoaded", function () {
    const reportList = document.getElementById("adminReportList");
    const searchInput = document.getElementById("searchReports");
    const statusFilter = document.getElementById("filterStatus");
    const priorityFilter = document.getElementById("filterPriority");
    const damageFilter = document.getElementById("filterDamage");

    function getReports() {
        try {
            const saved = JSON.parse(
                localStorage.getItem("roadRescueReports") || "[]"
            );

            return Array.isArray(saved) ? saved : [];
        } catch (error) {
            console.error("Could not read reports:", error);
            return [];
        }
    }

    function saveReports(reports) {
        try {
            localStorage.setItem(
                "roadRescueReports",
                JSON.stringify(reports)
            );
            return true;
        } catch (error) {
            console.error("Could not save reports:", error);
            alert("Could not save changes. Please try again.");
            return false;
        }
    }

    function updateStats(reports) {
        document.getElementById("totalReports").textContent =
            reports.length;

        document.getElementById("pendingReports").textContent =
            reports.filter(r => (r.status || "Pending") === "Pending").length;

        document.getElementById("progressReports").textContent =
            reports.filter(r => r.status === "In Progress").length;

        document.getElementById("resolvedReports").textContent =
            reports.filter(r => r.status === "Resolved").length;
    }

    function createDetail(card, labelText, value) {
        const paragraph = document.createElement("p");
        const label = document.createElement("strong");

        label.textContent = labelText + ": ";
        paragraph.appendChild(label);
        paragraph.appendChild(
            document.createTextNode(value || "Not provided")
        );

        card.appendChild(paragraph);
    }

    function createSelect(labelText, options, selectedValue) {
        const label = document.createElement("label");
        label.textContent = labelText;

        const select = document.createElement("select");

        options.forEach(function (value) {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            select.appendChild(option);
        });

        select.value = selectedValue;
        label.appendChild(select);

        return { label, select };
    }

    function renderReports() {
        const reports = getReports();
        updateStats(reports);

        const query = searchInput.value.trim().toLowerCase();
        const wantedStatus = statusFilter.value;
        const wantedPriority = priorityFilter.value;
        const wantedDamage = damageFilter.value;

        const filteredReports = reports.filter(function (report) {
            const matchesSearch =
                (report.id || "").toLowerCase().includes(query) ||
                (report.location || "").toLowerCase().includes(query);

            const matchesStatus =
                wantedStatus === "All" ||
                (report.status || "Pending") === wantedStatus;

            const matchesPriority =
                wantedPriority === "All" ||
                (report.priority || "Medium") === wantedPriority;

            const matchesDamage =
                wantedDamage === "All" ||
                report.damageType === wantedDamage;

            return matchesSearch &&
                matchesStatus &&
                matchesPriority &&
                matchesDamage;
        });

        reportList.replaceChildren();

        if (filteredReports.length === 0) {
            const message = document.createElement("p");
            message.textContent = reports.length === 0
                ? "No reports yet. Submit a test report from the citizen homepage."
                : "No reports match your search or filters.";

            reportList.appendChild(message);
            return;
        }

        filteredReports.forEach(function (report) {
            const card = document.createElement("div");
            card.className = "admin-report-card";

            const heading = document.createElement("h3");
            heading.textContent = report.id;
            card.appendChild(heading);

            createDetail(card, "Damage Type", report.damageType);
            createDetail(card, "Location", report.location);
            createDetail(card, "Description", report.description);
            createDetail(card, "Submitted On", report.date);
            
createDetail(card, "Photo File", report.photoName || "No photo uploaded");

if (report.photoData) {
    const photo = document.createElement("img");
    photo.src = report.photoData;
    photo.alt = "Road damage evidence for report " + report.id;
    photo.className = "admin-report-photo";
    card.appendChild(photo);
}


            const statusControl = createSelect(
                "Report Status",
                ["Pending", "In Progress", "Resolved"],
                report.status || "Pending"
            );

            card.appendChild(statusControl.label);

            const priorityControl = createSelect(
                "Priority",
                ["Low", "Medium", "High"],
                report.priority || "Medium"
            );

            card.appendChild(priorityControl.label);

            const saveButton = document.createElement("button");
            saveButton.textContent = "Save Changes";

            saveButton.addEventListener("click", function () {
                const latestReports = getReports();

                const currentReport = latestReports.find(
                    item => item.id === report.id
                );

                if (!currentReport) {
                    alert("Report not found. Refresh the dashboard.");
                    return;
                }

                currentReport.status = statusControl.select.value;
                currentReport.priority = priorityControl.select.value;

                if (saveReports(latestReports)) {
                    renderReports();
                    alert("Report updated successfully!");
                }
            });

            card.appendChild(saveButton);
            reportList.appendChild(card);
        });
    }

    searchInput.addEventListener("input", renderReports);
    statusFilter.addEventListener("change", renderReports);
    priorityFilter.addEventListener("change", renderReports);
    damageFilter.addEventListener("change", renderReports);

    renderReports();
});
