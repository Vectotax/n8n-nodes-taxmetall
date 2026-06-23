# n8n-nodes-taxmetall

[![npm version](https://img.shields.io/npm/v/@vectotaxsoftwaregmbh/n8n-nodes-taxmetall.svg)](https://www.npmjs.com/package/@vectotaxsoftwaregmbh/n8n-nodes-taxmetall)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An [n8n](https://n8n.io/) community node package that connects **TaxMetall ERP** and **TaxDMS** to your workflows. Read and create records across all major ERP domains — customers, articles, orders, offers, invoices, delivery notes, purchase invoices, suppliers, dunning — and run custom SQL reports and upload documents to TaxDMS, all directly from n8n.

[TaxMetall](https://www.vectotax.de) is an ERP system for metal trading and processing companies, developed by Vectotax Software GmbH.

---

## Table of Contents

- [Installation](#installation)
- [Credentials](#credentials)
- [Node: TaxMetall ERP](#node-taxmetall-erp)
  - [Acquisition](#acquisition)
  - [Article](#article)
  - [Customer](#customer)
  - [Delivery Note](#delivery-note)
  - [DMS](#dms)
  - [Document Sync (SharePoint WF1 / WF2)](#document-sync-sharepoint-wf1--wf2)
  - [Dunning](#dunning)
  - [Invoice](#invoice)
  - [Offer](#offer)
  - [Order](#order)
  - [Purchase Invoice](#purchase-invoice)
  - [Statistic](#statistic)
  - [Supplier](#supplier)
- [Compatibility](#compatibility)
- [Resources](#resources)
- [License](#license)

---

## Installation

Follow the [n8n community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/).

**Via the n8n UI:**
1. Go to **Settings → Community Nodes**
2. Click **Install a community node**
3. Enter `@vectotaxsoftwaregmbh/n8n-nodes-taxmetall`
4. Click **Install**

**Via CLI:**
```bash
npm install @vectotaxsoftwaregmbh/n8n-nodes-taxmetall
```

---

## Credentials

Create a **TaxMetall API** credential in n8n (**Settings → Credentials → New → TaxMetall API**).

| Field | Required | Description |
|---|---|---|
| **Base URL** | Yes | URL of your TaxMetall API service, e.g. `https://api.example.com:8443` |
| **API Key** | Yes | The `tax-api-key` configured in your TaxMetall API service |
| **Use ngrok Tunnel** | No | Enable if your TaxMetall instance is accessed via an ngrok tunnel — adds the `ngrok-skip-browser-warning` header to bypass the ngrok browser interstitial page |
| **Allow Self-Signed Certificates** | No | Disable TLS certificate validation — enable only for on-premises installations using self-signed certificates |

The API key is automatically injected as the `tax-api-key` HTTP header with every request.

---

## Node: TaxMetall ERP

The **TaxMetall ERP** node covers all major TaxMetall domains. Select a **Resource** and then an **Operation** to configure the node.

---

### Acquisition

Manages acquisition/lead contacts in TaxMetall.

#### Create

Creates a new acquisition entry.

| Field | Required | Description |
|---|---|---|
| Email | Yes | Contact email address |
| Company | Yes | Company name |
| First Name | No | Contact first name |
| Last Name | No | Contact last name |
| Phone | No | Phone number |
| Street | No | Street address |
| Postal Code | No | Postal code |
| City | No | City |
| Country | No | Country |
| Lead Source | No | Origin of the lead (e.g. trade fair, website) |
| Campaign Info | No | Associated campaign |
| Perspective Lead ID | No | External ID from Perspective CRM |

#### Search by ID

Returns a single acquisition entry by its internal contact number.

| Field | Required | Description |
|---|---|---|
| Acquisition ID | Yes | Internal contact number (KontaktNr) |

#### Search by Name

Searches acquisition entries by partial match on company or contact name.

| Field | Required | Description |
|---|---|---|
| Name | Yes | Partial name to search for |

#### Search by Date Range

Lists acquisition entries by their first contact date.

| Field | Required | Description |
|---|---|---|
| Date From | Yes | Start date in format `yyyy-mm-dd` |
| Date To | Yes | End date in format `yyyy-mm-dd` |

---

### Article

Manages articles (Artikel) in TaxMetall.

#### Create

Creates a new article. If no article number is provided, the next number from the configured number range is used automatically.

| Field | Required | Description |
|---|---|---|
| Name | Yes | Article name / description (Bezeichnung) |
| Unit of Measure | Yes | Unit of measure, e.g. `Stk`, `m`, `kg` |
| Article Number | No | Article number — auto-assigned if left empty |
| Drawing Number | No | Drawing or part number (Zeichnungsnr) |
| Revision Number | No | Revision index |
| Material | No | Material designation, e.g. `S235`, `1.4301` |
| Manufacturing Indicator | No | Manufacturing key (FertigungsKz) |
| Bill of Materials | No | `0` = no BOM, `1` = is a BOM |
| Custom Tariff Number | No | Customs tariff number (Zolltarifnr) |
| Preliminary | No | Mark article as preliminary (Vorläufig) |

#### Search by Article ID

Returns an article by its internal numeric ID.

| Field | Required | Description |
|---|---|---|
| Article ID | Yes | Internal article ID (AID) |

#### Search by Article Number

Returns an article by its exact article number.

| Field | Required | Description |
|---|---|---|
| Article Number | Yes | Article number (Artikelnr) |

#### Search by Drawing Number

Searches articles by drawing or part number.

| Field | Required | Description |
|---|---|---|
| Drawing Number | Yes | Drawing number (Zeichnungsnr) |

#### Search by Name

Searches articles by partial match on the article name.

| Field | Required | Description |
|---|---|---|
| Name | Yes | Partial name to search for |

---

### Customer

Manages customers (Kunden) in TaxMetall.

#### Create

Creates a new customer.

| Field | Required | Description |
|---|---|---|
| Company Name | Yes | Customer company name |
| Name Addition | No | Additional name line (Namenzusatz) |
| Street | No | Street address |
| Postal Code | No | Postal code |
| City | No | City |
| Country | No | Country name |
| ISO Country Code | No | Two-letter ISO code, e.g. `DE`, `AT`, `CH` |
| Email | No | Email address |
| Phone | No | Phone number |
| Website | No | Website URL |

#### Search by ID

Returns a customer by their customer number.

| Field | Required | Description |
|---|---|---|
| Customer ID | Yes | Customer number (Kundennr) |

#### Search by Name

Searches customers by partial match on their company name.

| Field | Required | Description |
|---|---|---|
| Customer Name | Yes | Partial name to search for |

#### Search by Order ID

Returns the customer associated with a given order number.

| Field | Required | Description |
|---|---|---|
| Order ID | Yes | Order number (Auftragnr) |

---

### Delivery Note

Reads delivery notes (Lieferscheine) including their line items.

#### Search by Delivery Note No.

Returns a single delivery note with all its line items.

| Field | Required | Description |
|---|---|---|
| Delivery Note Number | Yes | Delivery note number (Lieferscheinnr) |

#### Search by Customer No.

Lists all delivery notes for a given customer.

| Field | Required | Description |
|---|---|---|
| Customer Number | Yes | Customer number (Kundennr) |

#### Search by Date Range

Lists all delivery notes within a date range.

| Field | Required | Description |
|---|---|---|
| Date From | Yes | Start date in format `yyyy-mm-dd` |
| Date To | Yes | End date in format `yyyy-mm-dd` |

---

### DMS

Uploads files to the **TaxDMS** document management system (Vectotax Software GmbH).

#### Create File

Uploads a binary file together with a metadata object to TaxDMS via the `/api/create-dms-file` endpoint. The file is transferred as Base64.

| Field | Required | Description |
|---|---|---|
| Data (JSON) | Yes | Metadata object — structure defined by your TaxDMS configuration |
| File (Binary) | Yes | Name of the n8n binary property that holds the file, e.g. `data` |

> **Tip:** Use an **HTTP Request** node, a **Read Binary File** node, or any node that outputs a binary property to provide the file. The value of **File (Binary)** must match the property name under which n8n stores the file in that node's output.

---

### Document Sync (SharePoint WF1 / WF2)

Connects the TaxMetall document pocket (Dokutasche) with SharePoint through the TaxMetall document-sync work queue (`APIEventTrigger` / `APIEventDetail`). It implements two workflows:

- **WF1 — Export** (TaxMetall → SharePoint): claim newly created documents from the queue, download each file, upload it to SharePoint, then report the result back so the entry is closed or retried.
- **WF2 — Import** (SharePoint / mail → TaxMetall): create a document (typically an `.eml` built by the service) in TaxMetall and write a closing audit entry, with optional deduplication by mail message ID.

The service stores the resulting SharePoint URL under `Payload.sharePoint.mainUrl` and, for WF2, the mail ID under `Payload.email.messageId`.

#### Check New Documents

Claims up to **Limit** pending entries from the work queue and returns a **lease token** plus the list of documents to process (WF1, step 1). Each call generates a fresh lease token; only the holder of that token may download a claimed file or report its status, and the lease expires after the service-configured number of seconds.

| Field | Required | Description |
|---|---|---|
| Limit | No | Max number of documents to claim in one call (default `50`). The service caps this at its configured maximum. |

Important response fields:

| Field | Description |
|---|---|
| `leaseToken` | **Legacy / optional.** A per-batch token that is still returned for backward compatibility but is **no longer validated** by the service (claim locking is now in-memory per tenant). It will be removed in a future major version. |
| `busy` | `true` when another batch is still being processed; then `documents[]` is empty and nothing is claimed — simply poll again later |
| `documents[]` | Entries ready for processing |
| `documents[].syncId` | Queue entry ID — needed for download and status report |
| `documents[].downloadUrl` | Ready-to-use relative URL `/api/document-file?syncId=…&token=…` (CREATE only) |
| `documents[].eventTyp` | Event type as integer: `1` = CREATE, `3` = DELETE |
| `documents[].aktion` | The same event as text: `CREATE` or `DELETE` |
| `documents[].belegTyp` / `belegNr` | Business document type (e.g. `Auftrag`, `Rechnung`, `Angebot`) and document number — the internal table name is not exposed |
| `documents[].dateiname` | Source file path/name |
| `documents[].email` | For mail documents (`Typ=2`) on CREATE events: `{ from, to, subject, date }` from the document record — handy when uploading the mail to storage. Absent for non-mail documents. |
| `documents[].sharePointUrl` | For DELETE events only: SharePoint URL of the previously uploaded file, so it can be removed from SharePoint. Derived from the stored payload (`payload.sharePointUrl` or legacy `payload.sharePoint.mainUrl`). `null` if no prior upload is found. |
| `documents[].payload` | For DELETE events only: the **full** payload object that was stored on the prior transfer status (whatever key/value pairs were sent), or `null` if none / already purged by retention. |
| `skipped[]` | Entries the service skipped this batch — `dms_reference`, `file_not_found`, `file_unreadable`, or `superseded` (an older event for the same file path, collapsed because only the latest state matters; see Coalescing below) |

**Coalescing (per file path):** Between two polls the same file can be created/deleted several times (e.g. created → deleted → created). For SharePoint only the **final state** matters. On each claim the service therefore keeps **only the latest event per file path** (highest `syncId`) and marks the earlier ones `skipped` / `superseded`. Combined with the delete correlation this means: a created→deleted pair where nothing was ever uploaded collapses to a no-op (the kept DELETE event returns `sharePointUrl: null`), while created→deleted→created collapses to a single upload of the latest version.

#### Download Document File

Downloads the file of a single claimed entry as **binary data** (WF1, step 2). The node parses the file name from the response and sets the MIME type automatically.

| Field | Required | Description |
|---|---|---|
| Sync ID | Yes | `syncId` of the entry (from Check New Documents) |
| Lease Token (Legacy) | No | Optional / legacy — no longer validated by the service. Leave empty. Kept for backward compatibility; will be removed in a future major version. |
| Put Output File in Field | Yes | Name of the binary property to write the file to (default `data`) |

The downloaded file is placed in the chosen binary property, ready for an upload node (e.g. **HTTP Request** or a **Microsoft SharePoint** node). The item JSON also carries `syncId`, `leaseToken`, `fileName` and `mimeType`.

#### Check & Download New Documents

Combines **Check New Documents** and **Download Document File** into a single step (WF1, steps 1 + 2). It claims a batch from the queue and, using the batch-wide lease token, downloads the file for each CREATE entry (those with a `downloadUrl`) — so you no longer need a Split/loop + a separate download node.

| Field | Required | Description |
|---|---|---|
| Limit | No | Max number of documents to claim in one call (default `50`). The service caps this at its configured maximum. |
| Put Output File in Field | Yes | Name of the binary property to write each file to (default `data`) |

**Output:** one item per claimed document — and exactly one summary item when nothing was found, so the node always returns something to branch on.

- **Nothing found:** a single item `{ "success": false, "count": 0, "description": "No new documents found" }` (no binary). Use this to drive a "nothing to do" branch.
- **Documents found:** one item per claimed document. Every item carries `success: true`, `count` (number of documents in the batch) and `index` (0-based position), in addition to:
  - CREATE entries (with a file): the full document metadata plus `leaseToken`, `fileName` and `mimeType`; the file is in the chosen binary property — ready to wire straight into an upload node.
  - Non-file events (e.g. DELETE): metadata only, no binary.
  - If a single file fails to download (it was removed or skipped server-side between claim and download), that item carries `downloadError` and `httpCode` instead of a binary; the rest of the batch still comes through.

Tip: filter downstream on `{{ $json.success }}` to separate the "found" items from the empty-result item.

Because the `leaseToken` and `syncId` are on every found item, a downstream **Report SharePoint Transfer Status** can acknowledge each entry as usual. Use the low-level **Check New Documents** / **Download Document File** operations only when you need full manual control over the claim/download split.

#### Report SharePoint Transfer Status

Reports the upload result back to the service (WF1, step 4).

| Field | Required | Description |
|---|---|---|
| Sync ID | Yes | `syncId` of the entry |
| Lease Token (Legacy) | No | Optional / legacy — no longer validated by the service. Leave empty. Kept for backward compatibility; will be removed in a future major version. |
| Success | Yes | `true` = synced successfully, `false` = transfer failed |
| Payload Fields | No | Shown when **Success** is on — **custom key/value pairs** stored as the entry payload (flat JSON), e.g. Key `sharePointUrl` with the uploaded URL. Stored verbatim and **returned in full on a later DELETE event** (`documents[].payload`) so you can act on it. Keys must be non-empty and unique; values are sent as strings. Total payload limited to 8 KB. |
| SharePoint URL (Legacy) | No | Optional shortcut for a single URL, used only when **no Payload Fields** are set; stored as `{"sharePointUrl":"…"}`. Prefer **Payload Fields**. Optional in all cases (URL is no longer required). |
| Error Message | No | Shown when **Success** is off — error text recorded for the failed transfer |

**Retry handling:** on `success = false` the service **keeps the work-queue row**, so the document is retried on the next poll — **unconditionally and without limit** (there is no retry counter and no `dead` state). The failure is recorded only in the service log.

#### Create Document

WF2: creates a document in TaxMetall from mail data. When no existing file path is supplied, the service builds a standards-compliant `.eml` (via Indy) from the email fields and attachments, links it to the target record, and writes a closing audit entry (`Quelle = API:create-new-dokument`). A `CONTEXT_INFO` marker prevents the ERP trigger from re-syncing the document (no loop).

| Field | Required | Description |
|---|---|---|
| Area (Bereich) | Yes | Target area, chosen from a dropdown. Position documents are attached to the article, so use **Article (Artikel)** for those. |
| Document Number (Belegnummer) | Yes | Number of the target record. For position documents use the article number. |
| SharePoint URL | No | Optional source SharePoint URL (stored under `Payload.sharePoint.mainUrl` when set). Leave empty to create the document without a SharePoint reference — e.g. when the export to storage is handled later by WF1 (enable **Also Export to Storage**). |
| Email To | No* | Recipient address (`email.an`) — required when the service generates the `.eml` |
| Attach All Input Binary Fields | No | Attach **every** binary property on the input item automatically (variable number of files, e.g. all attachments from a Gmail/IMAP trigger). When on, the manual Attachments list is hidden and ignored. |
| Allow Duplicates | No | Skip deduplication. Off by default. |
| Also Export to Storage (Disable Loop Guard) | No | Off by default — the imported document is not re-exported. Enable to additionally queue the created document for export (WF1), e.g. to mirror it to SharePoint. |

**Area (Bereich) mapping** — the dropdown sends these table names. Documents attached from positions use `Artikel_s` with `BelegNr = ArtikelNr`.

| Dropdown | API value | Dropdown | API value |
|---|---|---|---|
| Order (Auftrag) | `Auftrag_s` | Offer (Angebot) | `Angebot_s` |
| Invoice (Rechnung) | `Rechnung_s` | Delivery Note (Lieferschein) | `Lieferschein_s` |
| Purchase Order (Bestellung) | `Bestellung_s` | Article (Artikel) | `Artikel_s` |
| Inquiry (Anfrage) | `Anfrage_s` | Project (Projekt) | `Projekt` |
| Customer (Kunde) | `Kunden_s` | Supplier (Lieferant) | `Liefer_s` |
| Purchase Invoice (ER) | `ER` |  |  |

**Email Fields** (collection — used to build the `.eml`):

| Field | API field | Description |
|---|---|---|
| Date | `email.datum` | Date the mail was received (ISO 8601) |
| From | `email.von` | Sender address |
| HTML | `email.html` | HTML body — provide Text **or** HTML |
| Message ID | `email.messageId` | Unique mail ID — drives deduplication |
| Subject | `email.betreff` | Email subject |
| Text | `email.text` | Plain text body — provide Text **or** HTML |

\*When the service builds the `.eml`, `email.an` and at least one of `email.text` / `email.html` are required; otherwise the API returns `400`.

**Attachments** (add one row per file):

| Field | Description |
|---|---|
| Input Binary Field | Name of the n8n binary property to attach. If set, its content is Base64-encoded automatically and the file name / MIME type are taken from the binary metadata (unless overridden below). |
| File Name | Attachment file name (`dateiname`) — overrides the binary file name |
| MIME Type | Attachment MIME type — overrides the binary MIME type |
| Content (Base64) | Base64 content (`inhaltBase64`) — used when **Input Binary Field** is empty |

> **Binary handling:** the most convenient way to add attachments is to wire a node that outputs binary data (e.g. **HTTP Request**, **Read Binary File**, a SharePoint download) and reference its binary property under **Input Binary Field** — the node performs the Base64 conversion for you. The combined upload is bounded by the service limit (`MAX_UPLOAD_SIZE`, 60 MB request body ≈ 45 MiB of decoded attachments); a larger request is rejected with `403 Forbidden`.

**Deduplication & `allowDuplicates`:**

| `allowDuplicates` | `email.messageId` | Behaviour |
|---|---|---|
| off (default) | present, already seen | No `.eml`, no document, no audit entry — returns `duplicate: true` |
| off (default) | present, new | Document is created normally |
| off (default) | absent | No dedup check — document is created normally |
| on | any | Dedup skipped — document is always created |

The duplicate check matches on the previously stored `JSON_VALUE(Payload, '$.email.messageId')` of WF2 audit entries.

#### Example workflows

**WF1 — Export to SharePoint (combined, recommended):**

```text
[Schedule/Trigger]
      ↓
[TaxMetall ERP · Document Sync · Check & Download New Documents] → one item per document, binary "data"
      ↓
[Upload to SharePoint]                                          → sharePointUrl
      ↓
[TaxMetall ERP · Document Sync · Report Transfer Status]        (success = true, sharePointUrl)
```

**WF1 — Export to SharePoint (manual claim/download split):**

```text
[Schedule/Trigger]
      ↓
[TaxMetall ERP · Document Sync · Check New Documents]   → leaseToken, documents[]
      ↓ (Split / loop over documents[])
[TaxMetall ERP · Document Sync · Download Document File] → binary "data"
      ↓
[Upload to SharePoint]                                  → sharePointUrl
      ↓
[TaxMetall ERP · Document Sync · Report Transfer Status] (success = true, sharePointUrl)
```

On an upload failure, set **Success** = `false` and pass the error message — the entry is retried and eventually marked dead.

**WF2 — Import from SharePoint / mail:**

```text
[SharePoint / Mail source]
      ↓
[TaxMetall ERP · Document Sync · Create Document]  (bereich, belegnummer, sharePointUrl, email, attachments)
```

#### Example JSON for Create Document

The node assembles the request below from its fields. The same body can also be sent directly to `POST /api/create-new-dokument`:

```json
{
  "bereich": "Auftrag_s",
  "belegnummer": "10523",
  "sharePointUrl": "https://contoso.sharepoint.com/sites/erp/Freigegebene%20Dokumente/10523.eml",
  "allowDuplicates": false,
  "email": {
    "messageId": "<a1b2c3@mail.example.com>",
    "von": "kunde@example.com",
    "an": "vertrieb@firma.de",
    "betreff": "Bestellung 10523",
    "datum": "2026-06-15T09:30:00",
    "text": "Anbei die Bestellung.",
    "html": "<p>Anbei die Bestellung.</p>"
  },
  "attachments": [
    {
      "dateiname": "bestellung.pdf",
      "mimeType": "application/pdf",
      "inhaltBase64": "JVBERi0xLjcZ…"
    }
  ]
}
```

Successful response (new document):

```json
{ "success": true, "emlGenerated": true, "messageId": "<a1b2c3@mail.example.com>" }
```

Duplicate response (same `messageId`, `allowDuplicates` off):

```json
{ "success": true, "duplicate": true, "message": "Mail bereits verarbeitet" }
```

#### Typical errors

| Status | Meaning |
|---|---|
| `400 Bad Request` | Missing/invalid field — e.g. `bereich`/`belegnummer` missing, no `sharePointUrl`, `email.an` or body missing, invalid Base64, or `allowDuplicates` not boolean |
| `401 Unauthorized` | Lease token missing, wrong, or expired (download / status report) |
| `403 Forbidden` | Request body exceeds `MAX_UPLOAD_SIZE`, or the source file is not readable |
| `404 Not Found` | Queue entry or source file not found; or an invalid target reference for WF2 |
| `409 Conflict` | Entry not in `in_progress`, wrong event type, or a `DMS:` reference that cannot be delivered as a local file |
| `503 Service Unavailable` | Document sync disabled in the service config, or the APIEvent tables (`APIEventTrigger`/`APIEventDetail`) not present for the tenant — run `syncschema-init` |

---

### Dunning

Reads open dunning items (Mahnungen). Dunning records are not independent documents in TaxMetall — they are a filtered view of the invoice table (open balance > 0, not a credit note, no dunning block active).

#### Search by Customer No.

Lists all open dunning items for a specific customer.

| Field | Required | Description |
|---|---|---|
| Customer Number | Yes | Customer number (Kundennr) |
| Due Date From | No | Optional: filter by due date start (`yyyy-mm-dd`) |
| Due Date To | No | Optional: filter by due date end (`yyyy-mm-dd`) |
| Dunning Level | No | Show only items of this dunning level — `0` = all levels |
| Include Blocked | No | Include items with dunning block (Mahnsperre) — default: off |
| Include Paid | No | Include already paid items — default: off |

#### Search by Due Date Range

Lists all open dunning items within a due date range.

| Field | Required | Description |
|---|---|---|
| Due Date From | Yes | Start date in format `yyyy-mm-dd` |
| Due Date To | Yes | End date in format `yyyy-mm-dd` |
| Dunning Level | No | Show only items of this dunning level — `0` = all levels |
| Include Blocked | No | Include items with dunning block — default: off |
| Include Paid | No | Include already paid items — default: off |

---

### Invoice

Reads invoices (Rechnungen) including their line items.

#### Search by Invoice No.

Returns a single invoice with all its line items.

| Field | Required | Description |
|---|---|---|
| Invoice Number | Yes | Invoice number (Rechnungnr) |

#### Search by Customer No.

Lists all invoices for a given customer.

| Field | Required | Description |
|---|---|---|
| Customer Number | Yes | Customer number (Kundennr) |

#### Search by Date Range

Lists all invoices within a date range (by invoice date).

| Field | Required | Description |
|---|---|---|
| Date From | Yes | Start date in format `yyyy-mm-dd` |
| Date To | Yes | End date in format `yyyy-mm-dd` |

---

### Offer

Manages offers (Angebote) in TaxMetall.

#### Create

Creates a new offer for a customer with one article position. Either **Article ID** or **Article Number** must be provided — if both are set, Article ID takes precedence.

| Field | Required | Description |
|---|---|---|
| Customer ID | Yes | Customer number (Kundennr) |
| Article ID | No* | Numeric internal article ID |
| Article Number | No* | Article number as text — used when Article ID is `0` |
| Quantity | No | Quantity for the position — default: `1` |

*At least one of Article ID or Article Number must be provided.

#### Search by Offer No.

Returns a single offer with all its line items.

| Field | Required | Description |
|---|---|---|
| Offer Number | Yes | Offer number (Angebotsnr) |

#### Search by Customer No.

Lists all offers for a given customer.

| Field | Required | Description |
|---|---|---|
| Customer Number | Yes | Customer number (Kundennr) |

#### Search by Date Range

Lists all offers within a date range (by offer date).

| Field | Required | Description |
|---|---|---|
| Date From | Yes | Start date in format `yyyy-mm-dd` |
| Date To | Yes | End date in format `yyyy-mm-dd` |

---

### Order

Creates and reads orders (Aufträge) in TaxMetall.

#### Create

Creates a new order for a customer with one or more article positions. For each position, either **Article ID** or **Article Number** must be provided — if both are set, Article ID takes precedence. Header and position data (addresses, VAT, prices, discounts, open quantity) are derived automatically from the customer and article master data, and the order totals are calculated.

| Field | Required | Description |
|---|---|---|
| Customer ID | Yes | Customer number (Kundennr) the order is created for |
| Positions | Yes | One or more positions. Add a row per article. |
| › Article ID | No* | Numeric internal article ID |
| › Article Number | No* | Article number as text — used when Article ID is `0` |
| › Quantity | No | Quantity for the position — default: `1` |
| Create Calculation | No | Freeze the bill of materials and create the calculation (work plan / material) for each position. Off by default. |

*At least one of Article ID or Article Number must be provided per position.

Each created position is marked in the `Text1` field with the note *"Erstellt durch TaxMetall API Service"*.

#### Get Order Status

Returns a single order including all its line items and current production status.

| Field | Required | Description |
|---|---|---|
| Order Number | Yes | Internal order number (Auftragnr) |

#### Search by Date Range

Lists all orders within a date range.

| Field | Required | Description |
|---|---|---|
| Date From | Yes | Start date in format `yyyy-mm-dd` |
| Date To | Yes | End date in format `yyyy-mm-dd` |

---

### Purchase Invoice

Reads incoming purchase invoices (Eingangsrechnungen) including their line items.

#### Search by Purchase Invoice No.

Returns a purchase invoice by its invoice number. If multiple entries share the same invoice number (from different suppliers), add the supplier number to narrow the result.

| Field | Required | Description |
|---|---|---|
| Purchase Invoice Number | Yes | Purchase invoice number (ERNr) |
| Supplier Number | No | Supplier number to narrow results when the invoice number is not unique |

#### Search by Supplier

Lists all purchase invoices for a given supplier.

| Field | Required | Description |
|---|---|---|
| Supplier Number | Yes | Supplier number (Liefernr) |

#### Search by Date Range

Lists all purchase invoices within a date range (by invoice date).

| Field | Required | Description |
|---|---|---|
| Date From | Yes | Start date in format `yyyy-mm-dd` |
| Date To | Yes | End date in format `yyyy-mm-dd` |

---

### Statistic

Executes pre-configured SQL reports stored in TaxMetall and returns the results as a JSON array. This covers both custom SQL reports and Business Cockpit reports defined in your TaxMetall installation.

The available reports are loaded dynamically from the API and presented in a dropdown — each option shows the report name and which parameters it requires.

> **Note:** Only reports of type **Individual** (Individuell) and **Business Cockpit** (BC) are supported. Static system reports (Statisch) are not available because their SQL is not stored in the database.

#### Execute

| Field | Required | Description |
|---|---|---|
| Statistics / Report | Yes | Select the report from the dropdown — the description shows which parameters are needed |
| Date From | No | Start of the reporting period (SQL parameter: `DatumVon`) |
| Date To | No | End of the reporting period (SQL parameter: `DatumBis`) |
| Comparison From | No | Start of an optional comparison period (SQL parameter: `VergleichVon`) |
| Comparison To | No | End of an optional comparison period (SQL parameter: `VergleichBis`) |

**Additional Parameters** (collection — add only what the report requires):

| Field | SQL Parameter | Description |
|---|---|---|
| Article No. | `Artikel` | Filter by article number |
| Article Group | `ArtikelGruppe` | Filter by article group |
| Order No. | `Auftrag` | Filter by order number |
| Order Position | `AuftragsPos` | Filter by order position |
| Order Type | `AuftragsArt` | Filter by order type code |
| Business Area | `GeschBereich` | Filter by business area |
| Customer No. | `Kunden` | Filter by customer number |
| Warehouse | `Lagerort` | Filter by warehouse code |
| Supplier No. | `Lieferanten` | Filter by supplier number |
| Employee | `Mitarbeiter` | Filter by employee code |
| Offer No. | `Angebot` | Filter by offer number |
| Offer Position | `AngebotsPos` | Filter by offer position |
| Project No. | `Projekt` | Filter by project ID |
| Purchase Order No. | `Bestellung` | Filter by purchase order number |
| Purchase Order Position | `BestellPos` | Filter by purchase order position |
| Value Range From | `WertebereichVon` | Numeric start value for range filters |
| Value Range To | `WertebereichBis` | Numeric end value for range filters |
| Variable 1 | `Variable1` | Free text parameter |

---

### Supplier

Manages suppliers (Lieferanten) in TaxMetall.

#### Create

Creates a new supplier.

| Field | Required | Description |
|---|---|---|
| Company Name | Yes | Supplier company name |
| Name Addition | No | Additional name line (Namenzusatz) |
| Street | No | Street address |
| Postal Code | No | Postal code |
| City | No | City |
| Country | No | Country name |
| ISO Country Code | No | Two-letter ISO code, e.g. `DE`, `AT`, `CH` |
| Email | No | Email address |
| Phone | No | Phone number |
| Website | No | Website URL |

#### Search by ID

Returns a supplier by their supplier number.

| Field | Required | Description |
|---|---|---|
| Supplier Number | Yes | Supplier number (Liefernr) |

#### Search by Name

Searches suppliers by partial match on their company name.

| Field | Required | Description |
|---|---|---|
| Name | Yes | Partial name to search for |

#### Search by Article

Returns all suppliers linked to a specific article via the supplier-article assignment table.

| Field | Required | Description |
|---|---|---|
| Article Number | Yes | Article number from the supplier-article assignment |

---

## Compatibility

| Requirement | Version |
|---|---|
| n8n | >= 1.0.0 |
| Node.js | >= 18 |
| n8n Nodes API | 1 |

---

## Resources

- [Vectotax Software GmbH](https://www.vectotax.de)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [npm package](https://www.npmjs.com/package/@vectotaxsoftwaregmbh/n8n-nodes-taxmetall)
- [Report an issue](mailto:vectotax@vectotax.de)

---

## License

[MIT](LICENSE.md)
