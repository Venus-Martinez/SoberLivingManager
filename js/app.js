let residents = [];

async function loadResidentsFromCloud() {

    try {

        residents =
            await getResidentsFromApi();

        console.log(
            "Residents loaded from DynamoDB:",
            residents
        );

    } catch (error) {

        console.error(
            "Unable to load residents from DynamoDB:",
            error
        );

        alert(
            "Unable to load resident data from the cloud."
        );

        throw error;
    }
}

let transactions = [];

async function loadTransactionsFromCloud() {

    try {

        transactions =
            await getTransactionsFromApi();

        console.log(
            "Transactions loaded from DynamoDB:",
            transactions
        );

    } catch (error) {

        console.error(
            "Unable to load transactions from DynamoDB:",
            error
        );

        alert(
            "Unable to load transaction data from the cloud."
        );

        throw error;
    }
}

let uaRecords = [];

async function loadUaRecordsFromCloud() {

    try {

        uaRecords =
            await getUaRecordsFromApi();

        console.log(
            "UA records loaded from DynamoDB:",
            uaRecords
        );

    } catch (error) {

        console.error(
            "Unable to load UA records from DynamoDB:",
            error
        );

        alert(
            "Unable to load UA records from the cloud."
        );

        throw error;
    }
}

let incidentRecords = [];

async function loadIncidentRecordsFromCloud() {

    try {

        incidentRecords =
            await getIncidentRecordsFromApi();

        console.log(
            "Incident records loaded from DynamoDB:",
            incidentRecords
        );

    } catch (error) {

        console.error(
            "Unable to load incident records from DynamoDB:",
            error
        );

        alert(
            "Unable to load incident records from the cloud."
        );

        throw error;
    }
}

document
    .getElementById("show-incident-form")
    .addEventListener("click", () => {

        if (!selectedResident) {
            return;
        }

        document.getElementById("incident-date").value =
            getTodayDate();

        document
            .getElementById("incident-form-container")
            .classList.remove("hidden");
    });

document
    .getElementById("cancel-incident")
    .addEventListener("click", () => {

        document
            .getElementById("incident-form-container")
            .classList.add("hidden");

        document
            .getElementById("incident-form")
            .reset();

        resetIncidentAiAssist();
    });

document
    .getElementById("incident-form")
    .addEventListener("submit", async event => {

        event.preventDefault();

        if (!selectedResident) {
            return;
        }

        const incidentDate =
            document.getElementById(
                "incident-date"
            ).value;

        const incidentType =
            document.getElementById(
                "incident-type"
            ).value;

        const recordedBy =
            document.getElementById(
                "incident-recorded-by"
            ).value.trim();

        const description =
            document.getElementById(
                "incident-description"
            ).value.trim();

        const newIncident = {
            id: `INC-${Date.now()}-${selectedResident.id}`,
            residentId: selectedResident.id,
            date: incidentDate,
            type: incidentType,
            recordedBy: recordedBy,
            description: description,
            recordedAt: new Date().toISOString()
        };

        try {

            const savedIncident =
                await createIncidentRecordInApi(
                    newIncident
                );

            incidentRecords.push(
                savedIncident
            );

        } catch (error) {

            console.error(
                "Unable to save incident record:",
                error
            );

            alert(
                "The incident report could not be saved to the cloud."
            );

            return;
        }

        document
            .getElementById("incident-form")
            .reset();

        document
            .getElementById("incident-form-container")
            .classList.add("hidden");

        resetIncidentAiAssist();

        displayIncidentHistory(
            selectedResident.id
        );

        updateDashboard();
    });

function displayIncidentHistory(residentId) {

    const incidentHistory =
        document.getElementById(
            "incident-history"
        );

    incidentHistory.innerHTML = "";

    const residentIncidents =
        incidentRecords
            .filter(
                incident =>
                    incident.residentId === residentId
            )
            .sort(
                (a, b) =>
                    new Date(b.date) -
                    new Date(a.date)
            );

    if (residentIncidents.length === 0) {

        incidentHistory.innerHTML = `
            <p>No incident reports recorded.</p>
        `;

        return;
    }

    residentIncidents.forEach(incident => {

        const incidentRecord =
            document.createElement("div");

        incidentRecord.classList.add(
            "incident-record"
        );

        incidentRecord.innerHTML = `
            <p>
                <strong>Date:</strong>
                ${incident.date}
            </p>

            <p>
                <strong>Type:</strong>
                ${incident.type}
            </p>

            <p>
                <strong>Recorded By:</strong>
                ${incident.recordedBy}
            </p>

            <div class="incident-description">
                <strong>Description:</strong>
                <br>
                ${incident.description}
            </div>

            <button
                class="delete-incident"
                data-incident-id="${incident.id}"
            >
                Delete Incident
            </button>
        `;

        incidentHistory.appendChild(
            incidentRecord
        );

        const deleteButton =
            incidentRecord.querySelector(
                ".delete-incident"
            );

        deleteButton.addEventListener(
            "click",
            () => deleteIncident(
                incident.id
            )
        );
    });
}

async function deleteIncident(
    incidentId
) {

    const incident =
        incidentRecords.find(
            incident =>
                incident.id ===
                incidentId
        );

    if (!incident) {
        return;
    }

    const confirmed = confirm(
        `Delete this ${incident.type} incident report?`
    );

    if (!confirmed) {
        return;
    }

    try {

        await deleteIncidentRecordFromApi(
            incidentId
        );

    } catch (error) {

        console.error(
            "Unable to delete incident record:",
            error
        );

        alert(
            "The incident report could not be deleted from the cloud."
        );

        return;
    }

    incidentRecords =
        incidentRecords.filter(
            incident =>
                incident.id !==
                incidentId
        );

    if (selectedResident) {

        displayIncidentHistory(
            selectedResident.id
        );
    }

    updateDashboard();
}

let selectedResident = null;

function calculateResidentBalance(residentId) {

    const residentTransactions = transactions.filter(
        transaction => transaction.residentId === residentId
    );

    let totalCharges = 0;
    let totalPayments = 0;

    residentTransactions.forEach(transaction => {

        if (transaction.type === "Charge") {
            totalCharges += transaction.amount;
        }

        if (transaction.type === "Payment") {
            totalPayments += transaction.amount;
        }
    });

    return totalPayments - totalCharges;
}

function getTodayDate() {
    return new Date().toISOString().split("T")[0];
}

function addDays(dateString, numberOfDays) {

    const date =
        new Date(`${dateString}T00:00:00`);

    date.setDate(
        date.getDate() + numberOfDays
    );

    return date.toISOString().split("T")[0];
}

async function generateDueUaRecords() {

    const today =
        getTodayDate();

    for (const resident of residents) {

        if (
            resident.status !==
            "Active"
        ) {
            continue;
        }

        if (
            !resident.nextUaDueDate
        ) {
            continue;
        }

        while (
            resident.nextUaDueDate <=
            today
        ) {

            const dueDate =
                resident.nextUaDueDate;

            const alreadyExists =
                uaRecords.some(
                    record =>
                        record.residentId ===
                        resident.id &&
                        record.dueDate ===
                        dueDate
                );

            if (!alreadyExists) {

                const newUaRecord = {
                    id:
                        `UA-${Date.now()}-${resident.id}-${dueDate}`,

                    residentId:
                        resident.id,

                    dueDate:
                        dueDate,

                    status:
                        "Due",

                    result:
                        null,

                    actionDate:
                        null,

                    resolved:
                        false
                };

                try {

                    const savedUaRecord =
                        await createUaRecordInApi(
                            newUaRecord
                        );

                    uaRecords.push(
                        savedUaRecord
                    );

                } catch (error) {

                    console.error(
                        `Unable to create UA record for ${resident.firstName} ${resident.lastName}:`,
                        error
                    );

                    /*
                        Do NOT advance the UA date
                        if the UA record itself
                        could not be saved.
                    */

                    break;
                }
            }

            const previousUaDate =
                resident.nextUaDueDate;

            resident.nextUaDueDate =
                addDays(
                    dueDate,
                    14
                );

            try {

                await updateResidentInApi(
                    resident
                );

            } catch (error) {

                console.error(
                    `Unable to advance UA schedule for ${resident.firstName} ${resident.lastName}:`,
                    error
                );

                resident.nextUaDueDate =
                    previousUaDate;

                break;
            }
        }
    }

    updateDashboard();
    displayResidents();

    if (selectedResident) {

        displayUaHistory(
            selectedResident.id
        );
    }
}

function updateDashboard() {

    const activeResidents = residents.filter(
        resident => resident.status === "Active"
    ).length;

    let amountOwed = 0;
    let residentCredits = 0;

    residents.forEach(resident => {

        if (resident.status !== "Active") {
            return;
        }

        const balance =
            calculateResidentBalance(resident.id);

        if (balance < 0) {
            amountOwed += Math.abs(balance);
        }

        if (balance > 0) {
            residentCredits += balance;
        }
    });

    const activeResidentIds =
        residents
            .filter(
                resident =>
                    resident.status === "Active"
            )
            .map(
                resident => resident.id
            );

    const residentsNeedingUaAction =
        new Set(
            uaRecords
                .filter(
                    record =>
                        activeResidentIds.includes(
                            record.residentId
                        ) &&
                        !record.resolved
                )
                .map(
                    record =>
                        record.residentId
                )
        );

    const uaActionNeeded =
        residentsNeedingUaAction.size;

    const incidentCount =
        incidentRecords.filter(
            incident =>
                activeResidentIds.includes(
                    incident.residentId
                )
        ).length;

    document.getElementById("active-residents").textContent =
        activeResidents;

    document.getElementById("amount-owed").textContent =
        `$${amountOwed.toFixed(2)}`;

    document.getElementById("resident-credits").textContent =
        `$${residentCredits.toFixed(2)}`;

    document.getElementById("ua-action-needed").textContent =
        uaActionNeeded;

    document.getElementById("open-incidents").textContent =
        incidentCount;
}

function displayResidents() {

    const residentList = document.getElementById("resident-list");

    residentList.innerHTML = "";

    const activeResidents = residents.filter(
        resident => resident.status === "Active"
    );

    activeResidents.forEach(resident => {

        const balance = calculateResidentBalance(resident.id);

        const residentCard = document.createElement("div");

        const uaStatus = getResidentUaStatus(resident);

        const incidentCount =
            incidentRecords.filter(
                incident =>
                    incident.residentId === resident.id
            ).length;

        residentCard.classList.add("resident-card");

        residentCard.addEventListener("click", () => {
            showResidentDetails(resident);
        });

        residentCard.innerHTML = `
            <h3>${resident.firstName} ${resident.lastName}</h3>

            <p>
                <strong>Balance:</strong>
                $${balance.toFixed(2)}
            </p>

            <p>
                <strong>UA Status:</strong>
                ${uaStatus}
            </p>

            <p>
                <strong>Chore Status:</strong>
                ${resident.choreStatus}
            </p>

            <p>
                <strong>Incident Reports:</strong>
                ${incidentCount}
            </p>
        `;

        residentList.appendChild(residentCard);
    });
}

function showResidentDetails(resident) {

    selectedResident = resident;

    const balance = calculateResidentBalance(resident.id);

    const uaStatus = getResidentUaStatus(resident);

    const incidentCount =
        incidentRecords.filter(
            incident =>
                incident.residentId === resident.id
        ).length;

    document.getElementById("dashboard").classList.add("hidden");
    document.getElementById("residents").classList.add("hidden");

    document.getElementById("resident-details").classList.remove("hidden");

    document.getElementById("resident-name").textContent =
        `${resident.firstName} ${resident.lastName}`;

    document.getElementById("detail-status").textContent =
        resident.status;

    document.getElementById("detail-weekly-rent").textContent =
        `$${resident.weeklyRent.toFixed(2)}`;

    document.getElementById("detail-balance").textContent =
        `$${balance.toFixed(2)}`;

    document.getElementById("detail-ua-status").textContent =
        uaStatus;

    document.getElementById("detail-chore-status").textContent =
        resident.choreStatus;

    document.getElementById("detail-open-incidents").textContent =
        incidentCount;

    displayPaymentHistory(resident.id);
    displayUaHistory(resident.id);
    displayIncidentHistory(resident.id);
}

document
    .getElementById("show-ua-schedule-form")
    .addEventListener("click", () => {

        if (!selectedResident) {
            return;
        }

        const dateInput =
            document.getElementById(
                "next-ua-date"
            );

        dateInput.value =
            selectedResident.nextUaDueDate ??
            getTodayDate();

        document
            .getElementById(
                "ua-schedule-form-container"
            )
            .classList.remove("hidden");
    });

document
    .getElementById("cancel-ua-schedule")
    .addEventListener("click", () => {

        document
            .getElementById(
                "ua-schedule-form-container"
            )
            .classList.add("hidden");

        document
            .getElementById(
                "ua-schedule-form"
            )
            .reset();
    });

document
    .getElementById("ua-schedule-form")
    .addEventListener("submit", async event => {

        event.preventDefault();

        if (!selectedResident) {
            return;
        }

        const nextUaDate =
            document.getElementById(
                "next-ua-date"
            ).value;

        const previousUaDate =
            selectedResident.nextUaDueDate;

        selectedResident.nextUaDueDate =
            nextUaDate;

        generateDueUaRecords();

        try {

            await updateResidentInApi(
                selectedResident
            );

        } catch (error) {

            console.error(
                "Unable to update UA schedule:",
                error
            );

            selectedResident.nextUaDueDate =
                previousUaDate;

            alert(
                "The UA schedule could not be saved to the cloud."
            );

            return;
        }

        document
            .getElementById(
                "ua-schedule-form-container"
            )
            .classList.add("hidden");

        document
            .getElementById(
                "ua-schedule-form"
            )
            .reset();

        displayUaHistory(
            selectedResident.id
        );

        updateDashboard();
    });

function openUaRecord(uaRecordId) {

    const record =
        uaRecords.find(
            record =>
                record.id === uaRecordId
        );

    if (!record) {
        return;
    }

    document.getElementById(
        "ua-record-id"
    ).value = record.id;

    document.getElementById(
        "ua-action-date"
    ).value = getTodayDate();

    document.getElementById(
        "ua-record-status"
    ).value = "";

    document.getElementById(
        "ua-result"
    ).value = "";

    document
        .getElementById(
            "ua-update-form-container"
        )
        .classList.remove("hidden");
}

document
    .getElementById("cancel-ua-update")
    .addEventListener("click", () => {

        document
            .getElementById(
                "ua-update-form-container"
            )
            .classList.add("hidden");

        document
            .getElementById(
                "ua-update-form"
            )
            .reset();
    });

document
    .getElementById("ua-update-form")
    .addEventListener("submit", async event => {

        event.preventDefault();

        const uaRecordId =
            document.getElementById(
                "ua-record-id"
            ).value;

        const status =
            document.getElementById(
                "ua-record-status"
            ).value;

        const actionDate =
            document.getElementById(
                "ua-action-date"
            ).value;

        const result =
            document.getElementById(
                "ua-result"
            ).value;

        const record =
            uaRecords.find(
                record =>
                    record.id === uaRecordId
            );

        if (!record) {
            return;
        }

        record.status = status;
        record.actionDate = actionDate;
        record.result = result;

        if (
            status === "Completed" ||
            status === "Refused" ||
            status === "Missed"
        ) {
            record.resolved = true;
        }

        if (
            status === "Unable to Provide"
        ) {
            record.resolved = false;
        }

        try {

            const savedRecord =
                await updateUaRecordInApi(
                    record
                );

            const recordIndex =
                uaRecords.findIndex(
                    uaRecord =>
                        uaRecord.id ===
                        savedRecord.id
                );

            if (recordIndex !== -1) {

                uaRecords[recordIndex] =
                    savedRecord;
            }

        } catch (error) {

            console.error(
                "Unable to update UA record:",
                error
            );

            alert(
                "The UA record could not be saved to the cloud."
            );

            return;
        }

        document
            .getElementById(
                "ua-update-form-container"
            )
            .classList.add("hidden");

        document
            .getElementById(
                "ua-update-form"
            )
            .reset();

        displayUaHistory(
            selectedResident.id
        );

        updateDashboard();
    });

function getResidentUaStatus(resident) {

    const residentRecords = uaRecords
        .filter(
            record =>
                record.residentId === resident.id
        )
        .sort(
            (a, b) =>
                new Date(b.dueDate) -
                new Date(a.dueDate)
        );

    const unresolvedRecord =
        residentRecords.find(
            record => !record.resolved
        );

    if (unresolvedRecord) {
        return unresolvedRecord.status;
    }

    if (residentRecords.length > 0) {
        return residentRecords[0].status;
    }

    if (resident.nextUaDueDate) {
        return "Scheduled";
    }

    return "Not Set";
}

async function deleteTransaction(
    transactionId
) {

    const transaction =
        transactions.find(
            transaction =>
                transaction.id === transactionId
        );

    if (!transaction) {
        return;
    }

    const confirmed = confirm(
        `Delete this ${transaction.type.toLowerCase()} of $${transaction.amount.toFixed(2)}?`
    );

    if (!confirmed) {
        return;
    }

    try {

        await deleteTransactionFromApi(
            transactionId
        );

    } catch (error) {

        console.error(
            "Unable to delete transaction:",
            error
        );

        alert(
            "The transaction could not be deleted from the cloud."
        );

        return;
    }

    transactions =
        transactions.filter(
            transaction =>
                transaction.id !==
                transactionId
        );

    refreshResidentData();
}

function displayPaymentHistory(residentId) {

    const paymentHistory =
        document.getElementById("payment-history");

    paymentHistory.innerHTML = "";

    const residentTransactions = transactions
        .filter(
            transaction => transaction.residentId === residentId
        )
        .sort(
            (a, b) => new Date(b.date) - new Date(a.date)
        );

    if (residentTransactions.length === 0) {

        paymentHistory.innerHTML = `
            <p>No account activity recorded.</p>
        `;

        return;
    }

    residentTransactions.forEach(transaction => {

        const transactionRecord =
            document.createElement("div");

        transactionRecord.classList.add("payment-record");

        if (transaction.type === "Payment") {
            transactionRecord.classList.add("transaction-payment");
        }

        if (transaction.type === "Charge") {
            transactionRecord.classList.add("transaction-charge");
        }

        let transactionDetails = `
            <p>
                <strong>Type:</strong>
                ${transaction.type}
            </p>

            <p>
                <strong>Category:</strong>
                ${transaction.category}
            </p>

            <p>
                <strong>Amount:</strong>
                $${transaction.amount.toFixed(2)}
            </p>

            <p>
                <strong>Date:</strong>
                ${transaction.date}
            </p>
        `;

        if (transaction.type === "Payment") {

            transactionDetails += `
                <p>
                    <strong>Method:</strong>
                    ${transaction.paymentMethod}
                </p>
            `;
        }

        transactionDetails += `
            <button
                class="delete-transaction"
                data-transaction-id="${transaction.id}">
                Delete Entry
            </button>
        `;

        transactionRecord.innerHTML =
            transactionDetails;

        paymentHistory.appendChild(transactionRecord);

        const deleteButton =
            transactionRecord.querySelector(".delete-transaction");

        deleteButton.addEventListener("click", () => {
            deleteTransaction(transaction.id);
        });
    });
}

function refreshResidentData() {

    if (!selectedResident) {
        return;
    }

    const balance =
        calculateResidentBalance(selectedResident.id);

    document.getElementById("detail-balance").textContent =
        `$${balance.toFixed(2)}`;

    displayPaymentHistory(selectedResident.id);

    updateDashboard();
}

document.getElementById("back-to-residents").addEventListener("click", () => {

    document.getElementById("resident-details").classList.add("hidden");

    document.getElementById("dashboard").classList.remove("hidden");
    document.getElementById("residents").classList.remove("hidden");
});

document.getElementById("show-add-resident-form").addEventListener("click", () => {

    const startDate =
        document.getElementById("resident-start-date");

    startDate.value =
        new Date().toISOString().split("T")[0];

    document
        .getElementById("add-resident-form-container")
        .classList.remove("hidden");
});

document.getElementById("cancel-add-resident").addEventListener("click", () => {

    document
        .getElementById("add-resident-form-container")
        .classList.add("hidden");

    document.getElementById("add-resident-form").reset();
});

document.getElementById("add-resident-form").addEventListener("submit", async event => {

    event.preventDefault();

    const firstName =
        document.getElementById("resident-first-name").value.trim();

    const lastName =
        document.getElementById("resident-last-name").value.trim();

    const weeklyRent = parseFloat(
        document.getElementById("resident-weekly-rent").value
    );

    const startDate =
        document.getElementById("resident-start-date").value;

    const firstUaDate =
        document.getElementById("resident-first-ua-date").value;

    const newResident = {
        id: `RES-${Date.now()}`,
        firstName: firstName,
        lastName: lastName,
        status: "Active",
        weeklyRent: weeklyRent,
        startDate: startDate,
        archivedDate: null,
        nextUaDueDate: firstUaDate,
        choreStatus: "Complete"
    };

    try {

        const savedResident =
            await createResidentInApi(
                newResident
            );

        residents.push(
            savedResident
        );

        generateDueUaRecords();

    } catch (error) {

        console.error(
            "Unable to create resident:",
            error
        );

        alert(
            "The resident could not be saved to the cloud."
        );

        return;
    }

    document.getElementById("add-resident-form").reset();

    document
        .getElementById("add-resident-form-container")
        .classList.add("hidden");

    updateDashboard();
    displayResidents();
});

function displayUaHistory(residentId) {

    const uaHistory =
        document.getElementById("ua-history");

    uaHistory.innerHTML = "";

    const residentUaRecords = uaRecords
        .filter(
            record =>
                record.residentId === residentId
        )
        .sort(
            (a, b) =>
                new Date(b.dueDate) -
                new Date(a.dueDate)
        );

    if (residentUaRecords.length === 0) {

        uaHistory.innerHTML = `
            <p>No UA records yet.</p>
        `;

        return;
    }

    residentUaRecords.forEach(record => {

        const recordElement =
            document.createElement("div");

        recordElement.classList.add(
            "ua-record"
        );

        if (record.status === "Due") {
            recordElement.classList.add(
                "ua-record-due"
            );
        }

        if (record.status === "Completed") {
            recordElement.classList.add(
                "ua-record-completed"
            );
        }

        if (
            record.status === "Refused" ||
            record.status === "Missed"
        ) {
            recordElement.classList.add(
                "ua-record-refused"
            );
        }

        let recordHtml = `
            <p>
                <strong>Due Date:</strong>
                ${record.dueDate}
            </p>

            <p>
                <strong>Status:</strong>
                ${record.status}
            </p>
        `;

        if (record.actionDate) {

            recordHtml += `
                <p>
                    <strong>Action Date:</strong>
                    ${record.actionDate}
                </p>
            `;
        }

        if (record.result) {

            recordHtml += `
                <p>
                    <strong>Result:</strong>
                    ${record.result}
                </p>
            `;
        }

        if (!record.resolved) {

            recordHtml += `
                <button
                    class="update-ua-record"
                    data-ua-id="${record.id}"
                >
                    Update UA
                </button>
            `;
        }

        recordElement.innerHTML =
            recordHtml;

        uaHistory.appendChild(
            recordElement
        );

        const updateButton =
            recordElement.querySelector(
                ".update-ua-record"
            );

        if (updateButton) {

            updateButton.addEventListener(
                "click",
                () => openUaRecord(record.id)
            );
        }
    });
}

document.getElementById("archive-resident").addEventListener("click", async () => {

    if (!selectedResident) {
        return;
    }

    const confirmed = confirm(
        `Archive ${selectedResident.firstName} ${selectedResident.lastName}?`
    );

    if (!confirmed) {
        return;
    }

    const previousStatus =
        selectedResident.status;

    const previousUaDate =
        selectedResident.nextUaDueDate;

    const previousArchivedDate =
        selectedResident.archivedDate;

    selectedResident.status =
        "Archived";

    selectedResident.nextUaDueDate =
        null;

    selectedResident.archivedDate =
        getTodayDate();

    try {

        await updateResidentInApi(
            selectedResident
        );

    } catch (error) {

        console.error(
            "Unable to archive resident:",
            error
        );

        selectedResident.status =
            previousStatus;

        selectedResident.nextUaDueDate =
            previousUaDate;

        selectedResident.archivedDate =
            previousArchivedDate;

        alert(
            "The resident could not be archived in the cloud."
        );

        return;
    }

    updateDashboard();

    document
        .getElementById("resident-details")
        .classList.add("hidden");

    document
        .getElementById("dashboard")
        .classList.remove("hidden");

    document
        .getElementById("residents")
        .classList.remove("hidden");

    displayResidents();
});

document.getElementById("delete-resident").addEventListener("click", async () => {

    if (!selectedResident) {
        return;
    }

    const residentTransactions =
        transactions.filter(
            transaction =>
                transaction.residentId ===
                selectedResident.id
        );

    if (residentTransactions.length > 0) {

        alert(
            "This resident has account history. Archive the resident instead of deleting them."
        );

        return;
    }

    const confirmed = confirm(
        `Permanently delete ${selectedResident.firstName} ${selectedResident.lastName}? This cannot be undone.`
    );

    if (!confirmed) {
        return;
    }

    const residentId =
        selectedResident.id;

    try {

        await deleteResidentFromApi(
            residentId
        );

    } catch (error) {

        console.error(
            "Unable to delete resident:",
            error
        );

        alert(
            "The resident could not be deleted from the cloud."
        );

        return;
    }

    residents =
        residents.filter(
            resident =>
                resident.id !== residentId
        );

    selectedResident =
        null;

    document
        .getElementById("resident-details")
        .classList.add("hidden");

    document
        .getElementById("dashboard")
        .classList.remove("hidden");

    document
        .getElementById("residents")
        .classList.remove("hidden");

    updateDashboard();
    displayResidents();
});

function displayArchivedResidents() {

    const archivedResidentList =
        document.getElementById("archived-resident-list");

    archivedResidentList.innerHTML = "";

    const archivedResidents = residents.filter(
        resident => resident.status === "Archived"
    );

    if (archivedResidents.length === 0) {

        archivedResidentList.innerHTML = `
            <p>No archived residents.</p>
        `;

        return;
    }

    archivedResidents.forEach(resident => {

        const residentCard =
            document.createElement("div");

        residentCard.classList.add("resident-card");

        const balance =
            calculateResidentBalance(resident.id);

        residentCard.innerHTML = `
            <h3>${resident.firstName} ${resident.lastName}</h3>

            <p>
                <strong>Archived Date:</strong>
                ${resident.archivedDate ?? "Unknown"}
            </p>

            <p>
                <strong>Current Balance:</strong>
                $${balance.toFixed(2)}
            </p>

            <button
                class="restore-resident"
                data-resident-id="${resident.id}">
                Restore Resident
            </button>
        `;

        archivedResidentList.appendChild(residentCard);

        const restoreButton =
            residentCard.querySelector(".restore-resident");

        restoreButton.addEventListener("click", event => {

            event.stopPropagation();

            restoreResident(resident.id);
        });

    });
}

async function restoreResident(residentId) {

    const resident = residents.find(
        resident =>
            resident.id === residentId
    );

    if (!resident) {
        return;
    }

    const confirmed = confirm(
        `Restore ${resident.firstName} ${resident.lastName} as an active resident?`
    );

    if (!confirmed) {
        return;
    }

    const previousStatus =
        resident.status;

    const previousArchivedDate =
        resident.archivedDate;

    resident.status =
        "Active";

    resident.archivedDate =
        null;

    try {

        await updateResidentInApi(
            resident
        );

    } catch (error) {

        console.error(
            "Unable to restore resident:",
            error
        );

        resident.status =
            previousStatus;

        resident.archivedDate =
            previousArchivedDate;

        alert(
            "The resident could not be restored in the cloud."
        );

        return;
    }

    displayArchivedResidents();
    updateDashboard();
}

document
    .getElementById("show-archived-residents")
    .addEventListener("click", () => {

        document.getElementById("dashboard").classList.add("hidden");
        document.getElementById("residents").classList.add("hidden");

        document
            .getElementById("archived-residents")
            .classList.remove("hidden");

        displayArchivedResidents();
    });

document
    .getElementById("back-to-active-residents")
    .addEventListener("click", () => {

        document
            .getElementById("archived-residents")
            .classList.add("hidden");

        document
            .getElementById("dashboard")
            .classList.remove("hidden");

        document
            .getElementById("residents")
            .classList.remove("hidden");

        updateDashboard();
        displayResidents();
    });

document.getElementById("show-payment-form").addEventListener("click", () => {

    const paymentDate =
        document.getElementById("payment-date");

    paymentDate.value =
        new Date().toISOString().split("T")[0];

    document
        .getElementById("payment-form-container")
        .classList.remove("hidden");
});

document.getElementById("cancel-payment").addEventListener("click", () => {

    document
        .getElementById("payment-form-container")
        .classList.add("hidden");

    document.getElementById("payment-form").reset();
});

document.getElementById("payment-form").addEventListener("submit", async event => {

    event.preventDefault();

    if (!selectedResident) {
        return;
    }

    const amount = parseFloat(
        document.getElementById("payment-amount").value
    );

    const paymentDate =
        document.getElementById("payment-date").value;

    const paymentMethod =
        document.getElementById("payment-method").value;

    const newPayment = {
        id: `TXN-${Date.now()}-${selectedResident.id}`,
        residentId: selectedResident.id,
        type: "Payment",
        category: "Rent Payment",
        amount: amount,
        date: paymentDate,
        paymentMethod: paymentMethod
    };

    try {

        const savedPayment =
            await createTransactionInApi(
                newPayment
            );

        transactions.push(
            savedPayment
        );

    } catch (error) {

        console.error(
            "Unable to save payment:",
            error
        );

        alert(
            "The payment could not be saved to the cloud."
        );

        return;
    }

    document.getElementById("payment-form").reset();

    document
        .getElementById("payment-form-container")
        .classList.add("hidden");

    refreshResidentData();
});

document.getElementById("add-rent-charge").addEventListener("click", () => {

    if (!selectedResident) {
        return;
    }

    const today =
        new Date().toISOString().split("T")[0];

    document.getElementById("rent-charge-date").value =
        today;

    document.getElementById("rent-charge-amount").value =
        selectedResident.weeklyRent;

    document
        .getElementById("rent-charge-form-container")
        .classList.remove("hidden");
});

document
    .getElementById("post-weekly-rent")
    .addEventListener("click", async () => {

        const billingDate =
            getTodayDate();

        let chargesCreated = 0;
        let chargesFailed = 0;

        for (const resident of residents) {

            if (
                resident.status !==
                "Active"
            ) {
                continue;
            }

            const alreadyCharged =
                transactions.some(
                    transaction =>
                        transaction.residentId ===
                        resident.id &&
                        transaction.type ===
                        "Charge" &&
                        transaction.category ===
                        "Weekly Rent" &&
                        transaction.billingDate ===
                        billingDate
                );

            if (alreadyCharged) {
                continue;
            }

            const newCharge = {
                id:
                    `TXN-${Date.now()}-${resident.id}`,

                residentId:
                    resident.id,

                type:
                    "Charge",

                category:
                    "Weekly Rent",

                amount:
                    resident.weeklyRent,

                date:
                    billingDate,

                billingDate:
                    billingDate
            };

            try {

                const savedCharge =
                    await createTransactionInApi(
                        newCharge
                    );

                transactions.push(
                    savedCharge
                );

                chargesCreated++;

            } catch (error) {

                console.error(
                    `Unable to post rent for ${resident.firstName} ${resident.lastName}:`,
                    error
                );

                chargesFailed++;
            }
        }

        updateDashboard();
        displayResidents();

        if (chargesFailed === 0) {

            alert(
                `${chargesCreated} weekly rent charge(s) posted.`
            );

        } else {

            alert(
                `${chargesCreated} weekly rent charge(s) posted. ${chargesFailed} charge(s) failed to save.`
            );
        }
    });

document.getElementById("cancel-rent-charge").addEventListener("click", () => {

    document
        .getElementById("rent-charge-form-container")
        .classList.add("hidden");

    document.getElementById("rent-charge-form").reset();
});

document.getElementById("rent-charge-form").addEventListener("submit", async event => {

    event.preventDefault();

    if (!selectedResident) {
        return;
    }

    const amount = parseFloat(
        document.getElementById("rent-charge-amount").value
    );

    const billingDate =
        document.getElementById("rent-charge-date").value;

    const alreadyCharged = transactions.some(
        transaction =>
            transaction.residentId === selectedResident.id &&
            transaction.type === "Charge" &&
            transaction.category === "Weekly Rent" &&
            transaction.billingDate === billingDate
    );

    if (alreadyCharged) {

        alert(
            `${selectedResident.firstName} already has a weekly rent charge for ${billingDate}.`
        );

        return;
    }

    const newCharge = {
        id: `TXN-${Date.now()}-${selectedResident.id}`,
        residentId: selectedResident.id,
        type: "Charge",
        category: "Weekly Rent",
        amount: amount,
        date: billingDate,
        billingDate: billingDate
    };

    try {

        const savedCharge =
            await createTransactionInApi(
                newCharge
            );

        transactions.push(
            savedCharge
        );

    } catch (error) {

        console.error(
            "Unable to save rent charge:",
            error
        );

        alert(
            "The rent charge could not be saved to the cloud."
        );

        return;
    }

    document.getElementById("rent-charge-form").reset();

    document
        .getElementById("rent-charge-form-container")
        .classList.add("hidden");

    refreshResidentData();
});

async function initializeApplication() {

    await loadResidentsFromCloud();

    await loadTransactionsFromCloud();

    await loadUaRecordsFromCloud();

    await loadIncidentRecordsFromCloud();

    await generateDueUaRecords();

    updateDashboard();
    displayResidents();
}


initializeApplication();