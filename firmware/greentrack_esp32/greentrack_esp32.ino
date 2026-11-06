/*
  GreenTrack — nœud capteur ESP32 (firmware de référence)

  Matériel (voir l'onglet « Montage du capteur » dans GreenTrack)
    - ESP32 DevKit
    - Sonde d'humidité capacitive v1.2   → GPIO 34 (ADC)
    - DS18B20 étanche (température sol)  → GPIO 4  (+ résistance 4,7 kΩ vers 3,3 V)
    - Pont diviseur batterie 100k / 27k  → GPIO 35 (ADC)
    - Module relais 5 V                  → GPIO 26
    - Électrovanne 12 V (+ diode 1N4007)
    - Batterie 12 V 7 Ah + panneau solaire 20 W + régulateur solaire
    - Convertisseur LM2596 12 V → 5 V (alimente l'ESP32 et le relais)

  Cycle : réveil → mesure → envoi à la passerelle → commande d'arrosage
          → veille profonde (15 min).

  MODE AUTONOME : si la passerelle est injoignable (pas de Wi-Fi, coupure…),
  l'ESP32 décide SEUL d'arroser quand le sol descend sous le seuil de
  l'espèce. La plante n'est jamais abandonnée, même sans réseau.

  Bibliothèques : ArduinoJson, OneWire, DallasTemperature
*/
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// ── À adapter pour chaque nœud ──
const char* WIFI_SSID    = "GreenTrack-Parc";
const char* WIFI_PASS    = "changez-moi";
const char* GATEWAY_URL  = "http://192.168.1.50:8787";
const char* SENSOR_ID    = "ESP32-AMZ-001";   // = identifiant affiché dans GreenTrack

// Seuils de l'espèce (ici : cocotier) — utilisés en mode autonome hors ligne
const float SEUIL_STRESS  = 21.0;   // % : en dessous, on arrose
const float OPTIMUM       = 30.0;   // % : humidité visée
const float LITRES_DEFAUT = 30.0;   // dose apportée en autonomie

// Étalonnage de la sonde (valeurs ADC brutes relevées sur le terrain)
const int RAW_DRY   = 3300;   // sonde à l'air libre
const int RAW_WET   = 1350;   // sonde dans un sol saturé
const float VWC_MAX = 45.0;   // humidité volumétrique correspondant à RAW_WET (%)

const int PIN_SOIL  = 34;
const int PIN_TEMP  = 4;
const int PIN_BATT  = 35;
const int PIN_VALVE = 26;
const float FLOW_L_PER_MIN = 4.0;           // débit de la ligne goutte-à-goutte
const uint64_t SLEEP_US = 15ULL * 60 * 1000000;

OneWire oneWire(PIN_TEMP);
DallasTemperature tempSensor(&oneWire);

float readMoisture() {
  long sum = 0;
  for (int i = 0; i < 16; i++) { sum += analogRead(PIN_SOIL); delay(5); }
  float raw = sum / 16.0;
  float ratio = (RAW_DRY - raw) / float(RAW_DRY - RAW_WET);
  return constrain(ratio, 0.0, 1.0) * VWC_MAX;
}

int readBattery() {
  // Pont 100k / 27k : 12,7 V → 2,7 V sur l'entrée ADC
  float v = analogReadMilliVolts(PIN_BATT) * (127.0 / 27.0) / 1000.0;
  return constrain(int((v - 11.8) / (12.7 - 11.8) * 100), 0, 100);
}

bool connectWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  for (int i = 0; i < 40 && WiFi.status() != WL_CONNECTED; i++) delay(250);
  return WiFi.status() == WL_CONNECTED;
}

void water(float liters) {
  unsigned long ms = (unsigned long)(liters / FLOW_L_PER_MIN * 60000.0);
  ms = min(ms, 30UL * 60000UL);   // sécurité : 30 min maximum
  Serial.printf("Vanne OUVERTE pour %.1f L (%lu s)\n", liters, ms / 1000);
  digitalWrite(PIN_VALVE, HIGH);
  delay(ms);
  digitalWrite(PIN_VALVE, LOW);
  Serial.println("Vanne FERMÉE");
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_VALVE, OUTPUT);
  digitalWrite(PIN_VALVE, LOW);
  analogReadResolution(12);
  tempSensor.begin();

  float moisture = readMoisture();
  tempSensor.requestTemperatures();
  float tempC = tempSensor.getTempCByIndex(0);
  int battery = readBattery();
  Serial.printf("Humidité %.1f %% · Temp %.1f °C · Batterie %d %%\n", moisture, tempC, battery);

  bool gatewayOk = false;
  if (connectWifi()) {
    HTTPClient http;
    JsonDocument doc;
    doc["sensorId"] = SENSOR_ID;
    doc["moisture"] = round(moisture * 10) / 10.0;
    if (tempC > -100) doc["tempC"] = round(tempC * 10) / 10.0;
    doc["battery"] = battery;
    doc["rssi"] = WiFi.RSSI();
    String body;
    serializeJson(doc, body);

    http.begin(String(GATEWAY_URL) + "/api/readings");
    http.addHeader("Content-Type", "application/json");
    int code = http.POST(body);
    gatewayOk = code == 200;
    Serial.printf("Envoi %s -> %d\n", body.c_str(), code);
    http.end();

    // Commande d'arrosage décidée par GreenTrack (mode autonome central) ?
    if (gatewayOk) {
      http.begin(String(GATEWAY_URL) + "/api/commands/" + SENSOR_ID);
      if (http.GET() == 200) {
        JsonDocument cmd;
        if (!deserializeJson(cmd, http.getString()) && cmd["water"].is<float>()) water(cmd["water"]);
      }
      http.end();
    }
  }

  // Secours hors ligne : l'ESP32 arrose seul si la plante a soif
  if (!gatewayOk && moisture < SEUIL_STRESS) {
    Serial.println("Passerelle injoignable : arrosage autonome local");
    water(LITRES_DEFAUT);
  }

  WiFi.disconnect(true);
  esp_sleep_enable_timer_wakeup(SLEEP_US);
  esp_deep_sleep_start();
}

void loop() {}
