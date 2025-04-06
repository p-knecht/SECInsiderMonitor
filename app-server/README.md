# SECInsiderMonitor/app-server

Die SIM Application Server Komponente ist eine der beiden zentralen, selbst entwickelten Kernkomponenten von SECInsiderMonitor. Sie stellt die gesamte Logik, API-Endpoints und Weboberfläche bereit, um die durch den SIM Data Fetcher bezogenen SEC-Einreichungen anzuzeigen, zu analysieren und zu verwalten. Die bereitgestellten Funktionen umfassen unter anderem Dashboard, Filterlogik, Detailansichten, Visualisierungen und Benachrichtigungsverwaltung.

## Konfiguration

Die Komponente wird über folgende Umgebungsvariablen konfiguriert:

| Variable                      | Beschreibung                                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`                | Vollständiger Connection-String zur MongoDB-Instanz (inkl. Benutzer, Passwort, Host und Datenbankname) |
| `SERVER_DISABLE_REGISTRATION` | Deaktiviert Registrierung für neue Benutzer und blendet sie aus, wenn auf `true` gesetzt               |
| `SMTP_HOST`                   | Hostname des SMTP-Servers für Mailversand                                                              |
| `SMTP_PORT`                   | Portnummer des SMTP-Servers                                                                            |
| `SMTP_USE_SSL`                | Verwendung von SSL (`true` / `false`)                                                                  |
| `SMTP_USERNAME`               | Benutzername für SMTP-Authentifizierung (optional)                                                     |
| `SMTP_PASSWORD`               | Passwort für SMTP-Authentifizierung (optional)                                                         |
| `SMTP_FROM_NAME`              | Anzeigename des Absenders in E-Mails                                                                   |
| `SMTP_FROM_ADDRESS`           | Absenderadresse in E-Mails                                                                             |
| `SERVER_FQDN`                 | Vollständiger Domainname des Servers (z.B. für Erzeugung von Links )                                   |

## Verwendung

Folgende NPM-Skripte stehen zur Verfügung:

| Befehl                             | Beschreibung                                                                        |
| ---------------------------------- | ----------------------------------------------------------------------------------- |
| `npm run start`                    | Startet Komponente inklusive deren Webinterface                                     |
| `npm run build:appserver`          | Übersetzt bzw. generiert die Next.js-Anwendung                                      |
| `npm run build:initialize-scripts` | Übersetzt die zusätzlichen, für die Initialisierung der Anwendung notwendigen Daten |
| `npm run dev`                      | Startet den Next.js-Entwicklungsmodus mit Hot-Reloading, etc.                       |
| `npm run prisma:generate`          | Generiert den Prisma-Client basierend auf dem Schema                                |
| `npm run prisma:push`              | Synchronisiert das aktuelle Prisma-Schema mit der Datenbank                         |
| `npm run prisma:studio`            | Startet Prisma Studio zur Datenanalyse und für Debugging                            |
