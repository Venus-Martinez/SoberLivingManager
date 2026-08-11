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


document
    .getElementById("generate-ai-summary")
    .addEventListener("click", () => {

        if (!selectedResident) {
            return;
        }

        const residentContext =
            buildResidentAiContext(
                selectedResident
            );

        console.log(
            "Resident AI Context:",
            residentContext
        );

        const summaryContainer =
            document.getElementById(
                "ai-summary-container"
            );

        const summaryOutput =
            document.getElementById(
                "ai-summary-output"
            );

        summaryContainer.classList.remove("hidden");

        summaryOutput.textContent =
            `AI summary functionality is ready for ${selectedResident.firstName} ${selectedResident.lastName}.`;
    });