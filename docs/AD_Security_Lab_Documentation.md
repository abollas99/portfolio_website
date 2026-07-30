# Active Directory Lab

**Author:** Anthony Bollas
**Contact:** bollascareer@gmail.com | anthonybollas.com
**Stack:** Windows Server 2025 · Active Directory Domain Services · Hyper-V · OpenVPN/PKI

---

## Overview

This lab is a self-directed enterprise IT environment built to gain hands-on experience with the tools and workflows used by real-world systems administrators — Active Directory domain deployment, Group Policy management, file share services, and virtualized infrastructure. The goal was to replicate the core responsibilities of an enterprise AD admin role in a controlled environment, as preparation for full-time IT/systems administration work.

The lab runs on a single physical host (a Lenovo ThinkCentre Neo 50q Gen 4, 32GB RAM) hosting Windows Server 2025 (Evaluation) as the domain controller, with Hyper-V used to run additional virtual machines. A companion offensive-security lab, using this same domain as the target environment, is documented separately.

---

## Environment

| Component | Detail |
|---|---|
| Host hardware | Lenovo ThinkCentre Neo 50q Gen 4 (Mini PC), 32GB RAM |
| Operating System | Windows Server 2025 (Evaluation), bare metal |
| Domain | `bollas.local` |
| Virtualization | Hyper-V (running on the same host as the domain controller) |
| Client | Custom-built desktop PC, Windows 11 Pro, domain-joined |
| Remote Access | OpenVPN server with PKI-based certificate authentication |

---

## Active Directory Domain Services

- Deployed the AD DS role on Windows Server 2025 and promoted the server to a domain controller for the `bollas.local` domain.
- Built out a flat directory structure with a small set of test user accounts and security groups to validate authentication, group membership, and permission inheritance without the overhead of a full department-based OU design — appropriate for a single-DC lab environment.
- Domain-joined a custom-built desktop PC running Windows 11 Pro to `bollas.local`, replicating a real endpoint enrollment scenario (DNS resolution to the DC, machine account creation, and initial policy application) using self-built hardware rather than a pre-configured machine.

## Group Policy (GPOs)

Configured and applied Group Policy Objects to the domain to manage the client environment centrally, rather than through local configuration — the standard model for enterprise endpoint management. Verified that policy changes correctly propagated to the domain-joined client on the next Group Policy refresh cycle.

GPOs implemented:
- **Password Policy** — enforced minimum length, complexity, and maximum age at the domain level
- **Account Lockout Policy** — set lockout threshold and duration to protect against brute-force logon attempts
- **Interactive Logon / Machine Inactivity Limit** — enforced automatic screen lock after a period of inactivity
- **Restricted Groups** — limited local Administrators group membership on the client to domain-approved accounts only
- **Folder Redirection** — redirected the client's Documents/Desktop to the domain file share, tying endpoint policy to centralized storage
- **Audit Policy** — enabled logon/logoff and object access auditing for visibility into domain activity

*(Note: mark which of these you've actually applied vs. still planning — I can split this into "Implemented" and "Planned" if that's more accurate.)*

## File Share Services

- Deployed file share services on the domain controller to support centralized file storage and access for the domain, mirroring how file shares are typically provisioned and permissioned in a production AD environment.

*(Note: if you configured NTFS + share-level permissions tied to specific security groups, that's worth a line — it's a very commonly interviewed AD topic.)*

## Virtualization (Hyper-V)

- Enabled and configured Hyper-V on the domain controller host to run additional virtual machines alongside the physical DC, without requiring separate hardware.
- This setup allows the lab to expand (additional domain-joined VMs, test servers, a dedicated offensive-security VM, etc.) without new physical infrastructure.

## Remote Access (OpenVPN / PKI)

- Deployed an OpenVPN server on the lab network with a full PKI configuration (custom Certificate Authority, server and client certificates) rather than pre-shared key authentication — replicating how secure remote access is typically implemented in production.
- This provides secure remote access into the AD domain and Hyper-V infrastructure from any location, without exposing internal services directly to the internet.

*(Note: if you want to name the CA tool — easy-rsa, OpenSSL, etc. — or describe the cert issuance process briefly, that adds good technical detail.)*

---

## Skills Demonstrated

- Active Directory Domain Services deployment and administration
- Group Policy Object creation and management
- Windows Server 2025 (bare-metal) installation and configuration
- Hyper-V virtualization
- File share deployment and permissions
- PKI certificate authority setup and OpenVPN deployment
- End-to-end enterprise network replication (DC → client → VPN)

## Next Steps

- Expand AD structure with department-style OUs and delegated administration to more closely mirror a multi-team organization.
- Document NTFS/share permission model in detail.
- Continue applying and validating additional GPOs as the domain grows.

---

*This lab is part of an ongoing series of home infrastructure projects, including a companion offensive-security lab targeting this domain from Kali Linux, a segmented VLAN network build, and a Pi-hole DNS server deployment. Full write-ups at [anthonybollas.com](https://anthonybollas.com).*
