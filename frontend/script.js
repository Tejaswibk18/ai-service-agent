let apiKey = "";
let connectionVerified = false;


/* =========================================================
   API KEY
========================================================= */

function setApiKey() {

    const key = prompt("Enter your API key:");

    if (!key) {
        return false;
    }

    apiKey = key.trim();

    return true;
}


/* =========================================================
   DOM REFERENCES
========================================================= */

const connectButton =
    document.getElementById("connectButton");

const connectionStatus =
    document.getElementById("connectionStatus");

const addServerButton =
    document.getElementById("addServerButton");

const addServerPanel =
    document.getElementById("addServerPanel");

const cancelAddServerButton =
    document.getElementById("cancelAddServerButton");

const saveServerButton =
    document.getElementById("saveServerButton");

const removeServerButton =
    document.getElementById(
        "removeServerButton"
    );

const apiKeyOverlay =
    document.getElementById("apiKeyOverlay");

const apiKeyInput =
    document.getElementById("apiKeyInput");

const apiKeyLoginButton =
    document.getElementById(
        "apiKeyLoginButton"
    );

const apiKeyError =
    document.getElementById("apiKeyError");

const testConnectionButton =
    document.getElementById("testConnectionButton");

const newAuthType =
    document.getElementById("newServerAuthType");

const newPasswordGroup =
    document.getElementById("newPasswordGroup");

const newPemGroup =
    document.getElementById("newPemGroup");


/* =========================================================
   CONNECTION EVENTS
========================================================= */

connectButton.addEventListener(
    "click",
    connectToServer
);


addServerButton.addEventListener(
    "click",
    () => {

        addServerPanel.style.display =
            "block";

    }
);

removeServerButton.addEventListener(
    "click",
    removeServer
);

cancelAddServerButton.addEventListener(
    "click",
    () => {

        addServerPanel.style.display =
            "none";

    }
);

testConnectionButton.addEventListener(
    "click",
    testConnection
);

saveServerButton.addEventListener(
    "click",
    saveServer
);

apiKeyLoginButton.addEventListener(
    "click",
    validateApiKey
);


/* =========================================================
   REMOVE SERVER
========================================================= */

async function removeServer() {

    const serverSelect =
        document.getElementById(
            "serverSelect"
        );

    const serverId =
        serverSelect.value;


    if (!serverId) {

        alert(
            "Please select a server to remove."
        );

        return;
    }


    const confirmed =
        confirm(
            `Are you sure you want to remove "${serverId}"?`
        );


    if (!confirmed) {

        return;
    }


    removeServerButton.disabled =
        true;

    removeServerButton.textContent =
        "REMOVING...";


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/server/${encodeURIComponent(serverId)}`,
                {
                    method: "DELETE",

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
                "Unable to remove server"
            );
        }


        alert(
            "Server removed successfully."
        );


        clearServerInformation();


        updateConnectionStatus(
            "Not connected",
            false
        );


        await loadServers();


    } catch (error) {

        console.error(
            "Failed to remove server:",
            error
        );


        alert(
            error.message
        );


    } finally {

        removeServerButton.disabled =
            false;

        removeServerButton.textContent =
            "REMOVE SERVER";
    }
}


/* =========================================================
   ADD SERVER VALIDATION
========================================================= */

function invalidateConnectionTest() {

    connectionVerified = false;

    saveServerButton.disabled = true;
}


/* =========================================================
   ADD SERVER AUTHENTICATION
========================================================= */

newAuthType.addEventListener(
    "change",
    () => {

        /*
         * Authentication changed.
         * Previous connection test is no longer valid.
         */

        invalidateConnectionTest();


        newPasswordGroup.style.display =
            "none";

        newPemGroup.style.display =
            "none";


        if (newAuthType.value === "password") {

            newPasswordGroup.style.display =
                "flex";

        }


        if (newAuthType.value === "pem") {

            newPemGroup.style.display =
                "flex";

        }

    }
);


/* =========================================================
   INVALIDATE TEST WHEN SERVER DETAILS CHANGE
========================================================= */

document
    .getElementById("newServerId")
    .addEventListener(
        "input",
        invalidateConnectionTest
    );


document
    .getElementById("newServerHost")
    .addEventListener(
        "input",
        invalidateConnectionTest
    );


document
    .getElementById("newServerUsername")
    .addEventListener(
        "input",
        invalidateConnectionTest
    );


document
    .getElementById("newServerPassword")
    .addEventListener(
        "input",
        invalidateConnectionTest
    );


document
    .getElementById("newServerPem")
    .addEventListener(
        "change",
        invalidateConnectionTest
    );


/* =========================================================
   CONNECTION
========================================================= */

async function connectToServer() {

    const serverId =
        document
            .getElementById("serverSelect")
            .value;


    if (!serverId) {

        updateConnectionStatus(
            "Select a server",
            true
        );

        return;
    }


    setConnectingState();


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/server/connect`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                        "X-API-Key":
                            apiKey
                    },

                    body: JSON.stringify({
                        server_id: serverId
                    })
                }
            );


        const data =
            await response.json();


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

        console.error(
            "Server connection failed:",
            error
        );

        updateConnectionStatus(
            error.message,
            true
        );

    } finally {

        connectButton.disabled = false;

        connectButton.textContent =
            "CONNECT";
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


    // if (!apiKey) {

    //     setApiKey();

    //     if (!apiKey) {

    //         return;
    //     }
    // }


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

    // Escape HTML first
    html = html
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");


    // Code blocks
    html = html.replace(
        /```([\s\S]*?)```/g,
        "<pre><code>$1</code></pre>"
    );


    // Headings
    html = html.replace(
        /^### (.*)$/gm,
        "<h3>$1</h3>"
    );

    html = html.replace(
        /^## (.*)$/gm,
        "<h2>$1</h2>"
    );

    html = html.replace(
        /^# (.*)$/gm,
        "<h1>$1</h1>"
    );


    // Bold
    html = html.replace(
        /\*\*(.*?)\*\*/g,
        "<strong>$1</strong>"
    );


    // Inline code
    html = html.replace(
        /`([^`]+)`/g,
        "<code>$1</code>"
    );


    // Bullet points
    html = html.replace(
        /^\s*[-*] (.*)$/gm,
        "<li>$1</li>"
    );


    // Wrap consecutive list items
    html = html.replace(
        /((?:<li>.*<\/li>\s*)+)/g,
        "<ul>$1</ul>"
    );


    // Paragraphs / line breaks
    html = html.replace(
        /\n{2,}/g,
        "</p><p>"
    );

    html = html.replace(
        /\n/g,
        "<br>"
    );


    // Remove <br> immediately around block elements
    html = html.replace(
        /<br>\s*(<h[1-3]>)/g,
        "$1"
    );

    html = html.replace(
        /(<\/h[1-3]>)\s*<br>/g,
        "$1"
    );

    html = html.replace(
        /<br>\s*(<ul>)/g,
        "$1"
    );

    html = html.replace(
        /(<\/ul>)\s*<br>/g,
        "$1"
    );


    return `<div class="markdown-content">${html}</div>`;
}


/* =========================================================
   AGENT RESPONSE
========================================================= */

function displayAgentResponse(data) {

    const responseBox =
        document.getElementById(
            "agentResponse"
        );


    const analysisBox =
        document.getElementById(
            "analysisContent"
        );


    if (data.response) {

        responseBox.innerHTML =
            markdownToHtml(
                data.response
            );

    } else if (data.message) {

        responseBox.innerHTML =
            markdownToHtml(
                data.message
            );

    } else {

        responseBox.innerHTML =
            "<p>Server health analysis completed.</p>" +
            "<p>Detailed health analysis is available below.</p>";
    }


    if (data.analysis) {

        analysisBox.innerHTML =
            markdownToHtml(
                data.analysis
            );

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
   TEST CONNECTION
========================================================= */

async function testConnection() {

    console.log("TEST CONNECTION CLICKED");

    const serverId =
        document.getElementById("newServerId").value.trim();

    const host =
        document.getElementById("newServerHost").value.trim();

    const username =
        document.getElementById("newServerUsername").value.trim();

    const authType =
        document.getElementById("newServerAuthType").value;


    console.log({
        serverId,
        host,
        username,
        authType
    });


    if (
        !serverId ||
        !host ||
        !username ||
        !authType
    ) {

        alert(
            "Please fill all required fields."
        );

        return;
    }


    const formData = new FormData();


    formData.append(
        "server_id",
        serverId
    );

    formData.append(
        "host",
        host
    );

    formData.append(
        "username",
        username
    );

    formData.append(
        "auth_type",
        authType
    );


    // =============================================
    // PASSWORD
    // =============================================

    if (authType === "password") {

        const password =
            document
                .getElementById("newServerPassword")
                .value;


        if (!password) {

            alert(
                "Password is required."
            );

            return;
        }


        formData.append(
            "password",
            password
        );
    }


    // =============================================
    // PEM
    // =============================================

    if (authType === "pem") {

        const pemInput =
            document.getElementById(
                "newServerPem"
            );


        if (!pemInput) {

            alert(
                "PEM input element not found."
            );

            return;
        }


        const pemFile =
            pemInput.files[0];


        console.log(
            "Selected PEM file:",
            pemFile
        );


        if (!pemFile) {

            alert(
                "Please select a PEM file."
            );

            return;
        }


        if (
            !pemFile.name
                .toLowerCase()
                .endsWith(".pem")
        ) {

            alert(
                "Only .pem files are allowed."
            );

            return;
        }


        formData.append(
            "pem_file",
            pemFile
        );
    }


    // =============================================
    // BUTTON STATE
    // =============================================

    testConnectionButton.disabled =
        true;

    testConnectionButton.textContent =
        "TESTING...";


    connectionVerified =
        false;

    saveServerButton.disabled =
        true;


    // =============================================
    // API CALL
    // =============================================

    try {

        console.log(
            "Sending request to:",
            `${API_BASE_URL}/server/test-connection`
        );


        const response =
            await fetch(
                `${API_BASE_URL}/server/test-connection`,
                {
                    method: "POST",

                    headers: {
                        "X-API-Key":
                            apiKey
                    },

                    body: formData
                }
            );


        console.log(
            "HTTP status:",
            response.status
        );


        const data =
            await response.json();


        console.log(
            "Response:",
            data
        );


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Connection failed"
            );
        }


        connectionVerified =
            true;


        saveServerButton.disabled =
            false;


        alert(
            "Connection successful. You can now save the server."
        );


    } catch (error) {

        console.error(
            "Connection test failed:",
            error
        );


        alert(
            `Connection failed: ${error.message}`
        );


    } finally {

        testConnectionButton.disabled =
            false;

        testConnectionButton.textContent =
            "TEST CONNECTION";
    }
}


/* =========================================================
   ADD SERVER
========================================================= */

async function saveServer() {

    if (!connectionVerified) {

        alert(
            "Please test the server connection first."
        );

        return;
    }


    const serverId =
        document
            .getElementById("newServerId")
            .value
            .trim();

    const host =
        document
            .getElementById("newServerHost")
            .value
            .trim();

    const username =
        document
            .getElementById("newServerUsername")
            .value
            .trim();

    const authType =
        document
            .getElementById("newServerAuthType")
            .value;


    if (
        !serverId ||
        !host ||
        !username ||
        !authType
    ) {

        alert(
            "Please fill all required fields."
        );

        return;
    }


    const formData =
        new FormData();


    formData.append(
        "server_id",
        serverId
    );

    formData.append(
        "host",
        host
    );

    formData.append(
        "username",
        username
    );

    formData.append(
        "auth_type",
        authType
    );


    // ---------------------------------------------
    // PASSWORD
    // ---------------------------------------------

    if (authType === "password") {

        const password =
            document
                .getElementById(
                    "newServerPassword"
                )
                .value;


        if (!password) {

            alert(
                "Password is required."
            );

            return;
        }


        formData.append(
            "password",
            password
        );
    }


    // ---------------------------------------------
    // PEM
    // ---------------------------------------------

    if (authType === "pem") {

        const pemInput =
            document.getElementById(
                "newServerPem"
            );


        const pemFile =
            pemInput.files[0];


        if (!pemFile) {

            alert(
                "Please select a PEM file."
            );

            return;
        }


        if (
            !pemFile.name
                .toLowerCase()
                .endsWith(".pem")
        ) {

            alert(
                "Only .pem files are allowed."
            );

            return;
        }


        formData.append(
            "pem_file",
            pemFile
        );
    }


    saveServerButton.disabled =
        true;

    saveServerButton.textContent =
        "SAVING...";


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/server/add`,
                {
                    method: "POST",

                    headers: {
                        "X-API-Key":
                            apiKey
                    },

                    body: formData
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Unable to add server"
            );
        }


        alert(
            "Server added successfully."
        );


        addServerPanel.style.display =
            "none";


        clearAddServerForm();


        await loadServers();


        document.getElementById(
            "serverSelect"
        ).value =
            serverId;


    } catch (error) {

        console.error(
            "Failed to add server:",
            error
        );


        alert(
            `Unable to add server: ${error.message}`
        );


    } finally {

        saveServerButton.disabled =
            false;

        saveServerButton.textContent =
            "SAVE SERVER";
    }
}

/* =========================================================
   CLEAR ADD SERVER FORM
========================================================= */

function clearAddServerForm() {

    document.getElementById(
        "newServerId"
    ).value = "";


    document.getElementById(
        "newServerHost"
    ).value = "";


    document.getElementById(
        "newServerUsername"
    ).value = "";


    document.getElementById(
        "newServerAuthType"
    ).value = "";


    document.getElementById(
        "newServerPassword"
    ).value = "";


    document.getElementById(
        "newServerPem"
    ).value = "";


    newPasswordGroup.style.display =
        "none";


    newPemGroup.style.display =
        "none";


    connectionVerified = false;

    saveServerButton.disabled =
        true;
}

/* =========================================================
   CLEAR SERVER INFORMATION
========================================================= */

function clearServerInformation() {

    document.getElementById(
        "serverOs"
    ).textContent = "—";


    document.getElementById(
        "serverHostname"
    ).textContent = "—";


    document.getElementById(
        "serverKernel"
    ).textContent = "—";


    document.getElementById(
        "serverUptime"
    ).textContent = "—";


    document.getElementById(
        "serverCpu"
    ).textContent = "—";


    document.getElementById(
        "serverMemory"
    ).textContent = "—";


    document.getElementById(
        "serverDisk"
    ).textContent = "—";


    document.getElementById(
        "serverHealth"
    ).textContent = "—";
}


/* =========================================================
   UI HELPERS
========================================================= */

function setConnectingState() {

    connectButton.disabled =
        true;


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


    if (
        value.includes("healthy")
    ) {

        return "health-healthy";
    }


    if (
        value.includes("warning")
    ) {

        return "health-warning";
    }


    if (
        value.includes("critical")
    ) {

        return "health-critical";
    }


    return "";
}


/* =========================================================
   LOAD SERVERS
========================================================= */

async function loadServers() {

    const serverSelect =
        document.getElementById(
            "serverSelect"
        );


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/server/list`,
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
                "Unable to load servers"
            );
        }


        if (
            !data.servers ||
            !Array.isArray(data.servers)
        ) {

            throw new Error(
                "Invalid server list received"
            );
        }


        serverSelect.innerHTML =
            '<option value="">Select a server</option>';


        data.servers.forEach(
            serverId => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    serverId;


                option.textContent =
                    serverId;


                serverSelect.appendChild(
                    option
                );

            }
        );


    } catch (error) {

        console.error(
            "Failed to load servers:",
            error
        );


        updateConnectionStatus(
            "Unable to load servers",
            true
        );
    }
}


/* =========================================================
   VALIDATE API KEY
========================================================= */

async function validateApiKey() {

    const key =
        apiKeyInput.value.trim();

    if (!key) {

        apiKeyError.textContent =
            "Please enter your API key.";

        return;
    }

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/server/list`,
                {
                    method: "GET",

                    headers: {
                        "X-API-Key": key
                    }
                }
            );

        if (response.status === 401) {

            apiKeyError.textContent =
                "Invalid API key.";

            return;
        }

        if (!response.ok) {

            apiKeyError.textContent =
                "Unable to authenticate.";

            return;
        }

        apiKey = key;

        sessionStorage.setItem(
            "agentApiKey",
            apiKey
        );

        apiKeyOverlay.style.display =
            "none";

        apiKeyError.textContent = "";

        loadServers();

    } catch (error) {

        console.error(error);

        apiKeyError.textContent =
            "Unable to connect to server.";
    }
}


/* =========================================================
   RESTORE API KEY
========================================================= */

const savedApiKey =
    sessionStorage.getItem(
        "agentApiKey"
    );

if (savedApiKey) {

    apiKey = savedApiKey;

    apiKeyOverlay.style.display =
        "none";

    loadServers();
}