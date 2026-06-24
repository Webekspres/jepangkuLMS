import { AdminPageHeader } from '@/features/admin-cms/components/admin-page-header';
import { Card, CardContent } from '@/components/ui/card';

export function AdminPlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <AdminPageHeader title={title} description={description} />
      <Card className="border-border bg-card shadow-sm">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Modul ini akan diimplementasikan di slice CMS berikutnya.
        </CardContent>
      </Card>
    </div>
  );
}
