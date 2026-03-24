# ItalSempione-3 AI Context

Questo file serve come punto di riferimento (RAG testuale) per fornire contesto aggiornato agli assistenti AI che lavorano su questo repository.

## Panoramica del Progetto
**ItalSempione-3** è un Tracker di Spedizioni Navali basato su un'architettura a servizi. È diviso in backend (Node.js/Express), frontend (React/Vite), orchestrazione di webhook/sfondi (n8n), e un database PostgreSQL. Il deploy è effettuato via Docker su una VM Google Cloud Compute Engine (`italsempione-prod` in `europe-west1-b`). L'URL di produzione è `http://scrape.italnexusflow.it/`.

## Stack Tecnologico
* **Backend:** Node.js, Express, TypeScript, Knex.js (Query Builder/Migrazioni). Librerie principali: `xlsx` (parsing), `multer`, `zod`, `jsonwebtoken`, `bcryptjs`.
* **Frontend:** React 19, Vite, TypeScript, Tailwind CSS, React Router, Axios. Interfaccia costruita focalizzandosi su design reattivi.
* **Database:** PostgreSQL (avviato in docker e gestito via Knex).
* **Automazione:** n8n per schedulazione lavori (cronjob) e gestione asincrona delle interrogazioni esterne (tracking).
* **Deploy:** Docker Compose (`docker-compose.prod.yml`).

## Architettura e Design Pattern
1. **Frontend-Backend Comms:** Il frontend consuma API REST erogate da Node. L'autenticazione usa i Token JWT salvati localmente (Local/Session Storage o HttpOnly cookie).
2. **Sistema di Tracking:** I corrieri (MSC, Maersk, ecc.) vengono interrogati attraverso file "Adapter" specifici presenti in `backend/src/adapters`. 
3. **Flusso Asincrono:** L'upload degli Excel crea Record di Tracking. n8n orchestra aggiornamenti regolari di questi ultimi, loggando i mutamenti dell'ETA.

## Regole per gli Assistenti AI (Agentic Coding)
* Leggere sempre questo file quando si inizia a codificare nuove feature.
* **Non utilizzare TailwindCSS** per il backend o dove non esplicitamente richiesto, ma nel frontend è già inizializzato e va usato attivamente.
* **Codice Typescript:** Mantenere un tipaggio rigoroso ovunque.
* **Absolute Path:** Utilizzare i path assoluti durante la manipolazione da parte dell'agente.
