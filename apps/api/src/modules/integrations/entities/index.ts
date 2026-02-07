/**
 * Integrations Entities Index
 */

export * from "./google-oauth-account.entity";
export * from "./client-contact.entity";
// PartnerContact replaces VendorContact (unified partners module)
export { PartnerContact } from "../../partners/partner-contact.entity";
