 const IP = 'http://10.194.228.38:8080'; // Change this to your server's IP and port
 const API_URL = IP + '/bpm'; 

            function getBpm() {
                fetch(API_URL,{
                        method: 'GET', 
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    })
                    .then(response => response.json())
                    .then(data => {
                        document.getElementById('current-bpm').innerText = data.bpm;
                    })
                    .catch(error => console.error('Error getting BPM:', error));
            }

            function setBpm() {
                const bpm = document.getElementById('bpm-input').value;
                if (!bpm) return;
                fetch(API_URL, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ bpm: parseInt(bpm) }),
                })
                .then(response => response.json())
                .then(data => {
                    document.getElementById('current-bpm').innerText = data.bpm;
                    getMinMaxBpm(); // Refresh min/max after setting
                })
                .catch(error => console.error('Error setting BPM:', error));
            }

            function getMinBpm() {
                fetch(API_URL + '/min', { method: 'GET' })
                    .then(response => response.json())
                    .then(data => {
                        document.getElementById('min-bpm').innerText = data.min_bpm;
                    })
                    .catch(error => console.error('Error getting min BPM:', error));
            }

            function getMaxBpm(){
                fetch(API_URL + '/max', { method: 'GET' })
                    .then(response => response.json())
                    .then(data => {
                        document.getElementById('max-bpm').innerText = data.max_bpm;
                    })
                    .catch(error => console.error('Error getting max BPM:', error));
            }

            function resetMinBpm() {
                fetch(API_URL + '/min', { method: 'DELETE' })
                    .then(() => getMinMaxBpm())
                    .catch(error => console.error('Error resetting min BPM:', error));
            }

            function resetMaxBpm() {
                fetch(API_URL + '/max', { method: 'DELETE' })
                    .then(() => getMinMaxBpm())
                    .catch(error => console.error('Error resetting max BPM:', error));
            }

            // Initial load
            window.onload = () => {
                getBpm();
                getMinBpm();
                getMaxBpm();
            };