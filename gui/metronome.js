const DEFAULT_IP = '10.194.228.38'; // Default server IP
const PORT = '8080';
let IP = localStorage.getItem('metronome-server-ip') || DEFAULT_IP;
let BASE_URL = `http://${IP}:${PORT}`;

let API_BPM = BASE_URL + '/bpm/';
let API_MIN = BASE_URL + '/bpm/min/';
let API_MAX = BASE_URL + '/bpm/max/';

// Function to safely update the IP address
function updateIp(newIp, isInitialLoad = false) {
    if (isInitialLoad) {
        document.getElementById('connection-status').innerText = 'Connecting to Metronome...';
        document.getElementById('connection-ip-display').innerText = `Attempting IP: ${newIp}`;
    }

    // Only test the bpm endpoint to verify the connection is alive
    const testUrl = `http://${newIp}:${PORT}/bpm/`;

    fetch(testUrl, { method: 'GET' })
        .then(response => {
            if (response.ok) {
                IP = newIp;
                localStorage.setItem('metronome-server-ip', IP);
                BASE_URL = `http://${IP}:${PORT}`;
                API_BPM = BASE_URL + '/bpm/';
                API_MIN = BASE_URL + '/bpm/min/';
                API_MAX = BASE_URL + '/bpm/max/';

                // Hide modal
                document.getElementById('connection-modal').style.display = 'none';

                if (!isInitialLoad) {
                    alert(`Successfully connected to ${newIp}:${PORT}`);
                }
                
                refreshAll(); // Refresh data with the newly set IP
            } else {
                if (isInitialLoad) {
                    document.getElementById('connection-status').innerText = `Connection Failed (${response.status})`;
                } else {
                    alert(`The IP is reachable, but returned an error (${response.status}).`);
                }
            }
        })
        .catch(error => {
            console.error('Error fetching new IP:', error);
            if (isInitialLoad) {
                document.getElementById('connection-status').innerText = 'Connection Failed (Timeout/Unreachable)';
            } else {
                alert(`The IP ${newIp} is not reachable. Please check your connection and the IP address.`);
            }
        });
}

// Function to refresh all BPM values
function refreshAll() {
    getBpm();
    getMinBpm();
    getMaxBpm();
} 

function getBpm() {
    fetch(API_BPM,{
            method: 'GET', 
            headers: {
                'Content-Type': 'application/json',
            },
        })
        .then(response => response.json())
        .then(data => {
            console.log('BPM Response:', data);
            document.getElementById('current-bpm').innerText = data === 0 ? 'none' : data;
        })
        .catch(error => console.error('Error getting BPM:', error));
}

function setBpm() {
    const bpm = document.getElementById('bpm-input').value;
    if (!bpm) return;
    fetch(API_BPM, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(parseInt(bpm)),
    })
    .then(response => {
        if (response.ok){
            console.log('Set BPM Response:', bpm);
            refreshAll();
        }
    })
    .catch(error => console.error('Error setting BPM:', error));
}

function getMinBpm() {
    fetch(API_MIN, { method: 'GET' })
        .then(response => response.json())
        .then(data => {
            console.log('Min BPM Response:', data);
            document.getElementById('min-bpm').innerText = data === 0 ? 'none' : data;
        })
        .catch(error => console.error('Error getting min BPM:', error));
}

function getMaxBpm(){
    fetch(API_MAX, { method: 'GET' })
        .then(response => response.json())
        .then(data => {
            console.log('Max BPM Response:', data);
            document.getElementById('max-bpm').innerText = data === 0 ? 'none' : data;
        })
        .catch(error => console.error('Error getting max BPM:', error));
}

function resetMinBpm() {
    fetch(API_MIN, { method: 'DELETE' })
        .then(() => getMinBpm())
        .catch(error => console.error('Error resetting min BPM:', error));
}

function resetMaxBpm() {
    fetch(API_MAX, { method: 'DELETE' })
        .then(() => getMaxBpm())
        .catch(error => console.error('Error resetting max BPM:', error));
}

// Initial load
window.onload = () => {
    // Only call updateIp which will handle revealing the UI and calling refreshAll()
    updateIp(IP, true); 
};