import { Heading, Link, Section, Text } from '@react-email/components';
import { EmailLayout, emailStyles } from '@/emails/components/email-layout';
import { LMS_PUBLIC_URL } from '@/lib/email/config';

export type WelcomeEmailProps = {
  name: string;
  /** CTA + footer link — production LMS URL. */
  appUrl?: string;
  logoUrl: string;
};

export function WelcomeEmail({
  name,
  appUrl = LMS_PUBLIC_URL,
  logoUrl,
}: WelcomeEmailProps) {
  const preview = `Selamat datang di JepangKu, ${name}.`;

  return (
    <EmailLayout
      preview={preview}
      logoUrl={logoUrl}
      appUrl={appUrl}
      footerNote="Anda menerima email ini karena baru saja membuat akun JepangKu."
    >
      <Heading style={emailStyles.heading}>Hajimemashite, {name}!</Heading>

      <Text style={emailStyles.paragraph}>
        Terima kasih telah bergabung di JepangKu.
      </Text>

      <Text style={emailStyles.paragraph}>
        JepangKu adalah platform kursus bahasa Jepang yang membantu Anda belajar secara
        terstruktur dari materi pelajaran hingga latihan dan progres belajar.
      </Text>

      <Text style={emailStyles.paragraph}>
        Silakan mulai perjalanan belajar Anda di kursus.jepangku.com.
      </Text>

      <Section style={emailStyles.ctaWrap}>
        <Link href={appUrl} style={emailStyles.ctaButton}>
          Mulai Belajar
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

export default WelcomeEmail;
