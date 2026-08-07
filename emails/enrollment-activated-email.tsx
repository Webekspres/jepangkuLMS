import { Heading, Link, Section, Text } from '@react-email/components';
import { EmailLayout, emailStyles } from '@/emails/components/email-layout';
import { LMS_PUBLIC_URL } from '@/lib/email/config';

export type EnrollmentActivatedEmailProps = {
  name: string;
  productTitle: string;
  productKindLabel: string;
  ctaUrl: string;
  ctaLabel?: string;
  appUrl?: string;
  logoUrl: string;
};

export function EnrollmentActivatedEmail({
  name,
  productTitle,
  productKindLabel,
  ctaUrl,
  ctaLabel = 'Mulai Belajar',
  appUrl = LMS_PUBLIC_URL,
  logoUrl,
}: EnrollmentActivatedEmailProps) {
  const preview = `Akses ${productTitle} sudah aktif. Selamat belajar!`;

  return (
    <EmailLayout
      preview={preview}
      logoUrl={logoUrl}
      appUrl={appUrl}
      footerNote="Anda menerima email ini karena akses program JepangKu baru saja diaktifkan."
    >
      <Heading style={emailStyles.heading}>Terima kasih, {name}!</Heading>

      <Text style={emailStyles.paragraph}>
        Pembayaran / akses untuk <strong>{productKindLabel}</strong> berikut sudah aktif:
      </Text>

      <Text style={emailStyles.paragraph}>
        <strong>{productTitle}</strong>
      </Text>

      <Text style={emailStyles.paragraph}>
        Selamat belajar. Semoga progres JLPT-mu makin lancar bersama JepangKu.
      </Text>

      <Section style={emailStyles.ctaWrap}>
        <Link href={ctaUrl} style={emailStyles.ctaButton}>
          {ctaLabel}
        </Link>
      </Section>

      <Text style={emailStyles.signoff}>
        Salam,
        <br />
        Tim JepangKu
      </Text>
    </EmailLayout>
  );
}

export default EnrollmentActivatedEmail;
