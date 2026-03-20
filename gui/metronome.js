 const DEFAULT_IP = 'http://10.194.228.38:8080'; // Default server IP and port
let IP = localStorage.getItem('metronome-server-url') || DEFAULT_IP;
let API_BPM = IP + '/bpm/';
let API_MIN = IP + '/bpm/min/';
let API_MAX = IP + '/bpm/max/';

// Function to update the base URL
function updateBaseUrl(newUrl) {
    IP = newUrl;
    API_BPM = IP + '/bpm/';
    API_MIN = IP + '/bpm/min/';
    API_MAX = IP + '/bpm/max/';
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
    getBpm();
    getMinBpm();
    getMaxBpm();
};