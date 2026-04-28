/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
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

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brandMark}>EMILY RUSSELL</Text>
          <Text style={brandTagline}>REALTOR® · San Antonio, TX</Text>
        </Section>
        <Hr style={hr} />
        <Heading style={h1}>Confirm it's you</Heading>
        <Text style={text}>Use the code below to verify your identity:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Hr style={hr} />
        <Text style={footer}>
          This code will expire shortly. If you didn't request this, you can safely ignore this email.
        </Text>
        <Text style={footer}>
          Emily Russell, REALTOR® · TREC #791742 · Fathom Realty<br />
          <Link href="https://alamocitydesigns.com" style={footerLink}>alamocitydesigns.com</Link> · (210) 912-0806
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

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
const codeStyle = {
  fontFamily: "'Courier New', Courier, monospace",
  fontSize: '32px', fontWeight: 700 as const, letterSpacing: '8px',
  color: 'hsl(27, 32%, 50%)',
  textAlign: 'center' as const,
  padding: '16px',
  border: '1px solid hsl(30, 14%, 85%)',
  margin: '0 0 30px',
}
const footer = { fontSize: '12px', color: 'hsl(0, 0%, 33%)', lineHeight: '1.5', margin: '12px 0 0' }
const footerLink = { color: 'hsl(27, 32%, 50%)', textDecoration: 'underline' }
