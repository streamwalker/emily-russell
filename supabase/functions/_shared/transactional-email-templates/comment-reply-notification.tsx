import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Button, Hr, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Emily Russell Real Estate"

interface CommentReplyNotificationProps {
  propertyAddress?: string
  replyText?: string
  portalUrl?: string
}

const CommentReplyNotificationEmail = ({
  propertyAddress = 'your property',
  replyText = '',
  portalUrl = 'https://emily-russell.lovable.app/portal',
}: CommentReplyNotificationProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Emily replied to your comment on {propertyAddress}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New Reply on Your Comment</Heading>
        <Text style={text}>
          Emily has replied to your comment on <strong>{propertyAddress}</strong>:
        </Text>
        <Section style={quoteSection}>
          <Text style={quoteText}>"{replyText}"</Text>
        </Section>
        <Button style={button} href={portalUrl}>
          View in Client Portal
        </Button>
        <Hr style={hr} />
        <Text style={footer}>
          {SITE_NAME} · San Antonio, TX
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: CommentReplyNotificationEmail,
  subject: (data: Record<string, any>) =>
    `Emily replied to your comment on ${data.propertyAddress || 'a property'}`,
  displayName: 'Comment reply notification',
  previewData: {
    propertyAddress: '123 Main St, San Antonio, TX',
    replyText: 'Great question! I will look into that for you.',
    portalUrl: 'https://emily-russell.lovable.app/portal',
  },
} satisfies TemplateEntry

// Styles — brand: gold hsl(27, 35%, 59%) = #b89a6a, charcoal #1c1c1c, cream #f7f4f0
const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '32px 28px', maxWidth: '520px', margin: '0 auto' }
const h1 = { fontSize: '22px', fontWeight: '600' as const, color: '#1c1c1c', margin: '0 0 20px', fontFamily: "'Playfair Display', Georgia, serif" }
const text = { fontSize: '15px', color: '#555555', lineHeight: '1.6', margin: '0 0 20px' }
const quoteSection = { backgroundColor: '#f7f4f0', borderLeft: '3px solid #b89a6a', padding: '16px 20px', margin: '0 0 24px', borderRadius: '0 4px 4px 0' }
const quoteText = { fontSize: '15px', color: '#1c1c1c', lineHeight: '1.6', margin: '0', fontStyle: 'italic' as const }
const button = { backgroundColor: '#b89a6a', color: '#ffffff', fontSize: '13px', fontWeight: '600' as const, padding: '12px 28px', textDecoration: 'none', display: 'inline-block', letterSpacing: '0.5px', textTransform: 'uppercase' as const }
const hr = { borderColor: '#e8e2da', margin: '32px 0 16px' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', textAlign: 'center' as const }
