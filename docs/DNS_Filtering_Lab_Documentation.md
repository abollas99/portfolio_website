# Home DNS Filtering Server (Retired)

**Author:** Anthony Bollas
**Contact:** bollascareer@gmail.com | anthonybollas.com
**Stack:** Raspberry Pi 5 (8GB) · Pi-hole · Linux
**Status:** Decommissioned — built and run as a hands-on experiment, since retired

---

## Overview

This project deployed a dedicated DNS filtering server on a Raspberry Pi 5 (8GB) running Pi-hole, used to block ads, trackers, and known malicious/phishing domains at the network level before they ever reached client devices. Rather than relying on browser extensions or per-device filtering, DNS-level filtering meant every device on the network — phones, laptops, IoT devices — benefited from the same protection with zero client-side configuration.

The project was run as a hands-on experiment to gain practical experience with DNS infrastructure and network-wide security filtering, and was later decommissioned once its purpose — learning the deployment and operational model — was accomplished.

---

## Deployment

| Component | Detail |
|---|---|
| Hardware | Raspberry Pi 5, 8GB RAM |
| Software | Pi-hole (DNS sinkhole), Linux |
| Network Role | Static IP, assigned as the DNS resolver via DHCP |
| Coverage | Served all VLANs (Primary, IoT, Server, Printer) — intentionally excluded from Guest to avoid any dependency between visitor traffic and internal infrastructure |

Deploying with a static IP ensured the DNS server's address never changed, so DHCP-assigned clients across the network could reliably resolve through it without reconfiguration after a reboot or lease renewal.

## Filtering

- Used curated blocklists to filter DNS requests for advertising and tracking domains, reducing ad load and cross-site tracking network-wide.
- Also filtered known malicious and phishing domains, blocking resolution at the DNS layer before a client could ever connect to a flagged host — a lightweight but effective first line of defense against malware callbacks and phishing links.
- Guest VLAN was deliberately excluded from this DNS server, keeping visitor traffic isolated from internal infrastructure regardless of filtering benefits.

---

## Why It Was Retired

This was run as a scoped learning exercise to understand DNS-level filtering and network-wide ad/threat blocking in practice. Once that goal was met, the project was decommissioned to focus on other infrastructure work (VLAN segmentation, Active Directory, FortiGate IDS/IPS). The underlying skills — DNS architecture, network-wide service deployment, and blocklist-based filtering — carried forward directly into later projects.

## Skills Demonstrated

- DNS server deployment and configuration (Pi-hole)
- Network-wide service design with static IP addressing and DHCP integration
- Blocklist-based threat and ad/tracker filtering
- Scoping a project intentionally and knowing when to sunset it

---

*This project was part of an ongoing series of home infrastructure work, alongside the [Active Directory Lab](./AD_Security_Lab_Documentation.md) and the [Small Enterprise Network Lab](./Network_Lab_Documentation.md). Full write-ups at [anthonybollas.com](https://anthonybollas.com).*
