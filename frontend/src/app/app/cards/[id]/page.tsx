import CardEditor from "@/components/CardEditor";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CardEditPage({ params }: Props) {
  const { id } = await params;
  return <CardEditor cardId={id} />;
}
