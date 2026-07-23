import QrPanel from "@/components/QrPanel";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CardQrPage({ params }: Props) {
  const { id } = await params;
  return <QrPanel cardId={id} />;
}
