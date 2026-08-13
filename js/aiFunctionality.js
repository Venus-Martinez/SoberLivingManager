const API_URL =
    "https://ijsdv38yzf.execute-api.us-east-1.amazonaws.com/resident-summary";

const INCIDENT_REWRITE_API_URL =
    "https://ijsdv38yzf.execute-api.us-east-1.amazonaws.com/incident-rewrite";

const MANAGEMENT_BRIEF_API_URL =
    "https://ijsdv38yzf.execute-api.us-east-1.amazonaws.com/management-brief";

const ASK_HOUSE_API_URL =
    "https://ijsdv38yzf.execute-api.us-east-1.amazonaws.com/ask-house";

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

let currentIncidentAiAction = null;

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

        let action;

        /*
            CASE 1:
            No type selected
            Description exists
            -> Suggest incident type
        */
        if (!incidentType && description) {

            action = "suggestType";
        }

        /*
            CASE 2:
            Type selected
            Description exists
            -> Rewrite description
        */
        else if (incidentType && description) {

            action = "rewriteDescription";
        }

        /*
            CASE 3:
            Type selected
            No description
            -> Give documentation guidance
        */
        else if (incidentType && !description) {

            action = "documentationGuidance";
        }

        /*
            CASE 4:
            Nothing entered
        */
        else {

            alert(
                "Select an incident type or enter a description before using AI."
            );

            return;
        }

        currentIncidentAiAction =
            action;

        const suggestionContainer =
            document.getElementById(
                "incident-ai-suggestion-container"
            );

        const suggestionTitle =
            document.getElementById(
                "incident-ai-suggestion-title"
            );

        const suggestionOutput =
            document.getElementById(
                "incident-ai-suggestion"
            );

        const useSuggestionButton =
            document.getElementById(
                "use-incident-ai-suggestion"
            );


        /*
            Set the UI depending on
            what AI is being asked to do.
        */

        if (action === "suggestType") {

            suggestionTitle.textContent =
                "AI Suggested Incident Type";

            suggestionOutput.textContent =
                "Analyzing incident description...";

            useSuggestionButton.textContent =
                "Use Suggested Type";

            useSuggestionButton.classList.remove(
                "hidden"
            );
        }

        if (action === "rewriteDescription") {

            suggestionTitle.textContent =
                "AI Suggested Rewrite";

            suggestionOutput.textContent =
                "Improving documentation...";

            useSuggestionButton.textContent =
                "Use Suggested Rewrite";

            useSuggestionButton.classList.remove(
                "hidden"
            );
        }

        if (action === "documentationGuidance") {

            suggestionTitle.textContent =
                "AI Documentation Guidance";

            suggestionOutput.textContent =
                "Generating documentation guidance...";

            /*
                There is nothing to automatically
                insert in this mode.
            */

            useSuggestionButton.classList.add(
                "hidden"
            );
        }

        suggestionContainer.classList.remove(
            "hidden"
        );

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
                        action:
                            action,

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
                data.result;

        } catch (error) {

            console.error(
                "Incident AI Assist Error:",
                error
            );

            suggestionOutput.textContent =
                "Unable to complete the AI assistance request.";

            useSuggestionButton.classList.add(
                "hidden"
            );
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

        /*
            AI suggested a TYPE
        */
        if (
            currentIncidentAiAction ===
            "suggestType"
        ) {

            const incidentTypeSelect =
                document.getElementById(
                    "incident-type"
                );

            const validOption =
                Array.from(
                    incidentTypeSelect.options
                ).some(
                    option =>
                        option.value === suggestion
                );

            if (!validOption) {

                alert(
                    "The AI suggestion does not match an available incident type."
                );

                return;
            }

            incidentTypeSelect.value =
                suggestion;
        }

        /*
            AI suggested a rewritten DESCRIPTION
        */
        if (
            currentIncidentAiAction ===
            "rewriteDescription"
        ) {

            document.getElementById(
                "incident-description"
            ).value = suggestion;
        }

        document
            .getElementById(
                "incident-ai-suggestion-container"
            )
            .classList.add("hidden");

        currentIncidentAiAction =
            null;
    });

function resetIncidentAiAssist() {

    const suggestionContainer =
        document.getElementById(
            "incident-ai-suggestion-container"
        );

    if (suggestionContainer) {
        suggestionContainer.classList.add(
            "hidden"
        );
    }

    const suggestionOutput =
        document.getElementById(
            "incident-ai-suggestion"
        );

    if (suggestionOutput) {
        suggestionOutput.textContent = "";
    }

    const suggestionTitle =
        document.getElementById(
            "incident-ai-suggestion-title"
        );

    if (suggestionTitle) {
        suggestionTitle.textContent =
            "AI Suggestion";
    }

    const useSuggestionButton =
        document.getElementById(
            "use-incident-ai-suggestion"
        );

    if (useSuggestionButton) {

        useSuggestionButton.textContent =
            "Use Suggestion";

        useSuggestionButton.classList.remove(
            "hidden"
        );
    }

    currentIncidentAiAction = null;
}

function buildManagementBriefContext() {

    const activeResidents =
        residents.filter(
            resident =>
                resident.status === "Active"
        );

    return {
        generatedDate: getTodayDate(),

        houseSummary: {
            activeResidentCount:
                activeResidents.length
        },

        residents:
            activeResidents.map(resident => {

                const balance =
                    calculateResidentBalance(
                        resident.id
                    );

                const residentTransactions =
                    transactions
                        .filter(
                            transaction =>
                                transaction.residentId ===
                                resident.id
                        )
                        .sort(
                            (a, b) =>
                                new Date(b.date) -
                                new Date(a.date)
                        )
                        .slice(0, 5);

                const residentUaRecords =
                    uaRecords
                        .filter(
                            record =>
                                record.residentId ===
                                resident.id
                        )
                        .sort(
                            (a, b) =>
                                new Date(b.dueDate) -
                                new Date(a.dueDate)
                        );

                const unresolvedUaRecords =
                    residentUaRecords
                        .filter(
                            record =>
                                !record.resolved
                        )
                        .slice(0, 3);

                const recentUaRecords =
                    residentUaRecords
                        .slice(0, 3);

                const recentIncidents =
                    incidentRecords
                        .filter(
                            incident =>
                                incident.residentId ===
                                resident.id
                        )
                        .sort(
                            (a, b) =>
                                new Date(b.date) -
                                new Date(a.date)
                        )
                        .slice(0, 3);

                return {
                    resident: {
                        firstName:
                            resident.firstName,

                        lastName:
                            resident.lastName,

                        status:
                            resident.status,

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

                        nextUaDueDate:
                            resident.nextUaDueDate,

                        uaStatus:
                            getResidentUaStatus(
                                resident
                            )
                    },

                    recentTransactions:
                        residentTransactions,

                    unresolvedUaRecords:
                        unresolvedUaRecords,

                    recentUaRecords:
                        recentUaRecords,

                    recentIncidents:
                        recentIncidents
                };
            })
    };
}

document
    .getElementById(
        "generate-management-brief"
    )
    .addEventListener(
        "click",
        async () => {

            const managementContext =
                buildManagementBriefContext();

            const briefContainer =
                document.getElementById(
                    "management-brief-container"
                );

            const briefOutput =
                document.getElementById(
                    "management-brief-output"
                );

            briefContainer.classList.remove(
                "hidden"
            );

            briefOutput.textContent =
                "Generating management brief...";

            try {

                const response =
                    await fetch(
                        MANAGEMENT_BRIEF_API_URL,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                managementContext:
                                    managementContext
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

                briefOutput.innerHTML =
                    formatAiSummary(
                        data.managementBrief
                    );

            } catch (error) {

                console.error(
                    "Management Brief Error:",
                    error
                );

                briefOutput.textContent =
                    "Unable to generate the management brief.";
            }
        }
    );

    function buildAskHouseContext() {

    const activeResidents =
        residents.filter(
            resident =>
                resident.status === "Active"
        );

    return {
        generatedDate:
            getTodayDate(),

        activeResidentCount:
            activeResidents.length,

        residents:
            activeResidents.map(
                resident => {

                    const balance =
                        calculateResidentBalance(
                            resident.id
                        );

                    const residentTransactions =
                        transactions
                            .filter(
                                transaction =>
                                    transaction.residentId ===
                                    resident.id
                            )
                            .sort(
                                (a, b) =>
                                    new Date(b.date) -
                                    new Date(a.date)
                            )
                            .slice(0, 20);

                    const residentUaRecords =
                        uaRecords
                            .filter(
                                record =>
                                    record.residentId ===
                                    resident.id
                            )
                            .sort(
                                (a, b) =>
                                    new Date(b.dueDate) -
                                    new Date(a.dueDate)
                            )
                            .slice(0, 10);

                    const residentIncidents =
                        incidentRecords
                            .filter(
                                incident =>
                                    incident.residentId ===
                                    resident.id
                            )
                            .sort(
                                (a, b) =>
                                    new Date(b.date) -
                                    new Date(a.date)
                            )
                            .slice(0, 10);

                    return {
                        resident: {
                            firstName:
                                resident.firstName,

                            lastName:
                                resident.lastName,

                            status:
                                resident.status,

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

                            nextUaDueDate:
                                resident.nextUaDueDate,

                            uaStatus:
                                getResidentUaStatus(
                                    resident
                                )
                        },

                        transactions:
                            residentTransactions,

                        uaRecords:
                            residentUaRecords,

                        incidents:
                            residentIncidents
                    };
                }
            )
    };
}

document
    .getElementById("ask-house-button")
    .addEventListener("click", async () => {

        const questionInput =
            document.getElementById(
                "ask-house-question"
            );

        const question =
            questionInput.value.trim();

        if (!question) {

            alert(
                "Enter a question before asking AI."
            );

            return;
        }

        const houseContext =
            buildAskHouseContext();

        const answerContainer =
            document.getElementById(
                "ask-house-answer-container"
            );

        const answerOutput =
            document.getElementById(
                "ask-house-answer"
            );

        answerContainer.classList.remove(
            "hidden"
        );

        answerOutput.textContent =
            "Reviewing house records...";

        try {

            const response =
                await fetch(
                    ASK_HOUSE_API_URL,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            question:
                                question,

                            houseContext:
                                houseContext
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

            answerOutput.innerHTML =
                formatAiSummary(
                    data.answer
                );

        } catch (error) {

            console.error(
                "Ask the House Error:",
                error
            );

            answerOutput.textContent =
                "Unable to answer the question.";
        }
    });

document
    .getElementById("ask-house-question")
    .addEventListener("keydown", event => {

        if (event.key === "Enter") {

            event.preventDefault();

            document
                .getElementById(
                    "ask-house-button"
                )
                .click();
        }
    });