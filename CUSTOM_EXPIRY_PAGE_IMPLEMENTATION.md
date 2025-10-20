# Custom Expiry Page Feature - Implementation Guide

## 🎯 Feature Overview

Custom branded pages shown when links expire, with email capture and Mailgun notification support.

## ✅ Completed Steps

### 1. Database Schema (Migration: 04_add_custom_expiry_pages.sql)
- ✅ Created `expiry_pages` table
- ✅ Created `expiry_page_emails` table for email captures
- ✅ Added `expiry_page_id` foreign key to `links` table
- ✅ Added indexes for performance

### 2. Entity Models
- ✅ Created `ExpiryPage.cs` entity
- ✅ Created `ExpiryPageEmail.cs` entity
- ✅ Updated `Link.cs` to include `ExpiryPageId` and navigation property
- ✅ Updated `User.cs` to include `ExpiryPages` collection
- ✅ Updated `AppDbContext.cs` with new DbSets and configurations

## 📋 Remaining Tasks

### 3. DTOs & API Layer
- [ ] Create ExpiryPage DTOs (Create, Update, Response)
- [ ] Create ExpiryPageController with CRUD endpoints
- [ ] Update LinkController to support expiry page assignment

### 4. Email Service (Mailgun)
- [ ] Create IEmailService interface
- [ ] Implement MailgunEmailService
- [ ] Add email templates for notifications
- [ ] Configure Mailgun settings in appsettings.json

### 5. Redirect Logic
- [ ] Update RedirectController to check for custom expiry page
- [ ] Create expiry page rendering endpoint/view
- [ ] Handle email capture submission

### 6. Frontend
- [ ] Create ExpiryPage types in TypeScript
- [ ] Add expiry page API client methods
- [ ] Create Expiry Page Editor component
- [ ] Create Expiry Page Preview component
- [ ] Update Link creation/edit form to select expiry page
- [ ] Create public expiry page view

## 🔧 Database Migration

Run this command to apply the schema:
```bash
psql -U postgres -d linkexpiry -f database/04_add_custom_expiry_pages.sql
```

## 📊 Database Schema

### expiry_pages
- id, user_id, name
- title, message, logo_url, background_color
- cta_button_text, cta_button_url, cta_button_color
- social_* (facebook, twitter, instagram, linkedin, website)
- custom_css, enable_email_capture, email_capture_text
- created_at, updated_at

### expiry_page_emails
- id, expiry_page_id, link_id, email
- captured_at, ip_hash, user_agent

### links (updated)
- Added: expiry_page_id (UUID, nullable, FK to expiry_pages)

## 🎨 Feature Capabilities

1. **Custom Branding**: Logo, colors, background
2. **Custom Messaging**: Title, message, CTA button
3. **Social Links**: Facebook, Twitter, Instagram, LinkedIn, Website
4. **Email Capture**: Optional form to collect visitor emails
5. **Email Notifications**: Via Mailgun when link expires
6. **Reusable Templates**: Create templates and reuse across links
7. **Advanced CSS**: Custom CSS for power users

## 📧 Mailgun Integration

Configuration in appsettings.json:
```json
"Mailgun": {
  "ApiKey": "your-mailgun-api-key",
  "Domain": "mg.yourdomain.com",
  "FromEmail": "noreply@yourdomain.com",
  "FromName": "LinkExpiry"
}
```

Email scenarios:
1. Link expiry notification to link owner
2. Email capture confirmation to visitor (optional)
3. Daily/weekly report of captured emails

## 🚀 Next Steps

1. Run database migration
2. Implement email service
3. Create API endpoints
4. Build frontend UI
5. Test end-to-end

