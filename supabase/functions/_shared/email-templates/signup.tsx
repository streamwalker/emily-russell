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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email to access your client portal</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brandMark}>EMILY RUSSELL</Text>
          <Text style={brandTagline}>REALTOR® · San Antonio, TX</Text>
        </Section>
        <Hr style={hr} />
        <Heading style={h1}>Welcome — please confirm your email</Heading>
        <Text style={text}>
          Thanks for getting in touch. Confirm the address below to activate your account
          and access your private client portal.
        </Text>
        <Text style={emailHighlight}>{recipient}</Text>
        <Section style={buttonWrap}>
          <Button style={button} href={confirmationUrl}>
            Confirm Email
          </Button>
        </Section>
        <Text style={text}>
          Looking forward to helping you find the right home.
        </Text>
        <Text style={signature}>— Emily Russell</Text>
        <Hr style={hr} />
        <Text style={footer}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
        <Text style={footer}>
          Emily Russell, REALTOR® · TREC #791742 · Fathom Realty<br />
          <Link href={siteUrl} style={footerLink}>alamocitydesigns.com</Link> · (210) 912-0806
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = {
  backgroundColor: '#ffffff',
  fontFamily: "'DM Sans', Helvetica, Arial, sans-serif",
}
const container = { padding: '32px 28px', maxWidth: '560px' }
const header = { textAlign: 'center' as const, padding: '8px 0 16px' }
const brandMark = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: '28px',
  fontWeight: 600 as const,
  letterSpacing: '4px',
  color: 'hsl(0, 0%, 11%)',
  margin: '0',
}
const brandTagline = {
  fontSize: '11px',
  letterSpacing: '2px',
  color: 'hsl(27, 32%, 50%)',
  margin: '6px 0 0',
}
const hr = {
  borderTop: '1px solid hsl(30, 14%, 85%)',
  margin: '20px 0',
}
const h1 = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: '24px',
  fontWeight: 500 as const,
  color: 'hsl(0, 0%, 11%)',
  margin: '12px 0 18px',
}
const text = {
  fontSize: '15px',
  color: 'hsl(0, 0%, 33%)',
  lineHeight: '1.6',
  margin: '0 0 18px',
}
const emailHighlight = {
  fontSize: '15px',
  color: 'hsl(27, 32%, 50%)',
  fontWeight: 500 as const,
  margin: '0 0 24px',
}
const buttonWrap = { textAlign: 'center' as const, margin: '8px 0 28px' }
const button = {
  backgroundColor: 'hsl(27, 35%, 59%)',
  color: '#ffffff',
  fontSize: '14px',
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  borderRadius: '0px',
  padding: '14px 32px',
  textDecoration: 'none',
  fontWeight: 500 as const,
}
const signature = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: '16px',
  fontStyle: 'italic' as const,
  color: 'hsl(0, 0%, 11%)',
  margin: '0 0 8px',
}
const footer = {
  fontSize: '12px',
  color: 'hsl(0, 0%, 33%)',
  lineHeight: '1.5',
  margin: '12px 0 0',
}
const footerLink = { color: 'hsl(27, 32%, 50%)', textDecoration: 'underline' }
