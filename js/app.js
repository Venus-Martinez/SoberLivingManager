const STORAGE_PREFIX = "second-chance-portfolio";

const defaultResidents = [
    {
        id: "RES001",
        firstName: "Alex",
        lastName: "Johnson",
        status: "Active",
        weeklyRent: 175,
        uaStatus: "Complete",
        choreStatus: "Complete",
        openIncidents: 0
    },

    {
        id: "RES002",
        firstName: "Jordan",
        lastName: "Smith",
        status: "Active",
        weeklyRent: 175,
        uaStatus: "Due",
        choreStatus: "Missed",
        openIncidents: 1
    },

    {
        id: "RES003",
        firstName: "Chris",
        lastName: "Taylor",
        status: "Active",
        weeklyRent: 175,
        uaStatus: "Complete",
        choreStatus: "Complete",
        openIncidents: 0
    }
];

let residents = loadResidents();

function loadResidents() {

    const savedResidents =
        localStorage.getItem(`${STORAGE_PREFIX}-residents`);

    if (savedResidents) {
        return JSON.parse(savedResidents);
    }

    localStorage.setItem(
        `${STORAGE_PREFIX}-residents`,
        JSON.stringify(defaultResidents)
    );

    return [...defaultResidents];
}

function saveResidents() {

    localStorage.setItem(
        `${STORAGE_PREFIX}-residents`,
        JSON.stringify(residents)
    );
}

function ensureResidentUaFields() {

    let changed = false;

    residents.forEach(resident => {

        if (!Object.prototype.hasOwnProperty.call(
            resident,
            "nextUaDueDate"
        )) {
            resident.nextUaDueDate = null;
            changed = true;
        }
    });

    if (changed) {
        saveResidents();
    }
}

ensureResidentUaFields();

const defaultTransactions = [
    {
        id: "TXN001",
        residentId: "RES001",
        type: "Charge",
        category: "Weekly Rent",
        amount: 175,
        date: "2026-08-07",
        billingDate: "2026-08-07"
    },

    {
        id: "TXN002",
        residentId: "RES001",
        type: "Payment",
        category: "Rent Payment",
        amount: 175,
        date: "2026-08-07",
        paymentMethod: "Cash"
    },

    {
        id: "TXN003",
        residentId: "RES002",
        type: "Charge",
        category: "Weekly Rent",
        amount: 175,
        date: "2026-08-07",
        billingDate: "2026-08-07"
    },

    {
        id: "TXN004",
        residentId: "RES003",
        type: "Charge",
        category: "Weekly Rent",
        amount: 175,
        date: "2026-08-07",
        billingDate: "2026-08-07"
    },

    {
        id: "TXN005",
        residentId: "RES003",
        type: "Payment",
        category: "Rent Payment",
        amount: 125,
        date: "2026-08-07",
        paymentMethod: "Cash"
    }
];

let transactions = loadTransactions();

function loadTransactions() {

    const savedTransactions =
        localStorage.getItem(`${STORAGE_PREFIX}-transactions`);

    if (savedTransactions) {
        return JSON.parse(savedTransactions);
    }

    localStorage.setItem(
        `${STORAGE_PREFIX}-transactions`,
        JSON.stringify(defaultTransactions)
    );

    return [...defaultTransactions];
}


function saveTransactions() {

    localStorage.setItem(
        `${STORAGE_PREFIX}-transactions`,
        JSON.stringify(transactions)
    );
}

const defaultUaRecords = [];

let uaRecords = loadUaRecords();

function loadUaRecords() {

    const savedUaRecords =
        localStorage.getItem(`${STORAGE_PREFIX}-uaRecords`);

    if (savedUaRecords) {
        return JSON.parse(savedUaRecords);
    }

    localStorage.setItem(
        `${STORAGE_PREFIX}-uaRecords`,
        JSON.stringify(defaultUaRecords)
    );

    return [...defaultUaRecords];
}

function saveUaRecords() {

    localStorage.setItem(
        `${STORAGE_PREFIX}-uaRecords`,
        JSON.stringify(uaRecords)
    );
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

function generateDueUaRecords() {

    const today = getTodayDate();

    let uaRecordsChanged = false;
    let residentsChanged = false;

    residents.forEach(resident => {

        if (resident.status !== "Active") {
            return;
        }

        if (!resident.nextUaDueDate) {
            return;
        }

        while (resident.nextUaDueDate <= today) {

            const dueDate =
                resident.nextUaDueDate;

            const alreadyExists =
                uaRecords.some(
                    record =>
                        record.residentId === resident.id &&
                        record.dueDate === dueDate
                );

            if (!alreadyExists) {

                const newUaRecord = {
                    id: `UA-${Date.now()}-${resident.id}-${dueDate}`,
                    residentId: resident.id,
                    dueDate: dueDate,
                    status: "Due",
                    result: null,
                    actionDate: null,
                    resolved: false
                };

                uaRecords.push(newUaRecord);

                uaRecordsChanged = true;
            }

            resident.nextUaDueDate =
                addDays(dueDate, 14);

            residentsChanged = true;
        }
    });

    if (uaRecordsChanged) {
        saveUaRecords();
    }

    if (residentsChanged) {
        saveResidents();
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

    const openIncidents = residents.reduce(
        (total, resident) => total + resident.openIncidents,
        0
    );

    document.getElementById("active-residents").textContent =
        activeResidents;

    document.getElementById("amount-owed").textContent =
        `$${amountOwed.toFixed(2)}`;

    document.getElementById("resident-credits").textContent =
        `$${residentCredits.toFixed(2)}`;

    document.getElementById("ua-action-needed").textContent =
        uaActionNeeded;

    document.getElementById("open-incidents").textContent =
        openIncidents;
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
                <strong>Open Incidents:</strong>
                ${resident.openIncidents}
            </p>
        `;

        residentList.appendChild(residentCard);
    });
}

function showResidentDetails(resident) {

    selectedResident = resident;

    const balance = calculateResidentBalance(resident.id);

    const uaStatus = getResidentUaStatus(resident);

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
        resident.openIncidents;

    displayPaymentHistory(resident.id);
    displayUaHistory(resident.id);
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
    .addEventListener("submit", event => {

        event.preventDefault();

        if (!selectedResident) {
            return;
        }

        const nextUaDate =
            document.getElementById(
                "next-ua-date"
            ).value;

        selectedResident.nextUaDueDate =
            nextUaDate;

        saveResidents();

        generateDueUaRecords();

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
    .addEventListener("submit", event => {

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

        saveUaRecords();

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

function deleteTransaction(transactionId) {

    const transaction = transactions.find(
        transaction => transaction.id === transactionId
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

    transactions = transactions.filter(
        transaction => transaction.id !== transactionId
    );

    saveTransactions();

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

document.getElementById("add-resident-form").addEventListener("submit", event => {

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
        choreStatus: "Complete",
        openIncidents: 0
    };

    residents.push(newResident);

    saveResidents();
    generateDueUaRecords();

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

document.getElementById("archive-resident").addEventListener("click", () => {

    if (!selectedResident) {
        return;
    }

    const confirmed = confirm(
        `Archive ${selectedResident.firstName} ${selectedResident.lastName}?`
    );

    if (!confirmed) {
        return;
    }

    selectedResident.status = "Archived";
    selectedResident.nextUaDueDate = null;

    selectedResident.archivedDate =
        new Date().toISOString().split("T")[0];

    saveResidents();

    updateDashboard();

    document.getElementById("resident-details").classList.add("hidden");
    document.getElementById("dashboard").classList.remove("hidden");
    document.getElementById("residents").classList.remove("hidden");

    displayResidents();
});

document.getElementById("delete-resident").addEventListener("click", () => {

    if (!selectedResident) {
        return;
    }

    const residentTransactions = transactions.filter(
        transaction =>
            transaction.residentId === selectedResident.id
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

    residents = residents.filter(
        resident => resident.id !== selectedResident.id
    );

    saveResidents();

    selectedResident = null;

    document.getElementById("resident-details").classList.add("hidden");
    document.getElementById("dashboard").classList.remove("hidden");
    document.getElementById("residents").classList.remove("hidden");

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

function restoreResident(residentId) {

    const resident = residents.find(
        resident => resident.id === residentId
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

    resident.status = "Active";
    resident.archivedDate = null;

    saveResidents();

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

document.getElementById("payment-form").addEventListener("submit", event => {

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

    transactions.push(newPayment);

    saveTransactions();

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

document.getElementById("post-weekly-rent").addEventListener("click", () => {

    const billingDate =
        new Date().toISOString().split("T")[0];

    let chargesCreated = 0;

    residents.forEach(resident => {

        if (resident.status !== "Active") {
            return;
        }

        const alreadyCharged = transactions.some(
            transaction =>
                transaction.residentId === resident.id &&
                transaction.type === "Charge" &&
                transaction.category === "Weekly Rent" &&
                transaction.billingDate === billingDate
        );

        if (alreadyCharged) {
            return;
        }

        const newCharge = {
            id: `TXN-${Date.now()}-${selectedResident.id}`,
            residentId: resident.id,
            type: "Charge",
            category: "Weekly Rent",
            amount: resident.weeklyRent,
            date: billingDate,
            billingDate: billingDate
        };

        transactions.push(newCharge);

        chargesCreated++;
    });

    if (chargesCreated > 0) {
        saveTransactions();
    }

    updateDashboard();
    displayResidents();

    alert(
        `${chargesCreated} weekly rent charge(s) posted.`
    );
});

document.getElementById("cancel-rent-charge").addEventListener("click", () => {

    document
        .getElementById("rent-charge-form-container")
        .classList.add("hidden");

    document.getElementById("rent-charge-form").reset();
});

document.getElementById("rent-charge-form").addEventListener("submit", event => {

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

    transactions.push(newCharge);

    saveTransactions();

    document.getElementById("rent-charge-form").reset();

    document
        .getElementById("rent-charge-form-container")
        .classList.add("hidden");

    refreshResidentData();
});

generateDueUaRecords();
updateDashboard();
displayResidents();