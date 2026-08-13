const BASE_API_URL =
    "https://ijsdv38yzf.execute-api.us-east-1.amazonaws.com";


async function getResidentsFromApi() {

    const response = await fetch(
        `${BASE_API_URL}/residents`
    );

    if (!response.ok) {

        throw new Error(
            `Unable to load residents: ${response.status}`
        );
    }

    const data =
        await response.json();

    return data.residents;
}


async function createResidentInApi(
    resident
) {

    const response = await fetch(
        `${BASE_API_URL}/residents`,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                resident:
                    resident
            })
        }
    );

    if (!response.ok) {

        throw new Error(
            `Unable to create resident: ${response.status}`
        );
    }

    const data =
        await response.json();

    return data.resident;
}


async function updateResidentInApi(
    resident
) {

    const response = await fetch(
        `${BASE_API_URL}/residents`,
        {
            method: "PATCH",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                resident:
                    resident
            })
        }
    );

    if (!response.ok) {

        throw new Error(
            `Unable to update resident: ${response.status}`
        );
    }

    const data =
        await response.json();

    return data.resident;
}


async function deleteResidentFromApi(
    residentId
) {

    const response = await fetch(
        `${BASE_API_URL}/residents`,
        {
            method: "DELETE",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                residentId:
                    residentId
            })
        }
    );

    if (!response.ok) {

        throw new Error(
            `Unable to delete resident: ${response.status}`
        );
    }

    return response.json();
}

async function getTransactionsFromApi() {

    const response = await fetch(
        `${BASE_API_URL}/transactions`
    );

    if (!response.ok) {

        throw new Error(
            `Unable to load transactions: ${response.status}`
        );
    }

    const data =
        await response.json();

    return data.transactions;
}


async function createTransactionInApi(
    transaction
) {

    const response = await fetch(
        `${BASE_API_URL}/transactions`,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                transaction:
                    transaction
            })
        }
    );

    if (!response.ok) {

        throw new Error(
            `Unable to create transaction: ${response.status}`
        );
    }

    const data =
        await response.json();

    return data.transaction;
}


async function deleteTransactionFromApi(
    transactionId
) {

    const response = await fetch(
        `${BASE_API_URL}/transactions`,
        {
            method: "DELETE",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                transactionId:
                    transactionId
            })
        }
    );

    if (!response.ok) {

        throw new Error(
            `Unable to delete transaction: ${response.status}`
        );
    }

    return response.json();
}

async function getUaRecordsFromApi() {

    const response = await fetch(
        `${BASE_API_URL}/ua-records`
    );

    if (!response.ok) {

        throw new Error(
            `Unable to load UA records: ${response.status}`
        );
    }

    const data =
        await response.json();

    return data.uaRecords;
}


async function createUaRecordInApi(
    uaRecord
) {

    const response = await fetch(
        `${BASE_API_URL}/ua-records`,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                uaRecord:
                    uaRecord
            })
        }
    );

    if (!response.ok) {

        throw new Error(
            `Unable to create UA record: ${response.status}`
        );
    }

    const data =
        await response.json();

    return data.uaRecord;
}


async function updateUaRecordInApi(
    uaRecord
) {

    const response = await fetch(
        `${BASE_API_URL}/ua-records`,
        {
            method: "PATCH",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                uaRecord:
                    uaRecord
            })
        }
    );

    if (!response.ok) {

        throw new Error(
            `Unable to update UA record: ${response.status}`
        );
    }

    const data =
        await response.json();

    return data.uaRecord;
}

async function getIncidentRecordsFromApi() {

    const response = await fetch(
        `${BASE_API_URL}/incident-records`
    );

    if (!response.ok) {

        throw new Error(
            `Unable to load incident records: ${response.status}`
        );
    }

    const data =
        await response.json();

    return data.incidentRecords;
}


async function createIncidentRecordInApi(
    incidentRecord
) {

    const response = await fetch(
        `${BASE_API_URL}/incident-records`,
        {
            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                incidentRecord:
                    incidentRecord
            })
        }
    );

    if (!response.ok) {

        throw new Error(
            `Unable to create incident record: ${response.status}`
        );
    }

    const data =
        await response.json();

    return data.incidentRecord;
}


async function deleteIncidentRecordFromApi(
    incidentId
) {

    const response = await fetch(
        `${BASE_API_URL}/incident-records`,
        {
            method: "DELETE",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({
                incidentId:
                    incidentId
            })
        }
    );

    if (!response.ok) {

        throw new Error(
            `Unable to delete incident record: ${response.status}`
        );
    }

    return response.json();
}