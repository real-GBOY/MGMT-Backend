<!-- @format -->

# Security Guide - Enactus Management System

## Overview

This document outlines the comprehensive security measures implemented in the Enactus Management System to protect against various cyber threats and ensure data integrity.

## Security Layers

### 🔐 1. Authentication & Authorization

#### JWT Token Security

- **Algorithm**: HS256 (HMAC SHA-256)
- **Token Expiration**: 7 days (configurable)
- **Refresh Token**: 30 days (configurable)
- **Token Format Validation**: Regex pattern matching
- **Secure Storage**: HTTP-only cookies in production

#### Password Security

- **Hashing**: Bcrypt with 12 rounds
- **Minimum Length**: 8 characters
- **Requirements**: Uppercase, lowercase, numbers, special characters
- **Maximum Length**: 128 characters

#### Role-Based Access Control (RBAC)

- **Admin**: Full system access
- **TeamHead**: Team-specific access
- **TeamViceHead**: Team-specific access
- **Member**: Personal data access only

### 🛡️ 2. Input Validation & Sanitization

#### Input Sanitization

```javascript
// All inputs are automatically sanitized
- HTML escaping
- SQL injection prevention
- XSS protection
- Special character escaping
- Whitespace trimming
```

#### File Upload Security

- **Maximum File Size**: 10MB
- **Allowed MIME Types**: Images, PDFs, Office documents, text files
- **Virus Scanning**: Enabled (configurable)
- **Content Validation**: File header checking
- **Extension Validation**: Whitelist approach

#### Request Size Limiting

- **Maximum Request Size**: 50MB
- **Body Parser Limit**: 10MB
- **URL Encoded Limit**: 10MB

### 🚫 3. Rate Limiting

#### Global Rate Limiting

- **Window**: 15 minutes
- **Limit**: 100 requests per IP
- **Headers**: Standard rate limit headers

#### Authentication Rate Limiting

- **Window**: 15 minutes
- **Limit**: 5 login attempts per IP
- **Purpose**: Prevent brute force attacks

#### API Rate Limiting

- **Window**: 15 minutes
- **Limit**: 1000 requests per IP
- **Purpose**: Prevent API abuse

#### File Upload Rate Limiting

- **Window**: 1 hour
- **Limit**: 10 uploads per IP
- **Purpose**: Prevent storage abuse

### 🌐 4. CORS & Headers Security

#### CORS Configuration

```javascript
{
  origin: ['http://localhost:3000', 'https://yourdomain.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}
```

#### Security Headers

- **X-Content-Type-Options**: nosniff
- **X-Frame-Options**: DENY
- **X-XSS-Protection**: 1; mode=block
- **Referrer-Policy**: strict-origin-when-cross-origin
- **Permissions-Policy**: geolocation=(), microphone=(), camera=()
- **Content-Security-Policy**: Comprehensive CSP rules

### 🔍 5. Monitoring & Logging

#### Security Event Logging

- **Login Attempts**: All authentication attempts logged
- **File Uploads**: File upload activities tracked
- **Admin Actions**: All admin operations logged
- **Role Changes**: User role modifications tracked
- **Data Exports**: Export activities monitored

#### Access Logging

- **Request Logs**: All HTTP requests logged
- **Error Logs**: All errors with stack traces (development only)
- **Performance Logs**: Response times and resource usage

### 🚨 6. Threat Prevention

#### SQL Injection Prevention

- **MongoDB Sanitization**: Automatic NoSQL injection prevention
- **Input Validation**: SQL keyword detection
- **Parameterized Queries**: Mongoose ODM protection

#### XSS Protection

- **Input Sanitization**: HTML entity encoding
- **Output Encoding**: Automatic encoding of user data
- **CSP Headers**: Content Security Policy enforcement

#### CSRF Protection

- **SameSite Cookies**: Strict same-site policy
- **Token Validation**: JWT token verification
- **Origin Checking**: Request origin validation

## Environment Configuration

### Development Environment

```env
NODE_ENV=development
LOG_LEVEL=debug
SHOW_ERROR_DETAILS=true
DISABLE_RATE_LIMITING=false
```

### Production Environment

```env
NODE_ENV=production
LOG_LEVEL=warn
SHOW_ERROR_DETAILS=false
FORCE_HTTPS=true
ENABLE_COMPRESSION=true
```

### Required Environment Variables

```env
# Security
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# IP Blocking
BLOCKED_IPS=192.168.1.100,10.0.0.50

# Database
MONGODB_URI=mongodb://localhost:27017/enactus

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Security Best Practices

### 1. Password Management

- Use strong, unique passwords
- Enable password complexity requirements
- Implement password expiration policies
- Use secure password reset mechanisms

### 2. Session Management

- Implement session timeout
- Use secure session storage
- Enable session invalidation on logout
- Monitor for suspicious session activity

### 3. Data Protection

- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Implement data backup and recovery
- Regular security audits

### 4. Access Control

- Principle of least privilege
- Regular access reviews
- Implement multi-factor authentication
- Monitor privileged access

### 5. Incident Response

- Security incident response plan
- Regular security training
- Vulnerability management
- Security monitoring and alerting

## Security Testing

### Automated Security Tests

```bash
# Run security tests
npm run test:security

# Run vulnerability scan
npm run audit

# Check for outdated dependencies
npm outdated
```

### Manual Security Testing

1. **Authentication Testing**

   - Test login with invalid credentials
   - Test password reset functionality
   - Test session management

2. **Authorization Testing**

   - Test role-based access control
   - Test resource isolation
   - Test privilege escalation

3. **Input Validation Testing**

   - Test SQL injection attempts
   - Test XSS payloads
   - Test file upload security

4. **Rate Limiting Testing**
   - Test rate limit enforcement
   - Test rate limit bypass attempts
   - Test rate limit headers

## Security Monitoring

### Real-time Monitoring

- **Request Monitoring**: Track all incoming requests
- **Error Monitoring**: Monitor for security-related errors
- **Performance Monitoring**: Track response times and resource usage
- **User Activity Monitoring**: Monitor user behavior patterns

### Security Alerts

- **Failed Login Attempts**: Alert on multiple failed logins
- **Suspicious Activity**: Alert on unusual user behavior
- **System Errors**: Alert on security-related errors
- **Resource Usage**: Alert on high resource consumption

## Compliance & Standards

### OWASP Top 10 Protection

1. **Injection**: ✅ Protected by input validation and sanitization
2. **Broken Authentication**: ✅ Protected by JWT and rate limiting
3. **Sensitive Data Exposure**: ✅ Protected by encryption and secure headers
4. **XML External Entities**: ✅ Not applicable (no XML processing)
5. **Broken Access Control**: ✅ Protected by RBAC and resource isolation
6. **Security Misconfiguration**: ✅ Protected by secure defaults
7. **XSS**: ✅ Protected by input sanitization and CSP
8. **Insecure Deserialization**: ✅ Protected by JWT validation
9. **Using Components with Known Vulnerabilities**: ✅ Protected by dependency monitoring
10. **Insufficient Logging & Monitoring**: ✅ Protected by comprehensive logging

### GDPR Compliance

- **Data Minimization**: Only collect necessary data
- **Consent Management**: User consent tracking
- **Data Portability**: Export user data functionality
- **Right to be Forgotten**: User data deletion
- **Data Protection**: Encryption and access controls

## Security Checklist

### Pre-Deployment Checklist

- [ ] All security dependencies updated
- [ ] Environment variables configured
- [ ] SSL/TLS certificates installed
- [ ] Database security configured
- [ ] File upload security enabled
- [ ] Rate limiting configured
- [ ] CORS settings configured
- [ ] Security headers enabled
- [ ] Logging configured
- [ ] Monitoring enabled

### Post-Deployment Checklist

- [ ] Security tests passed
- [ ] Vulnerability scan completed
- [ ] Performance tests passed
- [ ] Backup system tested
- [ ] Monitoring alerts configured
- [ ] Incident response plan ready
- [ ] Security documentation updated
- [ ] Team security training completed

## Incident Response

### Security Incident Types

1. **Unauthorized Access**: Detect and block unauthorized access attempts
2. **Data Breach**: Identify and contain data breaches
3. **Malware Infection**: Detect and remove malware
4. **DDoS Attack**: Mitigate DDoS attacks
5. **Insider Threat**: Monitor for insider threats

### Response Procedures

1. **Detection**: Identify security incidents
2. **Assessment**: Evaluate incident severity
3. **Containment**: Isolate affected systems
4. **Eradication**: Remove threat sources
5. **Recovery**: Restore normal operations
6. **Lessons Learned**: Document and improve

## Security Tools & Resources

### Recommended Security Tools

- **OWASP ZAP**: Web application security scanner
- **Nmap**: Network security scanner
- **Wireshark**: Network protocol analyzer
- **Burp Suite**: Web application security testing
- **Metasploit**: Penetration testing framework

### Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [CIS Controls](https://www.cisecurity.org/controls/)
- [GDPR Guidelines](https://gdpr.eu/)

## Conclusion

The Enactus Management System implements comprehensive security measures to protect against various cyber threats. Regular security audits, monitoring, and updates are essential to maintain the security posture of the system.

For security-related questions or incidents, contact the security team immediately.
