#include <chrono>
#include <thread>
#include <iostream>  // Replaced cstdio for guaranteed console flushing
#include <cstdlib>
#include <csignal>
#include <atomic>
#include <exception>

using namespace std::chrono_literals;

#include <cpprest/http_msg.h>
#include <pigpio.h>

#include "metronome.hpp"
#include "rest.hpp"

// ** PIN SETUP **
#define LED_RED   27
#define LED_BLUE 26
#define BTN_MODE_RED  20
#define BTN_TAP_BLUE   18
#define BUZZ 19

// ** BUTTON BEHAVIOR SETUP **
// If your buttons connect to 3.3V when pushed, leave this as 1 (HIGH) and 0 (LOW).
// If your buttons connect to GND when pushed, flip these to 0 (LOW) and 1 (HIGH).
#define BTN_PRESSED 1
#define BTN_RELEASED 0

enum Mode {
    PLAY,
    LEARN
};

// Properly sync data between the Main loop, the Blink thread, and REST handlers
std::atomic<Mode> mode{PLAY};
std::atomic<int> interval{0};

std::atomic<size_t> min_bpm{0};
std::atomic<size_t> max_bpm{0};

volatile sig_atomic_t running = 1;

metronome m;

void cleanup() {
    gpioWrite(LED_RED, 0);
    gpioWrite(LED_BLUE, 0);
    gpioWrite(BUZZ, 0);
    gpioTerminate();
    std::cout << "Cleaned up GPIO and exiting." << std::endl;
}

void signalHandler(int signum) {
    std::cout << "\nInterrupt signal received. Shutting down..." << std::endl;
    running = 0; 
}

void set_new_bpm(size_t bpm) {
    if (bpm == 0) return;
    
    interval.store(60000 / bpm); 

    size_t current_min = min_bpm.load();
    if (current_min == 0 || bpm < current_min) {
        min_bpm.store(bpm);
    }
    
    size_t current_max = max_bpm.load();
    if (bpm > current_max) {
        max_bpm.store(bpm);
    }
}

void blink() {
    while (running) {
        Mode current_mode = mode.load();
        int current_interval = interval.load();

        if (current_mode == PLAY && current_interval > 0) {
            int tick_duration = 50; 
            if (tick_duration > current_interval) tick_duration = current_interval;

            gpioWrite(LED_BLUE, 1);
            gpioWrite(BUZZ, 1);
            std::this_thread::sleep_for(std::chrono::milliseconds(tick_duration));

            gpioWrite(LED_BLUE, 0);
            gpioWrite(BUZZ, 0);
            
            std::this_thread::sleep_for(std::chrono::milliseconds(current_interval - tick_duration));
        } else {
            gpioWrite(LED_BLUE, 0);
            gpioWrite(BUZZ, 0);
            std::this_thread::sleep_for(50ms);
        }
    }
}
void switchMode() {
    if (mode.load() == LEARN) {
        m.stop_timing();
        auto bpm = m.get_bpm();
        
        std::cout << "Mode Button Pressed! Attempting to switch to PLAY. Calculated BPM: " << bpm << std::endl;
        
        if (bpm == 0) {
            std::cout << "-> ERROR: Not enough beat samples! You must tap at least 4 times." << std::endl;
            
            mode.store(LEARN);
            m.start_timing(); 
        } else {
            std::cout << "-> SUCCESS: Switching to PLAY mode at " << bpm << " BPM." << std::endl;
            set_new_bpm(bpm);
            mode.store(PLAY);
        }
    } else {
        std::cout << "Mode Button Pressed! Switched to LEARN mode. Start tapping!" << std::endl;
        mode.store(LEARN);
        m.start_timing();
    }   
}

// --- REST Endpoints ---
void get_bpm(web::http::http_request msg) {
    int curr_interval = interval.load();
    int bpm = (curr_interval > 0) ? (60000 / curr_interval) : 0;
    web::http::http_response response(web::http::status_codes::OK);
    response.set_body(web::json::value::number(bpm));
    rest::addCorsHeaders(response);
    msg.reply(response);
}

void put_bpm(web::http::http_request msg) {
    msg.extract_json().then([msg](web::json::value body) {
        if (body.is_integer()) {
            int new_bpm = body.as_integer();
            if (new_bpm > 0) {
                set_new_bpm(new_bpm);
            }
            web::http::http_response response(web::http::status_codes::OK);
            rest::addCorsHeaders(response);
            msg.reply(response);
        } else {
            web::http::http_response response(web::http::status_codes::BadRequest);
            rest::addCorsHeaders(response);
            msg.reply(response);
        }
    }); 
}
void get_bpm_min(web::http::http_request msg) {
    web::http::http_response response(web::http::status_codes::OK);
    response.set_body(web::json::value::number(min_bpm.load()));
    rest::addCorsHeaders(response);
    msg.reply(response);
}

void delete_bpm_min(web::http::http_request msg) {
    min_bpm.store(0);
    web::http::http_response response(web::http::status_codes::OK);
    rest::addCorsHeaders(response);
    msg.reply(response);
}

void get_bpm_max(web::http::http_request msg) {
    web::http::http_response response(web::http::status_codes::OK);
    response.set_body(web::json::value::number(max_bpm.load()));
    rest::addCorsHeaders(response);
    msg.reply(response);
}

void delete_bpm_max(web::http::http_request msg) {
    max_bpm.store(0);
    web::http::http_response response(web::http::status_codes::OK);
    rest::addCorsHeaders(response);
    msg.reply(response);
}

int main() {
    std::cout << "Starting Metronome..." << std::endl;

    if (gpioInitialise() < 0) {
        std::cerr << "CRITICAL ERROR: Pigpio failed to initialize. Are you running with 'sudo'?" << std::endl;
        return 1;
    }
    std::cout << "GPIO Initialized successfully." << std::endl;
    
    std::signal(SIGINT, signalHandler);
    std::signal(SIGTERM, signalHandler);
    atexit(cleanup);

    gpioSetMode(LED_RED, PI_OUTPUT);
    gpioSetMode(LED_BLUE, PI_OUTPUT);
    gpioSetMode(BUZZ, PI_OUTPUT);
    gpioSetMode(BTN_MODE_RED, PI_INPUT);
    gpioSetMode(BTN_TAP_BLUE, PI_INPUT);

    std::cout << "Setting up REST endpoints..." << std::endl;
    
    // We wrap this in a Try-Catch block. If cpprestsdk fails to bind to the port,
    // the app will throw an error here instead of silently closing.
    auto bpm_rest = rest::make_endpoint("/bpm/");
    auto bpm_min_rest = rest::make_endpoint("/bpm/min/");
    auto bpm_max_rest = rest::make_endpoint("/bpm/max/");

    try {
        bpm_rest.support(web::http::methods::GET, get_bpm);
        bpm_rest.support(web::http::methods::PUT, put_bpm);
        bpm_min_rest.support(web::http::methods::GET, get_bpm_min);
        bpm_min_rest.support(web::http::methods::DEL, delete_bpm_min);
        bpm_max_rest.support(web::http::methods::GET, get_bpm_max);
        bpm_max_rest.support(web::http::methods::DEL, delete_bpm_max);

        bpm_rest.open().wait();
        bpm_min_rest.open().wait();
        bpm_max_rest.open().wait();
        std::cout << "REST endpoints opened successfully." << std::endl;
    } catch (const std::exception& e) {
        std::cerr << "CRITICAL ERROR starting REST API: " << e.what() << std::endl;
        cleanup();
        return 1;
    }

    std::thread blink_thread(blink);

    bool prev_mode_state = BTN_RELEASED;
    bool prev_tap_state = BTN_RELEASED;
    
    auto last_mode_press = std::chrono::steady_clock::now();
    auto last_tap_press = std::chrono::steady_clock::now();

    std::cout << "Metronome is active! Press the red button to enter LEARN mode." << std::endl;

    while (running) {
        std::this_thread::sleep_for(10ms);
        
        // --- MODE BUTTON ---
        // used for avoiding spam of the mode button
        bool current_mode_state = gpioRead(BTN_MODE_RED);
        if (prev_mode_state == BTN_RELEASED && current_mode_state == BTN_PRESSED) {
            auto now = std::chrono::steady_clock::now();
            if (std::chrono::duration_cast<std::chrono::milliseconds>(now - last_mode_press).count() > 200) {
                switchMode();
                last_mode_press = now;
            }
        }
        prev_mode_state = current_mode_state;

        // --- TAP BUTTON ---
        if (mode.load() == LEARN) {
            bool current_tap_state = gpioRead(BTN_TAP_BLUE);
            if (prev_tap_state == BTN_RELEASED && current_tap_state == BTN_PRESSED) {
                auto now = std::chrono::steady_clock::now();
                // DEBOUNCE
                if (std::chrono::duration_cast<std::chrono::milliseconds>(now - last_tap_press).count() > 50) {
                    m.tap(); 
                    std::cout << "Tap registered!" << std::endl;
                    last_tap_press = now;
                }
                gpioWrite(LED_RED, 1);
                
            } else if (prev_tap_state == BTN_PRESSED && current_tap_state == BTN_RELEASED) {
                gpioWrite(LED_RED, 0);
            }
            prev_tap_state = current_tap_state;
        } else {
            if (prev_tap_state == BTN_PRESSED) {
                gpioWrite(LED_RED, 0);
                prev_tap_state = BTN_RELEASED;
            }
        }
    }

    // Shutdown gracefully
    try {
        bpm_rest.close().wait();
        bpm_min_rest.close().wait();
        bpm_max_rest.close().wait();
    } catch (...) {}
    
    blink_thread.join();

    return 0;
}
