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

Reads orders (Aufträge) from TaxMetall.

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
