# Valyria Metronome
A simple metronome for our sleeping dragon heartbeat ﮩ٨ـﮩﮩ٨ـ♡ﮩ٨ـﮩﮩ٨ـ___


<p align="center">
  <img src="gui/Valyria_logo_plus_cuffie.png" alt="Valyria IoT Logo" width="400"/>
</p>

A smart, connected metronome built on the Raspberry Pi using C++, hardware GPIO components, and a RESTful web dashboard.

## 📖 Project Description

In this project, we built a metronome on the Raspberry Pi using GPIO inputs (push buttons), LEDs, and a buzzer. The device supports two distinct modes:

* **LEARN Mode:** The user taps a physical button to set the tempo. The system records the tap timings to compute the Beats Per Minute (BPM). A red LED provides visual feedback during tapping.
* **PLAY Mode:** A blue LED and a buzzer pulse rhythmically at the learned tempo.

Additionally, a **REST API** is included, which connects to a simple custom web dashboard. Through this interface, users can remotely query the current BPM, adjust it manually, and retrieve or reset the stored minimum and maximum BPM values of the session.

---

## 🔌 Hardware Setup

Connect your components to the following Raspberry Pi GPIO pins (using BCM numbering):

| Component | BCM Pin | Function |
| :--- | :--- | :--- |
| **Tap Button** | `GPIO 18` | Tap to set the tempo (LEARN mode). |
| **Buzzer** | `GPIO 19` | Beeps to the beat (PLAY mode). |
| **Mode Button** | `GPIO 20` | Toggles between LEARN and PLAY modes. |
| **Blue LED** | `GPIO 26` | Flashes to the beat (PLAY mode). |
| **Red LED** | `GPIO 27` | Flashes on user tap (LEARN mode). |

*(Note: The code utilizes internal Pull-Down resistors. Wire your buttons so that pressing them connects the GPIO pin to the 3.3V power pin).*

---

## 🛠️ How to Build and Run (Commands)

### 1. Install Dependencies
Your Raspberry Pi needs the `pigpio` library for hardware control and Microsoft's `cpprestsdk` for the REST API. Open your terminal and run:
```bash
sudo apt-get update
sudo apt-get install pigpio libcpprest-dev
