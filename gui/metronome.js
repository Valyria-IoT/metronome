 const IP = 'http://10.194.228.38:8080'; // Change this to your server's IP and port
 const API_URL = IP + '/bpm/'; 

            function getBpm() {
                fetch(API_URL,{
                        method: 'GET', 
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    })
                    .then(response => response.json())
                    .then(data => {
                        console.log('BPM Response:', data);
                        document.getElementById('current-bpm').innerText = data;
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
                    body: JSON.stringify(parseInt(bpm)),
                })
                .then(response => {
                    if (response.ok){
                        console.log('Set BPM Response:', bpm);
                        getBpm();
                        getMinBpm();
                        getMaxBpm();
                    }
                })
                .catch(error => console.error('Error setting BPM:', error));
            }

            function getMinBpm() {
                fetch(API_URL + '/min', { method: 'GET' })
                    .then(response => response.json())
                    .then(data => {
                        console.log('Min BPM Response:', data);
                        document.getElementById('min-bpm').innerText = data;
                    })
                    .catch(error => console.error('Error getting min BPM:', error));
            }

            function getMaxBpm(){
                fetch(API_URL + '/max', { method: 'GET' })
                    .then(response => response.json())
                    .then(data => {
                        console.log('Max BPM Response:', data);
                        document.getElementById('max-bpm').innerText = data;
                    })
                    .catch(error => console.error('Error getting max BPM:', error));
            }

            function resetMinBpm() {
                fetch(API_URL + '/min', { method: 'DELETE' })
                    .then(() => getMinBpm())
                    .catch(error => console.error('Error resetting min BPM:', error));
            }

            function resetMaxBpm() {
                fetch(API_URL + '/max', { method: 'DELETE' })
                    .then(() => getMaxBpm())
                    .catch(error => console.error('Error resetting max BPM:', error));
            }

            // Initial load
            window.onload = () => {
                getBpm();
                getMinBpm();
                getMaxBpm();
            };