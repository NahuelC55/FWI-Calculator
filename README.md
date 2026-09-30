# 🚒 Sistema de Monitoreo y Cálculo del Índice FWI (Fire Weather Index)

> **Nota de Transparencia y Propósito**: Este es un proyecto de código abierto, **sin fines de lucro** y desarrollado a modo de prueba y experimentación utilizando **Google Antigravity AI**. Está concebido como una herramienta de apoyo y evaluación técnica para cuarteles de **Bomberos Voluntarios** y organismos de protección civil.

---

## 📌 Descripción General

El **Sistema FWI Monitor** es una solución instalable diseñada para la recopilación automática de datos meteorológicos mediante scraping de la API global **Open-Meteo**, el procesamiento matemático del **Índice de Clima de Incendios (FWI - Canadian Forest Fire Weather Index System)** según la norma internacional (Van Wagner 1987) adaptada a escala regional, la persistencia histórica en base de datos **MySQL**, y la visualización interactiva en un tablero web en **React**.

---

## 🛠️ Tecnologías Utilizadas

### Backend & Motor de Cálculo:
- **Python 3.10+**: Lenguaje principal de procesamiento.
- **Django 5 & Django REST Framework**: API REST para la gestión de zonas, scraping y consultas históricas.
- **PyMySQL & SQLite**: Soporte dual para base de datos relational MySQL (entorno principal) y SQLite (instalación rápida de respaldo).
- **Requests & BeautifulSoup4**: Módulo de scraping y consumo de servicios meteorológicos.
- **NumPy & Pandas**: Procesamiento numérico de series temporales.

### Frontend Dashboard:
- **React 18 (Vite)**: Biblioteca para la interfaz de usuario fluida (Single Page Application).
- **Tailwind CSS**: Estilizado con diseño de modo oscuro y vidrio pulido (*glassmorphic UI*).
- **Lucide Icons**: Iconografía técnica de meteorología y control.
- **Recharts**: Gráficos interactivos de evolución histórica de FWI vs temperatura, humedad y lluvias.
- **Axios**: Cliente HTTP para integración con la API REST.

### Fuente de Datos Meteorológicos:
- **Open-Meteo API**: Servicio meteorológico libre de alta precisión (modelos ERA5 / IFS) sin requerimiento de claves API privadas.

---

## ⚙️ Funcionalidades Clave

1. **Scraping Meteorológico a Demanda e Histórico**:
   - Extrae automáticamente las 4 variables críticas a las 12:00 hs (mediodía) por coordenadas GPS: **Temperatura (°C)**, **Humedad Relativa (%)**, **Velocidad del viento a 10m (km/h)** y **Lluvia acumulada en 24h (mm)**.
2. **Motor de Cálculo FWI Continuo (Cadena Diaria)**:
   - Preserva la humedad histórica de los suelos de un día para el otro, garantizando que el riesgo del día actual refleje las sequías o lluvias previas.
3. **Escala de Peligro Adaptada a la Región (Córdoba, Argentina)**:
   - Configurado con los umbrales oficiales del Plan Provincial de Manejo del Fuego:
     - 🟢 **0 – 5.9**: Bajo (`LOW`)
     - 🔵 **6.0 – 14.9**: Moderado (`MODERATE`)
     - 🟡 **15.0 – 27.9**: Alto (`HIGH`)
     - 🟠 **28.0 – 45.9**: Muy Alto (`VERY_HIGH`)
     - 🔴 **$\ge$ 46.0**: Extremo (`EXTREME`)
4. **Gestión de Zonas Geográficas**:
   - Permite agregar y monitorear múltiples localidades o sectores rurales con presets rápidos (ej. Cosquín, Bariloche, Valparaíso, Madrid, etc.).
5. **Histórico y Exportación de Partes a CSV**:
   - Registro de datos sin duplicados y descarga directa en Excel/CSV para informes de guardia.

---

## 📐 Fórmulas y Algoritmos FWI (Norma Van Wagner 1987)

El motor implementa las ecuaciones estándar del *Canadian Forest Fire Danger Rating System* (CFFDRS) con ajuste de fotoperíodo según el hemisferio geográfica (Norte/Sur):

### 1. Códigos de Humedad (Moisture Codes)

- **FFMC (Fine Fuel Moisture Code - Humedad de Combustibles Finos)**:
  Evalúa el contenido de humedad de la hojarasca y pastizales finos ($m_0$).
  $$m_0 = 147.2 \cdot \frac{101 - FFMC_{prev}}{59.5 + FFMC_{prev}}$$
  Aplica el efecto de lluvia acumulada ($r_a = r_0 - 0.5$) y equilibra con la humedad relativa y temperatura para obtener la tasa de secado/humedecimiento $m$, calculando:
  $$FFMC = 59.5 \cdot \frac{250 - m}{147.2 + m}$$

- **DMC (Duff Moisture Code - Humedad de Capa Orgánica Media)**:
  Mide la humedad de capas vegetales medianas. La lluvia reduce el código ($DMC = DMC_{prev} - \text{efecto\_lluvia}$) y la evapo-transpiración diaria incrementa la sequía:
  $$K = 1.894 \cdot (T + 1.1) \cdot (100 - H) \cdot L_e \cdot 10^{-6}$$
  $$DMC = DMC_{prev} + 100 \cdot K$$
  *(donde $L_e$ es la duración del día ajustada a la latitud del hemisferio)*.

- **DC (Drought Code - Índice de Sequía Profunda)**:
  Mide la humedad de troncos densos y capas profundas del suelo con una memoria de respuesta lenta de ~52 días. La lluvia recupera la reserva de agua $Q_0 = 800 \cdot e^{-DC/400}$ y el calor incrementa la evaporación $V = 0.36(T + 2.8) + L_f$.

---

### 2. Índices de Comportamiento del Fuego (Fire Behavior Indices)

- **ISI (Initial Spread Index - Índice de Propagación Inicial)**:
  Calcula la velocidad estimada de avance del fuego combinando el viento ($W$) y el $FFMC$:
  $$ISI = 0.208 \cdot e^{0.05039 \cdot W} \cdot f(FFMC)$$

- **BUI (Buildup Index - Combustible Disponible)**:
  Combina el $DMC$ y el $DC$ para determinar la cantidad total de combustible vegetal disponible para alimentar el fuego:
  $$BUI = \frac{0.8 \cdot DMC \cdot DC}{DMC + 0.4 \cdot DC} \quad (\text{si } DMC \le 0.4 \cdot DC)$$

- **FWI (Fire Weather Index - Índice Final de Peligro)**:
  Combina el $ISI$ (propagación) y el $BUI$ (combustible) para calcular la intensidad de la línea de fuego:
  $$B = 0.1 \cdot ISI \cdot f(BUI)$$
  $$FWI = e^{2.72 + 0.434 \cdot (\ln B)^{0.647}} \quad (\text{si } B > 1)$$

- **DSR (Daily Severity Rating - Severidad Diaria)**:
  $$DSR = 0.0272 \cdot (FWI)^{1.77}$$

---

## 🚀 Instalación y Uso Rápido en Windows

1. **Instalación de Dependencias (Ejecutar solo una vez)**:
   Haz doble clic en:
   ```cmd
   install.bat
   ```

2. **Lanzar la Aplicación**:
   Haz doble clic en:
   ```cmd
   start.bat
   ```
   El dashboard se abrirá automáticamente en tu navegador en `http://localhost:3000`.

---

## 🤖 Créditos y Licencia

- **Desarrollado con asistencia de IA**: Google Antigravity.
- **Licencia**: Código Abierto / Libres sin fines de lucro (MIT License).
- **Basado en**: *Development and Structure of the Canadian Forest Fire Weather Index System* (Van Wagner 1987, Forestry Technical Report 35).
