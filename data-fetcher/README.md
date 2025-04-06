# SECInsiderMonitor/data-fetcher

Die Data-Fetcher-Komponente ist eine der beiden zentralen, selbst entwickelten Komponenten von SECInsiderMonitor. Ihr Hauptzweck besteht darin, in regelmässigen Abständen neue Einreichungen der relevanten Forms über die EDGAR-Schnittstelle der SEC zu beziehen, diese zu parsen und in der Datenbank strukturiert abzulegen. Zusätzlich wird sie verwendet, um Benachrichtigungen bei neu bezogenen, abonnierten Einreichungen per E-Mail zu versenden.

## Konfiguration

Die Komponente wird über folgende Umgebungsvariablen konfiguriert:

| Variable            | Beschreibung                                                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`      | Vollständiger Connection-String zur MongoDB-Instanz (inkl. Benutzer, Passwort, Host und Datenbankname)                  |
| `USER_AGENT`        | String für USER_AGENT bei Zugriff auf EDGAR-Schnittstelle gemäss Vorgaben der SEC (vgl. Kapitel 6.2.1 der Masterarbeit) |
| `SMTP_HOST`         | Hostname des SMTP-Servers für Mailversand                                                                               |
| `SMTP_PORT`         | Portnummer des SMTP-Servers                                                                                             |
| `SMTP_USE_SSL`      | Verwendung von SSL (`true` / `false`)                                                                                   |
| `SMTP_USERNAME`     | Benutzername für SMTP-Authentifizierung (optional)                                                                      |
| `SMTP_PASSWORD`     | Passwort für SMTP-Authentifizierung (optional)                                                                          |
| `SMTP_FROM_NAME`    | Anzeigename des Absenders in E-Mails                                                                                    |
| `SMTP_FROM_ADDRESS` | Absenderadresse in E-Mails                                                                                              |
| `SERVER_FQDN`       | Vollständiger Domainname des Servers (für Links in Benachrichtigungen)                                                  |
| `LOG_LEVEL`         | (Optional) Minimale Log-Level-Stufe für Meldungen in Log-Dateien und Konsole – Standard: `info`                         |

## Verwendung

Folgende NPM-Skripte stehen zur Verfügung:

| Befehl                    | Beschreibung                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------- |
| `npm run start:scheduled` | Startet eine Data Fetcher Instanz, die jeweils um 00:00 ET einen Datenbezug ausführt                    |
| `npm run start:once`      | Führt sofort einen einmaligen Datenbezug aus                                                            |
| `npm run debug:parsing`   | Unterstützt beim Debugging des Parsings von Einreichungen, bei denen ebendieses Parsing gescheitert ist |
| `npm run build`           | Übersetzt die Data Fetcher Komponente                                                                   |
| `npm run prisma:generate` | Generiert den Prisma-Client basierend auf dem Schema                                                    |
| `npm run prisma:push`     | Synchronisiert das aktuelle Prisma-Schema mit der Datenbank                                             |
| `npm run prisma:studio`   | Startet Prisma Studio zur Datenanalyse und für Debugging                                                |
