const API_URL =
    "https://ijsdv38yzf.execute-api.us-east-1.amazonaws.com/resident-summary";

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