import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import type { ReactNode } from 'react';

const BRAND_RED = '#EC1D24';
const BRAND_NAVY = '#1E1B57';
const MUTED = '#6b7280';

type EmailLayoutProps = {
  preview: string;
  logoUrl: string;
  appUrl: string;
  children: ReactNode;
  footerNote: string;
};

export function EmailLayout({
  preview,
  logoUrl,
  appUrl,
  children,
  footerNote,
}: EmailLayoutProps) {
  return (
    <Html lang="id">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img src={logoUrl} alt="JepangKu" width={180} height={52} style={logo} />
          </Section>

          <Hr style={divider} />

          <Section style={content}>{children}</Section>

          <Hr style={divider} />

          <Text style={footer}>{footerNote}</Text>
          <Text style={footerMuted}>
            <a href={appUrl} style={footerLink}>
              kursus.jepangku.com
            </a>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const emailStyles = {
  heading: {
    color: BRAND_NAVY,
    fontSize: '22px',
    fontWeight: 700,
    lineHeight: '30px',
    margin: '0 0 16px',
  } satisfies React.CSSProperties,
  paragraph: {
    color: '#374151',
    fontSize: '15px',
    lineHeight: '24px',
    margin: '0 0 16px',
  } satisfies React.CSSProperties,
  ctaButton: {
    backgroundColor: BRAND_RED,
    borderRadius: '10px',
    color: '#ffffff',
    display: 'inline-block',
    fontSize: '15px',
    fontWeight: 600,
    lineHeight: '1',
    padding: '14px 28px',
    textDecoration: 'none',
  } satisfies React.CSSProperties,
  ctaWrap: {
    margin: '28px 0 8px',
    textAlign: 'center' as const,
  },
  signoff: {
    color: BRAND_NAVY,
    fontSize: '15px',
    lineHeight: '24px',
    margin: '24px 0 0',
    fontWeight: 600,
  },
};

const main = {
  backgroundColor: '#f5f4fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: 0,
  padding: '24px 12px',
};

const container = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '16px',
  margin: '0 auto',
  maxWidth: '560px',
  padding: '32px 28px',
};

const logoSection = {
  textAlign: 'center' as const,
  marginBottom: '8px',
};

const logo = {
  margin: '0 auto',
};

const divider = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const content = {
  padding: '0',
};

const footer = {
  color: MUTED,
  fontSize: '12px',
  lineHeight: '20px',
  margin: '0 0 8px',
  textAlign: 'center' as const,
};

const footerMuted = {
  color: MUTED,
  fontSize: '12px',
  lineHeight: '20px',
  margin: 0,
  textAlign: 'center' as const,
};

const footerLink = {
  color: BRAND_RED,
  textDecoration: 'underline',
};
