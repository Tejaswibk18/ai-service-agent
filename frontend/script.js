const API_BASE_URL = "http://127.0.0.1:8000";

let apiKey = "";


/* =========================================================
   AUTHENTICATION TYPE
========================================================= */

const authType = document.getElementById("authType");

const passwordGroup =
    document.getElementById("passwordGroup");

const pemGroup =
    document.getElementById("pemGroup");

const authenticationDetails =
    document.getElementById("authenticationDetails");


passwordGroup.style.display = "none";
pemGroup.style.display = "none";


authType.addEventListener("change", () => {

    passwordGroup.style.display = "none";
    pemGroup.style.display = "none";

    if (authType.value === "password") {
        passwordGroup.style.display = "flex";
    }

    if (authType.value === "pem") {
        pemGroup.style.display = "flex";
    }

});


/* =========================================================
   API KEY
========================================================= */

function setApiKey() {

    const key = prompt("Enter your API key:");

    if (!key) {
        return;
    }

    apiKey = key.trim();

    updateConnectionStatus(
        "API key configured",
        false
    );
}


/* =========================================================
   CONNECTION
========================================================= */

const connectButton =
    document.getElementById("connectButton");

const connectionStatus =
    document.getElementById("connectionStatus");


connectButton.addEventListener("click", connectToServer);


async function connectToServer() {

    const ip =
        document.getElementById("serverIp").value.trim();

    const username =
        document.getElementById("username").value.trim();

    const selectedAuth =
        document.getElementById("authType").value;


    if (!ip) {

        updateConnectionStatus(
            "Enter server IP address",
            true
        );

        return;
    }


    if (!username) {

        updateConnectionStatus(
            "Enter username",
            true
        );

        return;
    }


    if (!selectedAuth) {

        updateConnectionStatus(
            "Select authentication type",
            true
        );

        return;
    }


    if (!apiKey) {

        setApiKey();

        if (!apiKey) {
            return;
        }
    }


    const credentials = {

        ip: ip,

        username: username,

        auth_type: selectedAuth

    };


    if (selectedAuth === "password") {

        const password =
            document
                .getElementById("serverPassword")
                .value;

        if (!password) {

            updateConnectionStatus(
                "Enter password",
                true
            );

            return;
        }

        credentials.password = password;
    }


    if (selectedAuth === "pem") {

        const pemKey =
            document
                .getElementById("pemKey")
                .value
                .trim();

        if (!pemKey) {

            updateConnectionStatus(
                "Enter PEM key path",
                true
            );

            return;
        }

        credentials.pem_key = pemKey;
    }


    setConnectingState();


    try {

        const response = await fetch(
            `${API_BASE_URL}/server/connect`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": apiKey
                },

                body: JSON.stringify(credentials)
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Unable to connect to server"
            );
        }


        updateConnectionStatus(
            "Connected",
            false
        );


        if (data.data) {

            updateServerInformation(
                data.data
            );
        }


    } catch (error) {

        updateConnectionStatus(
            error.message,
            true
        );

    } finally {

        connectButton.disabled = false;

        connectButton.textContent = "CONNECT";
    }

}


/* =========================================================
   SERVER INFORMATION
========================================================= */

function updateServerInformation(data) {

    const os =
        data.os || {};

    const uptime =
        data.uptime || {};

    const cpu =
        data.cpu || {};

    const memory =
        data.memory || {};

    const disk =
        Array.isArray(data.disk)
            ? data.disk
            : [];


    document.getElementById(
        "serverOs"
    ).textContent =
        os.name || "—";


    document.getElementById(
        "serverHostname"
    ).textContent =
        os.hostname || "—";


    document.getElementById(
        "serverKernel"
    ).textContent =
        os.kernel ||
        os.version ||
        "—";


    document.getElementById(
        "serverUptime"
    ).textContent =
        formatUptime(
            uptime.seconds
        );


    document.getElementById(
        "serverCpu"
    ).textContent =
        formatCpu(cpu);


    document.getElementById(
        "serverMemory"
    ).textContent =
        formatMemory(memory);


    document.getElementById(
        "serverDisk"
    ).textContent =
        formatDisk(disk);


    const healthElement =
        document.getElementById(
            "serverHealth"
        );


    if (data.health) {

        healthElement.textContent =
            data.health.status || "—";

        healthElement.className =
            "health-status " +
            getHealthClass(
                data.health.status
            );

    } else {

        healthElement.textContent =
            "Connected";

        healthElement.className =
            "health-status health-healthy";
    }

}


/* =========================================================
   FORMATTING
========================================================= */

function formatUptime(seconds) {

    if (
        seconds === undefined ||
        seconds === null
    ) {
        return "—";
    }


    const totalSeconds =
        Math.floor(seconds);

    const days =
        Math.floor(
            totalSeconds / 86400
        );

    const hours =
        Math.floor(
            (totalSeconds % 86400) / 3600
        );

    const minutes =
        Math.floor(
            (totalSeconds % 3600) / 60
        );


    if (days > 0) {

        return `${days}d ${hours}h`;
    }


    if (hours > 0) {

        return `${hours}h ${minutes}m`;
    }


    return `${minutes}m`;
}


function formatCpu(cpu) {

    if (!cpu) {
        return "—";
    }


    if (
        cpu.usage_percent !== undefined
    ) {

        return `${cpu.usage_percent.toFixed(1)}%`;
    }


    if (cpu.load_average) {

        const load =
            cpu.load_average["1_min"];


        if (load !== undefined) {

            return `${load.toFixed(2)} load`;
        }
    }


    if (
        cpu.logical_cpus !== undefined
    ) {

        return `${cpu.logical_cpus} CPUs`;
    }


    return "—";
}


function formatMemory(memory) {

    if (!memory) {
        return "—";
    }


    if (
        memory.usage_percent !== undefined
    ) {

        return `${memory.usage_percent.toFixed(1)}%`;
    }


    return "—";
}


function formatDisk(disks) {

    if (!Array.isArray(disks)) {
        return "—";
    }


    if (disks.length === 0) {
        return "—";
    }


    const validUsage =
        disks
            .map(
                disk =>
                    disk.usage_percent
            )
            .filter(
                value =>
                    typeof value === "number"
            );


    if (validUsage.length === 0) {
        return "—";
    }


    const highestUsage =
        Math.max(
            ...validUsage
        );


    return `${highestUsage.toFixed(1)}%`;
}


/* =========================================================
   AGENT QUERY
========================================================= */

const sendQueryButton =
    document.getElementById(
        "sendQueryButton"
    );


sendQueryButton.addEventListener(
    "click",
    sendQuery
);


async function sendQuery() {

    const query =
        document
            .getElementById("agentQuery")
            .value
            .trim();


    const responseBox =
        document.getElementById(
            "agentResponse"
        );


    const analysisBox =
        document.getElementById(
            "analysisContent"
        );


    if (!query) {

        responseBox.textContent =
            "Enter a query.";

        return;
    }


    if (!apiKey) {

        setApiKey();

        if (!apiKey) {
            return;
        }
    }


    sendQueryButton.disabled = true;

    sendQueryButton.textContent =
        "PROCESSING...";


    responseBox.textContent =
        "Agent is processing your request...";


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/agent/query`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "X-API-Key":
                            apiKey
                    },

                    body: JSON.stringify({
                        query: query
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Agent request failed"
            );
        }


        displayAgentResponse(data);


    } catch (error) {

        responseBox.textContent =
            `Error: ${error.message}`;

    } finally {

        sendQueryButton.disabled = false;

        sendQueryButton.textContent =
            "SEND";
    }

}

/* =========================================================
   MARKDOWN FORMATTER
========================================================= */

function markdownToHtml(markdown) {

    if (!markdown) {
        return "";
    }


    let html = markdown;


    /*
     * Escape HTML first
     * so AI output cannot directly inject HTML.
     */

    html = html
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");


    /*
     * Headings
     */

    html = html.replace(
        /^### (.+)$/gm,
        "<h3>$1</h3>"
    );

    html = html.replace(
        /^## (.+)$/gm,
        "<h2>$1</h2>"
    );

    html = html.replace(
        /^# (.+)$/gm,
        "<h1>$1</h1>"
    );


    /*
     * Bold
     */

    html = html.replace(
        /\*\*(.+?)\*\*/g,
        "<strong>$1</strong>"
    );


    /*
     * Inline code
     */

    html = html.replace(
        /`([^`]+)`/g,
        "<code>$1</code>"
    );


    /*
     * Bullet points
     */

    html = html.replace(
        /^\* (.+)$/gm,
        "<li>$1</li>"
    );

    html = html.replace(
        /(<li>.*<\/li>\n?)+/g,
        "<ul>$&</ul>"
    );


    /*
     * Paragraphs / line breaks
     */

    html = html.replace(
        /\n{2,}/g,
        "</p><p>"
    );

    html = html.replace(
        /\n/g,
        "<br>"
    );


    /*
     * Avoid wrapping block elements unnecessarily
     */

    html = html.replace(
        /<p>(<h[1-3]>)/g,
        "$1"
    );

    html = html.replace(
        /(<\/h[1-3]>)<\/p>/g,
        "$1"
    );

    html = html.replace(
        /<p>(<ul>)/g,
        "$1"
    );

    html = html.replace(
        /(<\/ul>)<\/p>/g,
        "$1"
    );


    return `<div class="markdown-content">${html}</div>`;
}



/* =========================================================
   AGENT RESPONSE
========================================================= */

function displayAgentResponse(data) {

    const responseBox =
        document.getElementById("agentResponse");

    const analysisBox =
        document.getElementById("analysisContent");


    /*
     * Agent Response
     */

    if (data.response) {

        responseBox.innerHTML =
            markdownToHtml(data.response);

    } else if (data.message) {

        responseBox.innerHTML =
            markdownToHtml(data.message);

    } else {

        responseBox.innerHTML =
            "<p>Server health analysis completed.</p>" +
            "<p>Detailed health analysis is available below.</p>";
    }


    /*
     * Health Analysis
     */

    if (data.analysis) {

        analysisBox.innerHTML =
            markdownToHtml(data.analysis);

    } else {

        analysisBox.innerHTML =
            "<p>No health analysis was returned.</p>";
    }

}


/* =========================================================
   REFRESH
========================================================= */

const refreshButton =
    document.getElementById(
        "refreshButton"
    );


refreshButton.addEventListener(
    "click",
    refreshServer
);


async function refreshServer() {

    if (!apiKey) {

        setApiKey();

        if (!apiKey) {
            return;
        }
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/server/health`,
                {
                    method: "GET",

                    headers: {
                        "X-API-Key":
                            apiKey
                    }
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Unable to refresh server"
            );
        }


        if (data.data) {

            updateServerInformation(
                data.data
            );
        }


    } catch (error) {

        updateConnectionStatus(
            error.message,
            true
        );
    }

}


/* =========================================================
   UI HELPERS
========================================================= */

function setConnectingState() {

    connectButton.disabled = true;

    connectButton.textContent =
        "CONNECTING...";

    updateConnectionStatus(
        "Connecting...",
        false
    );
}


function updateConnectionStatus(
    message,
    error
) {

    connectionStatus.textContent =
        message;

    connectionStatus.style.color =
        error
            ? "#d71920"
            : "#666666";
}


function getHealthClass(status) {

    if (!status) {
        return "";
    }


    const value =
        status.toLowerCase();


    if (value.includes("healthy")) {
        return "health-healthy";
    }


    if (value.includes("warning")) {
        return "health-warning";
    }


    if (value.includes("critical")) {
        return "health-critical";
    }


    return "";
}