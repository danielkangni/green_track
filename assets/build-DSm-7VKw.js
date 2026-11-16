import{A as e,T as t,n,o as r,p as i}from"./index-BuKBe61a.js";var a=`/*
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
  Serial.printf("Vanne OUVERTE pour %.1f L (%lu s)\\n", liters, ms / 1000);
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
  Serial.printf("Humidité %.1f %% · Temp %.1f °C · Batterie %d %%\\n", moisture, tempC, battery);

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
    Serial.printf("Envoi %s -> %d\\n", body.c_str(), code);
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
`,o=`/*
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
`,s=()=>({title:`Montage du capteur`,sub:`Ce qu’il faut construire pour chaque plante — schéma, matériel, étapes et code`}),c={solar:{name:`Panneau solaire 20 W`,role:`Recharge la batterie avec le soleil : aucune prise électrique nécessaire dans le parc.`,qty:1,price:18e3},ctrl:{name:`Régulateur solaire 12 V`,role:`Protège la batterie : il gère la charge par le panneau et coupe si la batterie est trop faible.`,qty:1,price:6e3},battery:{name:`Batterie 12 V 7 Ah`,role:`Réserve d’énergie pour la nuit et les jours nuageux (plusieurs jours d’autonomie).`,qty:1,price:15e3},buck:{name:`Convertisseur LM2596 (12 V → 5 V)`,role:`Abaisse la tension de la batterie pour alimenter l’ESP32 et le relais.`,qty:1,price:2500},esp:{name:`ESP32 DevKit`,role:`Le cerveau : lit les capteurs, calcule l’indice de soif, envoie les données en Wi-Fi et commande la vanne.`,qty:1,price:6e3},divider:{name:`Résistances 100 kΩ + 27 kΩ`,role:`Pont diviseur : permet à l’ESP32 de mesurer la charge de la batterie.`,qty:2,price:200},soil:{name:`Sonde d’humidité capacitive v1.2`,role:`Plantée dans la terre au pied de l’arbre : mesure l’humidité du sol. Capacitive = ne rouille pas.`,qty:1,price:2500},ds:{name:`Sonde de température DS18B20 étanche`,role:`Mesure la température du sol, utilisée pour ajuster l’indice de soif (il fait chaud → la plante boit plus).`,qty:1,price:3e3},pullup:{name:`Résistance 4,7 kΩ`,role:`Résistance de tirage obligatoire pour la sonde DS18B20.`,qty:1,price:100},relay:{name:`Module relais 5 V`,role:`Interrupteur commandé par l’ESP32 : il ouvre ou ferme le circuit 12 V de l’électrovanne.`,qty:1,price:2e3},valve:{name:`Électrovanne 12 V ½″`,role:`Le robinet automatique : quand elle reçoit du courant, l’eau coule vers la plante.`,qty:1,price:7500},diode:{name:`Diode 1N4007`,role:`Protège le circuit contre la surtension créée par la bobine de la vanne à la fermeture.`,qty:1,price:100},pipe:{name:`Tuyau goutte-à-goutte + raccords`,role:`Amène l’eau au pied de la plante, lentement, sans gaspillage.`,qty:1,price:5e3},pot:{name:`La plante (ici un jeune cocotier)`,role:`La sonde et le goutteur sont placés dans la zone des racines, à environ 20 cm de profondeur.`,qty:0,price:0}},l=[{name:`Boîtier étanche IP65`,role:`Protège l’électronique de la pluie et de la poussière.`,qty:1,price:4e3},{name:`Fils, borniers, gaine thermo`,role:`Câblage et connexions.`,qty:1,price:2e3}],u={red:`#e0463a`,black:`#2c3e50`,orange:`#f08c1a`,yellow:`#f2c12e`,green:`#2bb673`,blue:`#3d8fd6`},d=[{c:u.red,p:[[230,62],[290,62]],parts:`solar ctrl`,power:1},{c:u.black,p:[[230,108],[290,108]],parts:`solar ctrl`,power:1},{c:u.red,p:[[370,130],[370,160],[410,160],[410,190]],parts:`ctrl battery`,power:1},{c:u.black,p:[[330,130],[330,190]],parts:`ctrl battery`,power:1},{c:u.red,p:[[450,62],[530,62]],parts:`ctrl buck`,power:1},{c:u.black,p:[[450,108],[530,108]],parts:`ctrl buck`,power:1},{c:u.red,p:[[660,62],[1180,62],[1180,614],[1150,614]],parts:`buck rails`,power:1},{c:u.black,p:[[660,108],[1196,108],[1196,662],[1150,662]],parts:`buck rails`,power:1},{c:u.red,p:[[530,450],[530,614]],parts:`esp rails`,power:1},{c:u.black,p:[[560,450],[560,662]],parts:`esp rails`,power:1},{c:u.orange,p:[[590,450],[590,638]],parts:`esp rails`,power:1},{c:u.red,p:[[410,175],[470,175],[470,237],[485,237]],parts:`battery divider`},{c:u.yellow,p:[[560,237],[560,330]],parts:`divider esp`,sig:1},{c:u.black,p:[[635,237],[1196,237]],parts:`divider rails`},{c:u.yellow,p:[[350,375],[500,375]],parts:`relay esp`,sig:1,id:`w-relay`},{c:u.red,p:[[310,425],[310,614]],parts:`relay rails`,power:1},{c:u.black,p:[[280,425],[280,662]],parts:`relay rails`,power:1},{c:u.red,p:[[390,160],[390,150],[270,150],[270,300],[225,300],[225,330]],parts:`battery relay`,valve:1},{c:u.red,p:[[265,330],[265,312],[200,312],[200,210],[160,210]],parts:`relay valve diode`,valve:1},{c:u.black,p:[[330,165],[250,165],[250,250],[160,250]],parts:`battery valve diode`,valve:1},{c:u.green,p:[[800,365],[920,365],[920,380]],parts:`esp soil`,sig:1},{c:u.orange,p:[[935,380],[935,355],[1120,355],[1120,638]],parts:`soil rails`,power:1},{c:u.black,p:[[950,380],[950,345],[1135,345],[1135,662]],parts:`soil rails`,power:1},{c:u.yellow,p:[[1020,380],[1020,320],[840,320],[840,405],[800,405]],parts:`ds esp pullup`,sig:1},{c:u.orange,p:[[1035,380],[1035,355]],parts:`ds rails`},{c:u.black,p:[[1050,380],[1050,345]],parts:`ds rails`},{c:u.yellow,p:[[1020,330],[1030,330]],parts:`pullup ds`},{c:u.orange,p:[[1066,330],[1080,330],[1080,355]],parts:`pullup ds`}],f=[[410,175],[390,160],[330,165],[560,237],[1196,237],[1035,355],[1050,345],[1020,330],[1080,355],[530,614],[560,662],[590,638],[310,614],[280,662],[1120,638],[1135,662]],p=(e,t,n,r=`below`)=>{let i=r===`below`?t-8:r===`above`?t+14:t+4,a=r===`left`?e+8:r===`right`?e-8:e,o=r===`left`?`start`:r===`right`?`end`:`middle`;return`<rect x="${e-3.5}" y="${t-3.5}" width="7" height="7" rx="1.5" fill="#d9b44a" stroke="#8a6d1f"/>${n?`<text x="${a}" y="${i}" text-anchor="${o}" class="pin-l">${n}</text>`:``}`},m=(e,t,n)=>`<text x="${e}" y="${t}" text-anchor="middle" class="part-l">${n}</text>`,h=(e,t)=>`<g class="part" data-part="${e}">${t}</g>`,g=(e,t,n,r)=>`<line x1="${e}" y1="${t}" x2="${n}" y2="${t}" stroke="#9aa4a8" stroke-width="2"/><rect x="${e+8}" y="${t-6}" width="${n-e-16}" height="12" rx="5" fill="#e3c99a" stroke="#b39566"/>${r.map((n,r)=>`<rect x="${e+14+r*7}" y="${t-6}" width="3.5" height="12" fill="${n}"/>`).join(``)}`;function _(){let e=(e,t)=>`<g class="wire ${e.power?`power`:``} ${e.sig?`sig`:``} ${e.valve?`valvew`:``}" data-parts="${e.parts}" ${e.id?`id="${e.id}"`:``}>
      <polyline class="halo" points="${e.p.map(e=>e.join(`,`)).join(` `)}"/>
      <polyline class="core" stroke="${e.c}" points="${e.p.map(e=>e.join(`,`)).join(` `)}"/></g>`,t=Array.from({length:12},(e,t)=>`<rect x="${52+t%4*43}" y="${42+Math.floor(t/4)*30}" width="40" height="27" fill="#24467a" stroke="#4d73ad" stroke-width=".8"/>`).join(``);return`<svg viewBox="0 0 1220 700" class="circuit" id="circuit" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="#dde5ec" stroke-width="1"/></pattern>
      <linearGradient id="brass" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#e8c55a"/><stop offset="1" stop-color="#a8821f"/></linearGradient>
      <linearGradient id="sun" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
    </defs>
    <rect width="1220" height="700" fill="url(#grid)"/>

    <!-- Plaque d'essai : rails d'alimentation -->
    ${h(`rails`,`<rect x="60" y="596" width="1100" height="84" rx="8" fill="#fbfbf9" stroke="#cfd6dc"/>
      ${Array.from({length:54},(e,t)=>`<circle cx="${110+t*20}" cy="626" r="2" fill="#c9d0d5"/><circle cx="${110+t*20}" cy="650" r="2" fill="#c9d0d5"/>`).join(``)}
      <line x1="100" y1="614" x2="1150" y2="614" stroke="${u.red}" stroke-width="3"/>
      <line x1="100" y1="638" x2="1150" y2="638" stroke="${u.orange}" stroke-width="3"/>
      <line x1="100" y1="662" x2="1150" y2="662" stroke="${u.black}" stroke-width="3"/>
      <text x="70" y="618" class="rail-l" fill="${u.red}">5 V</text><text x="66" y="642" class="rail-l" fill="${u.orange}">3,3 V</text><text x="66" y="666" class="rail-l" fill="${u.black}">GND</text>`)}

    <!-- Tuyau d'arrosage -->
    <g class="part" data-part="pipe">
      <polyline points="100,265 100,578 860,578 860,470 985,470" fill="none" stroke="#7f8c8d" stroke-width="9" stroke-linejoin="round"/>
      <polyline points="100,265 100,578 860,578 860,470 985,470" fill="none" stroke="#b9c3c7" stroke-width="5" stroke-linejoin="round"/>
      <polyline id="water" points="100,265 100,578 860,578 860,470 985,470" fill="none" stroke="#3d8fd6" stroke-width="4" stroke-linejoin="round" stroke-dasharray="8 10"/>
      <rect x="978" y="466" width="14" height="10" rx="2" fill="#2c3e50"/>
      <g id="drops">${[0,1,2].map(e=>`<circle cx="985" cy="482" r="3" fill="#3d8fd6" style="animation-delay:${e*.33}s"/>`).join(``)}</g>
    </g>

    ${d.map(e).join(``)}
    ${f.map(([e,t])=>`<circle cx="${e}" cy="${t}" r="4" fill="#17231e"/>`).join(``)}

    ${h(`solar`,`<rect x="40" y="30" width="190" height="110" rx="6" fill="#c9d1d6" stroke="#8e9aa1"/>${t}<rect id="sunshine" x="44" y="34" width="182" height="102" fill="url(#sun)"/>
      ${p(230,62,`+`,`right`)}${p(230,108,`−`,`right`)}${m(135,158,`Panneau solaire 20 W`)}`)}
    ${h(`ctrl`,`<rect x="290" y="40" width="160" height="90" rx="8" fill="#2f3a40"/><rect x="330" y="54" width="80" height="26" rx="3" fill="#9fd3a8"/><text x="370" y="72" text-anchor="middle" class="lcd" id="lcd">12.6V</text>
      <text x="370" y="104" text-anchor="middle" class="chip-l">RÉGULATEUR</text>
      ${p(290,62,`PV+`,`left`)}${p(290,108,`PV−`,`left`)}${p(330,130,`BAT−`,`above`)}${p(370,130,`BAT+`,`above`)}${p(450,62,`OUT+`,`right`)}${p(450,108,`OUT−`,`right`)}`)}
    ${h(`battery`,`<rect x="290" y="190" width="160" height="95" rx="6" fill="#23272b"/><rect x="290" y="190" width="160" height="16" rx="4" fill="#3a4046"/>
      <text x="370" y="244" text-anchor="middle" class="chip-l" style="font-size:15px">12 V · 7 Ah</text><text x="370" y="264" text-anchor="middle" class="chip-s" id="batt-l">100 %</text>
      <rect x="322" y="182" width="16" height="10" fill="#2c3e50"/><rect x="402" y="182" width="16" height="10" fill="${u.red}"/>${m(370,302,`Batterie 12 V`)}`)}
    ${h(`buck`,`<rect x="530" y="40" width="130" height="90" rx="6" fill="#1d5fa8"/><circle cx="575" cy="85" r="20" fill="#2b2b2b"/><circle cx="575" cy="85" r="9" fill="#555"/><rect x="615" y="60" width="22" height="22" rx="3" fill="#3d8fd6"/><circle cx="626" cy="71" r="5" fill="#d9b44a"/>
      <text x="626" y="112" text-anchor="middle" class="chip-s" style="fill:#fff">LM2596</text>
      ${p(530,62,`IN+`,`left`)}${p(530,108,`IN−`,`left`)}${p(660,62,`5V`,`right`)}${p(660,108,`GND`,`right`)}${m(595,148,`12 V → 5 V`)}`)}
    ${h(`divider`,`${g(485,237,545,[`#8b4513`,`#111`,`#e6c200`])}${g(575,237,635,[`#e00`,`#7a2be2`,`#e67e22`])}<text x="560" y="222" text-anchor="middle" class="pin-l">100k · 27k</text>`)}
    ${h(`esp`,`<rect x="500" y="330" width="300" height="120" rx="8" fill="#20252b"/><rect x="600" y="345" width="130" height="88" rx="4" fill="#b8bfc4"/><text x="665" y="385" text-anchor="middle" class="chip-s">ESP-WROOM-32</text><text x="665" y="402" text-anchor="middle" class="chip-s" style="font-size:9px">Wi-Fi · Bluetooth</text>
      <rect x="490" y="372" width="22" height="26" rx="3" fill="#9aa4a8"/><circle id="esp-led" cx="760" cy="350" r="5" fill="#3d8fd6"/><text x="550" y="400" class="chip-l" style="fill:#fff;font-size:15px">ESP32</text>
      ${p(560,330,`G35`,`above`)}${p(500,375,`G26`,`left`)}${p(800,365,`G34`,`right`)}${p(800,405,`G4`,`right`)}${p(530,450,`VIN`,`below`)}${p(560,450,`GND`,`below`)}${p(590,450,`3V3`,`below`)}`)}
    ${h(`relay`,`<rect x="200" y="330" width="150" height="95" rx="6" fill="#1d5fa8"/><rect x="232" y="352" width="70" height="52" rx="4" fill="#2f86d9"/><text x="267" y="382" text-anchor="middle" class="chip-s" style="fill:#fff">RELAIS 5V</text>
      <circle id="relay-led" cx="330" cy="405" r="5" fill="#5b1f1f"/>
      ${p(225,330,`COM`,`above`)}${p(265,330,`NO`,`above`)}${p(350,375,`IN`,`right`)}${p(280,425,`GND`,`below`)}${p(310,425,`VCC`,`below`)}${m(275,442,`Module relais`)}`)}
    ${h(`valve`,`<rect x="40" y="225" width="120" height="40" rx="8" fill="url(#brass)"/><rect x="70" y="190" width="60" height="40" rx="6" fill="#2c3e50"/><text x="100" y="215" text-anchor="middle" class="chip-s" style="fill:#fff">12 V</text>
      <rect x="20" y="236" width="22" height="18" fill="#a8821f"/><text id="valve-l" x="100" y="252" text-anchor="middle" class="chip-s">FERMÉE</text>
      ${p(160,210,`+`,`right`)}${p(160,250,`−`,`right`)}${m(90,182,`Électrovanne`)}`)}
    ${h(`diode`,`<line x1="178" y1="210" x2="178" y2="250" stroke="#9aa4a8" stroke-width="2"/><rect x="171" y="220" width="14" height="22" rx="3" fill="#2b2b2b"/><rect x="171" y="221" width="14" height="4" fill="#ccc"/>`)}
    ${h(`pot`,`<polygon points="880,480 1100,480 1085,588 895,588" fill="#c46a3f"/><rect id="soil" x="884" y="480" width="212" height="22" fill="#7a5233"/><polygon points="884,502 1096,502 1085,588 895,588" fill="#c46a3f" opacity=".0"/>
      <path d="M1078 480 C1076 455 1074 440 1078 420" stroke="#8c7357" stroke-width="5" fill="none"/>
      <path d="M1078 420 C1060 405 1045 410 1036 420 M1078 420 C1095 402 1112 406 1120 418 M1078 420 C1072 400 1062 392 1052 392 M1078 420 C1086 398 1098 392 1108 393" stroke="#4c8f35" stroke-width="6" fill="none" stroke-linecap="round"/>`)}
    ${h(`soil`,`<rect x="905" y="380" width="60" height="58" rx="4" fill="#1b1b1b"/><rect x="917" y="438" width="36" height="110" rx="3" fill="#1b1b1b"/><text x="935" y="420" text-anchor="middle" class="chip-s" style="fill:#fff;font-size:9px">CAPACITIVE</text>
      ${p(920,380,`A`,`below`)}${p(935,380,`+`,`below`)}${p(950,380,`−`,`below`)}<g id="soil-read" class="readout"><rect x="835" y="425" width="62" height="24" rx="6"/><text x="866" y="441" text-anchor="middle">—</text></g>`)}
    ${h(`ds`,`<rect x="1008" y="380" width="52" height="22" rx="3" fill="#2a8c4a"/><path d="M1034 402 C1034 440 1046 460 1040 530" stroke="#1b1b1b" stroke-width="4" fill="none"/><rect x="1035" y="520" width="10" height="26" rx="3" fill="#c0c6ca"/>
      ${p(1020,380,`D`,`below`)}${p(1035,380,`+`,`below`)}${p(1050,380,`−`,`below`)}`)}
    ${h(`pullup`,`${g(1030,330,1066,[`#e6c200`,`#7a2be2`,`#e00`])}`)}
  </svg>`}var v=[{t:`Préparer l’alimentation solaire`,d:`Relier le panneau au régulateur (PV+ / PV−), puis la batterie au régulateur (BAT+ / BAT−). Toujours brancher la batterie AVANT le panneau.`,parts:[`solar`,`ctrl`,`battery`]},{t:`Régler le convertisseur 5 V`,d:`Brancher le LM2596 sur la sortie du régulateur. Avec un multimètre, tourner la petite vis jusqu’à lire 5,0 V en sortie avant de brancher l’ESP32.`,parts:[`buck`]},{t:`Installer l’ESP32 et les rails`,d:`Sur la plaque d’essai : 5 V → VIN, GND → GND, et le 3,3 V de l’ESP32 sur le rail 3,3 V qui alimentera les sondes.`,parts:[`esp`,`rails`]},{t:`Brancher les deux sondes`,d:`Sonde d’humidité : A → G34. Sonde DS18B20 : D → G4, avec la résistance 4,7 kΩ entre D et 3,3 V. Les deux sur 3,3 V et GND.`,parts:[`soil`,`ds`,`pullup`]},{t:`Câbler le relais et la vanne`,d:`Relais : IN → G26, VCC → 5 V, GND → GND. Côté puissance : batterie + → COM, NO → vanne +, vanne − → batterie −. Diode 1N4007 en parallèle sur la vanne (bague grise côté +).`,parts:[`relay`,`valve`,`diode`]},{t:`Mesure de la batterie`,d:`Pont diviseur 100 kΩ / 27 kΩ entre batterie + et GND, point milieu sur G35 : l’ESP32 surveille ainsi la charge.`,parts:[`divider`]},{t:`Installer sur le terrain`,d:`Planter la sonde à 20 cm, dans la zone des racines, à environ 50 cm du tronc. Poser le goutteur au même endroit. Fixer le boîtier étanche sur un piquet, panneau orienté plein sud.`,parts:[`pot`,`pipe`]},{t:`Téléverser le programme`,d:`Ouvrir firmware/greentrack_esp32 dans l’IDE Arduino, renseigner le Wi-Fi et l’identifiant du capteur, puis téléverser. Le capteur apparaît dans GreenTrack.`,parts:[`esp`]}],y=e=>`${e.toLocaleString(`fr-FR`)} FCFA`;function b(e){e.innerHTML=`
    <div class="build-tabs seg" id="tabs">
      <button data-tab="circuit" class="active">${r(`cpu`)} Circuit</button>
      <button data-tab="bom">Matériel</button>
      <button data-tab="steps">Étapes</button>
      <button data-tab="code">Code ESP32</button>
      <button data-tab="tinkercad">Version Tinkercad</button>
    </div>
    <div id="tab-body" class="mt"></div>`;let t=t=>e.querySelector(t),n=()=>{},i={circuit:()=>w(t(`#tab-body`),e=>n=e),bom:()=>T(t(`#tab-body`)),steps:()=>E(t(`#tab-body`),e=>o(`circuit`,e)),code:()=>D(t(`#tab-body`),a,`greentrack_esp32.ino`,`À ouvrir dans l’IDE Arduino (carte « ESP32 Dev Module »). Modifier le nom du Wi-Fi, le mot de passe et l’identifiant du capteur en haut du fichier.`),tinkercad:()=>O(t(`#tab-body`))};function o(e,r){n(),n=()=>{},t(`#tabs`).querySelectorAll(`button`).forEach(t=>t.classList.toggle(`active`,t.dataset.tab===e));let a=t(`#tab-body`);a.replaceWith(a.cloneNode(!1)),i[e](),r&&setTimeout(()=>x(t(`#tab-body`),r),50)}return t(`#tabs`).addEventListener(`click`,e=>{let t=e.target.closest(`[data-tab]`);t&&o(t.dataset.tab)}),o(`circuit`),()=>n()}function x(e,t){let n=e.querySelector(`#circuit`);if(!n)return;n.classList.add(`focus`),n.querySelectorAll(`.part`).forEach(e=>e.classList.toggle(`on`,t.includes(e.dataset.part))),n.querySelectorAll(`.wire`).forEach(e=>e.classList.toggle(`on`,e.dataset.parts.split(` `).some(e=>t.includes(e))));let r=e.querySelector(`#part-info`);r&&(r.innerHTML=S(t[0],t))}function S(e,t){let r=c[e];if(!r)return C();let i=[...new Set(d.filter(t=>t.parts.split(` `).includes(e)).flatMap(e=>e.parts.split(` `)).filter(t=>t!==e&&c[t]))];return`<h3>${n(r.name)}</h3><p>${n(r.role)}</p>
    ${i.length?`<div class="small muted" style="margin-top:10px">Relié à :</div><div class="row" style="flex-wrap:wrap;gap:6px;margin-top:6px">${i.map(e=>`<span class="badge neutral plain">${n(c[e].name)}</span>`).join(``)}</div>`:``}
    ${r.price?`<div class="small muted" style="margin-top:10px">Prix indicatif : <b style="color:var(--ink)">${y(r.price*r.qty)}</b></div>`:``}
    ${t&&t.length>1?`<div class="small muted" style="margin-top:8px">+ ${t.slice(1).map(e=>c[e]?.name).filter(Boolean).join(`, `)}</div>`:``}`}var C=()=>`<h3>Survolez un composant</h3><p>Chaque plante est équipée de ce petit montage autonome, alimenté par le soleil. Passez la souris sur un élément pour savoir à quoi il sert, ou lancez la simulation.</p>`;function w(i,a){let o=t.species.filter(e=>[`cocotier`,`neem`,`baobab`,`flamboyant`,`manguier`].includes(e.id));i.innerHTML=`
    <div class="tk-toolbar card">
      <button class="btn tk-start" id="start">${r(`zap`)} Démarrer la simulation</button>
      <div class="tk-ctrl"><label>Humidité du sol <b id="m-val">24 %</b></label><input type="range" id="m" min="3" max="45" step="0.5" value="24" disabled></div>
      <div class="tk-ctrl"><label>Espèce</label><select class="select" id="sp">${o.map(e=>`<option value="${e.id}">${n(e.name)}</option>`).join(``)}</select></div>
      <label class="row small" style="gap:8px"><span class="toggle"><input type="checkbox" id="sun" checked><span></span></span>Soleil</label>
    </div>
    <div class="tk-layout mt">
      <div class="card tk-canvas">${_()}</div>
      <aside class="stack" style="display:flex;flex-direction:column;gap:12px">
        <div class="card card-pad tk-info" id="part-info">${C()}</div>
        <div class="card card-pad" id="sim-state"></div>
      </aside>
    </div>
    <div class="card mt tk-serial"><div class="tk-serial-h">Moniteur série <span class="muted">115200 bauds</span></div><pre id="serial">Cliquez sur « Démarrer la simulation » pour voir l’ESP32 travailler.</pre></div>`;let s=e=>i.querySelector(e),c=s(`#circuit`);c.addEventListener(`mouseover`,e=>{let t=e.target.closest(`.part`);t&&t.dataset.part!==`rails`&&x(i,[t.dataset.part])}),c.addEventListener(`mouseleave`,()=>{c.classList.remove(`focus`),s(`#part-info`).innerHTML=C()});let l={running:!1,m:24,valve:!1,batt:12.5,n:0,timer:0},u=()=>t.species.find(e=>e.id===s(`#sp`).value),d=s(`#serial`),f=e=>{let t=new Date().toLocaleTimeString(`fr-FR`);d.textContent=(d.textContent.startsWith(`Cliquez`)?``:d.textContent)+`[${t}] ${e}\n`;let n=d.textContent.split(`
`);n.length>120&&(d.textContent=n.slice(-120).join(`
`)),d.scrollTop=d.scrollHeight};function p(){let t=u(),i=s(`#sun`).checked?33:26,a=e({moisture:l.m,tempC:i},t,10),o=a>=65?`#d64545`:a>=35?`#e8a33d`:`#2f9e44`,d=Math.min(1,l.m/40);return s(`#soil`).setAttribute(`fill`,`rgb(${Math.round(196-110*d)},${Math.round(150-92*d)},${Math.round(105-70*d)})`),s(`#soil-read text`).textContent=`${l.m.toFixed(1)} %`,s(`#m`).value=l.m,s(`#m-val`).textContent=`${l.m.toFixed(1)} %`,s(`#relay-led`).setAttribute(`fill`,l.valve?`#ff3b30`:`#5b1f1f`),s(`#valve-l`).textContent=l.valve?`OUVERTE`:`FERMÉE`,s(`#lcd`).textContent=`${l.batt.toFixed(1)}V`,s(`#batt-l`).textContent=`${Math.round(Math.max(0,Math.min(1,(l.batt-11.8)/.9))*100)} %`,c.classList.toggle(`running`,l.running),c.classList.toggle(`valve-open`,l.valve),c.classList.toggle(`sunny`,s(`#sun`).checked),s(`#sim-state`).innerHTML=`
      <h3 style="font-size:14px;margin-bottom:10px">Ce que calcule l’ESP32</h3>
      <div class="spread small"><span>Humidité mesurée</span><b>${l.m.toFixed(1)} %</b></div>
      <div class="spread small" style="margin-top:6px"><span>Besoin du ${n(t.name.toLowerCase())}</span><b>${t.optimal} %</b></div>
      <div class="spread small" style="margin-top:6px"><span>Indice de soif</span><b style="color:${o}">${a} / 100</b></div>
      <div class="thirst-bar" style="margin:8px 0"><div class="track"><div class="fill" style="width:${a}%;background:${o}"></div></div></div>
      <div class="reco ${a>=65?`water`:a>=35?`watch`:`ok`}" style="padding:10px 12px">${r(l.valve||a>=65?`drop`:`check`)}<div><strong style="font-size:13.5px">${l.valve?`Vanne ouverte : arrosage en cours`:a>=65?`La plante a soif`:a>=35?`À surveiller`:`Pas besoin d’eau`}</strong>${l.running?``:`<p>Démarrez la simulation pour activer le mode autonome.</p>`}</div></div>`,a}function m(){let t=u(),n=s(`#sun`).checked;l.valve?l.m+=.7:l.m-=n?.18:.07,l.m=Math.max(3,Math.min(45,l.m)),l.batt=Math.max(11.7,Math.min(12.8,l.batt+(n?.004:-.003)-(l.valve?.006:0)));let r=e({moisture:l.m,tempC:n?33:26},t,10);!l.valve&&r>=65?(l.valve=!0,f(`Indice de soif ${r} ≥ 65 → la plante a soif : VANNE OUVERTE (G26 = HIGH)`)):l.valve&&l.m>=t.optimal&&(l.valve=!1,f(`Humidité revenue à ${l.m.toFixed(1)} % (optimum ${t.optimal} %) → VANNE FERMÉE`)),l.n++%4==0&&f(`Humidité ${l.m.toFixed(1)} % · Temp ${n?33:26} °C · Batterie ${l.batt.toFixed(2)} V · Indice ${r}`),p()}s(`#start`).addEventListener(`click`,()=>{l.running=!l.running,s(`#m`).disabled=!l.running,s(`#start`).innerHTML=l.running?`${r(`reset`)} Arrêter la simulation`:`${r(`zap`)} Démarrer la simulation`,s(`#start`).classList.toggle(`stop`,l.running),clearInterval(l.timer),l.running?(f(`ESP32 démarré — GreenTrack mode autonome`),f(`Espèce : ${u().name} (stress ${u().stress} %, optimum ${u().optimal} %)`),l.timer=setInterval(m,500)):(l.valve=!1,f(`Simulation arrêtée`)),p()}),s(`#m`).addEventListener(`input`,e=>{l.m=+e.target.value,p()}),s(`#sp`).addEventListener(`change`,()=>{l.running&&f(`Nouvelle espèce : ${u().name}`),p()}),s(`#sun`).addEventListener(`change`,p),p(),a(()=>clearInterval(l.timer))}function T(e){let t=[...Object.values(c).filter(e=>e.qty),...l],r=t.reduce((e,t)=>e+t.price*(t.qty||1),0);e.innerHTML=`
    <div class="grid g-3">
      <div class="card kpi"><div class="kpi-label">Coût d’un point d’arrosage</div><div class="kpi-value">≈ ${y(Math.round(r/1e3)*1e3)}</div><div class="kpi-foot">prix indicatifs, marché de Cotonou / en ligne</div></div>
      <div class="card kpi"><div class="kpi-label">Autonomie</div><div class="kpi-value">3 à 5 jours</div><div class="kpi-foot">sans soleil, grâce à la veille profonde de l’ESP32</div></div>
      <div class="card kpi"><div class="kpi-label">Consommation</div><div class="kpi-value">0 FCFA / mois</div><div class="kpi-foot">100 % solaire, aucun abonnement</div></div>
    </div>
    <div class="card mt"><div class="table-wrap"><table class="table bom">
      <thead><tr><th>Composant</th><th>Qté</th><th>À quoi ça sert</th><th style="text-align:right">Prix</th></tr></thead>
      <tbody>${t.map(e=>`<tr><td><strong>${n(e.name)}</strong></td><td>${e.qty}</td><td class="muted">${n(e.role)}</td><td style="text-align:right;white-space:nowrap">${y(e.price*(e.qty||1))}</td></tr>`).join(``)}
      <tr><td colspan="3"><strong>Total</strong></td><td style="text-align:right"><strong>${y(r)}</strong></td></tr></tbody>
    </table></div></div>
    <p class="small muted">Astuce : un même panneau et une même batterie peuvent alimenter plusieurs vannes proches, ce qui divise le coût par arbre dans un parc.</p>`}function E(e,t){e.innerHTML=`<div class="steps">${v.map((e,t)=>`<article class="card step"><span class="guide-num">${t+1}</span><div style="flex:1"><h3>${n(e.t)}</h3><p>${n(e.d)}</p></div><button class="btn btn-sm" data-step="${t}">${r(`eye`)} Voir sur le schéma</button></article>`).join(``)}</div>`,e.addEventListener(`click`,e=>{let n=e.target.closest(`[data-step]`);n&&t(v[+n.dataset.step].parts)})}function D(e,t,r,a){e.innerHTML=`
    <div class="card card-pad spread" style="flex-wrap:wrap"><p style="margin:0;max-width:640px">${a}</p>
      <div class="row"><button class="btn" id="copy">Copier</button><button class="btn btn-primary" id="dl">Télécharger ${n(r)}</button></div></div>
    <pre class="code mt" style="max-height:620px">${n(t)}</pre>`,e.querySelector(`#copy`).addEventListener(`click`,async()=>{try{await navigator.clipboard.writeText(t),i(`Code copié`)}catch{i(`Copie impossible`,`alert`)}}),e.querySelector(`#dl`).addEventListener(`click`,()=>{let e=Object.assign(document.createElement(`a`),{href:URL.createObjectURL(new Blob([t],{type:`text/plain`})),download:r});e.click(),URL.revokeObjectURL(e.href)})}function O(e){e.innerHTML=`
    <div class="card card-pad">
      <h3 style="font-size:15px">Reproduire le montage dans Tinkercad Circuits</h3>
      <p class="muted" style="margin:6px 0 0;max-width:760px">Tinkercad ne propose pas l’ESP32 : on valide la même logique (indice de soif + arrosage autonome) avec un <b>Arduino Uno</b>. Le moteur DC joue le rôle de l’électrovanne. Dans la simulation, faites glisser le curseur du capteur d’humidité : la pompe démarre quand la plante a soif et s’arrête quand le sol est revenu à l’optimum.</p>
      <a class="btn btn-primary mt" href="https://www.tinkercad.com/circuits" target="_blank" rel="noopener">Ouvrir Tinkercad Circuits</a>
    </div>
    <div class="grid g-2 mt">
      <div class="card"><div class="card-head"><h3>Câblage</h3></div><div class="table-wrap" style="margin-top:8px"><table class="table">
        <tbody>${[[`Capteur d’humidité du sol`,`Alim → 5V · GND → GND · SIG → A0`],[`TMP36 (température)`,`+Vs → 5V · GND → GND · Vout → A1`],[`Transistor NPN 2N2222`,`Base ← résistance 1 kΩ ← D8 · Émetteur → GND`],[`Relais SPDT`,`Bobine entre 5V et le collecteur du transistor (+ diode 1N4007 en parallèle)`],[`Moteur DC (= pompe / vanne)`,`Pile 9 V + → COM du relais · NO → moteur · moteur → pile 9 V −`],[`LED verte`,`D5 → 220 Ω → LED → GND (« pas besoin d’eau »)`],[`LED rouge`,`D6 → 220 Ω → LED → GND (« a soif »)`]].map(([e,t])=>`<tr style="cursor:default"><td><strong>${n(e)}</strong></td><td class="small">${n(t)}</td></tr>`).join(``)}</tbody></table></div></div>
      <div class="card"><div class="card-head"><h3>Code Arduino Uno</h3><button class="btn btn-sm" id="copy-uno">Copier</button></div><div class="card-body"><pre class="code" style="max-height:460px">${n(o)}</pre></div></div>
    </div>`,e.querySelector(`#copy-uno`).addEventListener(`click`,async()=>{try{await navigator.clipboard.writeText(o),i(`Code copié — collez-le dans l’onglet « Code » de Tinkercad (mode Texte)`)}catch{i(`Copie impossible`,`alert`)}})}export{s as meta,b as render};