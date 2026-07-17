import { Heading, Link, Section, Text } from '@react-email/components';
import { EmailLayout, emailStyles } from '@/emails/components/email-layout';

export type LiveClassReminderSessionItem = {
  title: string;
  timeLabel: string;
};

export type LiveClassReminderEmailProps = {
  name: string;
  liveClassTitle: string;
  senseiName: string;
  dateLabel: string;
  sessions: LiveClassReminderSessionItem[];
  detailUrl: string;
  appUrl: string;
  logoUrl: string;
};

export function LiveClassReminderEmail({
  name,
  liveClassTitle,
  senseiName,
  dateLabel,
  sessions,
  detailUrl,
  appUrl,
  logoUrl,
}: LiveClassReminderEmailProps) {
  const preview = `Hari ini ada Live Class: ${liveClassTitle}`;

  return (
    <EmailLayout
      preview={preview}
      logoUrl={logoUrl}
      appUrl={appUrl}
      footerNote="Kamu menerima email ini karena terdaftar di program Live Class JepangKu."
    >
      <Heading style={emailStyles.heading}>Reminder Live Class Hari Ini</Heading>

      <Text style={emailStyles.paragraph}>Halo {name},</Text>

      <Text style={emailStyles.paragraph}>
        Hari ini kamu punya jadwal Live Class <strong>{liveClassTitle}</strong> bersama{' '}
        <strong>{senseiName}</strong>.
      </Text>

      <Text style={emailStyles.paragraph}>
        <strong>Tanggal:</strong> {dateLabel}
      </Text>

      {sessions.map((session) => (
        <Text key={`${session.title}-${session.timeLabel}`} style={emailStyles.paragraph}>
          <strong>{session.title}</strong>
          <br />
          {session.timeLabel}
        </Text>
      ))}

      <Text style={emailStyles.paragraph}>
        Buka halaman detail kelas untuk melihat link meeting saat sesi dimulai.
      </Text>

      <Section style={emailStyles.ctaWrap}>
        <Link href={detailUrl} style={emailStyles.ctaButton}>
          Lihat Detail Live Class
        </Link>
      </Section>

      <Text style={emailStyles.signoff}>
        Ganbarimashou!
        <br />
        Tim JepangKu
      </Text>
    </EmailLayout>
  );
}

export default LiveClassReminderEmail;
