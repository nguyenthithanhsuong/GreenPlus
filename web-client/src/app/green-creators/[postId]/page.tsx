import GreenCreatorDetails from "../../../../frontend/green-creators/components/GreenCreatorDetails";

type RouteParams = {
  postId: string;
};

export default async function GreenCreatorDetailsPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const resolvedParams = await params;
  return <GreenCreatorDetails postId={resolvedParams.postId ?? ""} />;
}
