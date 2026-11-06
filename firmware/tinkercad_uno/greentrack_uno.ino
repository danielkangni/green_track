/*
  GreenTrack — version Arduino Uno pour Tinkercad Circuits
  (Tinkercad ne propose pas l'ESP32 : on valide la logique sur un Uno.)

  Composants Tinkercad
    - Arduino Uno R3
    - Capteur d'humidité du sol (Soil Moisture Sensor) : Alim → 5V, GND → GND, SIG → A0
    - Capteur de température TMP36                    : +Vs → 5V, GND → GND, Vout → A1
    - Transistor NPN (2N2222) + résistance 1 kΩ        : D8 → 1 kΩ → base, émetteur → GND
    - Relais SPDT : bobine entre 5V et le collecteur du transistor (+ diode 1N4007 en parallèle)
    - Moteur DC (= pompe) + pile 9 V : pile + → COM du relais, NO → moteur, moteur → pile −
    - LED verte (D5) et LED rouge (D6), chacune avec une résistance de 220 Ω vers GND

  Fonctionnement : identique au mode autonome de GreenTrack.
    indice de soif ≥ 65 → la pompe démarre, jusqu'à revenir à l'humidité optimale.
  Ouvrir le « Moniteur série » de Tinkercad pour suivre les décisions.
*/

const int PIN_SOIL = A0;
const int PIN_TEMP = A1;
const int PIN_PUMP = 8;
const int LED_OK   = 5;
const int LED_SOIF = 6;

// Profil de l'espèce (cocotier) — mêmes valeurs que dans GreenTrack
const float OPTIMUM = 30.0;
const float FLETRISSEMENT = 13.0;

bool pompe = false;

float lireHumidite() {
  int raw = analogRead(PIN_SOIL);          // 0 (sec) … ~876 (détrempé) dans Tinkercad
  return constrain(raw / 876.0, 0.0, 1.0) * 45.0;
}

float lireTemperature() {
  float mv = analogRead(PIN_TEMP) * 5000.0 / 1023.0;
  return (mv - 500.0) / 10.0;
}

int indiceDeSoif(float humidite, float tempC) {
  float base = (OPTIMUM - humidite) / (OPTIMUM - FLETRISSEMENT);
  base = constrain(base, 0.0, 1.0);
  float climat = constrain(1 + (tempC - 28) * 0.03 * 0.95, 0.85, 1.35);
  return constrain(int(base * climat * 100), 0, 100);
}

void setup() {
  Serial.begin(9600);
  pinMode(PIN_PUMP, OUTPUT);
  pinMode(LED_OK, OUTPUT);
  pinMode(LED_SOIF, OUTPUT);
  Serial.println("GreenTrack - mode autonome (Arduino Uno)");
}

void loop() {
  float h = lireHumidite();
  float t = lireTemperature();
  int indice = indiceDeSoif(h, t);

  if (!pompe && indice >= 65) pompe = true;          // la plante a soif : on arrose
  if (pompe && h >= OPTIMUM) pompe = false;           // sol revenu à l'optimum : on coupe

  digitalWrite(PIN_PUMP, pompe ? HIGH : LOW);
  digitalWrite(LED_SOIF, indice >= 65 ? HIGH : LOW);
  digitalWrite(LED_OK, indice < 35 ? HIGH : LOW);

  Serial.print("Humidite: ");
  Serial.print(h, 1);
  Serial.print(" %  Temp: ");
  Serial.print(t, 1);
  Serial.print(" C  Indice de soif: ");
  Serial.print(indice);
  Serial.println(pompe ? "  -> POMPE EN MARCHE" : "  -> pompe arretee");
  delay(1000);
}
