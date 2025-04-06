# SECInsiderMonitor

**Full-Stack Webanwendung zur Anzeige und Analyse von SEC-Insider-Filings**

Diese Anwendung ermöglicht das automatisierte Beziehen, Verarbeiten und Visualisieren von Insider-Einreichungen (Forms 3, 4 und 5). Das Projekt entstand im Rahmen einer Masterarbeit.

## Wesentliche Funktionen

- Automatisierter Bezug und Parsing von SEC-Filings (Forms 3, 4, 5)
- Speicherung in strukturierter Form mit MongoDB & Prisma ORM
- Einreichungs-Dashboard sowie Transaktionsübersicht mit Filter- und Analysefunktionen
- Visualisierung von Unternehmenstransaktionsverlauf und Netzwerkbeziehungen
- E-Mail-Benachrichtigungen bei abonnierten, neuen Einreichungen
- Benutzerverwaltung mit Authentifizierung und einfachem Rollenmodell

## Deployment

### Voraussetzungen

- 2 vCPU, 2–4 GB RAM, 50–80 GB SSD
- Öffentliche IPv4 oder Portweiterleitung für TCP 443/80 mitsamt passendem DNS-Eintrag (für automatischen Zertifikatsbezug)
- SMTP-Zugangsdaten für Mailversand

### Installationsschritte

_Exemplarisch für Installation auf System mit Ubuntu Server 24.04 LTS:_

```bash
# Docker und Docker Compose installieren
apt -y install docker.io docker-compose-v2

# Anwendungsverzeichnis anlegen
mkdir -p /opt/secinsidermonitor
cd /opt/secinsidermonitor

# Deploymentar-Archiv beziehen und entpacken
wget https://github.com/p-knecht/SECInsiderMonitor/releases/download/v1.0/sim.tar.gz
tar xvzf sim.tar.gz
rm sim.tar.gz

# Konfiguration anpassen
cp env.example .env
vi .env

# Anwendung starten (Hinweis: Der initiale Start kann einige Minuten dauern)
docker compose up -d
```

## Dokumentation

Alle technischen Details, Hintergründe und Begründungen sind in der entsprechenden Masterarbeit dokumentiert.
