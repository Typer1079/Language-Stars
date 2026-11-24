/**
 * Terms of Use (end-user license) and Privacy Policy, written for a family learning app used by
 * children under a parent's account: U.S. COPPA, Apple App Store minimum EULA terms and the
 * App Store Kids Category rules (no ads, no third-party analytics, no data selling).
 *
 * Raise TERMS_VERSION whenever the text changes in a way people should re-accept: everyone is
 * asked to accept the new version at their next sign-in.
 */
export const TERMS_VERSION = '2026-11-24'
export const APP_NAME = 'Language Stars'
/** Who parents contact about their child's information. Change this if you want a different address. */
export const CONTACT_EMAIL = 'typer1079@gmail.com'
export const OPERATOR = 'the Language Stars administrator'
export const GOVERNING_LAW = 'the State of Texas, United States'

export interface LegalSection { heading: string; body: string[] }
export interface LegalDoc { title: string; updated: string; intro: string; sections: LegalSection[] }

export const TERMS: LegalDoc = {
  title: 'Terms of Use (End-User License Agreement)',
  updated: TERMS_VERSION,
  intro: `These Terms are an agreement between you (the account holder) and ${OPERATOR} ("we", "us") for using ${APP_NAME} on the web or as an installed app. By creating an account, or by tapping "I agree", you accept these Terms and our Privacy Policy.`,
  sections: [
    { heading: '1. Who can have an account', body: [
      'You must be 18 or older to create and hold an account.',
      'Children may use the app only through a learner profile that a parent or legal guardian creates and manages on their own account. Children may not create accounts.',
      'By adding a child\'s learner profile, you confirm that you are that child\'s parent or legal guardian (or have their permission) and that you consent to the collection and use of the child\'s information described in the Privacy Policy.',
    ] },
    { heading: '2. Your license', body: [
      `We grant you a personal, limited, non-exclusive, non-transferable, revocable license to use ${APP_NAME} for your family's private, non-commercial learning, on devices you own or control.`,
      'You may not copy, resell, rent, reverse engineer or redistribute the app or its word lists, or use it to build a competing product, except where the law allows it.',
    ] },
    { heading: '3. Learner devices', body: [
      'A parent may link a child\'s own phone or tablet to that child\'s learner profile with a one-time code. The child never gives an email, phone number or password. A linked device can only practice as that learner; it cannot see other learners, change the profile, or reach the parent\'s account.',
      'You are responsible for the devices you link. Unlink a device at any time from ✏️ Edit on the learner\'s card; a lost device should be unlinked right away.',
    ] },
    { heading: '3a. Your responsibilities', body: [
      'Keep your password, Face ID / passkey and authenticator safe; you are responsible for activity on your account.',
      'Supervise children\'s use. Use first names or nicknames only for learner profiles; don\'t enter last names, addresses, school names or other contact information.',
      'Don\'t misuse the service: no attempts to access other accounts, overload or attack the service, or bypass its security.',
    ] },
    { heading: '4. Children and safety', body: [
      'There is no advertising, no in-app purchases, no chat or messaging between users, and no links that take a child out of the app without a parent.',
      'World rankings never show anyone\'s name: other learners appear under made-up codenames.',
      'Stars and stickers are rewards inside the app only. They have no cash value and can\'t be bought, sold or transferred.',
    ] },
    { heading: '5. Account suspension and closure', body: [
      'We may sign out, suspend or archive an account that breaks these Terms, puts a child at risk, or threatens the security of the service. Archived accounts can\'t sign in or see their data; we can restore them.',
      `You can delete a learner profile at any time (Account → Delete a learner), and ask us to delete your whole account by emailing ${CONTACT_EMAIL}.`,
      'Accounts with no activity for 90 days are archived automatically for safety. Nothing is deleted; the account holder can reopen it by confirming their identity (emailed sign-in link, Face ID or authenticator code).',
    ] },
    { heading: '6. Changes', body: [
      'We may update the app and these Terms. If the Terms change in a meaningful way, we\'ll ask you to accept the new version the next time you sign in. If you don\'t accept, stop using the app and ask us to delete your account.',
    ] },
    { heading: '7. Disclaimer and limitation of liability', body: [
      `${APP_NAME} is provided "as is" and "as available", without warranties of any kind, to the fullest extent the law allows. Grade levels and rankings are a guide, not an educational assessment.`,
      'To the fullest extent the law allows, we are not liable for indirect, incidental or consequential damages, or for loss of data. Some places don\'t allow these limits, so they may not apply to you.',
    ] },
    { heading: '8. Apple App Store terms', body: [
      'If you got the app from Apple\'s App Store: these Terms are between you and us, not Apple. Apple is not responsible for the app or its content.',
      'Your license is also limited to Apple-branded devices you own or control, as allowed by the App Store Usage Rules.',
      'Apple has no obligation to provide maintenance or support for the app. If the app fails to meet a warranty that applies, you may notify Apple for a refund of the purchase price (if any); otherwise Apple has no warranty obligation.',
      'We, not Apple, are responsible for any claims about the app (product liability, legal or regulatory compliance, consumer protection or privacy laws) and for any claim that the app infringes someone\'s intellectual property.',
      'You confirm you are not in a country under a U.S. Government embargo or listed as a terrorist-supporting country, and not on any U.S. Government list of prohibited or restricted parties.',
      'You must follow any third-party terms that apply when using the app (for example, your internet provider\'s).',
      'Apple and its subsidiaries are third-party beneficiaries of these Terms and may enforce them against you.',
    ] },
    { heading: '9. Law and contact', body: [
      `These Terms are governed by the laws of ${GOVERNING_LAW}, without regard to conflict-of-law rules.`,
      `Questions, complaints or claims: ${CONTACT_EMAIL}.`,
    ] },
  ],
}

export const PRIVACY: LegalDoc = {
  title: 'Privacy Policy (including our notice to parents)',
  updated: TERMS_VERSION,
  intro: `${APP_NAME} is a family learning app. A parent or guardian holds the account and manages any child's learner profile. We collect only what the app needs to work, we never sell or share personal information for advertising, and we follow the U.S. Children's Online Privacy Protection Act (COPPA).`,
  sections: [
    { heading: 'What we collect', body: [
      'From the account holder (an adult): email address, password (stored only as a secure hash by our sign-in provider), sign-in method details (Face ID / passkey, authenticator), and the date you accepted these terms.',
      'For each learner profile, entered by the parent: a first name or nickname, an age group, a chosen avatar emoji and sticker style.',
      'Learning activity: levels, stars, stickers, words practiced, answers to meaning questions, and per-round totals (items tried, items on your own, minutes). We don\'t collect last names, birthdays, photos, location, contacts or device identifiers.',
    ] },
    { heading: 'Voice and microphone', body: [
      'The app listens to the microphone only while practicing, to hear words and spellings. We never record or store audio.',
      'Speech is turned into text by your device\'s or browser\'s built-in speech service (for example Apple\'s on iPhone, iPad and Safari, or Google\'s in Chrome). That service may process the audio on its own servers under its own privacy policy. Only the resulting text is used by the app, and only to check the answer; it is not saved except in a short on-screen log that stays on the device.',
    ] },
    { heading: 'How we use it', body: [
      'To run the app: sign you in, save progress, pick the next words, show progress graphs, and keep the account secure (for example, an activity log of changes).',
      'World rankings use the numbers only (levels, stars, minutes). Other people never see a learner\'s name, avatar or account; everyone appears under a made-up codename.',
      'The administrator can see account emails, learner first names and progress to run and secure the service. Every administrator view and action is logged.',
    ] },
    { heading: 'What we don\'t do', body: [
      'No advertising, no ad tracking, no third-party analytics, no selling or renting of information, no behavioral profiles, and no contact with children by email or messages.',
    ] },
    { heading: 'Who processes data for us', body: [
      'Supabase (database and sign-in) stores the information above on our behalf, under contract and security controls. GitHub Pages hosts the app\'s files. Neither may use your information for its own purposes.',
    ] },
    { heading: 'Parental consent and rights (COPPA)', body: [
      'Only an adult account holder can add a child\'s profile, and adding one requires two-step sign-in (Face ID / passkey or an authenticator code). By adding a child, the parent gives consent to the collection described here.',
      `Parents can review a child's information (Progress and Account screens), change it (Edit), download it (Account → backup), delete a child's profile (Account → Delete a learner), or refuse further collection by deleting the profile. To have the whole account deleted, email ${CONTACT_EMAIL}; we'll delete it within 30 days.`,
      'We won\'t require a child to give more information than needed to use the app.',
    ] },
    { heading: 'Learner devices', body: [
      'When a parent links a child\'s own device, that device signs in without any personal information (no email, phone number or password); it gets a random identifier only. It can read and update only that child\'s progress, stickers and settings for today\'s subject, and is listed for the parent, who can unlink it at any time. Unlinking deletes the device\'s sign-in.',
    ] },
    { heading: 'How long we keep it', body: [
      'Account and learner data: until you delete it or ask us to. Practice history: up to 2 years. Security activity logs: 1 year. Accounts with no activity for 90 days are archived automatically and need the account holder to confirm their identity to reopen. Archived accounts are kept so they can be restored, unless you ask for deletion.',
    ] },
    { heading: 'Security', body: [
      'Encrypted connections, row-level database security so each family can only reach its own data, two-step sign-in for children\'s profiles, automatic sign-out after inactivity, and an audit log. No system is perfectly secure; tell us right away if you think your account was misused.',
    ] },
    { heading: 'Changes and contact', body: [
      'If we change this policy in a meaningful way, we\'ll ask you to accept the new version at your next sign-in before any new kind of information is collected.',
      `Operator: ${OPERATOR}. Contact: ${CONTACT_EMAIL}.`,
    ] },
  ],
}
