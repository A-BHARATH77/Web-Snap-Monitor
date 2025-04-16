# Web Snap Monitor

**Web Snap Monitor** is a distributed system that automates the process of visually monitoring websites over time. It periodically captures website screenshots, detects visual changes, and archives them as keyframes. This tool is ideal for UI regression testing, website compliance tracking, and visual monitoring.

## ✨ Features

- 📸 **Automated Screenshot Capture**  
  Periodically takes screenshots of registered websites using a headless browser.

- 🔍 **Visual Change Detection**  
  Compares screenshots pixel-by-pixel to detect visual differences and stores significant updates.

- 🌐 **Web Interface**  
  Web-based frontend for users to register URLs, browse historical snapshots, and view keyframes.

- ⚙️ **Event-Driven Microservices Architecture**  
  Loosely coupled services communicate via message queues for scalability and reliability.

## 🧱 Core Services

### 🕒 Task Scheduler
Emits periodic screenshot tasks by publishing events to a message queue.

### 📷 Screenshot Service
Consumes screenshot tasks and captures the current view of websites using a headless browser.

### 🖼️ Image Difference Service
Receives new screenshots, compares them against existing reference images, and detects visual changes using pixel comparison.

### 🌐 Frontend Service
User interface for:
- Registering websites
- Viewing tracked pages and keyframes
- Navigating visual change history

## 🗃️ Data & Storage

- **MongoDB** for storing metadata (e.g., registered sites, timestamps, keyframe info).
- **Static assets** (screenshots and diffs) stored in a public directory or integrated cloud storage.

## 📦 Technologies Used

- Node.js / Python (per microservice)
- MongoDB
- Puppeteer / Playwright (headless browser)
- RabbitMQ / Kafka (message broker)
- Express / React (frontend, optional)
- Docker (recommended for deployment)
