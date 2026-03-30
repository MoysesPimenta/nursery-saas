# Nursery-SaaS Security Whitepaper

## Executive Summary

This whitepaper documents the comprehensive security architecture and practices implemented in the Nursery-SaaS platform. The system is designed to protect sensitive childcare data, comply with privacy regulations, and provide secure access control for staff and parents.

**Key Security Principles:**
- Defense in depth with multiple layers of protection
- Zero-trust model for all external access
- Encryption for data at rest and in transit
- Role-based access control with least privilege
- Complete audit trail for compliance
- Regular security assessments and updates

---

## 1. Overview

### Purpose

Nursery-SaaS manages sensitive information including:
- Children's personal data (names, birthdates, photos)
- Health and allergy information
- Parent contact details and authorization
- Employee information and schedules
- Financial records and parent billing
- Incident reports and daily activity logs

### Regulatory Compliance

The system is designed to comply with:
- GDPR (General Data Protection Regulation)
- CCPA (California Consumer Privacy Act)
- COPPA (Children's Online Privacy Protection Act)
- SOC 2 Type II standards
- State-specific childcare regulations

### Security Goals

1. **Confidentiality** - Only authorized users access data
2. **Integrity** - Data remains accurate and unmodified
3. **Availability** - System remains operational 99.9% uptime
4. **Auditability** - All actions are logged and traceable
5. **Compliance** - Meet regulatory requirements

---

## 2. Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                     Client Layer                         │
│        (Next.js Frontend via Vercel CDN)                 │
└────────────────────┬────────────────────────────────────┘
                     │
    ┌────────────────┴────────────────┐
    │                                  │
┌───▼──────────────┐        ┌─────────▼──────────┐
│  Cloudflare      │        │   API Requests     │
│  (WAF/DDoS/DNS)  │        │   (HTTPS/TLS 1.2)  │
└───┬──────────────┘        └─────────┬──────────┘
    │                                  │
    └────────────────┬─────────────────┘
                     │
         ┌───────────▼──────────┐
         │  Supabase Backend    │
         │  - Auth Layer        │
         │  - PostgreSQL DB     │
         │  - RLS Policies      │
         │  - Storage Buckets   │
         └───────────┬──────────┘
                     │
         ┌───────────▼──────────┐
         │  AWS Backup/Storage  │
         │  - S3 Backups        │
         │  - Encrypted Storage │
         │  - State Management  │
         └──────────────────────┘
```

### Security Layers

1. **Perimeter Security** - Cloudflare WAF, DDoS protection, rate limiting
2. **Transport Security** - TLS 1.2+, HTTPS enforcement, HSTS headers
3. **Authentication** - Supabase Auth, JWT tokens, MFA support
4. **Authorization** - Row-Level Security, role-based access control
5. **Data Protection** - Encryption at rest, field-level encryption for PII
6. **Monitoring** - Audit logs, anomaly detection, alerting

---

## 3. Authentication & Authorization

### Authentication Methods

#### Email/Password Authentication
- Password requirements: Minimum 12 characters, mixed case, numbers, symbols
- Password hashing: bcrypt with salt rounds
- Account lockout after 5 failed attempts (15 minute cooldown)
- Password reset via secure email token (expires in 1 hour)

#### Multi-Factor Authentication (MFA)
- TOTP (Time-based One-Time Password) using authenticator apps
- Backup codes for account recovery
- Mandatory for admin accounts, optional for other users
- Implementation via Supabase Auth

#### OAuth 2.0 / Social Login
- Google OAuth for employee sign-up
- Apple ID for parent app access (iOS)
- OIDC compliant providers

### JWT Token Management

**Token Structure:**
```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "tenant_id": "tenant-uuid",
  "role": "staff",
  "permissions": ["view_children", "edit_attendance"],
  "iat": 1234567890,
  "exp": 1234571490
}
```

**Token Security:**
- Signed with RS256 (RSA) using private key
- Short-lived access tokens (15 minutes)
- Refresh tokens stored securely (7 days)
- Token revocation on logout
- Secure HttpOnly cookies for token storage

### Role-Based Access Control (RBAC)

**Default Roles:**
- **Super Admin** - System-wide administration
- **Tenant Admin** - Facility administrator
- **Director** - Facility leadership
- **Lead Teacher** - Classroom management
- **Assistant Teacher** - Support staff
- **Parent** - View child's information
- **Guardian** - Authorized pickup/medical

**Permission Model:**
```
Roles
├── Super Admin
├── Tenant Admin
├── Director
├── Lead Teacher
├── Assistant Teacher
├── Parent
└── Guardian

Permissions (assigned to roles)
├── view_children
├── edit_children
├── view_employees
├── manage_attendance
├── manage_medications
├── manage_billing
└── view_reports
```

### Row-Level Security (RLS)

All tables enforce RLS policies isolating data by tenant_id:

```sql
-- Example: Children table RLS policy
CREATE POLICY tenant_isolation ON children
  USING (tenant_id = auth.jwt()->'tenant_id'::text);

-- Only users in the same tenant can see children
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
```

---

## 4. Data Protection

### Encryption at Rest

**Database Encryption:**
- Supabase PostgreSQL with encrypted volumes
- AES-256 encryption for database storage
- Encrypted backups in S3

**Sensitive Field Encryption:**
- Social Security Numbers (encrypted)
- Health information (encrypted)
- Parent payment information (tokenized via Stripe)
- Child photos (encrypted in storage)

**Key Management:**
- Encryption keys stored in AWS Secrets Manager
- Key rotation policy: Annual review
- Separate keys per environment
- No hardcoded keys in code

### Encryption in Transit

**HTTPS/TLS:**
- TLS 1.2 minimum (prefer TLS 1.3)
- Strong cipher suites only
- HSTS header (max-age: 31536000, includeSubDomains)
- Certificate pinning for critical APIs
- Cloudflare SSL/TLS strict mode

**Certificate Management:**
- Automatic renewal via Cloudflare
- Certificate transparency logging
- Regular certificate audits

### Data Minimization

**Collection Principles:**
- Only collect data necessary for operations
- Obtain explicit consent for optional data
- Provide data export/deletion capabilities

**Retention Policy:**
- Active children data: Retained for account lifetime + 7 years
- Inactive accounts: Deleted after 2 years inactivity
- Audit logs: Retained for 7 years minimum
- Backups: Retained per regulatory requirements

---

## 5. Audit Logging

### Logged Events

All sensitive operations are logged:

```json
{
  "timestamp": "2026-03-30T14:23:45Z",
  "event_type": "child_medical_update",
  "user_id": "user-123",
  "tenant_id": "tenant-456",
  "resource_type": "child",
  "resource_id": "child-789",
  "action": "update",
  "changes": {
    "allergies": ["added: peanut allergy"]
  },
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "status": "success"
}
```

### Log Protection

- Immutable logs stored in database
- Separate log retention schema
- Encrypted log transmission
- Access control on log viewing
- Archival to S3 for long-term retention

### Compliance Reports

Logs support generation of:
- User access reports
- Data modification reports
- Failed login attempts
- Permission changes
- Document access tracking

---

## 6. Compliance

### GDPR Compliance

**Lawful Basis:** Contractual necessity and legitimate interests
- Data processing addendum in place
- Privacy policy aligned with GDPR
- Consent management for optional data
- Data subject rights: Access, rectification, erasure, portability

**Data Subject Rights:**
- Right to access personal data
- Right to correction/update
- Right to erasure ("right to be forgotten")
- Right to data portability
- Right to object to processing

### CCPA Compliance

**Consumer Rights:**
- Right to know what data is collected
- Right to delete personal information
- Right to opt-out of data selling
- Right to non-discrimination for exercising rights

**Policies:**
- Privacy notice at point of collection
- Opt-out mechanisms for data sharing
- Annual privacy audit

### COPPA Compliance

**Children's Data Protection:**
- Parental consent for children under 13
- Limited data collection from children
- No behavioral advertising
- Reasonable security measures
- Annual compliance assessment

---

## 7. Incident Response

### Incident Classification

| Severity | Definition | Response Time |
|----------|-----------|---|
| Critical | Data breach, system unavailable | 1 hour |
| High | Unauthorized access, data integrity | 4 hours |
| Medium | Configuration issue, minor breach | 24 hours |
| Low | Non-critical vulnerability | 1 week |

### Response Procedures

1. **Detection** - Automated alerts, user reports
2. **Assessment** - Determine scope and impact
3. **Containment** - Isolate affected systems
4. **Eradication** - Remove root cause
5. **Recovery** - Restore normal operations
6. **Post-Incident** - Root cause analysis, improvements

### Notification Requirements

- User notification for data breaches (within 48 hours)
- Regulatory notification as required by law
- Customer notification within 24 hours
- Public disclosure if applicable

---

## 8. Third-Party Security

### Vendor Assessment

All vendors are assessed for:
- SOC 2 compliance
- Security certifications
- Data handling practices
- Incident history
- Financial stability

### API Integration Security

**Webhook Validation:**
- HMAC-SHA256 signatures on all webhooks
- Timestamp verification (within 5 minutes)
- IP whitelisting where available
- Request/response encryption

**API Keys:**
- Separate anon keys (public, limited scope)
- Service role keys (private, full scope)
- Key rotation every 90 days
- Revocation on employee departure

---

## 9. Security Operations

### Vulnerability Management

**Scanning:**
- Weekly dependency scanning (Snyk, Dependabot)
- Monthly security audits
- Annual penetration testing
- OWASP Top 10 compliance

**Patch Management:**
- Critical patches: Deploy within 24 hours
- High priority: Deploy within 1 week
- Regular patches: Monthly cycle

### Monitoring & Alerting

**Metrics:**
- Failed login attempts
- Unusual data access patterns
- API error rates
- Database query performance
- Storage utilization
- Backup success/failure

**Alerts:**
- Threshold-based alerts
- Anomaly detection
- Escalation procedures
- PagerDuty integration

### Disaster Recovery

**Backup Strategy:**
- Automated daily backups
- Point-in-time recovery capability
- Geo-redundant backup storage
- Regular recovery drills (quarterly)

**RTO/RPO Targets:**
- Recovery Time Objective (RTO): 4 hours
- Recovery Point Objective (RPO): 1 hour

---

## 10. Security Training

### Employee Training

- Annual security awareness training
- OWASP Top 10 training
- Data handling procedures
- Incident response procedures
- Phishing simulation quarterly

### Code Review

- Security-focused code reviews
- SAST (Static Application Security Testing)
- DAST (Dynamic Application Security Testing)
- Dependency analysis

---

## Appendix: Security Checklist

### Before Production Deployment

- [ ] All HTTPS endpoints active
- [ ] RLS policies enabled on all tables
- [ ] MFA configured for admin users
- [ ] Audit logging operational
- [ ] Backups tested and working
- [ ] DDoS protection active
- [ ] WAF rules deployed
- [ ] Secrets not in code repository
- [ ] API keys rotated
- [ ] Third-party integrations validated

### Ongoing Operations

- [ ] Weekly vulnerability scans
- [ ] Monthly security audits
- [ ] Quarterly recovery drills
- [ ] Quarterly phishing simulations
- [ ] Annual penetration testing
- [ ] Annual policy review

---

## Document Version

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-30 | Security Team | Initial draft |

## Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Security Lead | TBD | TBD | TBD |
| CTO | TBD | TBD | TBD |
| Compliance Officer | TBD | TBD | TBD |
