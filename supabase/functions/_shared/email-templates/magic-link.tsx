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

interface MagicLinkEmailProps {
  siteName: string
  siteUrl?: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteUrl = 'https://alamocitydesigns.com',
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your secure sign-in link</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brandMark}>EMILY RUSSELL</Text>
          <Text style={brandTagline}>REALTOR® · San Antonio, TX</Text>
        </Section>
        <Hr style={hr} />
        <Heading style={h1}>Your sign-in link</Heading>
        <Text style={text}>
          Click below to sign in to your client portal. For your security, this link will expire shortly.
        </Text>
        <Section style={buttonWrap}>
          <Button style={button} href={confirmationUrl}>
            Sign In
          </Button>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          If you didn't request this link, you can safely ignore this email.
        </Text>
        <Text style={footer}>
          Emily Russell, REALTOR® · TREC #791742 · Fathom Realty<br />
          <Link href={siteUrl} style={footerLink}>alamocitydesigns.com</Link> · (210) 912-0806
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

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
const buttonWrap = { textAlign: 'center' as const, margin: '8px 0 28px' }
const button = {
  backgroundColor: 'hsl(27, 35%, 59%)', color: '#ffffff',
  fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase' as const,
  borderRadius: '0px', padding: '14px 32px', textDecoration: 'none', fontWeight: 500 as const,
}
const footer = { fontSize: '12px', color: 'hsl(0, 0%, 33%)', lineHeight: '1.5', margin: '12px 0 0' }
const footerLink = { color: 'hsl(27, 32%, 50%)', textDecoration: 'underline' }
