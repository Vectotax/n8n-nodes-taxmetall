# n8n-nodes-taxmetall

[![npm version](https://img.shields.io/npm/v/@vectotaxsoftwaregmbh/n8n-nodes-taxmetall.svg)](https://www.npmjs.com/package/@vectotaxsoftwaregmbh/n8n-nodes-taxmetall)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An [n8n](https://n8n.io/) community node package that integrates **TaxMetall ERP** into your workflows. Query customers, articles, orders, invoices, suppliers, delivery notes, offers, dunning records, and execute custom statistics reports — all directly from n8n.

[TaxMetall](https://www.vectotax.de) is an ERP system for metal trading and processing companies, developed by Vectotax Software GmbH.

---

## Table of Contents

- [Installation](#installation)
- [Credentials](#credentials)
- [Nodes](#nodes)
  - [TaxMetall](#taxmetall)
  - [TaxMetall Statistics](#taxmetall-statistics)
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

Create a **TaxMetall API** credential in n8n (**Settings → Credentials → New**).

| Field | Description | Example |
|---|---|---|
| **Base URL** | URL of your TaxMetall API service | `https://api.example.com:8443` |
| **API Key** | The `tax-api-key` configured in your TaxMetall API service | `your-secret-api-key` |

The API key is sent as the `tax-api-key` HTTP header with every request.

---

## Nodes

### TaxMetall

General-purpose ERP node for querying and creating records across all TaxMetall domains.

#### Resources and Operations

##### Article (Artikel)

| Operation | Description | Required Parameters |
|---|---|---|
| Search by article ID | Retrieve an article by its internal ID | Article ID |
| Search by article number | Find an article by its exact number | Article number |
| Search by name | Search articles by partial name match | Name |
| Search by drawing number | Find articles by drawing/part number | Drawing number |

##### Customer (Kunde)

| Operation | Description | Required Parameters |
|---|---|---|
| Search by ID | Retrieve a customer by their customer number | Customer number |
| Search by name | Find customers by partial name match | Name |
| Search by order ID | Find the customer associated with an order | Order number |

##### Order (Auftrag)

| Operation | Description | Required Parameters |
|---|---|---|
| Get order status | Retrieve a full order including line items | Order number |
| Search by date range | List all orders within a date range | Date from, Date to |

##### Offer (Angebot)

| Operation | Description | Required Parameters |
|---|---|---|
| Create | Create a new offer | Customer ID, Article ID |
| Search by offer number | Retrieve an offer including line items | Offer number |
| Search by customer | List all offers for a customer | Customer number |
| Search by date range | List all offers within a date range | Date from, Date to |

##### Invoice (Rechnung)

| Operation | Description | Required Parameters |
|---|---|---|
| Search by invoice number | Retrieve an invoice including line items | Invoice number |
| Search by customer | List all invoices for a customer | Customer number |
| Search by date range | List all invoices within a date range | Date from, Date to |

##### Purchase Invoice (Eingangsrechnung)

| Operation | Description | Required Parameters |
|---|---|---|
| Search by ER number | Retrieve a purchase invoice including line items | ER number (+ optional supplier number) |
| Search by supplier | List all purchase invoices for a supplier | Supplier number |
| Search by date range | List all purchase invoices within a date range | Date from, Date to |

##### Delivery Note (Lieferschein)

| Operation | Description | Required Parameters |
|---|---|---|
| Search by delivery note number | Retrieve a delivery note including line items | Delivery note number |
| Search by customer | List all delivery notes for a customer | Customer number |
| Search by date range | List all delivery notes within a date range | Date from, Date to |

##### Supplier (Lieferant)

| Operation | Description | Required Parameters |
|---|---|---|
| Search by ID | Retrieve a supplier by their supplier number | Supplier number |
| Search by name | Find suppliers by partial name match | Name |
| Search by article | Find all suppliers linked to an article | Article number |

##### Dunning (Mahnung)

| Operation | Description | Required Parameters |
|---|---|---|
| Search by customer | List all open dunning items for a customer | Customer number |
| Search by due date range | List all open dunning items by due date | Date from, Date to |

> **Note:** Dunning records are not independent documents in TaxMetall. They are a filtered view of the invoice table (open balance > 0, not a credit note, no dunning block).

##### Akquise

| Operation | Description | Required Parameters |
|---|---|---|
| Create | Create a new acquisition/lead entry | Company name, email address |

---

### TaxMetall Statistics

Executes pre-configured SQL reports stored in TaxMetall and returns the results as a JSON array. This allows every custom report and business cockpit report defined in your TaxMetall installation to be used directly inside n8n workflows.

#### How it works

The node dynamically loads all available reports for the authenticated tenant from the database and presents them in a dropdown. Each option shows the report name and which parameters it expects.

#### Fields

| Field | Type | Description |
|---|---|---|
| **Statistic / Report** | Dropdown | Select the report to execute. The option description lists the expected parameters. |
| **Date from** | Date | Start of the reporting period (SQL parameter: `DatumVon`) |
| **Date to** | Date | End of the reporting period (SQL parameter: `DatumBis`) |
| **Additional parameters** | Collection | Optional filter parameters depending on the report |

#### Additional parameters

| Field | SQL Name | Description |
|---|---|---|
| Article number | `Artikel` | Filter by article number |
| Order type | `AuftragsArt` | Filter by order type code |
| Business area | `GeschBereich` | Filter by business area |
| Customer number | `Kunden` | Filter by customer number |
| Warehouse | `Lagerort` | Filter by warehouse code |
| Supplier number | `Lieferanten` | Filter by supplier number |
| Employee | `Mitarbeiter` | Filter by employee code |
| Project | `Projekt` | Filter by project ID |
| Value range from | `WertebereichVon` | Numeric start value for range filters |
| Value range to | `WertebereichBis` | Numeric end value for range filters |

#### Example response

```json
{
  "success": true,
  "statisticId": "SQLButton3",
  "statisticName": "Revenue by Customer",
  "rowCount": 42,
  "data": [
    { "CustomerNo": "1001", "Revenue": 15000.00 },
    { "CustomerNo": "1002", "Revenue": 8750.50 }
  ]
}
```

#### Supported report types

| Type | Available | Description |
|---|---|---|
| Individual (Individuell) | Yes | Custom SQL reports defined by the tenant |
| Business Cockpit (BC) | Yes | Reports from the Business Cockpit module |
| Static (Statisch) | No | Hardcoded system reports — SQL is not stored in the database |

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
