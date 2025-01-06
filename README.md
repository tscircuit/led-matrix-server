# LED Matrix Server

A web interface for controlling LED matrices on RP2040-based microcontrollers. This server provides a visual grid interface where users can click cells to cycle through different colors (off, red, green, blue), with the state being tracked and made available via a REST API.

Source code for LED Matrix board here: https://tscircuit.com/seveibar/pico-w-3x5-led-matrix

<table>
  <tr>
    <td><img src="https://github.com/user-attachments/assets/2b399f91-8a54-4b2f-b6d2-46bb2fcef171" alt="2025-01-06_10-28"></td>
    <td><img src="https://github.com/user-attachments/assets/412db337-5d65-4138-9be1-25c4395c99a3" alt="image"></td>
  </tr>
</table>


## Features

- 5x3 LED matrix visual interface
- Click to cycle through colors (off/gray, red, green, blue)
- Real-time state updates via API
- Built with React + Vite
- Ready for RP2040 integration

## API Endpoints

- `GET /api/matrix/get` - Get current matrix state
- `POST /api/matrix/update` - Update matrix state (expects 5x3 2D array of integers 0-3)

## Pico W Code, Micropython

```python
import network
import time
from credentials import SSID, PASSWORD
import urequests

import array
import time
import rp2
from machine import Pin

# WS2812 configuration
@rp2.asm_pio(sideset_init=rp2.PIO.OUT_LOW, out_shiftdir=rp2.PIO.SHIFT_LEFT, autopull=True, pull_thresh=24)
def ws2812():
    T1 = 3  # 1-bit high duration (T1H = 3 cycles)
    T2 = 7  # 0-bit low duration (T1L = 7 cycles)
    T3 = 2  # Reset duration (>= 280 µs)

    wrap_target()
    label("bitloop")
    out(x, 1)             .side(0) [T3 - 1]
    jmp(not_x, "do_zero") .side(1) [T1 - 1]
    jmp("bitloop")        .side(1) [T2 - 1]
    label("do_zero")
    nop()                 .side(0) [T2 - 1]
    wrap()

def connect_to_wifi():
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    wlan.connect(SSID, PASSWORD)
    
    print("Connecting to WiFi...")
    while not wlan.isconnected():
        time.sleep(1)
        print(".", end="")
    print("\nConnected to WiFi!")
    print("IP Address:", wlan.ifconfig()[0])

connect_to_wifi()

# Initialize PIO and GPIO
NUM_LEDS = 1  # Number of LEDs in the chain
PIN_NUM = 6  # GPIO pin number (set to GP10 or GP6)

# State machine for PIO
sm = rp2.StateMachine(0, ws2812, freq=8000000, sideset_base=Pin(PIN_NUM))
sm.active(1)

def get_matrix():
    response = urequests.get("https://bear-conspiracy-beside-witch.trycloudflare.com/api/matrix/get") #change this URL to your ngrok/cloudflared url!
    matrix = response.json()
    response.close()
    return matrix

# Function to convert RGB values to GRB format for WS2812
def rgb_to_grb(rgb):
    r, g, b = rgb
    return (g << 16) | (r << 8) | b

# Function to send color data
def send_color(colors):
    data = array.array("I", (rgb_to_grb(color) for color in colors))
    sm.put(data, 8)  # Send data to the state machine


while 1:
    print("Got Matrix")
    matrix = get_matrix()
    for row in range(len(matrix)):
        for col in range(len(matrix[row])):
            led_color_i = matrix[row][col]
            led_color = [(0,0,0), (25,0,0), (0,25,0), (0,0,25)][led_color_i]
            send_color([led_color])
    time.sleep(0.1)
```

Use `ngrok` or `cloudflared` (as shown above) to get a publicly-accessible url for your server.

## Installation

Install dependencies:

```bash
bun install
```

## Running the Server

Start the development server:

```bash
bun run start
```

The web interface will be available at `http://localhost:5173`

## Development

This project uses:
- React for the frontend
- Vite as the development server
- Tailwind CSS for styling
- TypeScript for type safety
- [Bun](https://bun.sh) as the JavaScript runtime

## Hardware Integration

The API endpoints are designed to work with RP2040-based LED matrix controllers. The matrix state is represented as integers:
- 0: Off
- 1: Red
- 2: Green
- 3: Blue

