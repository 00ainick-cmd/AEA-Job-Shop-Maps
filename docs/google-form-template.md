# AEA Member Shop Map - Google Form Template

Use this template to create a Google Form for collecting member shop data. Copy these questions into your Google Form.

---

## Form Title
**AEA Member Shop Directory & Job Board Submission**

## Form Description
Help job seekers find your shop! Complete this form to be listed on the AEA Member Shop Map. Your information will be visible to aviation technicians and job seekers looking for opportunities with AEA member companies.

---

## Section 1: Company Information

### Question 1: Company Name *
- Type: Short answer
- Required: Yes
- Example: "Duncan Aviation"

### Question 2: Company Type *
- Type: Dropdown
- Required: Yes
- Options:
  - MRO (Maintenance, Repair, Overhaul)
  - Repair Station
  - OEM (Original Equipment Manufacturer)
  - Dealer/Distributor

### Question 3: Street Address *
- Type: Short answer
- Required: Yes
- Example: "2000 S 16th St"

### Question 4: City *
- Type: Short answer
- Required: Yes

### Question 5: State/Province *
- Type: Short answer
- Required: Yes
- Example: "NE" or "BC"

### Question 6: ZIP/Postal Code *
- Type: Short answer
- Required: Yes

### Question 7: Nearest Airport Code
- Type: Short answer
- Required: No
- Description: "FAA identifier (e.g., LNK, TEB, CYPK)"

### Question 8: Year Joined AEA
- Type: Short answer
- Required: No
- Validation: Number
- Example: "1956"

---

## Section 2: Contact Information

### Question 9: Main Phone Number *
- Type: Short answer
- Required: Yes
- Example: "(402) 475-2611"

### Question 10: Email Address *
- Type: Short answer
- Required: Yes
- Validation: Email
- Description: "Primary contact or careers email"

### Question 11: Website
- Type: Short answer
- Required: No
- Description: "Company website URL"

### Question 12: Contact Person Name
- Type: Short answer
- Required: No
- Description: "HR contact or hiring manager name"

---

## Section 3: Hiring Information

### Question 13: Are you currently hiring? *
- Type: Multiple choice
- Required: Yes
- Options:
  - Yes
  - No

### Question 14: How many open positions do you have?
- Type: Short answer
- Required: No
- Validation: Number
- Description: "Only answer if currently hiring"

### Question 15: What positions are you hiring for?
- Type: Checkboxes
- Required: No
- Description: "Select all that apply"
- Options:
  - Avionics Technician
  - A&P Mechanic
  - Avionics Installer
  - Bench Technician
  - Inspector
  - Line Service Technician
  - Sheet Metal Technician
  - Composite Technician
  - Interior Technician
  - Project Manager
  - Systems Engineer
  - Quality Inspector
  - Other (please specify)

### Question 16: Minimum experience level required
- Type: Multiple choice
- Required: No
- Options:
  - Entry-level (no experience required)
  - 1-2 years
  - 3-5 years
  - 5+ years

### Question 17: Salary range (annual)
- Type: Multiple choice
- Required: No
- Description: "Optional - helps job seekers assess fit"
- Options:
  - $35,000 - $45,000
  - $45,000 - $55,000
  - $55,000 - $65,000
  - $65,000 - $75,000
  - $75,000 - $85,000
  - $85,000 - $100,000
  - $100,000+
  - Prefer not to disclose

### Question 18: Available shifts
- Type: Checkboxes
- Required: No
- Options:
  - Day shift
  - Night shift
  - Weekend shifts available

---

## Section 4: Benefits & Company Info

### Question 19: Benefits offered
- Type: Checkboxes
- Required: No
- Description: "Select all that apply"
- Options:
  - Health Insurance
  - 401(k) / Retirement Plan
  - Training Programs
  - Tuition Reimbursement
  - Relocation Assistance
  - Sign-on Bonus
  - Performance Bonus
  - Paid Time Off
  - Tool Allowance

### Question 20: Company size
- Type: Multiple choice
- Required: No
- Options:
  - Small (1-10 employees)
  - Medium (11-50 employees)
  - Large (50+ employees)

### Question 21: What aircraft/equipment does your shop specialize in?
- Type: Checkboxes
- Required: No
- Description: "Select all that apply"
- Options:
  - Garmin
  - Collins Aerospace
  - Honeywell
  - Avidyne
  - Aspen Avionics
  - Gulfstream
  - Falcon/Dassault
  - Challenger/Bombardier
  - Citation/Cessna
  - King Air/Beechcraft
  - Pilatus
  - Cirrus
  - Piper
  - Floatplanes
  - Helicopters
  - Other (please specify)

---

## Form Settings Recommendations

1. **Collect email addresses**: Yes (for follow-up)
2. **Allow response editing**: Yes
3. **Limit to 1 response**: No (allow updates)
4. **Confirmation message**: "Thank you! Your shop will be added to the AEA Member Shop Map within 5 business days."

---

## Exporting Data

1. Open the linked Google Sheet
2. File > Download > Comma Separated Values (.csv)
3. Rename columns to match expected format (see below)
4. Upload to the Admin page or run the processor script

### Column Mapping (Google Form Response → CSV Column)

| Form Question | CSV Column Name |
|--------------|-----------------|
| Company Name | name |
| Company Type | type |
| Street Address | address |
| City | city |
| State/Province | state |
| ZIP/Postal Code | zip |
| Main Phone Number | phone |
| Email Address | email |
| Website | website |
| Contact Person Name | contact |
| Nearest Airport Code | airport |
| Year Joined AEA | memberSince |
| Are you currently hiring? | hiring |
| How many open positions | openingsCount |
| What positions are you hiring for? | positionTypes |
| Minimum experience level | experienceLevel |
| Salary range | salaryRange |
| Available shifts | shifts |
| Benefits offered | benefits |
| Company size | companySize |
| Aircraft/equipment specializations | specializations |

**Note**: For checkbox questions, Google Forms outputs comma-separated values. The processor handles this automatically.

---

## Sample Email to Members

**Subject: Update Your Listing on the AEA Member Shop Map**

Dear AEA Member,

We're building an interactive map to help aviation technicians and job seekers find AEA member shops across North America. This is especially valuable for military members transitioning to civilian careers in avionics.

Please take 5 minutes to complete this form:
[INSERT GOOGLE FORM LINK]

Your listing will include:
- Company location on an interactive map
- Contact information for job seekers
- Current hiring status and open positions
- Benefits and specializations

The map will be available on aerocareers.net as a free resource for the aviation community.

Questions? Contact [YOUR EMAIL]

Thank you for your participation!

[YOUR NAME]
Aircraft Electronics Association
