# Volume Data Example: TB_KANTIN_LT1

## Time Range
- **UTC**: 2025-11-02 00:00:00 to 2025-11-02 01:00:00
- **WIB**: 2025-11-02 07:00:00 to 2025-11-02 08:00:00

## Data Structure

Each trash bin (TB_KANTIN_LT1) has **3 devices** (Organic, Anorganic, Residue).
Each device has **4 ultrasonic sensors** at different positions (Top, Upper-Mid, Lower-Mid, Bottom).

### Hardware Configuration
- **Sensors per device**: 4 ultrasonic sensors
- **Sensor positions**: 1 (Top), 2 (Upper-Mid), 3 (Lower-Mid), 4 (Bottom)
- **Total sensors per bin**: 3 devices × 4 sensors = 12 sensors
- **Reading frequency**: ~1 reading per sensor per minute
- **Data points per minute**: 4 sensors × 3 devices = 12 readings

### Volume Calculation
For each device, the 4 sensor readings are **averaged** to get the device's fill percentage.

---

## Sample Data (First 10 Minutes)

### 1. 17:00 (00:00 WIB)

#### Organic Device
| Sensor Position | Sensor ID | Fill % | Distance (cm) |
|----------------|-----------|---------|---------------|
| 1 (Bottom) | SENS_KLT1_ORG_U1 | 24.30% | 90.80 |
| 2 (Bottom) | SENS_KLT1_ORG_U2 | 25.50% | 89.40 |
| 3 (Bottom) | SENS_KLT1_ORG_U3 | 25.30% | 89.70 |
| 4 (Bottom) | SENS_KLT1_ORG_U4 | 25.90% | 88.90 |

**Average Fill Percentage**: 25.25%

#### Anorganic Device
| Sensor Position | Sensor ID | Fill % | Distance (cm) |
|----------------|-----------|---------|---------------|
| 1 (Bottom) | SENS_KLT1_ANO_U1 | 5.70% | 113.10 |
| 2 (Bottom) | SENS_KLT1_ANO_U2 | 5.00% | 114.10 |
| 3 (Bottom) | SENS_KLT1_ANO_U3 | 5.90% | 112.90 |
| 4 (Bottom) | SENS_KLT1_ANO_U4 | 5.70% | 113.10 |

**Average Fill Percentage**: 5.58%

#### Residue Device
| Sensor Position | Sensor ID | Fill % | Distance (cm) |
|----------------|-----------|---------|---------------|
| 1 (Bottom) | SENS_KLT1_RES_U1 | 53.20% | 56.20 |
| 2 (Bottom) | SENS_KLT1_RES_U2 | 53.10% | 56.20 |
| 3 (Bottom) | SENS_KLT1_RES_U3 | 53.50% | 55.80 |
| 4 (Bottom) | SENS_KLT1_RES_U4 | 52.60% | 56.80 |

**Average Fill Percentage**: 53.10%

---

### 2. 17:01 (00:01 WIB)

#### Organic Device
| Sensor Position | Sensor ID | Fill % | Distance (cm) |
|----------------|-----------|---------|---------------|
| 1 (Bottom) | SENS_KLT1_ORG_U1 | 24.10% | 91.10 |
| 2 (Bottom) | SENS_KLT1_ORG_U2 | 24.30% | 90.80 |
| 3 (Bottom) | SENS_KLT1_ORG_U3 | 25.40% | 89.60 |
| 4 (Bottom) | SENS_KLT1_ORG_U4 | 25.70% | 89.20 |

**Average Fill Percentage**: 24.88%

#### Anorganic Device
| Sensor Position | Sensor ID | Fill % | Distance (cm) |
|----------------|-----------|---------|---------------|
| 1 (Bottom) | SENS_KLT1_ANO_U1 | 5.60% | 113.20 |
| 2 (Bottom) | SENS_KLT1_ANO_U2 | 6.10% | 112.70 |
| 3 (Bottom) | SENS_KLT1_ANO_U3 | 4.80% | 114.20 |
| 4 (Bottom) | SENS_KLT1_ANO_U4 | 5.10% | 113.80 |

**Average Fill Percentage**: 5.40%

#### Residue Device
| Sensor Position | Sensor ID | Fill % | Distance (cm) |
|----------------|-----------|---------|---------------|
| 1 (Bottom) | SENS_KLT1_RES_U1 | 53.60% | 55.60 |
| 2 (Bottom) | SENS_KLT1_RES_U2 | 53.80% | 55.40 |
| 3 (Bottom) | SENS_KLT1_RES_U3 | 53.60% | 55.60 |
| 4 (Bottom) | SENS_KLT1_RES_U4 | 53.60% | 55.70 |

**Average Fill Percentage**: 53.65%

---

### 3. 17:02 (00:02 WIB)

#### Organic Device
| Sensor Position | Sensor ID | Fill % | Distance (cm) |
|----------------|-----------|---------|---------------|
| 1 (Bottom) | SENS_KLT1_ORG_U1 | 25.50% | 89.40 |
| 2 (Bottom) | SENS_KLT1_ORG_U2 | 24.70% | 90.40 |
| 3 (Bottom) | SENS_KLT1_ORG_U3 | 26.50% | 88.20 |
| 4 (Bottom) | SENS_KLT1_ORG_U4 | 26.20% | 88.60 |

**Average Fill Percentage**: 25.73%

#### Anorganic Device
| Sensor Position | Sensor ID | Fill % | Distance (cm) |
|----------------|-----------|---------|---------------|
| 1 (Bottom) | SENS_KLT1_ANO_U1 | 6.40% | 112.30 |
| 2 (Bottom) | SENS_KLT1_ANO_U2 | 4.70% | 114.30 |
| 3 (Bottom) | SENS_KLT1_ANO_U3 | 5.80% | 113.00 |
| 4 (Bottom) | SENS_KLT1_ANO_U4 | 4.80% | 114.20 |

**Average Fill Percentage**: 5.43%

#### Residue Device
| Sensor Position | Sensor ID | Fill % | Distance (cm) |
|----------------|-----------|---------|---------------|
| 1 (Bottom) | SENS_KLT1_RES_U1 | 53.70% | 55.50 |
| 2 (Bottom) | SENS_KLT1_RES_U2 | 54.40% | 54.80 |
| 3 (Bottom) | SENS_KLT1_RES_U3 | 54.00% | 55.30 |
| 4 (Bottom) | SENS_KLT1_RES_U4 | 53.90% | 55.30 |

**Average Fill Percentage**: 54.00%

---

### 4. 17:03 (00:03 WIB)

#### Organic Device
| Sensor Position | Sensor ID | Fill % | Distance (cm) |
|----------------|-----------|---------|---------------|
| 1 (Bottom) | SENS_KLT1_ORG_U1 | 24.40% | 90.70 |
| 2 (Bottom) | SENS_KLT1_ORG_U2 | 25.50% | 89.40 |
| 3 (Bottom) | SENS_KLT1_ORG_U3 | 25.60% | 89.30 |
| 4 (Bottom) | SENS_KLT1_ORG_U4 | 25.40% | 89.50 |

**Average Fill Percentage**: 25.23%

#### Anorganic Device
| Sensor Position | Sensor ID | Fill % | Distance (cm) |
|----------------|-----------|---------|---------------|
| 1 (Bottom) | SENS_KLT1_ANO_U1 | 5.10% | 113.90 |
| 2 (Bottom) | SENS_KLT1_ANO_U2 | 5.30% | 113.60 |
| 3 (Bottom) | SENS_KLT1_ANO_U3 | 6.10% | 112.70 |
| 4 (Bottom) | SENS_KLT1_ANO_U4 | 5.20% | 113.70 |

**Average Fill Percentage**: 5.42%

#### Residue Device
| Sensor Position | Sensor ID | Fill % | Distance (cm) |
|----------------|-----------|---------|---------------|
| 1 (Bottom) | SENS_KLT1_RES_U1 | 53.60% | 55.70 |
| 2 (Bottom) | SENS_KLT1_RES_U2 | 52.70% | 56.70 |
| 3 (Bottom) | SENS_KLT1_RES_U3 | 54.50% | 54.70 |
| 4 (Bottom) | SENS_KLT1_RES_U4 | 53.50% | 55.80 |

**Average Fill Percentage**: 53.58%

---

### 5. 17:04 (00:04 WIB)

#### Organic Device
| Sensor Position | Sensor ID | Fill % | Distance (cm) |
|----------------|-----------|---------|---------------|
| 1 (Bottom) | SENS_KLT1_ORG_U1 | 25.10% | 89.90 |
| 2 (Bottom) | SENS_KLT1_ORG_U2 | 25.50% | 89.40 |
| 3 (Bottom) | SENS_KLT1_ORG_U3 | 25.90% | 88.90 |
| 4 (Bottom) | SENS_KLT1_ORG_U4 | 25.30% | 89.70 |

**Average Fill Percentage**: 25.45%

#### Anorganic Device
| Sensor Position | Sensor ID | Fill % | Distance (cm) |
|----------------|-----------|---------|---------------|
| 1 (Bottom) | SENS_KLT1_ANO_U1 | 5.30% | 113.60 |
| 2 (Bottom) | SENS_KLT1_ANO_U2 | 5.70% | 113.10 |
| 3 (Bottom) | SENS_KLT1_ANO_U3 | 5.30% | 113.60 |
| 4 (Bottom) | SENS_KLT1_ANO_U4 | 4.40% | 114.70 |

**Average Fill Percentage**: 5.18%

#### Residue Device
| Sensor Position | Sensor ID | Fill % | Distance (cm) |
|----------------|-----------|---------|---------------|
| 1 (Bottom) | SENS_KLT1_RES_U1 | 52.90% | 56.60 |
| 2 (Bottom) | SENS_KLT1_RES_U2 | 52.90% | 56.50 |
| 3 (Bottom) | SENS_KLT1_RES_U3 | 52.40% | 57.10 |
| 4 (Bottom) | SENS_KLT1_RES_U4 | 53.00% | 56.40 |

**Average Fill Percentage**: 52.80%

---

### 6. 17:05 (00:05 WIB)

#### Organic Device
| Sensor Position | Sensor ID | Fill % | Distance (cm) |
|----------------|-----------|---------|---------------|
| 1 (Bottom) | SENS_KLT1_ORG_U1 | 25.50% | 89.40 |
| 2 (Bottom) | SENS_KLT1_ORG_U2 | 24.50% | 90.70 |
| 3 (Bottom) | SENS_KLT1_ORG_U3 | 25.00% | 90.00 |
| 4 (Bottom) | SENS_KLT1_ORG_U4 | 24.40% | 90.70 |

**Average Fill Percentage**: 24.85%

#### Anorganic Device
| Sensor Position | Sensor ID | Fill % | Distance (cm) |
|----------------|-----------|---------|---------------|
| 1 (Bottom) | SENS_KLT1_ANO_U1 | 5.90% | 112.90 |
| 2 (Bottom) | SENS_KLT1_ANO_U2 | 6.40% | 112.30 |
| 3 (Bottom) | SENS_KLT1_ANO_U3 | 6.40% | 112.30 |
| 4 (Bottom) | SENS_KLT1_ANO_U4 | 6.50% | 112.20 |

**Average Fill Percentage**: 6.30%

#### Residue Device
| Sensor Position | Sensor ID | Fill % | Distance (cm) |
|----------------|-----------|---------|---------------|
| 1 (Bottom) | SENS_KLT1_RES_U1 | 54.30% | 54.90 |
| 2 (Bottom) | SENS_KLT1_RES_U2 | 53.40% | 56.00 |
| 3 (Bottom) | SENS_KLT1_RES_U3 | 53.90% | 55.40 |
| 4 (Bottom) | SENS_KLT1_RES_U4 | 53.20% | 56.20 |

**Average Fill Percentage**: 53.70%

---

### 7. 17:06 (00:06 WIB)

#### Organic Device
| Sensor Position | Sensor ID | Fill % | Distance (cm) |
|----------------|-----------|---------|---------------|
| 1 (Bottom) | SENS_KLT1_ORG_U1 | 26.00% | 88.70 |
| 2 (Bottom) | SENS_KLT1_ORG_U2 | 25.10% | 89.80 |
| 3 (Bottom) | SENS_KLT1_ORG_U3 | 24.50% | 90.60 |
| 4 (Bottom) | SENS_KLT1_ORG_U4 | 24.10% | 91.10 |

**Average Fill Percentage**: 24.92%

#### Anorganic Device
| Sensor Position | Sensor ID | Fill % | Distance (cm) |
|----------------|-----------|---------|---------------|
| 1 (Bottom) | SENS_KLT1_ANO_U1 | 6.00% | 112.80 |
| 2 (Bottom) | SENS_KLT1_ANO_U2 | 6.00% | 112.80 |
| 3 (Bottom) | SENS_KLT1_ANO_U3 | 6.20% | 112.60 |
| 4 (Bottom) | SENS_KLT1_ANO_U4 | 4.90% | 114.20 |

**Average Fill Percentage**: 5.78%

#### Residue Device
| Sensor Position | Sensor ID | Fill % | Distance (cm) |
|----------------|-----------|---------|---------------|
| 1 (Bottom) | SENS_KLT1_RES_U1 | 52.90% | 56.60 |
| 2 (Bottom) | SENS_KLT1_RES_U2 | 52.80% | 56.70 |
| 3 (Bottom) | SENS_KLT1_RES_U3 | 53.00% | 56.50 |
| 4 (Bottom) | SENS_KLT1_RES_U4 | 52.70% | 56.70 |

**Average Fill Percentage**: 52.85%

---

### 8. 17:07 (00:07 WIB)

#### Organic Device
| Sensor Position | Sensor ID | Fill % | Distance (cm) |
|----------------|-----------|---------|---------------|
| 1 (Bottom) | SENS_KLT1_ORG_U1 | 25.80% | 89.10 |
| 2 (Bottom) | SENS_KLT1_ORG_U2 | 24.80% | 90.30 |
| 3 (Bottom) | SENS_KLT1_ORG_U3 | 25.10% | 89.80 |
| 4 (Bottom) | SENS_KLT1_ORG_U4 | 26.10% | 88.70 |

**Average Fill Percentage**: 25.45%

#### Anorganic Device
| Sensor Position | Sensor ID | Fill % | Distance (cm) |
|----------------|-----------|---------|---------------|
| 1 (Bottom) | SENS_KLT1_ANO_U1 | 5.90% | 112.90 |
| 2 (Bottom) | SENS_KLT1_ANO_U2 | 5.00% | 113.90 |
| 3 (Bottom) | SENS_KLT1_ANO_U3 | 5.10% | 113.90 |
| 4 (Bottom) | SENS_KLT1_ANO_U4 | 6.50% | 112.20 |

**Average Fill Percentage**: 5.63%

#### Residue Device
| Sensor Position | Sensor ID | Fill % | Distance (cm) |
|----------------|-----------|---------|---------------|
| 1 (Bottom) | SENS_KLT1_RES_U1 | 53.40% | 55.90 |
| 2 (Bottom) | SENS_KLT1_RES_U2 | 52.80% | 56.60 |
| 3 (Bottom) | SENS_KLT1_RES_U3 | 53.20% | 56.20 |
| 4 (Bottom) | SENS_KLT1_RES_U4 | 53.80% | 55.40 |

**Average Fill Percentage**: 53.30%

---

### 9. 17:08 (00:08 WIB)

#### Organic Device
| Sensor Position | Sensor ID | Fill % | Distance (cm) |
|----------------|-----------|---------|---------------|
| 1 (Bottom) | SENS_KLT1_ORG_U1 | 26.50% | 88.20 |
| 2 (Bottom) | SENS_KLT1_ORG_U2 | 24.90% | 90.10 |
| 3 (Bottom) | SENS_KLT1_ORG_U3 | 25.80% | 89.10 |
| 4 (Bottom) | SENS_KLT1_ORG_U4 | 24.80% | 90.20 |

**Average Fill Percentage**: 25.50%

#### Anorganic Device
| Sensor Position | Sensor ID | Fill % | Distance (cm) |
|----------------|-----------|---------|---------------|
| 1 (Bottom) | SENS_KLT1_ANO_U1 | 6.00% | 112.80 |
| 2 (Bottom) | SENS_KLT1_ANO_U2 | 5.50% | 113.30 |
| 3 (Bottom) | SENS_KLT1_ANO_U3 | 4.80% | 114.20 |
| 4 (Bottom) | SENS_KLT1_ANO_U4 | 6.30% | 112.50 |

**Average Fill Percentage**: 5.65%

#### Residue Device
| Sensor Position | Sensor ID | Fill % | Distance (cm) |
|----------------|-----------|---------|---------------|
| 1 (Bottom) | SENS_KLT1_RES_U1 | 53.60% | 55.60 |
| 2 (Bottom) | SENS_KLT1_RES_U2 | 52.70% | 56.80 |
| 3 (Bottom) | SENS_KLT1_RES_U3 | 53.10% | 56.30 |
| 4 (Bottom) | SENS_KLT1_RES_U4 | 52.90% | 56.50 |

**Average Fill Percentage**: 53.08%

---

### 10. 17:09 (00:09 WIB)

#### Organic Device
| Sensor Position | Sensor ID | Fill % | Distance (cm) |
|----------------|-----------|---------|---------------|
| 1 (Bottom) | SENS_KLT1_ORG_U1 | 24.90% | 90.10 |
| 2 (Bottom) | SENS_KLT1_ORG_U2 | 25.40% | 89.60 |
| 3 (Bottom) | SENS_KLT1_ORG_U3 | 24.80% | 90.30 |
| 4 (Bottom) | SENS_KLT1_ORG_U4 | 24.50% | 90.50 |

**Average Fill Percentage**: 24.90%

#### Anorganic Device
| Sensor Position | Sensor ID | Fill % | Distance (cm) |
|----------------|-----------|---------|---------------|
| 1 (Bottom) | SENS_KLT1_ANO_U1 | 5.40% | 113.50 |
| 2 (Bottom) | SENS_KLT1_ANO_U2 | 6.00% | 112.80 |
| 3 (Bottom) | SENS_KLT1_ANO_U3 | 5.90% | 112.90 |
| 4 (Bottom) | SENS_KLT1_ANO_U4 | 6.20% | 112.60 |

**Average Fill Percentage**: 5.88%

#### Residue Device
| Sensor Position | Sensor ID | Fill % | Distance (cm) |
|----------------|-----------|---------|---------------|
| 1 (Bottom) | SENS_KLT1_RES_U1 | 53.10% | 56.30 |
| 2 (Bottom) | SENS_KLT1_RES_U2 | 52.50% | 56.90 |
| 3 (Bottom) | SENS_KLT1_RES_U3 | 52.60% | 56.90 |
| 4 (Bottom) | SENS_KLT1_RES_U4 | 53.50% | 55.80 |

**Average Fill Percentage**: 52.92%

---

## 5-Minute Interval Aggregation (Chart Data)

This is what the frontend chart displays:

| Time (WIB) | Organic Avg % | Anorganic Avg % | Residue Avg % | Total Avg % |
|------------|---------------|-----------------|---------------|-------------|
| 00:00 | 25.30% | 5.40% | 53.42% | 28.04% |
| 00:05 | 25.13% | 5.85% | 53.17% | 28.05% |
| 00:10 | 25.40% | 5.63% | 53.54% | 28.19% |
| 00:15 | 25.33% | 5.96% | 53.49% | 28.26% |
| 00:20 | 25.54% | 5.98% | 53.39% | 28.30% |

## Notes

- Each minute has 4 sensor readings per device (from 4 different positions)
- The device's fill percentage is the **average** of these 4 sensor readings
- For the chart, data is further aggregated into 5-minute intervals
- Chart shows the average of all readings within each 5-minute window
- Total sensors reporting: 12 (3 devices × 4 sensors per device)
