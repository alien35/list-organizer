---
name: list-organizer
description: >-
  Cognitive Information Architecture (IA) and Hierarchical Feature Refinement agent toolkit. Rooted in
  Miller's 7±2 Law (Miller, 1956), Hierarchical Feature Trees (Kang et al., 1990; Wei et al., 2024),
  the 2-to-3 tier sweet spot (Larson & Czerwinski, 1998), and Jobs-To-Be-Done (JTBD). Transforms unorganized
  flat lists, competitor matrices, and backlog items into consumer-facing 2-level parent-child hierarchies
  with operational descriptions, boolean comparative matrices, and verifiable evidence links.
---

# List Organizer: Cognitive Information Architecture & Hierarchical Feature Refinement

**List Organizer** is an AI agent system and CLI toolkit (`listorg`) grounded in empirical cognitive psychology and requirements engineering. It replaces unstructured, disorienting flat lists with scannable, outcome-driven **Two-Level Hierarchical Feature Trees**.

---

## 🧠 Theoretical Foundations

### 1. Miller's 7±2 Law & Cognitive Working Memory
Cognitive psychology demonstrates that human working memory cannot comfortably process or retain flat lists beyond **$7 \pm 2$ items** (Miller, 1956). Unstructured lists cause:
- **Search Fatigue:** Inability to locate specific capabilities quickly.
- **Mental Model Deficits:** Inability to assess functional completeness or architecture.
- **Hallucination & Redundancy Sprawl:** LLMs generating flat lists repeatedly duplicate features under slight synonyms.

### 2. The 2-to-3 Tier Sweet Spot (Breadth vs. Depth)
Human-Computer Interaction (HCI) and menu-design studies by **Larson & Czerwinski (1998)** and **Jacko & Salvendy (1996)** establish that shallow hierarchies (2–3 levels) consistently outperform both flat lists (1 level) and deeply nested trees (4+ levels):
- **Level 0 (Root Scope):** High-level product or domain scope (e.g., *Digital Notary Platform* or *Mental Health Therapy*).
- **Level 1 (Super-Features / Capability Domains):** 3 to 7 parent domains describing customer outcomes.
- **Level 2 (Sub-Features / Atomic Capabilities):** 3 to 7 discrete, verifiable capabilities per parent.

### 3. Sibling & Parent Context Prompting (Wei et al., 2024)
In their 2024 study on automated feature elicitation, **Wei et al.** discovered that evaluating or generating features in isolation produces redundant, disorganized sprawl. Providing the **Root**, **Super-Feature (Parent)**, and **Sibling Features** to the agent guarantees **100% valid parent-child logical relationships** across generated capabilities.

### 4. Jobs-To-Be-Done (JTBD) Parent Naming
Parent domains must express customer outcomes and peace-of-mind goals, not internal engineering modules:
- ❌ **Engineering Parent:** `Database & S3 Infrastructure` $\rightarrow$ `Child: Automated Backups`
- ✅ **Consumer Parent:** `Data Safety & Peace of Mind` $\rightarrow$ `Child: Hourly Cloud Backups`

---

## 📋 Recommended Hierarchical Schema

```yaml
root_scope: "Digital Notary Platform"
description: "Hierarchical capability registry decomposed into customer-facing domains."

domains:
  - id: DOM-01
    name: "Legal Compliance & Security"
    icon: "🛡️"
    consumer_benefit: "Ensure every transaction is audit-ready and tamper-proof."
    
    capabilities:
      - id: CAP-011
        name: "Tamper-Evident Audit Certificate"
        description: "Generates a cryptographically signed PDF summary of all signer events."
        why_it_matters: "Proof of integrity for court disputes"
        status:
          our_app: true
          competitor_a: true
        references:
          - source: "CompetitorA Compliance Guide"
            url: "https://competitor.com/compliance"
            quote: "Every completed packet includes an audit certificate."

      - id: CAP-012
        name: "Biometric Signer Verification"
        description: "Validates signer identity via government ID scan and selfie match."
        why_it_matters: "Prevent identity fraud on high-value deals"
        status:
          our_app: false
          competitor_a: true
        references:
          - source: "CompetitorA Feature Page"
            url: "https://competitor.com/id-verify"
            quote: "Verify signers in real time with biometric ID checking."

  - id: DOM-02
    name: "Signing Experience & Speed"
    icon: "⚡"
    consumer_benefit: "Close agreements in minutes without friction or login requirements."
    capabilities:
      - id: CAP-021
        name: "Instant Mobile In-Person Signing"
        description: "Hand a tablet or phone to signers for immediate signature capture."
        why_it_matters: "Hand over your phone or tablet on-site"
        status:
          our_app: true
          competitor_a: false
        references: []
```

---

## 🎨 Consumer Presentation: Tables & Accordions

### 🛡️ Legal Compliance & Security
*Ensure every transaction is audit-ready and legally defensible.*

| Capability | Our App | Competitor A | Why It Matters | Evidence |
| :--- | :---: | :---: | :--- | :--- |
| **Tamper-Evident Certificate** | ✅ | ✅ | Proof of integrity for court disputes | [CompA Docs ↗](https://example.com) |
| **Biometric ID Verification** | ❌ | ✅ | Prevent identity fraud on high-value deals | [CompA Docs ↗](https://example.com) |

---

### ⚡ Signing Experience & Speed
*Close agreements in minutes without friction.*

| Capability | Our App | Competitor A | Why It Matters | Evidence |
| :--- | :---: | :---: | :--- | :--- |
| **Instant In-Person Signing** | ✅ | ❌ | Hand over your phone or tablet on-site | — |

---

## 🛠️ CLI Toolkit Reference (`listorg`)

```bash
# Organize an unstructured flat list into a 2-tier JTBD hierarchy
listorg organize raw-items.txt --format md

# Audit an existing registry against Miller's 7±2, depth, and JTBD naming
listorg validate registry.yaml

# Render to consumer markdown or interactive HTML accordion
listorg render registry.yaml --format md
listorg render registry.yaml --format html --out matrix.html

# Compute domain-level coverage and head-to-head metrics
listorg rollup registry.yaml

# Generate Wei et al. (2024) sibling-aware prompts for an AI agent
listorg prompt registry.yaml --domain "Signing Experience & Speed"

# Print starter schema template
listorg template
```
