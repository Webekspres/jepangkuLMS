import { Heading, Link, Section, Text } from '@react-email/components';
import { EmailLayout, emailStyles } from '@/emails/components/email-layout';

export type WelcomeEmailProps = {
  name: string;
  appUrl: string;
  logoUrl: string;
};

export function WelcomeEmail({ name, appUrl, logoUrl }: WelcomeEmailProps) {
  const preview = `Hajimemashite, ${name}! Selamat datang di JepangKu.`;

  return (
    <EmailLayout
      preview={preview}
      logoUrl={logoUrl}
      appUrl={appUrl}
      footerNote="Kamu menerima email ini karena baru saja membuat akun JepangKu."
    >
      <Heading style={emailStyles.heading}>Hajimemashite, {name}!</Heading>

      <Text style={emailStyles.paragraph}>Terima kasih sudah bergabung di JepangKu.</Text>

      <Text style={emailStyles.paragraph}>
        Saat ini, Kursus Bahasa Jepang di JepangKu masih berada dalam tahap Beta.
      </Text>

      <Text style={emailStyles.paragraph}>
        Silakan jelajahi seluruh fitur di kursus.jepangku.com, coba materi yang tersedia, dan
        berikan masukan kepada kami.
      </Text>

      <Text style={emailStyles.paragraph}>
        Setiap feedback yang kamu berikan sangat berarti untuk membantu kami mengembangkan
        JepangKu menjadi platform belajar bahasa Jepang yang lebih baik.
      </Text>

      <Text style={emailStyles.paragraph}>
        Sebagai bentuk apresiasi, kamu juga akan mendapatkan poin untuk setiap feedback yang
        valid.
      </Text>

      <Section style={emailStyles.ctaWrap}>
        <Link href={appUrl} style={emailStyles.ctaButton}>
          Mulai Belajar
        </Link>
      </Section>

      <Text style={emailStyles.paragraph}>
        Ganbarimashou! <span style={{ fontStyle: 'italic' }}>(がんばりましょう！)</span>
      </Text>

      <Text style={emailStyles.signoff}>
        Salam,
        <br />
        Tim JepangKu 🇯🇵
      </Text>
    </EmailLayout>
  );
}

export default WelcomeEmail;
