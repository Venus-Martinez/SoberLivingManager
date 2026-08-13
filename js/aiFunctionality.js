const API_URL =
    "https://ijsdv38yzf.execute-api.us-east-1.amazonaws.com/resident-summary";

const INCIDENT_REWRITE_API_URL =
    "https://ijsdv38yzf.execute-api.us-east-1.amazonaws.com/incident-rewrite";

function buildResidentAiContext(resident) {

    if (!resident) {
        console.error(
            "Cannot build AI context: no resident was provided."
        );

        return null;
    }

    const balance =
        calculateResidentBalance(resident.id);

    const residentTransactions =
        transactions.filter(
            transaction =>
                transaction.residentId === resident.id
        );

    const residentUaRecords =
        uaRecords.filter(
            record =>
                record.residentId === resident.id
        );

    const residentIncidents =
        incidentRecords.filter(
            incident =>
                incident.residentId === resident.id
        );

    return {
        resident: {
            firstName: resident.firstName,
            lastName: resident.lastName,
            status: resident.status,
            balance: balance,
            financialStatus:
                balance < 0
                    ? "Amount Owed"
                    : balance > 0
                        ? "Resident Credit"
                        : "Paid in Full",
            amountOwed:
                balance < 0
                    ? Math.abs(balance)
                    : 0,
            creditAmount:
                balance > 0
                    ? balance
                    : 0,
            nextUaDueDate: resident.nextUaDueDate
        },

        recentTransactions:
            residentTransactions
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 20),

        recentUaRecords:
            residentUaRecords
                .sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate))
                .slice(0, 10),

        recentIncidents:
            residentIncidents
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 10)
    };
}

function formatAiSummary(text) {

    return text
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n/g, "<br>");
}

document
    .getElementById("generate-ai-summary")
    .addEventListener("click", async () => {

        if (!selectedResident) {
            return;
        }

        const residentContext =
            buildResidentAiContext(
                selectedResident
            );

        const summaryContainer =
            document.getElementById(
                "ai-summary-container"
            );

        const summaryOutput =
            document.getElementById(
                "ai-summary-output"
            );

        summaryContainer.classList.remove(
            "hidden"
        );

        summaryOutput.textContent =
            "Generating AI summary...";

        try {

            const response = await fetch(
                API_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        residentContext:
                            residentContext
                    })
                }
            );

            if (!response.ok) {

                throw new Error(
                    `API request failed with status ${response.status}`
                );
            }

            const data =
                await response.json();

            summaryOutput.innerHTML =
                formatAiSummary(data.summary);

        } catch (error) {

            console.error(
                "AI Summary Error:",
                error
            );

            summaryOutput.textContent =
                "Unable to generate the AI summary.";
        }
    });

document
    .getElementById("improve-incident-with-ai")
    .addEventListener("click", async () => {

        const incidentType =
            document.getElementById(
                "incident-type"
            ).value;

        const description =
            document.getElementById(
                "incident-description"
            ).value.trim();

        if (!description) {

            alert(
                "Enter an incident description before using AI."
            );

            return;
        }

        const suggestionContainer =
            document.getElementById(
                "incident-ai-suggestion-container"
            );

        const suggestionOutput =
            document.getElementById(
                "incident-ai-suggestion"
            );

        suggestionContainer.classList.remove(
            "hidden"
        );

        suggestionOutput.textContent =
            "Improving documentation...";

        try {

            const response = await fetch(
                INCIDENT_REWRITE_API_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        incidentType:
                            incidentType,

                        description:
                            description
                    })
                }
            );

            if (!response.ok) {

                throw new Error(
                    `API request failed with status ${response.status}`
                );
            }

            const data =
                await response.json();

            suggestionOutput.textContent =
                data.rewrittenDescription;

        } catch (error) {

            console.error(
                "Incident AI Rewrite Error:",
                error
            );

            suggestionOutput.textContent =
                "Unable to improve the incident documentation.";
        }
    });

document
    .getElementById("use-incident-ai-suggestion")
    .addEventListener("click", () => {

        const suggestion =
            document.getElementById(
                "incident-ai-suggestion"
            ).textContent.trim();

        if (!suggestion) {
            return;
        }

        document.getElementById(
            "incident-description"
        ).value = suggestion;

        document
            .getElementById(
                "incident-ai-suggestion-container"
            )
            .classList.add("hidden");
    });