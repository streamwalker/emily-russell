/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  siteUrl?: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteUrl = 'https://alamocitydesigns.com',
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email change</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brandMark}>EMILY RUSSELL</Text>
          <Text style={brandTagline}>REALTOR® · San Antonio, TX</Text>
        </Section>
        <Hr style={hr} />
        <Heading style={h1}>Confirm your email change</Heading>
        <Text style={text}>
          You requested to change the email on your client portal account from{' '}
          <strong style={emphasis}>{email}</strong> to <strong style={emphasis}>{newEmail}</strong>.
        </Text>
        <Section style={buttonWrap}>
          <Button style={button} href={confirmationUrl}>
            Confirm Email Change
          </Button>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          If you didn't request this change, please secure your account immediately by resetting your password.
        </Text>
        <Text style={footer}>
          Emily Russell, REALTOR® · TREC #791742 · Fathom Realty<br />
          <Link href={siteUrl} style={footerLink}>alamocitydesigns.com</Link> · (210) 912-0806
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Helvetica, Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '560px' }
const header = { textAlign: 'center' as const, padding: '8px 0 16px' }
const brandMark = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: '28px', fontWeight: 600 as const, letterSpacing: '4px',
  color: 'hsl(0, 0%, 11%)', margin: '0',
}
const brandTagline = {
  fontSize: '11px', letterSpacing: '2px',
  color: 'hsl(27, 32%, 50%)', margin: '6px 0 0',
}
const hr = { borderTop: '1px solid hsl(30, 14%, 85%)', margin: '20px 0' }
const h1 = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: '24px', fontWeight: 500 as const,
  color: 'hsl(0, 0%, 11%)', margin: '12px 0 18px',
}
const text = { fontSize: '15px', color: 'hsl(0, 0%, 33%)', lineHeight: '1.6', margin: '0 0 18px' }
const emphasis = { color: 'hsl(0, 0%, 11%)' }
const buttonWrap = { textAlign: 'center' as const, margin: '8px 0 28px' }
const button = {
  backgroundColor: 'hsl(27, 35%, 59%)', color: '#ffffff',
  fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase' as const,
  borderRadius: '0px', padding: '14px 32px', textDecoration: 'none', fontWeight: 500 as const,
}
const footer = { fontSize: '12px', color: 'hsl(0, 0%, 33%)', lineHeight: '1.5', margin: '12px 0 0' }
const footerLink = { color: 'hsl(27, 32%, 50%)', textDecoration: 'underline' }
